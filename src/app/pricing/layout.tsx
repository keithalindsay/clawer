import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Clawer.ai | AI Teams Starting Free",
  description: "Start free with 200 messages. Upgrade to Pro at $49/mo for 500 daily messages, full AI team, and priority support. No credit card required.",
  alternates: {
    canonical: "https://clawer.ai/pricing",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the free plan work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You get 200 total messages to try everything out — no credit card required. Once you've used them, upgrade to Pro for 500 messages per day and your full AI team.",
      },
    },
    {
      "@type": "Question",
      name: "What are AI Teams?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI Teams are multiple specialized agents that work together. Pick a template — Life OS, Solopreneur, Content Creator, and more — each with agents built for that workflow.",
      },
    },
    {
      "@type": "Question",
      name: "Can I switch plans anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upgrade, downgrade, or cancel from your dashboard. No lock-in contracts. Pro-rated refunds on downgrades.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every instance runs in an isolated container. We never train AI on your data. See our security blog post for details.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a credit card to start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nope. Free plan requires no credit card. Just sign up and start chatting.",
      },
    },
    {
      "@type": "Question",
      name: "What channels can I connect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pro unlocks WhatsApp, Telegram, and Slack — chat with your AI team from wherever you already work. Free is web-only.",
      },
    },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
