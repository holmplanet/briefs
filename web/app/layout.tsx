import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Brief — Tasks",
  description: "Holmplanet Brief task inbox and daily brief",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
