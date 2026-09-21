"use client";

/* LEADERBOARD P2 - PRODUCTION GOVERNED WORKSPACE */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./LeaderboardWorkspace.module.css";

type LeaderboardModule = {
  slug: string;
  title: string;
  durationMinutes: number;
  maxScore: number;
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  department: string;
  avatarKey: string;
  score: number;
  durationSeconds: number | null;
  completedAt: string | null;
  isCurrentUser: boolean;
};

type LeaderboardResponse = {
  generatedAt: string;
  scope: {
    kind: "ORGANIZATION";
    label: string;
    description: string;
  };
  rankingBasis: {
    primary: string;
    tieBreakers: string[];
  };
  modules: LeaderboardModule[];
  module: (LeaderboardModule & {
    description: string;
  }) | null;
  eligibleParticipants: number;
  entries: LeaderboardEntry[];
  currentUser: {
    rank: number | null;
    name: string;
    department: string;
    score: number | null;
    durationSeconds: number | null;
    completedAt: string | null;
  };
};

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "NG"
  );
}

function formatDuration(
  seconds: number | null,
): string {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(
    2,
    "0",
  )}`;
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

export default function LeaderboardWorkspace() {
  const [record, setRecord] =
    useState<LeaderboardResponse | null>(null);
  const [selectedSlug, setSelectedSlug] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (
      moduleSlug?: string,
      mode: "load" | "refresh" = "load",
    ) => {
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const query = moduleSlug
          ? `?moduleSlug=${encodeURIComponent(
              moduleSlug,
            )}`
          : "";

        const response = await fetch(
          `/api/leaderboard${query}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );

        const data = (await response
          .json()
          .catch(() => ({}))) as
          | LeaderboardResponse
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Leaderboard could not be loaded.",
          );
        }

        const next = data as LeaderboardResponse;
        setRecord(next);
        setSelectedSlug(
          next.module?.slug ??
            moduleSlug ??
            next.modules[0]?.slug ??
            "",
        );
        setError("");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Leaderboard could not be loaded.",
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

    const onFocus = () => {
      void load(
        selectedSlug || undefined,
        "refresh",
      );
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [load, selectedSlug]);

  const podium = useMemo(
    () => record?.entries.slice(0, 3) ?? [],
    [record],
  );

  const remaining = useMemo(
    () => record?.entries.slice(3) ?? [],
    [record],
  );

  const currentIsOutsideTopTen =
    Boolean(
      record?.currentUser.rank &&
        record.currentUser.rank > 10,
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
          Loading governed leaderboard…
        </strong>
        <small>
          Ranking real completed training results.
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
          Leaderboard temporarily unavailable
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

  const maxScore = record.module?.maxScore ?? 1000;
  const currentScore =
    record.currentUser.score == null
      ? "—"
      : `${record.currentUser.score}`;

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>
            Performance ranking
          </span>
          <h1>Leaderboard</h1>
          <p>
            Compare governed best results from
            completed training records.
          </p>
        </div>

        <button
          type="button"
          className={styles.refresh}
          disabled={refreshing}
          onClick={() =>
            void load(
              selectedSlug || undefined,
              "refresh",
            )
          }
        >
          <span aria-hidden="true">↻</span>
          {refreshing
            ? "Refreshing…"
            : "Refresh ranking"}
        </button>
      </header>

      <section
        className={styles.summary}
        aria-label="Leaderboard summary"
      >
        <article>
          <span>Your rank</span>
          <strong>
            {record.currentUser.rank
              ? `#${record.currentUser.rank}`
              : "—"}
          </strong>
          <small>
            {record.currentUser.rank
              ? `${record.eligibleParticipants} eligible participants`
              : "Complete this module to be ranked"}
          </small>
        </article>

        <article>
          <span>Your best</span>
          <strong>{currentScore}</strong>
          <small>
            {record.currentUser.score == null
              ? "No completed result"
              : `out of ${maxScore}`}
          </small>
        </article>

        <article>
          <span>Participants</span>
          <strong>
            {record.eligibleParticipants}
          </strong>
          <small>
            Active employees with a completed result
          </small>
        </article>

        <article>
          <span>Ranking basis</span>
          <strong>Best score</strong>
          <small>
            Fastest completion breaks score ties
          </small>
        </article>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <div className={styles.boardTitle}>
            <span className={styles.eyebrow}>
              Demo training record
            </span>
            <h2>
              {record.module?.title ??
                "Training leaderboard"}
            </h2>
            <p>{record.scope.description}</p>
          </div>

          <div className={styles.modulePicker}>
            <label htmlFor="leaderboard-module">
              Ranking module
            </label>
            <select
              id="leaderboard-module"
              value={selectedSlug}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedSlug(value);
                void load(value);
              }}
            >
              {record.modules.map((module) => (
                <option
                  key={module.slug}
                  value={module.slug}
                >
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {record.modules.length === 0 ? (
          <div className={styles.empty}>
            <span aria-hidden="true">—</span>
            <strong>
              No assigned modules available
            </strong>
            <p>
              Your account does not currently have an
              active training module available for
              ranking.
            </p>
            <Link href="/training">
              Open training library
            </Link>
          </div>
        ) : record.eligibleParticipants === 0 ? (
          <div className={styles.empty}>
            <span aria-hidden="true">01</span>
            <strong>
              No completed results yet
            </strong>
            <p>
              The leaderboard opens automatically when
              an active employee completes this module.
            </p>
            <Link
              href={`/training/${record.module?.slug}`}
            >
              Open this module
            </Link>
          </div>
        ) : (
          <>
            <div
              className={styles.podium}
              data-count={podium.length}
            >
              {podium.map((entry) => (
                <article
                  className={`${styles.podiumCard} ${
                    entry.rank === 1
                      ? styles.first
                      : ""
                  } ${
                    entry.isCurrentUser
                      ? styles.current
                      : ""
                  }`}
                  key={`${entry.rank}-${entry.name}`}
                >
                  <div className={styles.rankChip}>
                    #{entry.rank}
                  </div>
                  <div
                    className={styles.avatar}
                    data-avatar={entry.avatarKey}
                    aria-hidden="true"
                  >
                    {initials(entry.name)}
                  </div>
                  <div className={styles.person}>
                    <strong>{entry.name}</strong>
                    <span>{entry.department}</span>
                  </div>
                  {entry.isCurrentUser ? (
                    <span className={styles.you}>
                      You
                    </span>
                  ) : null}
                  <div className={styles.podiumMetric}>
                    <strong>
                      {entry.score}
                      <small> / {maxScore}</small>
                    </strong>
                    <span>
                      Best time{" "}
                      {formatDuration(
                        entry.durationSeconds,
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {remaining.length > 0 ? (
              <div className={styles.rankingTable}>
                <div className={styles.tableHead}>
                  <span>Rank</span>
                  <span>Employee</span>
                  <span>Department</span>
                  <span>Best score</span>
                  <span>Best time</span>
                </div>

                {remaining.map((entry) => (
                  <div
                    className={`${styles.tableRow} ${
                      entry.isCurrentUser
                        ? styles.currentRow
                        : ""
                    }`}
                    key={`${entry.rank}-${entry.name}`}
                  >
                    <strong className={styles.rank}>
                      {String(entry.rank).padStart(
                        2,
                        "0",
                      )}
                    </strong>
                    <div
                      className={styles.employeeCell}
                    >
                      <div
                        className={
                          styles.smallAvatar
                        }
                        aria-hidden="true"
                      >
                        {initials(entry.name)}
                      </div>
                      <div>
                        <strong>
                          {entry.name}
                        </strong>
                        {entry.isCurrentUser ? (
                          <span
                            className={styles.youSmall}
                          >
                            You
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span>{entry.department}</span>
                    <strong>
                      {entry.score} / {maxScore}
                    </strong>
                    <span>
                      {formatDuration(
                        entry.durationSeconds,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {currentIsOutsideTopTen ? (
              <div className={styles.currentPosition}>
                <div>
                  <span>Your position</span>
                  <strong>
                    #{record.currentUser.rank}
                  </strong>
                </div>
                <div>
                  <span>Best score</span>
                  <strong>
                    {record.currentUser.score} /{" "}
                    {maxScore}
                  </strong>
                </div>
                <div>
                  <span>Best time</span>
                  <strong>
                    {formatDuration(
                      record.currentUser
                        .durationSeconds,
                    )}
                  </strong>
                </div>
              </div>
            ) : null}
          </>
        )}

        <footer className={styles.footer}>
          <div>
            <strong>Ranking authority</strong>
            <span>
              Best completed score. Ties use fastest
              completion time, then earliest
              completion.
            </span>
          </div>
          <span>
            {formatUpdated(record.generatedAt)}
          </span>
        </footer>
      </section>
    </section>
  );
}
