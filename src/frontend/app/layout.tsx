import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DealPilot",
  description:
    "AI-powered deal discovery, background price monitoring, adaptive polling, and verified PayPal checkout.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
