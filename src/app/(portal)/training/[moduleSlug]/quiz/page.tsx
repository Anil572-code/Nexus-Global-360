import InteractiveTrainingQuiz from "@/components/training/InteractiveTrainingQuiz";
import TrainingAccessGate from "@/components/runtime/TrainingAccessGate";
import type { InteractiveModuleSlug } from "@/data/interactive-training";
export const dynamicParams=false;
export function generateStaticParams(){ return [{moduleSlug:"safety-induction"}]; }
export default async function Page({params}:{params:Promise<{moduleSlug:string}>}){ const {moduleSlug}=await params; return <TrainingAccessGate moduleSlug={moduleSlug}><InteractiveTrainingQuiz moduleSlug={moduleSlug as InteractiveModuleSlug}/></TrainingAccessGate>; }
