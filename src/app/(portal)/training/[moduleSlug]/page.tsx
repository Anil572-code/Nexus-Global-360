import TrainingModuleIntro from "@/components/TrainingModuleIntro";
import DemoTrainingGate from "@/components/demo/DemoTrainingGate";
import { getTrainingModule } from "@/data/training";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; const m=getTrainingModule(moduleSlug); if(!m)return null; return <DemoTrainingGate moduleSlug={moduleSlug}><TrainingModuleIntro module={m} launchHref={`/training/${moduleSlug}/challenge`} launchLabel="Start training →"/></DemoTrainingGate>; }
