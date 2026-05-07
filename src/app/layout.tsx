import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "VIDYUT | AI-Powered Smart Electricity Intelligence Platform",
  description: "BESCOM's next-generation AI platform for demand forecasting, theft detection, grid stress prediction, and explainable anomaly intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

