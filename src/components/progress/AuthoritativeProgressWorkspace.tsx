"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./AuthoritativeProgressWorkspace.module.css";

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

const order = [
  "hazard-perception",
  "working-at-height",
  "safety-induction",
  "fire-safety-emergency-evacuation",
  "forklift-pedestrian-safety",
  "manual-handling-ergonomics",
] as const;

const metadata: Record<string, { number: string; mode: string }> = {
  "hazard-perception": { number: "01", mode: "Observe · Identify · Learn" },
  "working-at-height": { number: "02", mode: "Assess · Inspect · Decide" },
  "safety-induction": { number: "03", mode: "Prepare · Follow · Respond · Report" },
  "fire-safety-emergency-evacuation": { number: "04", mode: "Recognise · Evacuate · Account" },
  "forklift-pedestrian-safety": { number: "05", mode: "Observe · Separate · Cross safely" },
  "manual-handling-ergonomics": { number: "06", mode: "Assess · Choose · Move safely" },
};

function durationLabel(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function dateTimeLabel(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function assignmentLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moduleHref(module: ModuleRecord) {
  if (module.hasActiveAttempt) return `/training/${module.slug}/challenge`;
  return `/training/${module.slug}`;
}

function actionLabel(module: ModuleRecord) {
  if (module.retakeInProgress) return "Resume retake";
  if (module.status === "IN_PROGRESS") return "Resume";
  if (module.status === "COMPLETED") return "Review";
  return "Start";
}

function activeProgressLabel(module: ModuleRecord) {
  if (!module.hasActiveAttempt) return null;

  if (module.activeStagesTotal > 0) {
    return `${module.activeStagesCompleted} / ${module.activeStagesTotal} stages`;
  }

  return "Active attempt";
}

export default function AuthoritativeProgressWorkspace() {
  const [record, setRecord] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleRecord | null>(null);

  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const detailCloseRef = useRef<HTMLButtonElement | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);

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
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!selectedModule) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => detailCloseRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedModule(null);
        requestAnimationFrame(() => detailTriggerRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !detailPanelRef.current) return;

      const focusable = Array.from(
        detailPanelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedModule]);

  const modules = useMemo(() => {
    if (!record) return [];

    const index = new Map<string, number>(
      order.map((slug, position): [string, number] => [slug, position]),
    );

    return [...record.modules].sort(
      (a, b) => (index.get(a.slug) ?? 999) - (index.get(b.slug) ?? 999),
    );
  }, [record]);

  const closeDetails = useCallback(() => {
    setSelectedModule(null);
    requestAnimationFrame(() => detailTriggerRef.current?.focus());
  }, []);

  if (!record && !error) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <strong>Loading demo training record…</strong>
        <span>
          Retrieving completion and performance from Nexus training authority.
        </span>
      </div>
    );
  }

  if (!record) {
    return (
      <section
        className={styles.page}
        aria-label="Training progress and performance"
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Learning record</span>
            <h1>Progress and performance</h1>
            <p>
              Review completion, governed scores, knowledge accuracy, attempts
              and best training times across your assigned safety modules.
            </p>
          </div>
        </header>

        <div className={styles.errorPanel}>
          <div className={styles.errorPanelIcon}>!</div>
          <div>
            <strong>Training record temporarily unavailable</strong>
            <p>{error}</p>
            <span>No training data has been changed.</span>
          </div>
          <button type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const summary = record.summary;
  const readyModules = Math.max(
    summary.totalModules - summary.completedModules - summary.inProgressModules,
    0,
  );

  const completionText =
    summary.inProgressModules > 0
      ? `${summary.completedModules} completed · ${summary.inProgressModules} active`
      : `${summary.completedModules} of ${summary.totalModules} completed`;

  const selectedMeta = selectedModule
    ? metadata[selectedModule.slug] ?? { number: "—", mode: "Safety training" }
    : null;

  return (
    <section
      className={styles.page}
      aria-label="Training progress and performance"
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Learning record</span>
          <h1>Progress and performance</h1>
          <p>
            Governed completion, scores, knowledge accuracy and training activity
            across your assigned modules.
          </p>
        </div>

        <button
          className={styles.refreshButton}
          type="button"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <span aria-hidden="true">↻</span>
          {refreshing ? "Refreshing…" : "Refresh record"}
        </button>
      </header>

      {error ? <div className={styles.softWarning}>{error}</div> : null}

      <div className={styles.metrics}>
        <article className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Training completion</span>
            <i className={styles.metricIcon}>✓</i>
          </div>
          <div className={styles.metricValueRow}>
            <strong>{summary.completionPercent}%</strong>
            <small>{completionText}</small>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <span style={{ width: `${summary.completionPercent}%` }} />
          </div>
        </article>

        <article className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Best governed score</span>
            <i className={`${styles.metricIcon} ${styles.metricIconWarm}`}>★</i>
          </div>
          <div className={styles.metricValueRow}>
            <strong>{summary.bestScore ?? "—"}</strong>
            <small>
              {summary.bestScore == null
                ? "No completed score"
                : "Highest completed result"}
            </small>
          </div>
        </article>

        <article className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Knowledge accuracy</span>
            <i className={`${styles.metricIcon} ${styles.metricIconGold}`}>?</i>
          </div>
          <div className={styles.metricValueRow}>
            <strong>
              {summary.knowledgeAccuracy == null
                ? "—"
                : `${summary.knowledgeAccuracy}%`}
            </strong>
            <small>Completed knowledge checks</small>
          </div>
        </article>

        <article className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Total attempts</span>
            <i className={`${styles.metricIcon} ${styles.metricIconBlue}`}>↻</i>
          </div>
          <div className={styles.metricValueRow}>
            <strong>{summary.totalAttempts}</strong>
            <small>
              {summary.inProgressModules} active · {readyModules} ready
            </small>
          </div>
        </article>
      </div>

      <section className={styles.history}>
        <div className={styles.historyHeader}>
          <div>
            <span className={styles.eyebrow}>Module performance</span>
            <h2>Training history</h2>
          </div>

          <div className={styles.historyMeta}>
            <span className={styles.authority}>
              <i />
              Demo training record
            </span>
            <span className={styles.recordSummary}>
              {summary.completedModules} completed · {summary.inProgressModules} active · {readyModules} ready
            </span>
          </div>
        </div>

        <div className={styles.columns} aria-hidden="true">
          <span>Module</span>
          <span>Best score</span>
          <span>Knowledge</span>
          <span>Best time</span>
          <span>Attempts</span>
          <span>Status & action</span>
        </div>

        <div className={styles.rows}>
          {modules.map((module) => {
            const meta = metadata[module.slug] ?? {
              number: "—",
              mode: "Safety training",
            };

            const statusClass =
              module.status === "COMPLETED"
                ? styles.statusCompleted
                : module.status === "IN_PROGRESS"
                  ? styles.statusProgress
                  : styles.statusReady;

            const activeLabel = activeProgressLabel(module);

            return (
              <article
                className={`${styles.row} ${
                  module.hasActiveAttempt ? styles.rowActive : ""
                }`}
                key={module.slug}
              >
                <div className={styles.moduleCell}>
                  <div
                    className={`${styles.moduleNumber} ${
                      module.status === "COMPLETED"
                        ? styles.moduleNumberCompleted
                        : ""
                    }`}
                  >
                    {module.status === "COMPLETED" ? "✓" : meta.number}
                  </div>

                  <div className={styles.moduleCopy}>
                    <strong>{module.title}</strong>
                    <span>{meta.mode}</span>
                  </div>
                </div>

                <div className={styles.valueCell}>
                  <span>Best score</span>
                  <strong>
                    {module.bestScore == null
                      ? "—"
                      : `${module.bestScore} / ${module.maxScore}`}
                  </strong>
                </div>

                <div className={styles.valueCell}>
                  <span>Knowledge</span>
                  <strong>
                    {module.knowledgeAccuracy == null
                      ? "—"
                      : `${module.knowledgeAccuracy}%`}
                  </strong>
                </div>

                <div className={styles.valueCell}>
                  <span>Best time</span>
                  <strong>{durationLabel(module.bestTimeSeconds)}</strong>
                </div>

                <div className={styles.valueCell}>
                  <span>Attempts</span>
                  <strong>{module.attempts || "—"}</strong>
                </div>

                <div className={styles.statusCell}>
                  <div className={styles.statusCopy}>
                    <span className={`${styles.status} ${statusClass}`}>
                      {module.status === "COMPLETED"
                        ? "Completed"
                        : module.status === "IN_PROGRESS"
                          ? "In progress"
                          : "Ready"}
                    </span>

                    {module.retakeInProgress ? (
                      <small className={styles.activityLabel}>
                        Retake · {activeLabel}
                      </small>
                    ) : module.status === "IN_PROGRESS" && activeLabel ? (
                      <small className={styles.activityLabel}>
                        {activeLabel}
                      </small>
                    ) : null}
                  </div>

                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={(event) => {
                        detailTriggerRef.current = event.currentTarget;
                        setSelectedModule(module);
                      }}
                    >
                      View
                    </button>

                    <Link className={styles.rowAction} href={moduleHref(module)}>
                      {actionLabel(module)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>
          Completion and scores are read from the browser-local Nexus demo training
          record.
        </span>
        <span>
          Updated{" "}
          {new Date(record.generatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </footer>

      {selectedModule && selectedMeta ? (
        <div
          className={styles.detailBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeDetails();
          }}
        >
          <div
            ref={detailPanelRef}
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-detail-title"
          >
            <header className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <div className={styles.detailNumber}>
                  {selectedMeta.number}
                </div>
                <div>
                  <span className={styles.detailEyebrow}>Training record details</span>
                  <h2 id="progress-detail-title">{selectedModule.title}</h2>
                  <p>{selectedMeta.mode}</p>
                </div>
              </div>

              <button
                ref={detailCloseRef}
                type="button"
                className={styles.detailClose}
                onClick={closeDetails}
                aria-label="Close training record details"
              >
                ×
              </button>
            </header>

            <div className={styles.detailStatusBar}>
              <div>
                <span>Current status</span>
                <strong>
                  {selectedModule.status === "COMPLETED"
                    ? "Completed"
                    : selectedModule.status === "IN_PROGRESS"
                      ? "In progress"
                      : "Ready"}
                </strong>
              </div>
              <div>
                <span>Assignment</span>
                <strong>{assignmentLabel(selectedModule.assignmentStatus)}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{selectedModule.durationMinutes} min</strong>
              </div>
            </div>

            <section className={styles.detailSection}>
              <div className={styles.detailSectionHeading}>
                <span>Recorded performance</span>
                <p>Read-only values from the browser-local Nexus demo training record.</p>
              </div>

              <div className={styles.detailMetrics}>
                <article>
                  <span>Best score</span>
                  <strong>
                    {selectedModule.bestScore == null
                      ? "—"
                      : `${selectedModule.bestScore} / ${selectedModule.maxScore}`}
                  </strong>
                </article>
                <article>
                  <span>Knowledge</span>
                  <strong>
                    {selectedModule.knowledgeAccuracy == null
                      ? "—"
                      : `${selectedModule.knowledgeAccuracy}%`}
                  </strong>
                </article>
                <article>
                  <span>Best time</span>
                  <strong>{durationLabel(selectedModule.bestTimeSeconds)}</strong>
                </article>
                <article>
                  <span>Total attempts</span>
                  <strong>{selectedModule.attempts || "—"}</strong>
                </article>
              </div>
            </section>

            <section className={styles.detailSection}>
              <div className={styles.detailSectionHeading}>
                <span>Record status</span>
              </div>

              <div className={styles.detailRecordGrid}>
                <div>
                  <span>Completed attempts</span>
                  <strong>{selectedModule.completedAttempts}</strong>
                </div>
                <div>
                  <span>Latest completion</span>
                  <strong>{dateTimeLabel(selectedModule.latestCompletedAt)}</strong>
                </div>
                <div>
                  <span>Active attempt</span>
                  <strong>{selectedModule.hasActiveAttempt ? "Yes" : "No"}</strong>
                </div>
                <div>
                  <span>Active stage progress</span>
                  <strong>
                    {selectedModule.hasActiveAttempt
                      ? activeProgressLabel(selectedModule)
                      : "—"}
                  </strong>
                </div>
              </div>
            </section>

            {selectedModule.hasActiveAttempt ? (
              <section className={styles.activeAttemptPanel}>
                <div>
                  <span>
                    {selectedModule.retakeInProgress
                      ? "Retake currently in progress"
                      : "Training attempt currently in progress"}
                  </span>
                  <strong>{activeProgressLabel(selectedModule)}</strong>
                  <small>
                    Started {dateTimeLabel(selectedModule.activeStartedAt)}
                  </small>
                </div>
              </section>
            ) : selectedModule.status === "READY" ? (
              <section className={styles.readyPanel}>
                No completed or active training result is currently recorded for this module.
              </section>
            ) : null}

            <footer className={styles.detailFooter}>
              <button
                type="button"
                className={styles.detailSecondary}
                onClick={closeDetails}
              >
                Close
              </button>

              <Link
                className={styles.detailPrimary}
                href={moduleHref(selectedModule)}
              >
                {actionLabel(selectedModule)} module
                <span aria-hidden="true">→</span>
              </Link>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
