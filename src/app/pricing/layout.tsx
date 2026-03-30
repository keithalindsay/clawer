import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Clawer.ai | Managed OpenClaw Hosting Plans",
  description:
    "Simple, transparent pricing for managed OpenClaw hosting. Free tier with 100 messages, Pro at $49/month with 500 messages/day, WhatsApp, Telegram, Slack & AI teams.",
  alternates: {
    canonical: "https://clawer.ai/pricing",
  },
  openGraph: {
    title: "Pricing — Clawer.ai | Managed OpenClaw Hosting Plans",
    description:
      "Simple, transparent pricing for managed OpenClaw hosting. Free tier to start, Pro at $49/month for full AI teams across WhatsApp, Telegram & Slack.",
    url: "https://clawer.ai/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Clawer.ai | Managed OpenClaw Hosting Plans",
    description:
      "Managed OpenClaw hosting from $0. Full AI teams, WhatsApp + Telegram + Slack, security patches auto-applied. Start free — no credit card.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
