import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FO Accounting Dashboards",
  description: "Formentera Operations — Accounting Reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
