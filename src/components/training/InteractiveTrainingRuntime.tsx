"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  interactiveTrainingModuleFor,
  type InteractiveModuleSlug,
} from "@/data/interactive-training";
import {
  recordTrainingControl,
  recordTrainingFinding,
  startTrainingAttempt,
  type RuntimeAttempt,
} from "@/lib/training-runtime";
import styles from "./InteractiveTraining.module.css";
import PremiumVisualTrainingRuntime from "./PremiumVisualTrainingRuntime";

type DecisionState = {
  optionIndex: number;
  isCorrect?: boolean;
  recorded: boolean;
};

export default function InteractiveTrainingRuntime({ moduleSlug }: { moduleSlug: InteractiveModuleSlug }) {
  if (moduleSlug === "working-at-height") {
    return <PremiumVisualTrainingRuntime moduleSlug="working-at-height" />;
  }
  if (moduleSlug === "safety-induction") {
    return <PremiumVisualTrainingRuntime moduleSlug="safety-induction" />;
  }
  return <LegacyInteractiveTrainingRuntime moduleSlug={moduleSlug} />;
}

function LegacyInteractiveTrainingRuntime({ moduleSlug }: { moduleSlug: InteractiveModuleSlug }) {
  const module = interactiveTrainingModuleFor(moduleSlug);
  const [attempt, setAttempt] = useState<RuntimeAttempt | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!module) return;
    startTrainingAttempt(module.slug)
      .then((started) => {
        setAttempt(started);
        const restored: Record<string, DecisionState> = {};
        Object.entries(started.controlAnswers).forEach(([code, optionIndex]) => {
          restored[code] = { optionIndex, recorded: true };
        });
        setDecisions(restored);
        const firstOpen = module.stages.findIndex((stage) => started.controlAnswers[stage.code] === undefined);
        setIndex(firstOpen === -1 ? module.stages.length - 1 : firstOpen);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Training could not be started."));
  }, [moduleSlug]);

  const stage = module?.stages[index];
  const decision = stage ? decisions[stage.code] : undefined;
  const completedCount = module
    ? module.stages.filter((item) => decisions[item.code]?.recorded).length
    : 0;
  const complete = !!module && completedCount === module.stages.length;
  const progress = module ? Math.round((completedCount / module.stages.length) * 100) : 0;

  const feedback = useMemo(() => {
    if (!stage || !decision?.recorded) return null;
    if (decision.isCorrect === undefined) {
      return {
        correct: decision.optionIndex === stage.recommendedIndex,
        text:
          decision.optionIndex === stage.recommendedIndex
            ? stage.positiveFeedback
            : stage.reviewFeedback,
      };
    }
    return {
      correct: decision.isCorrect,
      text: decision.isCorrect ? stage.positiveFeedback : stage.reviewFeedback,
    };
  }, [stage, decision]);

  if (!module) return <div className={styles.error}>Training module configuration is unavailable.</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!attempt || !stage) return <div className={styles.loading}>Preparing your training session…</div>;

  const activeModule = module;
  const activeAttempt = attempt;
  const activeStage = stage;

  async function choose(optionIndex: number) {
    if (decision?.recorded || busy) return;
    setBusy(true);
    setError("");
    try {
      if (!activeAttempt.findingCodes.includes(activeStage.code)) {
        await recordTrainingFinding(activeAttempt.id, activeStage.code);
      }
      const result = await recordTrainingControl(activeAttempt.id, activeStage.code, optionIndex);
      setDecisions((current) => ({
        ...current,
        [activeStage.code]: { optionIndex, recorded: true, isCorrect: result.isCorrect },
      }));
      setAttempt((current) =>
        current
          ? {
              ...current,
              findingCodes: current.findingCodes.includes(activeStage.code)
                ? current.findingCodes
                : [...current.findingCodes, activeStage.code],
              controlAnswers: { ...current.controlAnswers, [activeStage.code]: optionIndex },
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your decision could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (index < activeModule.stages.length - 1) {
      setIndex((value) => value + 1);
    }
  }

  function previous() {
    if (index > 0) setIndex((value) => value - 1);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span className={styles.badge}>{activeModule.code.replace("NGL-SAF-", "SAF ")}</span>
          <div><strong>{activeModule.scenarioLabel}</strong><span>{activeModule.contentType} · persisted training attempt</span></div>
        </div>
        <div className={styles.progressCopy}>
          {completedCount} of {activeModule.stages.length} decisions recorded
          <div className={styles.bar}><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railLabel}>Learning stages</div>
          {activeModule.stages.map((item, stageIndex) => {
            const done = !!decisions[item.code]?.recorded;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setIndex(stageIndex)}
                className={`${styles.step} ${stageIndex === index ? styles.active : ""} ${done ? styles.done : ""}`}
                style={{ width: "100%", border: 0, textAlign: "left", backgroundColor: undefined, cursor: "pointer" }}
              >
                <b>{done ? "✓" : String(stageIndex + 1).padStart(2, "0")}</b>
                <span><strong>{item.title}</strong><span>{done ? "Decision recorded" : item.label}</span></span>
              </button>
            );
          })}
          <div className={styles.principle}>{activeModule.stageIntro}</div>
        </aside>

        <section className={styles.main}>
          <div className={styles.sceneHeader}>
            <div className={styles.eyebrow}>{activeStage.label}</div>
            <h1>{activeStage.title}</h1>
            <p>{activeStage.principle}</p>
          </div>

          <div className={styles.body}>
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.situation}>
              <div className={styles.sceneMark}>N</div>
              <div><strong>Scenario</strong><p>{activeStage.situation}</p></div>
            </div>

            <h2 className={styles.question}>{activeStage.question}</h2>
            <div className={styles.options}>
              {activeStage.options.map((option, optionIndex) => (
                <button
                  type="button"
                  key={option}
                  disabled={busy || !!decision?.recorded}
                  className={`${styles.option} ${decision?.optionIndex === optionIndex ? styles.selected : ""}`}
                  onClick={() => choose(optionIndex)}
                >
                  <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                </button>
              ))}
            </div>

            {feedback ? (
              <div className={`${styles.feedback} ${feedback.correct ? "" : styles.review}`}>
                <strong>{feedback.correct ? "Recommended decision" : "Review this decision"}</strong>
                <p>{feedback.text}</p>
              </div>
            ) : null}
          </div>

          <footer className={styles.footer}>
            <div>
              {index > 0 ? <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={previous}>Previous</button> : null}
            </div>
            <div className={styles.statusText}>{decision?.recorded ? "Decision saved to your training record." : "Choose one response to continue."}</div>
            <div>
              {complete ? (
                <Link className={styles.linkButton} href={`/training/${activeModule.slug}/quiz`}>Knowledge check →</Link>
              ) : (
                <button type="button" className={styles.button} onClick={next} disabled={!decision?.recorded || index >= activeModule.stages.length - 1}>
                  Next stage
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
