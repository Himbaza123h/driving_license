import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import EnvironmentBanner from "@/components/EnvironmentBanner";
// Suppress development-only ResizeObserver errors
import "@/utils/suppressDevErrors";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DLV Burundi - Digital License Verification",
  description: "Official digital license verification system for Burundi. Verify driving licenses, apply for new licenses, and access government licensing services.",
  keywords: "Burundi, driving license, verification, digital license, government services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <EnvironmentBanner />
        <AuthProvider>
          <LanguageProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}