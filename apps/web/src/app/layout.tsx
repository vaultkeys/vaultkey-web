import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@vaultkey/ui/src/toaster";

import "./globals.css";

export const metadata: Metadata = {
  title: "VaultKey",
  description: "Stablecoin wallet infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
