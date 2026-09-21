"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readDemoSession, readDemoState } from "@/demo/store";

export default function DemoTrainingGate({moduleSlug,children}:{moduleSlug:string;children:React.ReactNode}){
 const router=useRouter(); const [allowed,setAllowed]=useState(false);
 useEffect(()=>{const state=readDemoState(),session=readDemoSession();const user=session?state.users.find(u=>u.id===session.userId):null;const mod=state.modules.find(m=>m.slug===moduleSlug);const assignment=user&&mod?state.assignments.find(a=>a.userId===user.id&&a.moduleId===mod.id):null;if(!user){router.replace("/login");return;}if(!assignment){router.replace("/training");return;}setAllowed(true);},[moduleSlug,router]);
 return allowed?<>{children}</>:null;
}
