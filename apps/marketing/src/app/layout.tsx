import "@vaultkey/ui/styles/globals.css";

import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@vaultkey/ui";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VaultKey – programmable wallet infrastructure",
  description:
    "Create and manage EVM and Solana wallets, sign transactions, and send stablecoins. Pay only for what you use.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: new URL("https://getvaultkey.com"),
  openGraph: {
    title: "VaultKey – programmable wallet infrastructure",
    description:
      "Create and manage EVM and Solana wallets, sign transactions, and send stablecoins. Pay only for what you use.",
    url: "https://getvaultkey.com",
    siteName: "VaultKey",
    images: [
      {
        // Replace with actual OG image when available
        url: "https://getvaultkey.com/og.png",
        width: 1200,
        height: 630,
        alt: "VaultKey – programmable wallet infrastructure",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultKey – programmable wallet infrastructure",
    description:
      "Create and manage EVM and Solana wallets, sign transactions, and send stablecoins.",
    images: ["https://getvaultkey.com/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://getvaultkey.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth bg-background"
    >
      {process.env.NODE_ENV === "production" && (
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      )}
      <body
        className={`font-mono ${inter.variable} ${jetbrainsMono.variable} bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="marketing-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}