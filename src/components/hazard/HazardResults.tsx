"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hazardPerceptionHazards } from "@/data/hazard-perception";

const RESULT_KEY = "nexus-safety-360:last-result:v1";

type Result = {
  score: number;
  sceneScore: number;
  knowledgeScore: number;
  completionBonus: number;
  quizCorrect: number;
  durationSeconds: number;
  hazardsFound: number;
  completedAt: string;
  performancePoints?: number;
  hintPenalty?: number;
  hintsUsed?: number;
  inspectionMisses?: number;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function HazardResults() {
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(RESULT_KEY);
      if (raw) setResult(JSON.parse(raw) as Result);
    } catch {
      setResult(null);
    }
  }, []);

  if (!result) {
    return (
      <section className="quiz-empty-state">
        <span className="eyebrow">Training results</span>
        <h1>No completed attempt is available</h1>
        <p>Start the Hazard Perception module to generate a training result.</p>
        <Link className="primary-button" href="/training/hazard-perception">Open module →</Link>
      </section>
    );
  }

  const accuracy = Math.round((result.quizCorrect / 3) * 100);
  const performancePoints = Math.max(0, result.performancePoints ?? 0);
  const hintPenalty = Math.max(0, result.hintPenalty ?? 0);
  const hintsUsed = Math.max(0, result.hintsUsed ?? 0);
  const inspectionMisses = Math.max(0, result.inspectionMisses ?? 0);
  const label = result.score >= 900 ? "Excellent" : result.score >= 800 ? "Strong result" : "Completed";

  return (
    <div className="results-shell results-shell-v42">
      <section className="results-hero">
        <div className="results-success-mark">✓</div>
        <div className="eyebrow">Training complete</div>
        <h1>Warehouse Hazard Perception</h1>
        <p>You completed the full immersive inspection and knowledge check.</p>
        <div className="result-score-ring"><strong>{result.score}</strong><span>/ 1000 governed</span></div>
        <div className="result-label">{label}</div>
      </section>

      <section className="result-metric-grid">
        <article><span>Hazards identified</span><strong>{result.hazardsFound} / 6</strong><small>Scene inspection</small></article>
        <article><span>Knowledge check</span><strong>{result.quizCorrect} / 3</strong><small>{accuracy}% accuracy</small></article>
        <article><span>Scene time</span><strong>{formatTime(result.durationSeconds)}</strong><small>Inspection duration</small></article>
        <article><span>Performance</span><strong>+{performancePoints}</strong><small>{hintsUsed} hint actions · {inspectionMisses} misses</small></article>
      </section>

      <section className="result-breakdown-card">
        <div><div className="eyebrow">Score breakdown</div><h2>How your result was calculated</h2></div>
        <div className="score-breakdown-list">
          <div><span>360° hazard inspection</span><strong>{result.sceneScore} / 600</strong></div>
          <div><span>Knowledge check</span><strong>{result.knowledgeScore} / 300</strong></div>
          <div><span>Completion bonus</span><strong>{result.completionBonus} / 100</strong></div>
          <div className="score-total"><span>Governed total</span><strong>{result.score} / 1000</strong></div>
          <div className="score-performance-v845"><span>Optional training performance</span><strong>+{performancePoints}</strong></div>
          <div className="score-performance-detail-v845"><span>Hint deductions</span><strong>−{hintPenalty}</strong></div>
        </div>
        <p className="performance-governance-note-v845">Performance points reward independent, precise inspection. They do not change the governed completion score stored by the training record.</p>
      </section>

      <section className="result-findings-card result-findings-card-v42">
        <div className="result-findings-head">
          <div><div className="eyebrow">Inspection review</div><h2>Six safety findings reinforced</h2></div>
          <span>Reference after completion</span>
        </div>
        <div className="result-findings-grid">
          {hazardPerceptionHazards.map((hazard, index) => (
            <article key={hazard.id}>
              <div className="result-finding-top"><span>{String(index + 1).padStart(2, "0")}</span><strong>{hazard.category}</strong></div>
              <h3>{hazard.title}</h3>
              <p>{hazard.learning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="result-actions">
        <Link className="secondary-button" href="/training/hazard-perception/challenge">Try again</Link>
        <Link className="secondary-button" href="/progress">View progress</Link>
        <Link className="primary-button" href="/dashboard">Return to overview →</Link>
      </section>
    </div>
  );
}
