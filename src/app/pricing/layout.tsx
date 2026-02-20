import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clawer.ai Pricing — Simple Pricing for Your AI Team",
  description:
    "Simple pricing for your AI team. Free: 100 messages. Pro: $49/mo with 500/day. No credit card required to start.",
  alternates: {
    canonical: "https://clawer.ai/pricing",
  },
  openGraph: {
    title: "Clawer.ai Pricing — Simple Pricing for Your AI Team",
    description:
      "Simple pricing for your AI team. Free: 100 messages. Pro: $49/mo with 500/day. No credit card required to start.",
    url: "https://clawer.ai/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clawer.ai Pricing — Simple Pricing for Your AI Team",
    description:
      "Simple pricing for your AI team. Free: 100 messages. Pro: $49/mo with 500/day. No credit card required to start.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
