import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { FeedbackWidgetWrapper } from "@/components/FeedbackWidgetWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clawer.ai — Hosted OpenClaw, Personal AI Assistant",
  description:
    "Your personal AI assistant powered by OpenClaw. No setup, no servers. Works in WhatsApp, Telegram & Slack. Start free in 60 seconds.",
  metadataBase: new URL("https://clawer.ai"),
  alternates: {
    canonical: "https://clawer.ai",
  },
  openGraph: {
    title: "Clawer.ai — Hosted OpenClaw, Personal AI Assistant",
    description:
      "Your personal AI assistant powered by OpenClaw. No setup, no servers. Works in WhatsApp, Telegram & Slack. Start free in 60 seconds.",
    url: "https://clawer.ai",
    siteName: "Clawer.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clawer.ai — Hosted OpenClaw, Personal AI Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clawer.ai — Your AI Team, Ready to Work",
    description:
      "Personal AI assistant with WhatsApp, Telegram, and web chat. Smart model routing, team templates, and enterprise security. Starting at $49/mo.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Clawer.ai",
  description: "Hosted OpenClaw personal AI assistant",
  url: "https://clawer.ai",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "USD",
    priceValidUntil: "2026-12-31",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <meta name="theme-color" content="#08090b" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={`${inter.variable} antialiased`}>
          {children}
          <FeedbackWidgetWrapper />
        </body>
      </html>
    </ClerkProvider>
  );
}
