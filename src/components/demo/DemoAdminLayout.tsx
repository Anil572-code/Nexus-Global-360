"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { demoPermissions, isAdminRole } from "@/demo/permissions";
import { readDemoSession, readDemoState } from "@/demo/store";
import type { DemoUser } from "@/demo/types";

export default function DemoAdminLayout({children}:{children:React.ReactNode}){
 const router=useRouter(); const [user,setUser]=useState<DemoUser|null>(null); const [ready,setReady]=useState(false);
 useEffect(()=>{const state=readDemoState();const session=readDemoSession();const found=session?state.users.find(u=>u.id===session.userId)??null:null;if(!found||found.status!=="ACTIVE"){router.replace("/login");setReady(true);return;}if(!isAdminRole(found.role)){router.replace("/dashboard");setReady(true);return;}setUser(found);setReady(true);},[router]);
 if(!ready||!user)return null; const scopeLabel=user.role==="ADMIN"||user.role==="SUPER_ADMIN"?"Organization":user.department;
 return <div className="nexus-admin-premium"><AdminShell user={{id:user.employeeId,databaseId:user.id,name:user.name,department:user.department,role:user.role}} scopeLabel={scopeLabel} permissions={demoPermissions(user.role)}>{children}</AdminShell></div>;
}
