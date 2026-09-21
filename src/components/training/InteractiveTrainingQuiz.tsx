"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  interactiveTrainingModuleFor,
  type InteractiveModuleSlug,
} from "@/data/interactive-training";
import {
  completeTrainingAttempt,
  startTrainingAttempt,
  type RuntimeAttempt,
} from "@/lib/training-runtime";
import styles from "./InteractiveTraining.module.css";
import PremiumVisualTrainingQuiz from "./PremiumVisualTrainingQuiz";

export default function InteractiveTrainingQuiz({ moduleSlug }: { moduleSlug: InteractiveModuleSlug }) {
  if (moduleSlug === "working-at-height") {
    return <PremiumVisualTrainingQuiz moduleSlug="working-at-height" />;
  }
  if (moduleSlug === "safety-induction") {
    return <PremiumVisualTrainingQuiz moduleSlug="safety-induction" />;
  }
  return <LegacyInteractiveTrainingQuiz moduleSlug={moduleSlug} />;
}

function LegacyInteractiveTrainingQuiz({ moduleSlug }: { moduleSlug: InteractiveModuleSlug }) {
  const module = interactiveTrainingModuleFor(moduleSlug);
  const router = useRouter();
  const [attempt, setAttempt] = useState<RuntimeAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!module) return;
    startTrainingAttempt(module.slug)
      .then((started) => {
        const completeStages = module.stages.every((stage) => started.controlAnswers[stage.code] !== undefined);
        if (!completeStages) {
          router.replace(`/training/${module.slug}/challenge`);
          return;
        }
        setAttempt(started);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Knowledge check could not be opened."));
  }, [moduleSlug]);

  if (!module) return <div className={styles.error}>Training module configuration is unavailable.</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!attempt) return <div className={styles.loading}>Preparing your knowledge check…</div>;

  const activeModule = module;
  const activeAttempt = attempt;
  const complete = activeModule.quiz.every((question) => answers[question.code] !== undefined);

  async function submit() {
    if (!complete || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeTrainingAttempt(
        activeAttempt.id,
        activeModule.quiz.map((question) => ({
          questionCode: question.code,
          optionIndex: answers[question.code],
        })),
      );
      router.replace(`/training/${activeModule.slug}/results`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Knowledge check could not be completed.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.identity}><span className={styles.badge}>CHECK</span><div><strong>{activeModule.scenarioLabel}</strong><span>Final knowledge reinforcement</span></div></div>
        <div className={styles.progressCopy}>{Object.keys(answers).length} of {activeModule.quiz.length} answered<div className={styles.bar}><i style={{ width: `${Math.round((Object.keys(answers).length / activeModule.quiz.length) * 100)}%` }} /></div></div>
      </header>

      <section className={styles.main}>
        <div className={styles.sceneHeader}><div className={styles.eyebrow}>Knowledge check</div><h1>Reinforce the key safety principles</h1><p>Answer every question. Your result is evaluated and stored in this browser demo.</p></div>
        <div className={styles.body}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.quizGrid}>
            {activeModule.quiz.map((question, questionIndex) => (
              <fieldset key={question.code} style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className={styles.question}>{questionIndex + 1}. {question.question}</legend>
                <div className={styles.options}>
                  {question.options.map((option, optionIndex) => (
                    <label className={styles.quizOption} key={option}>
                      <input
                        type="radio"
                        name={question.code}
                        checked={answers[question.code] === optionIndex}
                        onChange={() => setAnswers((current) => ({ ...current, [question.code]: optionIndex }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
        <footer className={styles.footer}>
          <div className={styles.statusText}>{complete ? "All answers ready for final submission." : "Complete all questions before submitting."}</div>
          <button type="button" className={styles.button} onClick={submit} disabled={!complete || busy}>{busy ? "Recording…" : "Complete module"}</button>
        </footer>
      </section>
    </div>
  );
}
