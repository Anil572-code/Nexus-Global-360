"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  premiumVisualTrainingModuleFor,
  type PremiumVisualModuleSlug,
} from "@/data/module-2-3-visual-training";
import {
  completeTrainingAttempt,
  startTrainingAttempt,
  type RuntimeAttempt,
  type RuntimeCompletion,
} from "@/lib/training-runtime";
import styles from "./PremiumVisualTraining.module.css";

const HEIGHT_RESULT_KEY = "nexus-safety-360:height-last-result:v2";

export default function PremiumVisualTrainingQuiz({
  moduleSlug,
}: {
  moduleSlug: PremiumVisualModuleSlug;
}) {
  const module = premiumVisualTrainingModuleFor(moduleSlug);
  const router = useRouter();
  const [attempt, setAttempt] = useState<RuntimeAttempt | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    startTrainingAttempt(module.slug)
      .then((started) => {
        if (cancelled) return;
        const completeStages = module.stages.every(
          (stage) => started.controlAnswers[stage.code] !== undefined,
        );
        if (!completeStages) {
          router.replace(`/training/${module.slug}/challenge`);
          return;
        }
        setAttempt(started);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Knowledge check could not be opened.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [module, router]);

  const question = module.quiz[index];
  const correctCount = useMemo(
    () =>
      answers.reduce(
        (total, answer, answerIndex) =>
          total + (answer === module.quiz[answerIndex].correctIndex ? 1 : 0),
        0,
      ),
    [answers, module.quiz],
  );

  if (error && !attempt) return <div className={styles.error}>{error}</div>;
  if (!attempt) return <div className={styles.loading}>Preparing your knowledge check…</div>;

  const isCorrect = selected === question.correctIndex;

  function confirm() {
    if (selected !== null) setConfirmed(true);
  }

  async function next() {
    const activeAttempt = attempt;
    if (selected === null || busy || !activeAttempt) return;
    const nextAnswers = [...answers, selected];

    if (index < module.quiz.length - 1) {
      setAnswers(nextAnswers);
      setIndex((value) => value + 1);
      setSelected(null);
      setConfirmed(false);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const completion = await completeTrainingAttempt(
        activeAttempt.id,
        nextAnswers.map((optionIndex, answerIndex) => ({
          questionCode: module.quiz[answerIndex].code,
          optionIndex,
        })),
      );

      if (module.slug === "working-at-height") {
        window.sessionStorage.setItem(
          HEIGHT_RESULT_KEY,
          JSON.stringify(completion satisfies RuntimeCompletion),
        );
      }

      router.replace(`/training/${module.slug}/results`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Knowledge check could not be completed.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.quizShell}>
      <section className={styles.quizMain}>
        <div className={styles.quizTop}>
          <div>
            <div className={styles.eyebrow}>{module.title} · Knowledge check</div>
            <h1>Reinforce the decisions you just practised</h1>
            <p>Answer each question from the scenario principles. Your final result is evaluated by the local demo training record.</p>
          </div>
          <div className={styles.quizCounter}>
            <strong>{index + 1}</strong>
            <span>/ {module.quiz.length}</span>
          </div>
        </div>

        <div className={styles.quizTrack}>
          <i style={{ width: `${((index + (confirmed ? 1 : 0)) / module.quiz.length) * 100}%` }} />
        </div>

        <h2 className={styles.quizQuestion}>{question.question}</h2>

        <div className={styles.quizOptions}>
          {question.options.map((option, optionIndex) => {
            const chosen = selected === optionIndex;
            const correct = confirmed && optionIndex === question.correctIndex;
            const wrong = confirmed && chosen && optionIndex !== question.correctIndex;

            return (
              <button
                key={option}
                type="button"
                disabled={confirmed}
                className={`${styles.quizOption} ${chosen ? styles.quizOptionSelected : ""} ${correct ? styles.quizOptionCorrect : ""} ${wrong ? styles.quizOptionWrong : ""}`}
                onClick={() => setSelected(optionIndex)}
              >
                <span className={styles.quizLetter}>{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
                <span>{correct ? "✓" : wrong ? "×" : ""}</span>
              </button>
            );
          })}
        </div>

        {confirmed ? (
          <div className={`${styles.quizFeedback} ${isCorrect ? "" : styles.quizFeedbackReview}`}>
            <strong>{isCorrect ? "Correct decision" : "Review this principle"}</strong>
            <p>{question.explanation}</p>
          </div>
        ) : null}

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.quizActions}>
          {!confirmed ? (
            <button type="button" className={styles.button} disabled={selected === null} onClick={confirm}>
              Check answer
            </button>
          ) : (
            <button type="button" className={styles.button} disabled={busy} onClick={next}>
              {busy ? "Recording…" : index === module.quiz.length - 1 ? "Complete module →" : "Next question →"}
            </button>
          )}
        </div>
      </section>

      <aside className={styles.quizSide}>
        <div className={styles.eyebrow}>Assessment status</div>
        <h2>{module.scenarioLabel}</h2>
        <p>Four scenario decisions must already be stored before this knowledge check can be completed.</p>
        <div className={styles.quizMetric}><span>Questions answered</span><strong>{answers.length + (confirmed ? 1 : 0)} / {module.quiz.length}</strong></div>
        <div className={styles.quizMetric}><span>Correct so far</span><strong>{correctCount + (confirmed && isCorrect ? 1 : 0)}</strong></div>
        <div className={styles.quizMetric}><span>Governed record</span><strong>Secure</strong></div>
      </aside>
    </div>
  );
}
