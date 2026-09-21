import Link from "next/link";
import { getTrainingModule } from "@/data/training";
import type { LatestTrainingResult } from "@/lib/training-access";
import styles from "./InteractiveTraining.module.css";
import PremiumVisualTrainingResults, { type PremiumVisualResult } from "./PremiumVisualTrainingResults";

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

export default function InteractiveTrainingResults({
  moduleSlug,
  result,
}: {
  moduleSlug: string;
  result: LatestTrainingResult | null;
}) {
  if (moduleSlug === "working-at-height") {
    return <PremiumVisualTrainingResults moduleSlug="working-at-height" result={result as PremiumVisualResult | null} />;
  }
  if (moduleSlug === "safety-induction") {
    return <PremiumVisualTrainingResults moduleSlug="safety-induction" result={result as PremiumVisualResult | null} />;
  }

  return <LegacyInteractiveTrainingResults moduleSlug={moduleSlug} result={result} />;
}

function LegacyInteractiveTrainingResults({
  moduleSlug,
  result,
}: {
  moduleSlug: string;
  result: LatestTrainingResult | null;
}) {
  const module = getTrainingModule(moduleSlug);

  if (!module) return <div className={styles.error}>Training module configuration is unavailable.</div>;
  if (!result) {
    return (
      <div className={styles.loading}>
        <div>
          <strong>Completed result not found.</strong>
          <p>Your training record may still be processing. Return to the Training library and reopen the module if required.</p>
          <Link className={styles.linkButton} href="/training">Training library</Link>
        </div>
      </div>
    );
  }

  const scorePercent = Math.min(100, Math.max(0, Math.round((result.totalScore / 1000) * 100)));
  const knowledgePercent = result.quizTotal ? Math.round((result.quizCorrect / result.quizTotal) * 100) : 0;
  const decisionTotal = moduleSlug === "hazard-perception" ? 0 : 4;
  const decisionPercent = decisionTotal ? Math.round((result.controlCorrect / decisionTotal) * 100) : 100;

  return (
    <div className={styles.results}>
      <section className={styles.scoreCard}>
        <div className={styles.eyebrow}>Module completed</div>
        <div className={styles.scoreRing} style={{ ["--score-angle" as string]: `${scorePercent * 3.6}deg` }}>
          <div><strong>{result.totalScore}</strong><span>/ 1000</span></div>
        </div>
        <strong>{module.title}</strong>
        <p className={styles.statusText}>Completion is stored in your Nexus training history.</p>
      </section>

      <section className={styles.resultPanel}>
        <div className={styles.eyebrow}>{module.category}</div>
        <h1>Training complete</h1>
        <p>Review your recorded performance and return to the assigned training library.</p>
        <div className={styles.metrics}>
          <div className={styles.metric}><span>Total score</span><strong>{result.totalScore} / 1000</strong></div>
          <div className={styles.metric}><span>Knowledge</span><strong>{knowledgePercent}%</strong></div>
          <div className={styles.metric}><span>Decision accuracy</span><strong>{decisionPercent}%</strong></div>
          <div className={styles.metric}><span>Duration</span><strong>{durationLabel(result.durationSeconds)}</strong></div>
          <div className={styles.metric}><span>Scenario stages</span><strong>{result.findingsCount}</strong></div>
          <div className={styles.metric}><span>Completed</span><strong>{result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "Recorded"}</strong></div>
        </div>
        <div className={styles.actions}>
          <Link className={styles.linkButton} href="/training">Return to training</Link>
          <Link className={`${styles.linkButton} ${styles.secondary}`} href={`/training/${moduleSlug}`}>Review module</Link>
        </div>
      </section>
    </div>
  );
}
