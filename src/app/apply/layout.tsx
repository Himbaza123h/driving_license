import type { Metadata } from "next";
import { ApplicationProvider } from "@/contexts/ApplicationContext";

export const metadata: Metadata = {
  title: "Apply for License - DLV Burundi",
  description: "Apply for your driver's license online through the official DLV Burundi platform",
};

export default function ApplyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ApplicationProvider>
      {children}
    </ApplicationProvider>
  );
}
