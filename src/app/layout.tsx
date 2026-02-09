import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clawer.ai — Your AI Team, Ready to Work",
  description:
    "Personal AI assistant with WhatsApp, Telegram, and web chat. Smart model routing, team templates, and enterprise security. Starting at $49/mo.",
  metadataBase: new URL("https://clawer.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clawer.ai — Your AI Team, Ready to Work",
    description:
      "Personal AI assistant with WhatsApp, Telegram, and web chat. Smart model routing, team templates, and enterprise security. Starting at $49/mo.",
    url: "https://clawer.ai",
    siteName: "Clawer.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clawer.ai — Your AI Team, Ready to Work",
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
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Personal AI assistant with WhatsApp, Telegram, and web chat. Smart model routing, team templates, and enterprise security.",
  url: "https://clawer.ai",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "USD",
    priceValidUntil: "2026-12-31",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "120",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
