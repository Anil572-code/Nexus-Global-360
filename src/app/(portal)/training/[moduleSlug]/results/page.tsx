import TrainingAccessGate from "@/components/runtime/TrainingAccessGate";
import TrainingResults from "@/components/runtime/TrainingResults";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; return <TrainingAccessGate moduleSlug={moduleSlug}><TrainingResults moduleSlug={moduleSlug}/></TrainingAccessGate>; }
