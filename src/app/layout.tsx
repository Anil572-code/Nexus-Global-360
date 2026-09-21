import type { Metadata } from "next";
import DemoRuntimeBridge from "@/components/demo/DemoRuntimeBridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Safety 360",
  description: "Interactive workplace safety training demo for Nexus Global Logistics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><DemoRuntimeBridge>{children}</DemoRuntimeBridge></body>
    </html>
  );
}
