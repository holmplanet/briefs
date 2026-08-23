import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SkyBackground } from "@briefs/web-shared";

import { siteUrl } from "@/lib/site-config";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Briefs SDK",
  description: "Documentation and playground for building on Holmplanet Briefs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Holmplanet Briefs",
    title: "Briefs SDK",
    description: "Documentation and playground for building on Holmplanet Briefs.",
  },
  twitter: {
    card: "summary",
    title: "Briefs SDK",
    description: "Documentation and playground for building on Holmplanet Briefs.",
  },
  themeColor: "#0a0a0e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <SkyBackground />
        {children}
      </body>
    </html>
  );
}
