import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DLV Burundi - Authentication",
  description: "Sign in to DLV Burundi digital license verification system",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
