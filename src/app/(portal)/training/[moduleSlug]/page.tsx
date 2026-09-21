import TrainingModuleIntro from "@/components/TrainingModuleIntro";
import TrainingAccessGate from "@/components/runtime/TrainingAccessGate";
import { getTrainingModule } from "@/data/training";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; const m=getTrainingModule(moduleSlug); if(!m)return null; return <TrainingAccessGate moduleSlug={moduleSlug}><TrainingModuleIntro module={m} launchHref={`/training/${moduleSlug}/challenge`} launchLabel="Start training →"/></TrainingAccessGate>; }
