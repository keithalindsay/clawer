#!/usr/bin/env python3
"""
Directory Submission Tracker CLI for clawer.ai backlinks.
Manages status of directory submissions in directory-submissions.json.

Usage:
  python3 directory-tracker.py status                   # Show counts by status
  python3 directory-tracker.py next                     # Next 5 priority submissions
  python3 directory-tracker.py submit "Product Hunt"    # Mark as submitted
  python3 directory-tracker.py live "TAAFT" https://...  # Mark as live
  python3 directory-tracker.py report                   # Weekly progress report
  python3 directory-tracker.py list                     # List all with status
  python3 directory-tracker.py --dry-run submit "X"    # Preview without saving
"""

import os
import sys
import json
import datetime
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKLINKS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "backlinks"))
SUBMISSIONS_FILE = os.path.join(BACKLINKS_DIR, "directory-submissions.json")

# ANSI color codes
class C:
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RESET   = "\033[0m"

STATUS_COLORS = {
    "pending":      C.YELLOW,
    "submitted":    C.CYAN,
    "live":         C.GREEN,
    "rejected":     C.RED,
    "needs-review": C.MAGENTA,
}

PRIORITY_COLORS = {
    "critical": C.RED + C.BOLD,
    "high":     C.YELLOW,
    "medium":   C.CYAN,
    "low":      C.DIM,
}

PRIORITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def c(text, color):
    return f"{color}{text}{C.RESET}"


def load_data():
    if not os.path.exists(SUBMISSIONS_FILE):
        print(c(f"ERROR: {SUBMISSIONS_FILE} not found.", C.RED))
        print(c("Make sure the backlink agent has created directory-submissions.json", C.YELLOW))
        sys.exit(1)
    with open(SUBMISSIONS_FILE) as f:
        return json.load(f)


def save_data(data):
    with open(SUBMISSIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)
    data["meta"]["last_updated"] = datetime.date.today().isoformat()


def find_directory(data, name):
    """Find a directory by name (case-insensitive partial match)."""
    name_lower = name.lower()
    dirs = data.get("directories", [])

    # Exact match first
    for d in dirs:
        if d["name"].lower() == name_lower or d["id"].lower() == name_lower:
            return d

    # Partial match
    matches = [d for d in dirs if name_lower in d["name"].lower() or name_lower in d["id"].lower()]
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(c(f"Ambiguous name '{name}'. Matches:", C.YELLOW))
        for m in matches:
            print(f"  - {m['name']} (id: {m['id']})")
        return None
    return None


def cmd_status(data, args):
    """Show submission status counts and overview."""
    dirs = data.get("directories", [])
    if not dirs:
        print(c("No directories found in submissions file.", C.YELLOW))
        return

    # Count by status and priority
    status_counts = {}
    priority_counts = {}
    for d in dirs:
        s = d.get("status", "pending")
        p = d.get("priority", "medium")
        status_counts[s] = status_counts.get(s, 0) + 1
        priority_counts[p] = priority_counts.get(p, 0) + 1

    total = len(dirs)
    live_count = status_counts.get("live", 0)
    submitted_count = status_counts.get("submitted", 0)
    pending_count = status_counts.get("pending", 0)

    print(f"\n{c('=== Directory Submission Status ===', C.BOLD)}")
    print(f"Last updated: {data.get('meta', {}).get('last_updated', 'unknown')}")
    print(f"Total directories: {c(str(total), C.BOLD)}\n")

    # Status breakdown
    print(c("Status Breakdown:", C.BOLD))
    for status in ["live", "submitted", "needs-review", "pending", "rejected"]:
        count = status_counts.get(status, 0)
        if count > 0:
            pct = int(count / total * 100)
            bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
            print(f"  {STATUS_COLORS.get(status, '')}{status:<14}{C.RESET} {bar} {c(str(count), C.BOLD)} ({pct}%)")

    # Priority breakdown (for pending only)
    pending_dirs = [d for d in dirs if d.get("status") == "pending"]
    if pending_dirs:
        print(f"\n{c('Pending by Priority:', C.BOLD)}")
        for priority in ["critical", "high", "medium", "low"]:
            count = sum(1 for d in pending_dirs if d.get("priority") == priority)
            if count > 0:
                print(f"  {PRIORITY_COLORS.get(priority, '')}{priority:<10}{C.RESET} {c(str(count), C.BOLD)} directories")

    # Progress bar overall
    if total > 0:
        live_pct = live_count / total * 100
        sub_pct = submitted_count / total * 100
        print(f"\n{c('Overall Progress:', C.BOLD)}")
        print(f"  Live:      {c(f'{live_pct:.1f}%', C.GREEN)} ({live_count}/{total})")
        print(f"  Submitted: {c(f'{sub_pct:.1f}%', C.CYAN)} ({submitted_count}/{total})")
        print(f"  Remaining: {c(str(pending_count), C.YELLOW)} to submit")

    # Critical pending items
    critical = [d for d in dirs if d.get("priority") == "critical" and d.get("status") == "pending"]
    if critical:
        print(f"\n{c('⚠️  Critical Pending:', C.RED + C.BOLD)}")
        for d in critical:
            print(f"  - {c(d['name'], C.BOLD)} ({d.get('url', '')})")


def cmd_next(data, args):
    """Show next 5 highest-priority unsubmitted directories."""
    dirs = data.get("directories", [])
    pending = [d for d in dirs if d.get("status") in ("pending", "needs-review")]

    if not pending:
        print(c("✓ No pending submissions — all done or submitted!", C.GREEN))
        return

    # Sort by priority then by DA (domain authority)
    pending.sort(key=lambda d: (
        PRIORITY_ORDER.get(d.get("priority", "medium"), 2),
        -(d.get("da", 0))
    ))

    limit = getattr(args, 'limit', 5)
    top = pending[:limit]

    print(f"\n{c(f'=== Next {limit} Priority Submissions ===', C.BOLD)}")
    for i, d in enumerate(top, 1):
        pcolor = PRIORITY_COLORS.get(d.get("priority", "medium"), "")
        scolor = STATUS_COLORS.get(d.get("status", "pending"), "")
        
        print(f"\n{c(f'{i}.', C.BOLD)} {c(d['name'], C.WHITE + C.BOLD)}")
        print(f"   Priority:   {pcolor}{d.get('priority', '?')}{C.RESET}  |  DA: {c(str(d.get('da', '?')), C.CYAN)}  |  Status: {scolor}{d.get('status', '?')}{C.RESET}")
        print(f"   Category:   {d.get('category', '?')}  |  Cost: {c(d.get('cost', '?'), C.GREEN)}")
        print(f"   Submit URL: {c(d.get('submit_url', d.get('url', '?')), C.BLUE)}")
        if d.get("expected_traffic"):
            print(f"   Traffic:    {d.get('expected_traffic')}")
        if d.get("notes"):
            notes = d["notes"][:120] + ("..." if len(d["notes"]) > 120 else "")
            print(f"   Notes:      {c(notes, C.DIM)}")
        if d.get("automation_potential") and d["automation_potential"] != "none":
            print(f"   Automation: {c(d['automation_potential'], C.MAGENTA)}")


def cmd_submit(data, args, dry_run=False):
    """Mark a directory as submitted."""
    name = args.name
    d = find_directory(data, name)

    if not d:
        print(c(f"ERROR: Directory '{name}' not found.", C.RED))
        print("Use 'list' command to see all directory names.")
        return False

    old_status = d.get("status", "pending")
    today = datetime.date.today().isoformat()

    print(f"\n{c('Submit:', C.BOLD)} {d['name']}")
    print(f"  Current status: {STATUS_COLORS.get(old_status, '')}{old_status}{C.RESET}")
    print(f"  New status: {c('submitted', C.CYAN)}")
    print(f"  Date: {today}")

    if dry_run:
        print(c("  [DRY RUN — not saving]", C.CYAN))
        return True

    d["status"] = "submitted"
    d["submitted_date"] = today
    save_data(data)
    print(c("  ✓ Saved!", C.GREEN))
    return True


def cmd_live(data, args, dry_run=False):
    """Mark a directory as live with the listing URL."""
    name = args.name
    listing_url = args.url

    d = find_directory(data, name)
    if not d:
        print(c(f"ERROR: Directory '{name}' not found.", C.RED))
        return False

    old_status = d.get("status", "pending")
    today = datetime.date.today().isoformat()

    print(f"\n{c('Mark Live:', C.BOLD)} {d['name']}")
    print(f"  Current status: {STATUS_COLORS.get(old_status, '')}{old_status}{C.RESET}")
    print(f"  New status: {c('live', C.GREEN)}")
    print(f"  Listing URL: {listing_url}")
    print(f"  Date: {today}")

    if dry_run:
        print(c("  [DRY RUN — not saving]", C.CYAN))
        return True

    d["status"] = "live"
    d["live_url"] = listing_url
    if not d.get("submitted_date"):
        d["submitted_date"] = today
    save_data(data)
    print(c("  ✓ Saved!", C.GREEN))
    return True


def cmd_report(data, args):
    """Generate a weekly backlink progress report."""
    dirs = data.get("directories", [])
    today = datetime.date.today()
    week_ago = (today - datetime.timedelta(days=7)).isoformat()

    # Gather stats
    all_live = [d for d in dirs if d.get("status") == "live"]
    all_submitted = [d for d in dirs if d.get("status") == "submitted"]
    all_pending = [d for d in dirs if d.get("status") == "pending"]
    all_rejected = [d for d in dirs if d.get("status") == "rejected"]

    # Recent activity (this week)
    recent_live = [d for d in all_live if (d.get("submitted_date") or "") >= week_ago]
    recent_submitted = [d for d in all_submitted if (d.get("submitted_date") or "") >= week_ago]

    # DA stats for live links
    live_da = [d.get("da", 0) for d in all_live if d.get("da")]
    avg_da = sum(live_da) / len(live_da) if live_da else 0
    max_da = max(live_da) if live_da else 0

    # Tier breakdown for live
    tier_counts = {}
    for d in all_live:
        t = d.get("tier", "?")
        tier_counts[t] = tier_counts.get(t, 0) + 1

    print(f"\n{c('=' * 50, C.BOLD)}")
    print(c(f"  Clawer.ai Backlink Report — {today.strftime('%B %d, %Y')}  ", C.BOLD))
    print(c('=' * 50, C.BOLD))

    print(f"\n{c('📊 Overall Status', C.BOLD)}")
    print(f"  Live:       {c(str(len(all_live)), C.GREEN + C.BOLD)} directories")
    print(f"  Submitted:  {c(str(len(all_submitted)), C.CYAN)} (awaiting approval)")
    print(f"  Pending:    {c(str(len(all_pending)), C.YELLOW)} (not yet submitted)")
    print(f"  Rejected:   {c(str(len(all_rejected)), C.RED)}")
    print(f"  Total:      {len(dirs)}")

    if all_live:
        print(f"\n{c('🔗 Link Quality', C.BOLD)}")
        print(f"  Average DA: {c(f'{avg_da:.0f}', C.CYAN)}")
        print(f"  Highest DA: {c(str(max_da), C.GREEN)}")
        if tier_counts:
            print(f"  Tier breakdown: ", end="")
            print(", ".join(f"Tier {t}: {n}" for t, n in sorted(tier_counts.items())))

    print(f"\n{c('📅 This Week', C.BOLD)}")
    if recent_live:
        print(f"  {c('New live listings:', C.GREEN)}")
        for d in recent_live:
            print(f"    ✓ {d['name']} (DA: {d.get('da', '?')}) — {d.get('live_url', 'no URL')}")
    else:
        print(f"  No new live listings this week")

    if recent_submitted:
        print(f"  {c('Newly submitted:', C.CYAN)}")
        for d in recent_submitted:
            print(f"    → {d['name']}")

    # Next actions
    critical_pending = [d for d in all_pending if d.get("priority") == "critical"]
    high_pending = [d for d in all_pending if d.get("priority") == "high"]

    print(f"\n{c('🎯 Next Actions', C.BOLD)}")
    if critical_pending:
        print(f"  {c('Critical (submit ASAP):', C.RED + C.BOLD)}")
        for d in critical_pending[:3]:
            print(f"    • {d['name']} — {d.get('submit_url', d.get('url', ''))}")

    if high_pending:
        print(f"  {c('High priority:', C.YELLOW)}")
        for d in high_pending[:5]:
            print(f"    • {d['name']} (DA: {d.get('da', '?')}) — {d.get('cost', '?')}")

    # Long-tail pipeline
    free_pending = [d for d in all_pending if d.get("cost") == "free" and d.get("priority") in ("medium", "high")]
    if free_pending:
        print(f"\n  {c('Free submissions remaining:', C.DIM)} {len(free_pending)}")

    print(f"\n{c('=' * 50, C.DIM)}")
    print(c(f"  Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", C.DIM))
    print(c('=' * 50, C.DIM))


def cmd_list(data, args):
    """List all directories with their status."""
    dirs = data.get("directories", [])
    if not dirs:
        print(c("No directories found.", C.YELLOW))
        return

    # Filter options
    status_filter = getattr(args, 'filter_status', None)
    if status_filter:
        dirs = [d for d in dirs if d.get("status") == status_filter]

    # Sort by priority then name
    dirs_sorted = sorted(dirs, key=lambda d: (
        PRIORITY_ORDER.get(d.get("priority", "medium"), 2),
        d.get("name", "")
    ))

    print(f"\n{c(f'=== All Directories ({len(dirs_sorted)}) ===', C.BOLD)}")
    print(f"{'Name':<30} {'Status':<14} {'Priority':<10} {'DA':<5} {'Cost':<12} {'Tier'}")
    print(c("-" * 80, C.DIM))

    for d in dirs_sorted:
        name = d.get("name", "?")[:29]
        status = d.get("status", "pending")
        priority = d.get("priority", "medium")
        da = str(d.get("da", "?"))
        cost = d.get("cost", "?")[:11]
        tier = str(d.get("tier", "?"))

        sc = STATUS_COLORS.get(status, "")
        pc = PRIORITY_COLORS.get(priority, "")

        print(f"{name:<30} {sc}{status:<14}{C.RESET} {pc}{priority:<10}{C.RESET} {da:<5} {cost:<12} {tier}")


def main():
    parser = argparse.ArgumentParser(
        description="Directory Submission Tracker for clawer.ai",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 directory-tracker.py status
  python3 directory-tracker.py next
  python3 directory-tracker.py submit "Product Hunt"
  python3 directory-tracker.py live "TAAFT" https://theresanaiforthat.com/ai/clawer/
  python3 directory-tracker.py report
  python3 directory-tracker.py list
        """
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving changes")

    subparsers = parser.add_subparsers(dest="command")

    # status
    subparsers.add_parser("status", help="Show submission status overview")

    # next
    next_parser = subparsers.add_parser("next", help="Show next N priority submissions")
    next_parser.add_argument("--limit", type=int, default=5, help="Number to show (default: 5)")

    # submit
    submit_parser = subparsers.add_parser("submit", help="Mark a directory as submitted")
    submit_parser.add_argument("name", help="Directory name or ID")

    # live
    live_parser = subparsers.add_parser("live", help="Mark a directory as live")
    live_parser.add_argument("name", help="Directory name or ID")
    live_parser.add_argument("url", help="The listing URL")

    # report
    subparsers.add_parser("report", help="Generate weekly progress report")

    # list
    list_parser = subparsers.add_parser("list", help="List all directories")
    list_parser.add_argument("--status", dest="filter_status", help="Filter by status")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 0

    data = load_data()

    if args.command == "status":
        cmd_status(data, args)
    elif args.command == "next":
        cmd_next(data, args)
    elif args.command == "submit":
        cmd_submit(data, args, dry_run=args.dry_run)
    elif args.command == "live":
        cmd_live(data, args, dry_run=args.dry_run)
    elif args.command == "report":
        cmd_report(data, args)
    elif args.command == "list":
        cmd_list(data, args)
    else:
        parser.print_help()

    return 0


if __name__ == "__main__":
    sys.exit(main())
