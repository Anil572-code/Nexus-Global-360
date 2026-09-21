"use client";
import { useLayoutEffect } from "react";
import { installDemoFetchBridge } from "@/demo/api";
import { readDemoState } from "@/demo/store";

export default function DemoRuntimeBridge({children}:{children:React.ReactNode}){
  useLayoutEffect(()=>{ readDemoState(); return installDemoFetchBridge(); },[]);
  return <>{children}</>;
}
