import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DLV Burundi - Profile",
  description: "Manage your DLV Burundi account profile and settings",
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
