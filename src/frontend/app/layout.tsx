import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/frontend/utils/auth-context";

export const metadata: Metadata = {
  title: "DealPilot — Autonomous Shopping & Price Intelligence Radar",
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
      <head>
        {/* PayPal v6 Web SDK Core */}
        <Script
          src="https://www.sandbox.paypal.com/web-sdk/v6/core"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
