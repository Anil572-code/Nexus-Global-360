import EmployeeIdMigrationScript from "next/script";
import type { Metadata } from "next";
import RuntimeBridge from "@/components/runtime/RuntimeBridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Safety 360",
  description: "Interactive workplace safety training for Nexus Global Logistics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <EmployeeIdMigrationScript src="/employee-id-migration-v8.5.24.js" strategy="beforeInteractive" /><RuntimeBridge>{children}</RuntimeBridge></body>
    </html>
  );
}
