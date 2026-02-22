'use client';

/**
 * VerifiedBadge — "Clawer Verified" trust signal
 *
 * Shows a shield icon + "Verified" text indicating the template
 * has been security-scanned by Clawer.ai.
 *
 * Props:
 *   size       - 'sm' (14px icon, text-xs) | 'md' (18px icon, text-sm)
 *   showText   - Whether to show "Verified" text (default: true)
 */

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  showText?: boolean;
}

export function VerifiedBadge({ size = 'md', showText = true }: VerifiedBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 18;
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className="inline-flex items-center gap-1 cursor-default"
      title="Security-scanned by Clawer.ai"
      aria-label="Clawer Verified — security-scanned template"
    >
      {/* Shield SVG icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-green-600 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
      </svg>

      {showText && (
        <span className={`${textClass} font-medium text-gray-600`}>Verified</span>
      )}
    </span>
  );
}

export default VerifiedBadge;
