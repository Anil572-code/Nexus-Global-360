"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyProgress, readProgress } from "@/lib/progress";

const MODULE_IDS = ["hazard-perception", "working-at-height"];

type ProgressSummaryProps = {
  variant?: "cards" | "strip";
};

export default function ProgressSummary({ variant = "cards" }: ProgressSummaryProps) {
  const [progress, setProgress] = useState(emptyProgress);
  useEffect(() => setProgress(readProgress()), []);

  const completed = progress.completedModules.filter((id) => MODULE_IDS.includes(id)).length;
  const completion = Math.round((completed / MODULE_IDS.length) * 100);
  const results = useMemo(() => MODULE_IDS.map((id) => progress.moduleResults[id]).filter(Boolean), [progress.moduleResults]);
  const averageKnowledge = results.length ? Math.round(results.reduce((sum, result) => sum + (result.quizCorrect / 3) * 100, 0) / results.length) : 0;
  const attempts = results.reduce((sum, result) => sum + result.attempts, 0);

  if (variant === "strip") {
    return (
      <div className="overview-snapshot-v62" aria-label="Training snapshot">
        <article>
          <span>Completion</span>
          <strong>{completion}%</strong>
          <small>{completed} of {MODULE_IDS.length} complete</small>
          <div className="overview-snapshot-progress-v62"><i style={{ width: `${completion}%` }} /></div>
        </article>
        <article>
          <span>Best score</span>
          <strong>{progress.bestScore || "—"}</strong>
          <small>{progress.bestScore ? "Highest recorded" : "No score yet"}</small>
        </article>
        <article>
          <span>Knowledge</span>
          <strong>{results.length ? `${averageKnowledge}%` : "—"}</strong>
          <small>{results.length ? "Average accuracy" : "Not assessed yet"}</small>
        </article>
        <article>
          <span>Attempts</span>
          <strong>{attempts || "—"}</strong>
          <small>{attempts ? "Total recorded" : "No attempts yet"}</small>
        </article>
      </div>
    );
  }

  return (
    <div className="stat-grid stat-grid-v6">
      <article className="stat-card stat-card-v6"><div className="stat-card-head"><span>Training completion</span><i className="stat-icon completion">✓</i></div><strong>{completion}%</strong><small>{completed} of {MODULE_IDS.length} immersive modules completed</small><div className="mini-progress"><span style={{ width: `${completion}%` }} /></div></article>
      <article className="stat-card stat-card-v6"><div className="stat-card-head"><span>Best score</span><i className="stat-icon score">★</i></div><strong>{progress.bestScore || "—"}</strong><small>{progress.bestScore ? "Highest score across completed modules" : "Complete a module to record a score"}</small></article>
      <article className="stat-card stat-card-v6"><div className="stat-card-head"><span>Knowledge accuracy</span><i className="stat-icon knowledge">?</i></div><strong>{results.length ? `${averageKnowledge}%` : "—"}</strong><small>{results.length ? "Average across completed knowledge checks" : "No knowledge check completed yet"}</small></article>
      <article className="stat-card stat-card-v6"><div className="stat-card-head"><span>Total attempts</span><i className="stat-icon attempts">↻</i></div><strong>{attempts || "—"}</strong><small>{attempts ? "Recorded attempts across both modules" : "Your first attempt will appear here"}</small></article>
    </div>
  );
}
