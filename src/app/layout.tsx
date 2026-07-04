import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cholla — Billing & UR Intelligence",
  description: "Behavioral Health Billing & Utilization Review platform for Cholla Behavioral Health.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
