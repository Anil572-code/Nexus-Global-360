import type { Metadata } from "next";
import AdminUsersWorkspace from "@/components/admin/AdminUsersWorkspace";

export const metadata: Metadata = { title: "Users | Nexus Global Safety 360" };
export default function AdminUsersPage() { return <AdminUsersWorkspace />; }
