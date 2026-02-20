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
  title: "Clawer.ai — AI Teams That Do the Work While You Sleep",
  description:
    "Deploy AI teams across WhatsApp, Telegram, and Slack in 60 seconds. They monitor competitors, draft content, and execute tasks — while you sleep. Start free.",
  metadataBase: new URL("https://clawer.ai"),
  alternates: {
    canonical: "https://clawer.ai",
  },
  openGraph: {
    title: "Clawer.ai — AI Teams That Do the Work While You Sleep",
    description:
      "Deploy AI teams across WhatsApp, Telegram, and Slack in 60 seconds. They monitor competitors, draft content, and execute tasks — while you sleep. Start free.",
    url: "https://clawer.ai",
    siteName: "Clawer.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clawer.ai — AI Teams That Do the Work While You Sleep",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clawer.ai — AI Teams That Do the Work While You Sleep",
    description:
      "Deploy AI teams across WhatsApp, Telegram, and Slack. They monitor, draft, and execute — autonomously. 100 free messages. No credit card.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Clawer",
  url: "https://clawer.ai",
  logo: "https://clawer.ai/logo.png",
  description: "Managed AI Teams powered by OpenClaw",
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
      <html lang="en" className="">
        <head>
          <meta name="theme-color" content="#ffffff" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* Google Analytics */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-4JFT86VTV5" />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4JFT86VTV5');`,
            }}
          />
          {/* Umami Analytics — self-hosted, privacy-friendly */}
          {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
            <script
              defer
              src={`${process.env.NEXT_PUBLIC_UMAMI_URL || 'https://clawer.ai/umami'}/script.js`}
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            />
          )}
        </head>
        <body className={`${inter.variable} antialiased`}>
          {children}
          <FeedbackWidgetWrapper />
        </body>
      </html>
    </ClerkProvider>
  );
}
