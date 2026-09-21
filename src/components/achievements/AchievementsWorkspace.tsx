"use client";

/* ACHIEVEMENTS P2 - PRODUCTION GOVERNED WORKSPACE */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./AchievementsWorkspace.module.css";

type Achievement = {
  code: string;
  name: string;
  description: string;
  criteria: string;
  category: string;
  icon: string;
  status: "EARNED" | "LOCKED";
  earnedAt: string | null;
};

type AchievementResponse = {
  generatedAt: string;
  authority: "GOVERNED_TRAINING_RECORD";
  summary: {
    earned: number;
    total: number;
    remaining: number;
    completionPercent: number;
    latestEarned: {
      code: string;
      name: string;
      earnedAt: string | null;
    } | null;
  };
  achievements: Achievement[];
};

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatUpdated(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Updated now";
  }

  return `Updated ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function Icon({
  name,
}: {
  name: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    width: 19,
    height: 19,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    );
  }

  if (name === "bolt") {
    return (
      <svg {...common}>
        <path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z" />
      </svg>
    );
  }

  if (name === "height") {
    return (
      <svg {...common}>
        <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
      </svg>
    );
  }

  if (name === "diamond") {
    return (
      <svg {...common}>
        <path d="m12 3 7 9-7 9-7-9 7-9Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2" />
    </svg>
  );
}

export default function AchievementsWorkspace() {
  const [record, setRecord] =
    useState<AchievementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (
      mode: "load" | "refresh" = "load",
    ) => {
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(
          "/api/achievements/me",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: "{}",
            cache: "no-store",
          },
        );

        const data = (await response
          .json()
          .catch(() => ({}))) as
          | AchievementResponse
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Achievements could not be loaded.",
          );
        }

        setRecord(data as AchievementResponse);
        setError("");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Achievements could not be loaded.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();

    const onFocus = () =>
      void load("refresh");

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(
        "focus",
        onFocus,
      );
    };
  }, [load]);

  const earned = useMemo(
    () =>
      record?.achievements.filter(
        (achievement) =>
          achievement.status === "EARNED",
      ) ?? [],
    [record],
  );

  if (loading && !record) {
    return (
      <section
        className={styles.state}
        aria-live="polite"
      >
        <span
          className={styles.spinner}
          aria-hidden="true"
        />
        <strong>
          Synchronizing achievements…
        </strong>
        <small>
          Evaluating your training record.
        </small>
      </section>
    );
  }

  if (!record) {
    return (
      <section
        className={styles.state}
        role="alert"
      >
        <strong>
          Achievements temporarily unavailable
        </strong>
        <small>{error}</small>
        <button
          type="button"
          onClick={() => void load()}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>
            Recognition
          </span>
          <h1>Achievements</h1>
          <p>
            Governed milestones earned from completed
            training, knowledge, inspection quality
            and performance.
          </p>
        </div>

        <button
          type="button"
          className={styles.refresh}
          disabled={refreshing}
          onClick={() =>
            void load("refresh")
          }
        >
          <span aria-hidden="true">↻</span>
          {refreshing
            ? "Refreshing…"
            : "Refresh record"}
        </button>
      </header>

      <section
        className={styles.summary}
        aria-label="Achievement summary"
      >
        <article>
          <span>Earned</span>
          <strong>
            {record.summary.earned} /{" "}
            {record.summary.total}
          </strong>
          <small>
            Governed achievements recorded
          </small>
        </article>

        <article>
          <span>Completion</span>
          <strong>
            {record.summary.completionPercent}%
          </strong>
          <small>
            Achievement programme progress
          </small>
        </article>

        <article>
          <span>Remaining</span>
          <strong>
            {record.summary.remaining}
          </strong>
          <small>
            Milestones still available
          </small>
        </article>

        <article>
          <span>Latest earned</span>
          <strong
            className={styles.latestName}
          >
            {record.summary.latestEarned?.name ??
              "No award yet"}
          </strong>
          <small>
            {record.summary.latestEarned
              ? formatDate(
                  record.summary.latestEarned
                    .earnedAt,
                )
              : "Complete training to begin"}
          </small>
        </article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHead}>
          <div>
            <span className={styles.eyebrow}>
              Achievement record
            </span>
            <h2>Safety milestones</h2>
            <p>
              Earned status is read from authenticated
              training records and stored in the Nexus
              achievement register.
            </p>
          </div>

          <div className={styles.progressBlock}>
            <div>
              <span>Programme progress</span>
              <strong>
                {record.summary.completionPercent}%
              </strong>
            </div>
            <div
              className={styles.progressTrack}
              aria-label={`${record.summary.completionPercent}% of achievements earned`}
            >
              <i
                style={{
                  width: `${record.summary.completionPercent}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {record.achievements.map(
            (achievement) => {
              const isEarned =
                achievement.status === "EARNED";

              return (
                <article
                  key={achievement.code}
                  className={`${styles.card} ${
                    isEarned
                      ? styles.earned
                      : styles.locked
                  }`}
                >
                  <div
                    className={styles.icon}
                    aria-hidden="true"
                  >
                    <Icon
                      name={achievement.icon}
                    />
                  </div>

                  <div
                    className={styles.cardCopy}
                  >
                    <div
                      className={styles.cardMeta}
                    >
                      <span>
                        {achievement.category}
                      </span>
                      <b>
                        {isEarned
                          ? "EARNED"
                          : "LOCKED"}
                      </b>
                    </div>

                    <h3>{achievement.name}</h3>
                    <p>
                      {achievement.description}
                    </p>

                    <div
                      className={styles.cardFoot}
                    >
                      <span>
                        {isEarned
                          ? "Earned"
                          : "Requirement"}
                      </span>
                      <strong>
                        {isEarned
                          ? formatDate(
                              achievement.earnedAt,
                            )
                          : achievement.criteria}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>

        <footer className={styles.footer}>
          <div>
            <strong>
              Achievement authority
            </strong>
            <span>
              Awards are derived from completed
              authenticated training attempts and are
              retained once earned.
            </span>
          </div>

          <span>
            {earned.length} recorded ·{" "}
            {formatUpdated(record.generatedAt)}
          </span>
        </footer>
      </section>
    </section>
  );
}
