import DemoTrainingGate from "@/components/demo/DemoTrainingGate";
import DemoTrainingResults from "@/components/demo/DemoTrainingResults";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; return <DemoTrainingGate moduleSlug={moduleSlug}><DemoTrainingResults moduleSlug={moduleSlug}/></DemoTrainingGate>; }
