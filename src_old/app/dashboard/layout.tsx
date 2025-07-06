import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DLV Burundi - Dashboard",
  description: "DLV Burundi user dashboard and account management",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
