import Link from "next/link";
import {
  premiumVisualTrainingModuleFor,
  type PremiumVisualModuleSlug,
} from "@/data/module-2-3-visual-training";
import styles from "./PremiumVisualTraining.module.css";

export type PremiumVisualResult = {
  totalScore: number;
  durationSeconds: number;
  inspectionScore: number;
  controlScore: number;
  knowledgeScore: number;
  completionBonus: number;
  findingsCount: number;
  controlCorrect: number;
  quizCorrect: number;
  quizTotal: number;
  completedAt: string | Date | null;
};

function durationLabel(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

export default function PremiumVisualTrainingResults({
  moduleSlug,
  result,
}: {
  moduleSlug: PremiumVisualModuleSlug;
  result: PremiumVisualResult | null;
}) {
  const module = premiumVisualTrainingModuleFor(moduleSlug);

  if (!result) {
    return (
      <div className={styles.loading}>
        <div className={styles.errorCard}>
          <strong>Completed result not found</strong>
          <p>Your secure training result is not available yet. Return to the module and confirm the assessment is complete.</p>
        </div>
      </div>
    );
  }

  const scorePercent = Math.min(100, Math.max(0, Math.round((result.totalScore / 1000) * 100)));
  const knowledgePercent = result.quizTotal
    ? Math.round((result.quizCorrect / result.quizTotal) * 100)
    : 0;
  const decisionPercent = Math.round((result.controlCorrect / 4) * 100);
  const label =
    result.totalScore >= 900
      ? "Excellent"
      : result.totalScore >= 800
        ? "Strong result"
        : "Completed";

  return (
    <div className={styles.resultsShell}>
      <section className={styles.resultHero}>
        <div className={styles.resultMark}>✓</div>
        <div className={styles.eyebrow}>Training complete</div>
        <h1>{module.title}</h1>
        <p>Your completion and governed score are stored in the Nexus training record.</p>

        <div
          className={styles.scoreRing}
          style={{ ["--score-angle" as string]: `${scorePercent * 3.6}deg` }}
        >
          <div><strong>{result.totalScore}</strong><span>/ 1000</span></div>
        </div>

        <span className={styles.resultLabel}>{label}</span>
      </section>

      <section className={styles.resultMain}>
        <div className={styles.eyebrow}>{module.scenarioLabel}</div>
        <h2>Recorded performance</h2>
        <p>Review the decision, knowledge and completion components of your module result.</p>

        <div className={styles.metrics}>
          <div className={styles.metric}><span>Decision accuracy</span><strong>{decisionPercent}%</strong></div>
          <div className={styles.metric}><span>Knowledge accuracy</span><strong>{knowledgePercent}%</strong></div>
          <div className={styles.metric}><span>Scenario stages</span><strong>{result.findingsCount} / 4</strong></div>
          <div className={styles.metric}><span>Duration</span><strong>{durationLabel(result.durationSeconds)}</strong></div>
        </div>

        <div className={styles.breakdown}>
          <div className={styles.breakdownRow}><span>Scenario recognition</span><strong>{result.inspectionScore} / 200</strong></div>
          <div className={styles.breakdownRow}><span>Control decisions</span><strong>{result.controlScore} / 400</strong></div>
          <div className={styles.breakdownRow}><span>Knowledge check</span><strong>{result.knowledgeScore} / 300</strong></div>
          <div className={styles.breakdownRow}><span>Completion bonus</span><strong>{result.completionBonus} / 100</strong></div>
          <div className={styles.breakdownRow}><span>Governed total</span><strong>{result.totalScore} / 1000</strong></div>
        </div>

        <div className={styles.resultActions}>
          <Link className={styles.linkButton} href="/training">Return to training</Link>
          <Link className={`${styles.linkButton} ${styles.secondary}`} href={`/training/${module.slug}`}>
            Review module
          </Link>
        </div>
      </section>
    </div>
  );
}
