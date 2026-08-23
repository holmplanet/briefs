import type { Metadata, Viewport } from "next";
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
  description: "A schema-first work spine for agents, applications, and people.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Briefs",
    title: "Briefs SDK",
    description: "A schema-first work spine for agents, applications, and people.",
  },
  twitter: {
    card: "summary",
    title: "Briefs SDK",
    description: "A schema-first work spine for agents, applications, and people.",
  },
};

export const viewport: Viewport = {
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
