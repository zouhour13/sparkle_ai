import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: {
    default: "Sparkle AI — Turn Product Photos Into Sales Content",
    template: "%s | Sparkle AI",
  },
  description:
    "Upload your product image and let Sparkle AI generate stunning descriptions, social captions, CTAs, and hashtags instantly. AI-powered marketing for small businesses.",
  keywords: [
    "AI product description",
    "social media caption generator",
    "marketing AI",
    "small business AI",
    "product photo to caption",
    "Sparkle AI",
  ],
  authors: [{ name: "Sparkle AI" }],
  creator: "Sparkle AI",
  metadataBase: new URL("https://sparkle-ai.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sparkle-ai.app",
    title: "Sparkle AI — Turn Product Photos Into Sales Content",
    description:
      "AI-powered marketing content generator for small businesses and creators.",
    siteName: "Sparkle AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparkle AI — Turn Product Photos Into Sales Content",
    description: "AI marketing content from your product photos — instantly.",
    creator: "@sparkleai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}