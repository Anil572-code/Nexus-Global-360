import InteractiveTrainingRuntime from "@/components/training/InteractiveTrainingRuntime";
import DemoTrainingGate from "@/components/demo/DemoTrainingGate";
import type { InteractiveModuleSlug } from "@/data/interactive-training";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; return <DemoTrainingGate moduleSlug={moduleSlug}><InteractiveTrainingRuntime moduleSlug={moduleSlug as InteractiveModuleSlug}/></DemoTrainingGate>; }
