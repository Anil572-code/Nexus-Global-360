import type { Metadata } from "next";
import DemoAdminLayout from "@/components/demo/DemoAdminLayout";
import "@/components/admin/AdminPremiumTheme.css";
export const metadata:Metadata={title:"Administration | Nexus Global Safety 360"};
export default function AdminLayout({children}:{children:React.ReactNode}){ return <DemoAdminLayout>{children}</DemoAdminLayout>; }
