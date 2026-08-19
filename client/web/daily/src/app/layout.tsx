import type { Metadata } from "next";
import { SkyBackground } from "@briefs/web-shared";

import "./globals.css";

export const metadata: Metadata = {
  title: "Briefs Daily",
  description: "View your Briefs items and activity log. Create and update work through MCP.",
  themeColor: "#0a0a0e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <SkyBackground />
        {children}
      </body>
    </html>
  );
}
