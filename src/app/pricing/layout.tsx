import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clawer.ai Pricing — Free & Pro Plans | Managed OpenClaw Hosting",
  description:
    "Deploy OpenClaw AI agents on WhatsApp, Telegram & Slack. Free plan: 200 messages, no credit card. Pro: $49/mo with 500/day messages and full AI team.",
  alternates: {
    canonical: "https://clawer.ai/pricing",
  },
  openGraph: {
    title: "Clawer.ai Pricing — Free & Pro Plans | Managed OpenClaw Hosting",
    description:
      "Deploy OpenClaw AI agents on WhatsApp, Telegram & Slack. Free plan: 200 messages, no credit card. Pro: $49/mo with 500/day messages and full AI team.",
    url: "https://clawer.ai/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clawer.ai Pricing — Free & Pro Plans | Managed OpenClaw Hosting",
    description:
      "Deploy OpenClaw AI agents on WhatsApp, Telegram & Slack. Free plan: 200 messages, no credit card. Pro: $49/mo with 500/day messages and full AI team.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
