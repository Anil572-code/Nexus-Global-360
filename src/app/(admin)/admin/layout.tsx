import type { Metadata } from "next";
import AdminPortalGuard from "@/components/runtime/AdminPortalGuard";
import "@/components/admin/AdminPremiumTheme.css";
export const metadata:Metadata={title:"Administration | Nexus Global Safety 360"};
export default function AdminLayout({children}:{children:React.ReactNode}){ return <AdminPortalGuard>{children}</AdminPortalGuard>; }
