"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import AccountShellBridge from "@/components/account/AccountShellBridge";
import { readClientSession, readClientState } from "@/client/store";
import { isAdminRole } from "@/client/permissions";
import type { ClientUser } from "@/client/types";

export default function PortalLayout({children}:{children:React.ReactNode}){
 const router=useRouter(); const [user,setUser]=useState<ClientUser|null>(null); const [ready,setReady]=useState(false);
 useEffect(()=>{ const state=readClientState(); const session=readClientSession(); const found=session?state.users.find(u=>u.id===session.userId)??null:null; if(!found||found.status!=="ACTIVE"){router.replace("/login");setReady(true);return;} if(isAdminRole(found.role)){router.replace("/admin");setReady(true);return;} setUser(found);setReady(true); },[router]);
 if(!ready||!user) return null;
 return <PortalShell user={{id:user.employeeId,name:user.name,department:user.department}}><AccountShellBridge/>{children}</PortalShell>;
}
