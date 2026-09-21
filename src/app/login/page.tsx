"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isAdminRole } from "@/demo/permissions";
import { readDemoSession, readDemoState } from "@/demo/store";

export default function LoginPage(){
 const router=useRouter();
 useEffect(()=>{const session=readDemoSession();if(!session)return;const user=readDemoState().users.find(u=>u.id===session.userId);if(user&&user.status==="ACTIVE")router.replace(isAdminRole(user.role)?"/admin":"/dashboard");},[router]);
 return <main className="login-page login-page-v6">
  <section className="login-brand-panel login-brand-panel-v6" aria-label="Nexus Safety 360 introduction"><div className="brand-panel-inner"><div className="login-logo-surface"><img className="login-logo" src="/brand/nexus-global-logo.png" alt="Nexus Global Logistics" /></div><div className="eyebrow light">Nexus Global Logistics</div><h1>Immersive safety learning for better workplace decisions.</h1><p>Inspect realistic scenarios, practise the right controls and reinforce learning with measurable feedback.</p><div className="login-feature-grid login-feature-grid-v6"><div><strong>6</strong><span>Training modules</span></div><div><strong>360°</strong><span>Immersive inspection</span></div><div><strong>1000</strong><span>Points per module</span></div></div></div><div className="brand-panel-footer">Nexus Global Logistics · Safety 360</div></section>
  <section className="login-card-panel login-card-panel-v6"><div className="login-card-wrap"><div className="mobile-logo-wrap"><img src="/brand/nexus-global-logo.png" alt="Nexus Global Logistics" /></div><div className="eyebrow">Safety 360 demo portal</div><h2>Welcome back</h2><p className="login-subtitle">Sign in with a demo employee or administrator account to access the assignment workspace.</p><LoginForm/><div className="prototype-badge">Frontend-only browser demo · no database required</div></div></section>
 </main>;
}
