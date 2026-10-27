import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/frontend/utils/auth-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DealPilot — Autonomous Shopping & Price Intelligence Radar",
  description:
    "Autonomous deal discovery, background price monitoring, adaptive polling, and verified PayPal checkout.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        {/* PayPal v6 Web SDK Core */}
        <Script
          src="https://www.sandbox.paypal.com/web-sdk/v6/core"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-black text-zinc-100 antialiased selection:bg-emerald-500 selection:text-black font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
