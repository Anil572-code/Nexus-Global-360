"use client";
import { useSearchParams } from "next/navigation";
import CertificateVerification from "./CertificateVerification";
export default function CertificateVerificationQuery(){ const params=useSearchParams(); const token=params.get("token")??""; return <CertificateVerification token={token}/>; }
