"use client";
import { useEffect, useState } from "react";
import InteractiveTrainingResults from "@/components/training/InteractiveTrainingResults";
import type { LatestTrainingResult } from "@/lib/training-access";

export default function TrainingResults({moduleSlug}:{moduleSlug:string}){
 const [result,setResult]=useState<LatestTrainingResult|null|undefined>(undefined);
 useEffect(()=>{let cancelled=false;fetch(`/api/training/results/${encodeURIComponent(moduleSlug)}/latest`,{method:"GET",headers:{Accept:"application/json"},cache:"no-store"}).then(async r=>r.ok?await r.json():null).then(data=>{if(!cancelled)setResult(data as LatestTrainingResult|null)}).catch(()=>{if(!cancelled)setResult(null)});return()=>{cancelled=true}},[moduleSlug]);
 if(result===undefined)return null;
 return <InteractiveTrainingResults moduleSlug={moduleSlug} result={result}/>;
}
