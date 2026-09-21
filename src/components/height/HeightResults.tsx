"use client";

import { useEffect, useState } from "react";
import PremiumVisualTrainingResults, {
  type PremiumVisualResult,
} from "@/components/training/PremiumVisualTrainingResults";

const RESULT_KEY = "nexus-safety-360:height-last-result:v2";

export default function HeightResults() {
  const [result, setResult] = useState<PremiumVisualResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(RESULT_KEY);
      if (raw) setResult(JSON.parse(raw) as PremiumVisualResult);
    } catch {
      setResult(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  if (!hydrated) return null;

  return <PremiumVisualTrainingResults moduleSlug="working-at-height" result={result} />;
}
