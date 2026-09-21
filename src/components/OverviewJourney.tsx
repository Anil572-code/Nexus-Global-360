"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trainingModules } from "@/data/training";
import styles from "@/app/(portal)/dashboard/DashboardOverview.module.css";

type ModuleRecord = {
  slug: string;
  title: string;
  durationMinutes: number;
  maxScore: number;
  status: "COMPLETED" | "IN_PROGRESS" | "READY";
  assignmentStatus: string;
  attempts: number;
  completedAttempts: number;
  bestScore: number | null;
  knowledgeAccuracy: number | null;
  bestTimeSeconds: number | null;
  latestCompletedAt: string | null;
  hasActiveAttempt: boolean;
  activeAttemptId: string | null;
  activeStartedAt: string | null;
  activeStagesCompleted: number;
  activeStagesTotal: number;
  retakeInProgress: boolean;
};

type ProgressResponse = {
  generatedAt: string;
  summary: {
    completedModules: number;
    totalModules: number;
    completionPercent: number;
    bestScore: number | null;
    knowledgeAccuracy: number | null;
    inProgressModules: number;
    totalAttempts: number;
  };
  modules: ModuleRecord[];
};

type DashboardModule = {
  definition: (typeof trainingModules)[number];
  record: ModuleRecord;
};

const order = [
  "hazard-perception",
  "working-at-height",
  "safety-induction",
  "fire-safety-emergency-evacuation",
  "forklift-pedestrian-safety",
  "manual-handling-ergonomics",
] as const;

function moduleHref(module: DashboardModule) {
  return module.record.hasActiveAttempt
    ? `/training/${module.record.slug}/challenge`
    : `/training/${module.record.slug}`;
}

function incompleteStatus(module: DashboardModule, recommended: boolean) {
  if (recommended) {
    return module.record.status === "IN_PROGRESS"
      ? "Resume next"
      : "Recommended next";
  }

  return module.record.status === "IN_PROGRESS" ? "In progress" : "Ready";
}

export default function OverviewJourney() {
  const [record, setRecord] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/training/progress/me", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: "{}",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as ProgressResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Training progress could not be loaded.");
      }

      setRecord(data);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Training progress could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const modules = useMemo<DashboardModule[]>(() => {
    if (!record) return [];

    const index = new Map(
      order.map((slug, position): [string, number] => [slug, position]),
    );

    return record.modules
      .map((moduleRecord) => {
        const definition = trainingModules.find(
          (module) => module.id === moduleRecord.slug,
        );

        return definition
          ? { definition, record: moduleRecord }
          : null;
      })
      .filter((entry): entry is DashboardModule => Boolean(entry))
      .sort(
        (a, b) =>
          (index.get(a.record.slug) ?? 999) -
          (index.get(b.record.slug) ?? 999),
      );
  }, [record]);

  if (!record && !error) {
    return (
      <section className={styles.dashboardState} aria-live="polite">
        <span className={styles.dashboardSpinner} aria-hidden="true" />
        <strong>Loading demo training record…</strong>
        <small>Synchronizing your latest completions and results.</small>
      </section>
    );
  }

  if (!record) {
    return (
      <section className={styles.dashboardState} role="alert">
        <strong>Training record temporarily unavailable</strong>
        <small>{error}</small>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </section>
    );
  }

  const summary = record.summary;
  const totalModules = summary.totalModules;
  const completedCount = summary.completedModules;
  const remainingCount = Math.max(totalModules - completedCount, 0);
  const completion = summary.completionPercent;
  const allComplete = totalModules > 0 && completedCount === totalModules;

  const nextModule =
    modules.find((module) => module.record.status === "IN_PROGRESS") ??
    modules.find((module) => module.record.status === "READY") ??
    modules.find((module) => module.record.status !== "COMPLETED") ??
    modules[0];

  const queueModules = modules
    .filter(
      (module) =>
        module.record.slug !== nextModule?.record.slug &&
        module.record.status !== "COMPLETED",
    )
    .slice(0, 3);

  const bestEntry = modules.reduce<DashboardModule | null>((best, module) => {
    if (module.record.bestScore == null) return best;

    return !best ||
      best.record.bestScore == null ||
      module.record.bestScore > best.record.bestScore
      ? module
      : best;
  }, null);

  return (
    <div className={styles.dashboard}>
      <section className={styles.kpiGrid} aria-label="Training statistics">
        <article className={styles.kpiCard}>
          <span>Completion</span>
          <div className={styles.kpiValueRow}>
            <strong>{completion}%</strong>
            <small>
              {completedCount} of {totalModules} modules
            </small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span>Best score</span>
          <div className={styles.kpiValueRow}>
            <strong>{summary.bestScore ?? "--"}</strong>
            <small>{bestEntry?.definition.title ?? "No result"}</small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span>Knowledge</span>
          <div className={styles.kpiValueRow}>
            <strong>
              {summary.knowledgeAccuracy == null
                ? "--"
                : `${summary.knowledgeAccuracy}%`}
            </strong>
            <small>Average recorded accuracy</small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span>Attempts</span>
          <div className={styles.kpiValueRow}>
            <strong>{summary.totalAttempts}</strong>
            <small>
              {remainingCount} module{remainingCount === 1 ? "" : "s"} remaining
            </small>
          </div>
        </article>
      </section>

      <section className={styles.workspaceGrid}>
        <article className={styles.progressionCard}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>
                Recorded best score by module
              </span>
              <h2>Training progression</h2>
            </div>

            <div className={styles.legend} aria-label="Chart legend">
              <span>
                <i className={styles.legendComplete} />
                Recorded score
              </span>
              <span>
                <i className={styles.legendNext} />
                Recommended next
              </span>
              <span>
                <i className={styles.legendPending} />
                Not completed
              </span>
            </div>
          </div>

          <div className={styles.chartArea}>
            <div className={styles.chartScale} aria-hidden="true">
              <span>1250</span>
              <span>1000</span>
              <span>750</span>
              <span>500</span>
              <span>250</span>
              <span>0</span>
            </div>

            <div className={styles.chartPlot}>
              <div className={styles.gridLines} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className={styles.columns}>
                {modules.map((module) => {
                  const completed =
                    module.record.status === "COMPLETED" &&
                    module.record.bestScore != null;
                  const recommended =
                    !allComplete &&
                    module.record.slug === nextModule?.record.slug;
                  const scorePlotPercent = completed
                    ? Math.max(
                        0,
                        Math.min(
                          80,
                          ((module.record.bestScore ?? 0) / 1250) * 100,
                        ),
                      )
                    : 0;

                  return (
                    <div className={styles.column} key={module.record.slug}>
                      <div
                        className={`${styles.scoreLane} ${
                          completed
                            ? styles.scoreLaneCompleted
                            : recommended
                              ? styles.scoreLaneRecommended
                              : styles.scoreLanePending
                        }`}
                      >
                        {completed ? (
                          <>
                            <strong
                              className={styles.scoreLabel}
                              style={{
                                bottom: `calc(${Math.max(
                                  scorePlotPercent,
                                  4,
                                )}% + 7px)`,
                              }}
                            >
                              {module.record.bestScore}
                            </strong>
                            <div
                              className={styles.completedBar}
                              style={{
                                height: `${Math.max(scorePlotPercent, 4)}%`,
                              }}
                              title={`${module.definition.title}: ${module.record.bestScore} / ${module.record.maxScore}`}
                            />
                          </>
                        ) : (
                          <div className={styles.emptyScoreMessage}>
                            <span>
                              {recommended
                                ? "NEXT"
                                : module.record.status === "IN_PROGRESS"
                                  ? "ACTIVE"
                                  : "—"}
                            </span>
                            <small>
                              {recommended
                                ? module.record.status === "IN_PROGRESS"
                                  ? "Resume module"
                                  : "Recommended"
                                : module.record.status === "IN_PROGRESS"
                                  ? "In progress"
                                  : "No score"}
                            </small>
                          </div>
                        )}
                      </div>

                      <div className={styles.columnLabel}>
                        <b>{module.definition.number}</b>
                        <strong>{module.definition.title}</strong>
                        <span
                          className={
                            completed
                              ? styles.completedStatus
                              : recommended
                                ? styles.recommendedStatus
                                : module.record.status === "IN_PROGRESS"
                                  ? styles.inProgressStatus
                                  : styles.pendingStatus
                          }
                        >
                          {completed
                            ? "Completed"
                            : incompleteStatus(module, recommended)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <footer className={styles.chartFooter}>
            <div className={styles.chartFooterCopy}>
              <strong>Score authority</strong>
              <span>
                Maximum attainable module score is 1000. The 1250 chart ceiling
                provides label headroom only.
              </span>
            </div>
            <Link href="/progress" className={styles.chartFooterAction}>
              View detailed progress
              <span aria-hidden="true">→</span>
            </Link>
          </footer>
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.nextCard}>
            <div className={styles.nextMeta}>
              <b>{allComplete ? "Training complete" : "Recommended next"}</b>
              {!allComplete && nextModule ? (
                <span>{nextModule.definition.duration}</span>
              ) : null}
            </div>

            <h2>
              {allComplete
                ? "Training library"
                : nextModule?.definition.title ?? "Training library"}
            </h2>

            <p>
              {allComplete
                ? "All available modules are complete. Review any module when required."
                : nextModule?.definition.description ??
                  "Continue your assigned training."}
            </p>

            {!allComplete && nextModule ? (
              <div className={styles.tags}>
                <span>{nextModule.definition.category}</span>
                <span>{nextModule.definition.difficulty}</span>
              </div>
            ) : null}

            <Link
              href={
                allComplete || !nextModule
                  ? "/training"
                  : moduleHref(nextModule)
              }
              className={styles.primaryAction}
            >
              {allComplete
                ? "Open training"
                : nextModule?.record.status === "IN_PROGRESS"
                  ? "Resume module"
                  : "Start module"}
              <span>→</span>
            </Link>
          </article>

          <article className={styles.queueCard}>
            <div className={styles.sideHeading}>
              <span className={styles.eyebrow}>Up after this</span>
              <h2>Training queue</h2>
            </div>

            <div className={styles.queueList}>
              {queueModules.length ? (
                queueModules.map((module) => (
                  <div className={styles.queueRow} key={module.record.slug}>
                    <b>{module.definition.number}</b>
                    <div>
                      <strong>{module.definition.title}</strong>
                      <span>{module.definition.duration}</span>
                    </div>
                    <em>
                      {module.record.status === "IN_PROGRESS"
                        ? "In progress"
                        : "Ready"}
                    </em>
                  </div>
                ))
              ) : (
                <div className={styles.queueEmpty}>
                  No additional modules are waiting.
                </div>
              )}
            </div>
          </article>

          <article className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <div>
                <span className={styles.eyebrow}>Program status</span>
                <h2>Learning progress</h2>
              </div>
              <strong>{completion}%</strong>
            </div>

            <div className={styles.progressTrack}>
              <i style={{ width: `${completion}%` }} />
            </div>

            <div className={styles.statusMetrics}>
              <div>
                <strong>{completedCount}</strong>
                <span>Completed</span>
              </div>
              <div>
                <strong>{remainingCount}</strong>
                <span>Remaining</span>
              </div>
              <div>
                <strong>{totalModules}</strong>
                <span>Total</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
