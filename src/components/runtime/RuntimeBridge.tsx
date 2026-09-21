"use client";
import { useLayoutEffect } from "react";
import { installClientFetchBridge } from "@/client/api";
import { readClientState } from "@/client/store";

export default function RuntimeBridge({children}:{children:React.ReactNode}){
  useLayoutEffect(()=>{ readClientState(); return installClientFetchBridge(); },[]);
  return <>{children}</>;
}
