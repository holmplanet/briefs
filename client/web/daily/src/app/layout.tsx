import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SkyBackground } from "@briefs/web-shared";

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
  title: "Briefs",
  description: "View your Briefs items and activity log. Create and update work through MCP.",
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
