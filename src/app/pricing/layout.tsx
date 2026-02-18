import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Clawer.ai | AI Teams Starting Free",
  description: "Start free with 200 messages. Upgrade to Pro at $49/mo for 500 daily messages, full AI team, and priority support. No credit card required.",
  alternates: {
    canonical: "https://clawer.ai/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
