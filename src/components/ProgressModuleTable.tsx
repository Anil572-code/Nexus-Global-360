"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trainingModules } from "@/data/training";
import { emptyProgress, readProgress } from "@/lib/progress";

function formatTime(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function ProgressModuleTable() {
  const [progress, setProgress] = useState(emptyProgress);
  useEffect(() => setProgress(readProgress()), []);

  return (
    <div className="progress-table progress-table-v3 progress-table-v6">
      {trainingModules.map((module) => {
        const result = progress.moduleResults[module.id];
        const complete = progress.completedModules.includes(module.id);
        const accuracy = result ? Math.round((result.quizCorrect / 3) * 100) : 0;
        return (
          <article className={`progress-row progress-row-v3 progress-row-v6 ${complete ? "complete" : ""}`} key={module.id}>
            <div className="progress-module-identity-v6"><span className="row-index">{complete ? "✓" : module.number}</span><div><strong>{module.title}</strong><span>{module.modeLabel}</span></div></div>
            <div className="progress-metric-v6"><span>Best score</span><strong>{result ? `${result.bestScore} / 1000` : "—"}</strong></div>
            <div className="progress-metric-v6"><span>Knowledge</span><strong>{result ? `${accuracy}%` : "—"}</strong></div>
            <div className="progress-metric-v6"><span>Best time</span><strong>{result ? formatTime(result.bestDurationSeconds) : "—"}</strong></div>
            <div className="progress-metric-v6"><span>Attempts</span><strong>{result?.attempts ?? "—"}</strong></div>
            <div className="progress-row-action-v6"><span className={`pill ${complete ? "completed" : "available"}`}>{complete ? "Completed" : "Ready"}</span><Link href={`/training/${module.id}`}>{complete ? "Review" : "Start"} →</Link></div>
          </article>
        );
      })}
    </div>
  );
}
