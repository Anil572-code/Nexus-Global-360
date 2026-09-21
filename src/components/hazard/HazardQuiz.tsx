"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hazardPerceptionQuestions } from "@/data/hazard-perception";
import { recordModuleResult } from "@/lib/progress";
import { completeTrainingAttempt, recordTrainingFinding, startTrainingAttempt } from "@/lib/training-runtime";

const ATTEMPT_KEY = "nexus-safety-360:hazard-attempt:v1";
const QUIZ_STATE_KEY = "nexus-safety-360:hazard-quiz-state:v1";
const RESULT_KEY = "nexus-safety-360:last-result:v1";

type SceneAttempt = {
  startedAt: number;
  seconds: number;
  foundIds: string[];
  sceneScore: number;
  backendAttemptId?: string;
  performancePoints?: number;
  hintPenalty?: number;
  hintsUsed?: number;
  misses?: number;
};

type QuizState = {
  index: number;
  selected: number | null;
  confirmed: boolean;
  answers: number[];
};

const emptyQuizState: QuizState = { index: 0, selected: null, confirmed: false, answers: [] };

function isValidQuizState(value: unknown): value is QuizState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<QuizState>;
  if (!Number.isInteger(state.index) || (state.index ?? -1) < 0 || (state.index ?? 99) >= hazardPerceptionQuestions.length) return false;
  if (state.selected !== null && state.selected !== undefined && (!Number.isInteger(state.selected) || state.selected < 0 || state.selected > 3)) return false;
  if (typeof state.confirmed !== "boolean") return false;
  if (!Array.isArray(state.answers) || state.answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 3)) return false;
  return state.answers.length === state.index;
}

export default function HazardQuiz() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<SceneAttempt | null>(null);
  const [quizState, setQuizState] = useState<QuizState>(emptyQuizState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { index, selected, confirmed, answers } = quizState;

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(ATTEMPT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SceneAttempt;
        if (parsed.foundIds?.length === 6 && parsed.sceneScore === 600) setAttempt(parsed);
      }

      const savedQuiz = window.sessionStorage.getItem(QUIZ_STATE_KEY);
      if (savedQuiz) {
        const parsedQuiz = JSON.parse(savedQuiz) as unknown;
        if (isValidQuizState(parsedQuiz)) setQuizState(parsedQuiz);
        else window.sessionStorage.removeItem(QUIZ_STATE_KEY);
      }
    } catch {
      setAttempt(null);
      setQuizState(emptyQuizState);
      window.sessionStorage.removeItem(QUIZ_STATE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !attempt) return;
    window.sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(quizState));
  }, [hydrated, attempt, quizState]);

  const question = hazardPerceptionQuestions[index];
  const correctCount = useMemo(
    () => answers.reduce((total, answer, answerIndex) => total + (answer === hazardPerceptionQuestions[answerIndex].correct ? 1 : 0), 0),
    [answers],
  );

  if (!hydrated) {
    return (
      <section className="quiz-empty-state quiz-loading-state" aria-live="polite">
        <span className="eyebrow">Knowledge check</span>
        <h1>Preparing your assessment</h1>
        <p>Your completed warehouse inspection is being verified.</p>
      </section>
    );
  }

  if (!attempt) {
    return (
      <div className="page-stack narrow-stack">
        <Link className="back-link" href="/training/hazard-perception">← Hazard Perception</Link>
        <section className="quiz-empty-state">
          <span className="eyebrow">Knowledge check</span>
          <h1>Complete the warehouse inspection first</h1>
          <p>The knowledge check unlocks after all six hazards have been identified in the 360° scene.</p>
          <Link className="primary-button" href="/training/hazard-perception/challenge">Start inspection →</Link>
        </section>
      </div>
    );
  }

  function confirmAnswer() {
    if (selected === null) return;
    setQuizState((current) => ({ ...current, confirmed: true }));
  }

  function selectAnswer(optionIndex: number) {
    if (confirmed) return;
    setQuizState((current) => ({ ...current, selected: optionIndex }));
  }

  async function nextQuestion() {
    if (selected === null || submitting) return;
    const currentAttempt = attempt;
    if (!currentAttempt) return;

    const nextAnswers = [...answers, selected];
    if (index < hazardPerceptionQuestions.length - 1) {
      setQuizState({ index: index + 1, selected: null, confirmed: false, answers: nextAnswers });
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      let attemptId = currentAttempt.backendAttemptId;
      if (!attemptId) {
        const remote = await startTrainingAttempt("hazard-perception");
        attemptId = remote.id;
        for (const findingId of currentAttempt.foundIds) await recordTrainingFinding(attemptId, findingId);
      }
      const completion = await completeTrainingAttempt(
        attemptId,
        nextAnswers.map((optionIndex, answerIndex) => ({
          questionCode: hazardPerceptionQuestions[answerIndex].id,
          optionIndex,
        })),
      );
      const result = {
        score: completion.totalScore,
        sceneScore: completion.inspectionScore,
        knowledgeScore: completion.knowledgeScore,
        completionBonus: completion.completionBonus,
        quizCorrect: completion.quizCorrect,
        durationSeconds: completion.durationSeconds,
        hazardsFound: completion.findingsCount,
        completedAt: completion.completedAt ?? new Date().toISOString(),
        attemptId: completion.attemptId,
        performancePoints: Math.max(0, currentAttempt.performancePoints ?? 0),
        hintPenalty: Math.max(0, currentAttempt.hintPenalty ?? 0),
        hintsUsed: Math.max(0, currentAttempt.hintsUsed ?? 0),
        inspectionMisses: Math.max(0, currentAttempt.misses ?? 0),
      };

      recordModuleResult("hazard-perception", result);
      window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      window.sessionStorage.removeItem(ATTEMPT_KEY);
      window.sessionStorage.removeItem(QUIZ_STATE_KEY);
      router.push("/training/hazard-perception/results");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Your assessment could not be recorded.");
      setSubmitting(false);
    }
  }

  const isCorrect = selected === question.correct;

  return (
    <div className="page-stack quiz-page-stack">
      <section className="quiz-header">
        <div>
          <span className="eyebrow">Knowledge check</span>
          <h1>Warehouse safety decisions</h1>
          <p>Use what you observed in the scene to choose the safest response. Your place is preserved if the page refreshes.</p>
        </div>
        <div className="quiz-progress-copy"><strong>{index + 1}</strong><span>/ {hazardPerceptionQuestions.length}</span></div>
      </section>

      <div className="quiz-progress-track"><span style={{ width: `${((index + (confirmed ? 1 : 0)) / hazardPerceptionQuestions.length) * 100}%` }} /></div>

      <section className="quiz-card">
        <div className="quiz-card-kicker"><span>Question {index + 1}</span><span>{confirmed ? (isCorrect ? "Correct" : "Review") : "Select one answer"}</span></div>
        <h2>{question.question}</h2>

        <div className="quiz-options">
          {question.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const showCorrect = confirmed && optionIndex === question.correct;
            const showWrong = confirmed && isSelected && optionIndex !== question.correct;
            return (
              <button
                type="button"
                key={option}
                className={`quiz-option ${isSelected ? "selected" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`}
                disabled={confirmed}
                onClick={() => selectAnswer(optionIndex)}
              >
                <span className="quiz-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
                {showCorrect && <strong>✓</strong>}
                {showWrong && <strong>×</strong>}
              </button>
            );
          })}
        </div>

        {confirmed && (
          <div className={`quiz-feedback ${isCorrect ? "correct" : "review"}`}>
            <div><strong>{isCorrect ? "Good decision" : "Review this point"}</strong><span>{isCorrect ? "+100 knowledge points" : "0 knowledge points"}</span></div>
            <p>{question.explanation}</p>
          </div>
        )}

        {submitError && <div className="training-runtime-alert inline" role="alert"><strong>Training record not saved</strong><span>{submitError}</span></div>}
        <div className="quiz-actions">
          <div className="quiz-running-score"><span>Knowledge score</span><strong>{(correctCount + (confirmed && isCorrect ? 1 : 0)) * 100} / 300</strong></div>
          {!confirmed ? (
            <button type="button" className="primary-button" disabled={selected === null} onClick={confirmAnswer}>Check answer</button>
          ) : (
            <button type="button" className="primary-button" disabled={submitting} onClick={nextQuestion}>{submitting ? "Recording result…" : index === hazardPerceptionQuestions.length - 1 ? "View results →" : "Next question →"}</button>
          )}
        </div>
      </section>
    </div>
  );
}
