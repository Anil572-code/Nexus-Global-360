"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  visualTrainingModuleFor,
  type VisualTrainingSlug,
} from "@/data/visual-training";
import {
  recordTrainingControl,
  recordTrainingFinding,
  startTrainingAttempt,
  type RuntimeAttempt,
} from "@/lib/training-runtime";
import styles from "./VisualTraining.module.css";

type DecisionState = {
  optionIndex: number;
  isCorrect?: boolean;
  recorded: boolean;
};

type InspectionPoint = {
  x: number;
  y: number;
  key: number;
};

type RegionPoint = {
  x: number;
  y: number;
};

function pointInPolygon(point: RegionPoint, polygon: RegionPoint[]) {
  if (polygon.length < 3) return false;

  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crosses =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y || Number.EPSILON) +
          currentPoint.x;

    if (crosses) inside = !inside;
  }

  return inside;
}

export default function VisualTrainingRuntime({ moduleSlug }: { moduleSlug: VisualTrainingSlug }) {
  const module = visualTrainingModuleFor(moduleSlug);
  const [attempt, setAttempt] = useState<RuntimeAttempt | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hotspotMessage, setHotspotMessage] = useState("");
  const [missPoint, setMissPoint] = useState<InspectionPoint | null>(null);
  const [foundPoint, setFoundPoint] = useState<InspectionPoint | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!module) return;

    startTrainingAttempt(module.slug)
      .then((started) => {
        setAttempt(started);
        const restored: Record<string, DecisionState> = {};

        Object.entries(started.controlAnswers).forEach(([code, optionIndex]) => {
          restored[code] = { optionIndex, recorded: true };
        });

        setDecisions(restored);

        const firstOpen = module.stages.findIndex(
          (stage) => started.controlAnswers[stage.code] === undefined,
        );
        setIndex(firstOpen === -1 ? module.stages.length - 1 : firstOpen);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Training could not be started."),
      );
  }, [moduleSlug]);

  useEffect(() => {
    setHotspotMessage("");
    setMissPoint(null);
    setFoundPoint(null);
    setError("");
  }, [index]);

  const stage = module?.stages[index];
  const decision = stage ? decisions[stage.code] : undefined;
  const pendingOptionIndex = stage ? pendingSelections[stage.code] : undefined;
  const completedCount = module
    ? module.stages.filter((item) => decisions[item.code]?.recorded).length
    : 0;
  const complete = !!module && completedCount === module.stages.length;
  const progress = module ? Math.round((completedCount / module.stages.length) * 100) : 0;
  const firstIncompleteIndex = module
    ? module.stages.findIndex((item) => !decisions[item.code]?.recorded)
    : -1;

  const feedback = useMemo(() => {
    if (!stage || !decision?.recorded) return null;
    const correct = decision.isCorrect ?? decision.optionIndex === stage.recommendedIndex;

    return {
      correct,
      text: correct ? stage.positiveFeedback : stage.reviewFeedback,
    };
  }, [stage, decision]);

  if (!module) {
    return <div className={styles.error}>Training module configuration is unavailable.</div>;
  }

  if (error && !attempt) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!attempt || !stage) {
    return <div className={styles.loading}>Preparing your visual training session…</div>;
  }

  const activeModule = module;
  const activeAttempt = attempt;
  const activeStage = stage;
  const hotspotFound = activeAttempt.findingCodes.includes(activeStage.code);
  const requiresHotspot = activeStage.interaction === "hotspot";
  const decisionLocked = requiresHotspot && !hotspotFound;

  function syncFinding(code: string) {
    setAttempt((current) =>
      current && !current.findingCodes.includes(code)
        ? { ...current, findingCodes: [...current.findingCodes, code] }
        : current,
    );
  }

  function selectStage(stageIndex: number) {
    const target = activeModule.stages[stageIndex];
    const targetDone = !!decisions[target.code]?.recorded;
    const currentOpenIndex = firstIncompleteIndex === -1
      ? activeModule.stages.length - 1
      : firstIncompleteIndex;

    if (stageIndex > currentOpenIndex && !targetDone) return;
    setIndex(stageIndex);
  }

  async function handleHotspot(event: MouseEvent<HTMLButtonElement>) {
    if (!requiresHotspot || hotspotFound || busy || !activeStage.hotspot) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const regions = activeStage.hotspot.regions ?? [];
    const insideConfiguredRegion =
      regions.length > 0 &&
      regions.some((region) => pointInPolygon({ x, y }, region.points));

    const dx = x - activeStage.hotspot.x;
    const dy = y - activeStage.hotspot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const insideLegacyRadius = regions.length === 0 && distance <= activeStage.hotspot.radius;

    if (!insideConfiguredRegion && !insideLegacyRadius) {
      setMissPoint({ x, y, key: Date.now() });
      setHotspotMessage(
        "That area is not part of the primary hazard. Inspect the full hazard object or conflict zone, then try again.",
      );
      return;
    }

    setBusy(true);
    setError("");
    setMissPoint(null);
    setFoundPoint({ x, y, key: Date.now() });

    try {
      await recordTrainingFinding(activeAttempt.id, activeStage.code);
      syncFinding(activeStage.code);
      setHotspotMessage(
        `${activeStage.hotspot.foundTitle}. ${activeStage.hotspot.foundCopy}`,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The hazard could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  function selectDecision(optionIndex: number) {
    if (decision?.recorded || busy) return;

    if (decisionLocked) {
      setHotspotMessage("Identify the hazard in the scene before choosing the control decision.");
      return;
    }

    setPendingSelections((current) => ({
      ...current,
      [activeStage.code]: optionIndex,
    }));
    setError("");
  }

  async function confirmDecision() {
    if (decision?.recorded || busy || decisionLocked || pendingOptionIndex === undefined) return;

    setBusy(true);
    setError("");

    try {
      if (!activeAttempt.findingCodes.includes(activeStage.code)) {
        await recordTrainingFinding(activeAttempt.id, activeStage.code);
        syncFinding(activeStage.code);
      }

      const result = await recordTrainingControl(
        activeAttempt.id,
        activeStage.code,
        pendingOptionIndex,
      );

      setDecisions((current) => ({
        ...current,
        [activeStage.code]: {
          optionIndex: pendingOptionIndex,
          recorded: true,
          isCorrect: result.isCorrect,
        },
      }));

      setAttempt((current) =>
        current
          ? {
              ...current,
              controlAnswers: {
                ...current.controlAnswers,
                [activeStage.code]: pendingOptionIndex,
              },
            }
          : current,
      );

      setPendingSelections((current) => {
        const next = { ...current };
        delete next[activeStage.code];
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your decision could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (index < activeModule.stages.length - 1 && decision?.recorded) {
      setIndex((value) => value + 1);
    }
  }

  function previous() {
    if (index > 0) setIndex((value) => value - 1);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span className={styles.badge} aria-label={`Safety module ${activeModule.code.replace("NGL-SAF-", "")}`}>
            <small>SAF</small>
            <b>{activeModule.code.replace("NGL-SAF-", "")}</b>
          </span>

          <div className={styles.identityCopy}>
            <span className={styles.moduleType}>{activeModule.contentType}</span>
            <strong>{activeModule.scenarioLabel}</strong>
            <span className={styles.moduleMeta}>Persisted training attempt · Stage {index + 1} of {activeModule.stages.length}</span>
          </div>
        </div>

        <div className={styles.progressCopy}>
          <div className={styles.progressLine}>
            <div>
              <span>Module progress</span>
              <small>{completedCount} of {activeModule.stages.length} stages completed</small>
            </div>
            <strong>{progress}%</strong>
          </div>
          <div className={styles.bar} aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railLabel}>Learning stages</div>

          {activeModule.stages.map((item, stageIndex) => {
            const done = !!decisions[item.code]?.recorded;
            const currentOpenIndex = firstIncompleteIndex === -1
              ? activeModule.stages.length - 1
              : firstIncompleteIndex;
            const locked = stageIndex > currentOpenIndex && !done;

            return (
              <button
                key={item.code}
                type="button"
                disabled={locked}
                onClick={() => selectStage(stageIndex)}
                className={`${styles.step} ${stageIndex === index ? styles.active : ""} ${done ? styles.done : ""} ${locked ? styles.lockedStep : ""}`}
              >
                <b>{done ? "✓" : locked ? "·" : String(stageIndex + 1).padStart(2, "0")}</b>
                <span>
                  <strong>{item.title}</strong>
                  <span>{done ? "Completed" : locked ? "Complete earlier stage" : item.label}</span>
                </span>
              </button>
            );
          })}

          <div className={styles.principle}>{activeModule.stageIntro}</div>
        </aside>

        <section className={styles.main}>
          <div className={styles.sceneHeader}>
            <div className={styles.sceneHeaderCopy}>
              <div className={styles.eyebrow}>{activeStage.label}</div>
              <h1>{activeStage.title}</h1>
              <p>{activeStage.principle}</p>
            </div>
            <div className={styles.stagePosition} aria-label={`Stage ${index + 1} of ${activeModule.stages.length}`}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span>/</span>
              <b>{String(activeModule.stages.length).padStart(2, "0")}</b>
            </div>
          </div>

          <div className={styles.body}>
            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.visualGrid}>
              <div className={styles.visualColumn}>
                <div className={`${styles.taskBanner} ${requiresHotspot ? styles.inspectTask : styles.referenceTask}`}>
                  <div className={styles.taskIcon} aria-hidden="true">{requiresHotspot ? "+" : "i"}</div>
                  <div>
                    <span>{requiresHotspot ? "Inspection task" : "Scenario reference"}</span>
                    <strong>
                      {requiresHotspot
                        ? hotspotFound
                          ? "Hazard identified — complete the control decision"
                          : "Inspect the scene and click the unsafe condition"
                        : "Review the scene, then choose the safest response"}
                    </strong>
                  </div>
                  {requiresHotspot ? (
                    <span className={`${styles.inspectState} ${hotspotFound ? styles.inspectStateDone : ""}`}>
                      {hotspotFound ? "Identified" : "Inspection active"}
                    </span>
                  ) : null}
                </div>

                {requiresHotspot ? (
                  <button
                    type="button"
                    className={`${styles.visualScene} ${styles.hotspotScene} ${hotspotFound ? styles.hotspotComplete : ""}`}
                    onClick={handleHotspot}
                    disabled={hotspotFound || busy}
                    aria-label={hotspotFound ? "Hazard identified" : "Inspect the scene and click the unsafe condition"}
                    aria-describedby={`inspection-status-${activeStage.code}`}
                  >
                    <img src={activeStage.image} alt={activeStage.imageAlt} />
                    <span className={styles.inspectionFrame} aria-hidden="true" />
                    <span className={styles.inspectCursorHint} aria-hidden="true">
                      <i />
                      Click scene to inspect
                    </span>

                    {missPoint ? (
                      <span
                        key={missPoint.key}
                        className={styles.missMarker}
                        style={{ left: `${missPoint.x}%`, top: `${missPoint.y}%` }}
                        aria-hidden="true"
                      >×</span>
                    ) : null}

                    {hotspotFound && activeStage.hotspot ? (
                      <span
                        className={styles.foundMarker}
                        style={{
                          left: `${foundPoint?.x ?? activeStage.hotspot.x}%`,
                          top: `${foundPoint?.y ?? activeStage.hotspot.y}%`,
                        }}
                        aria-hidden="true"
                      >✓</span>
                    ) : null}
                  </button>
                ) : (
                  <figure className={styles.visualScene}>
                    <img src={activeStage.image} alt={activeStage.imageAlt} />
                    <figcaption>Scenario reference</figcaption>
                  </figure>
                )}

                <div className={styles.situation}>
                  <div className={styles.sceneMark}>{requiresHotspot ? "?" : "N"}</div>
                  <div>
                    <strong>Scenario</strong>
                    <p>{activeStage.situation}</p>
                  </div>
                </div>

                {requiresHotspot ? (
                  <div
                    id={`inspection-status-${activeStage.code}`}
                    className={`${styles.hotspotNotice} ${hotspotFound ? styles.hotspotFound : ""}`}
                    aria-live="polite"
                  >
                    <strong>{hotspotFound ? "Hazard identified" : "Inspection guidance"}</strong>
                    <p>
                      {hotspotMessage ||
                        (hotspotFound
                          ? activeStage.hotspot?.foundCopy
                          : "Click anywhere on the primary hazard object or conflict zone. You do not need to find one exact point.")}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className={`${styles.decisionColumn} ${decisionLocked ? styles.decisionLocked : styles.decisionReady}`}>
                <div className={styles.decisionHeader}>
                  <div>
                    <span className={styles.decisionLabel}>{requiresHotspot ? "Control decision" : "Decision"}</span>
                    <h2 className={styles.question}>{activeStage.question}</h2>
                  </div>
                  <span className={`${styles.decisionState} ${decisionLocked ? "" : styles.decisionStateReady}`}>
                    {decisionLocked
                      ? "Locked"
                      : decision?.recorded
                        ? "Recorded"
                        : pendingOptionIndex !== undefined
                          ? "Selected"
                          : "Ready"}
                  </span>
                </div>

                <div className={styles.decisionSurface}>
                  <div className={styles.options} aria-hidden={decisionLocked}>
                    {activeStage.options.map((option, optionIndex) => {
                      const isRecordedSelection = decision?.optionIndex === optionIndex;
                      const isPendingSelection =
                        !decision?.recorded && pendingOptionIndex === optionIndex;

                      return (
                        <button
                          type="button"
                          key={option}
                          disabled={busy || !!decision?.recorded || decisionLocked}
                          aria-pressed={isPendingSelection}
                          className={`${styles.option} ${
                            isRecordedSelection || isPendingSelection ? styles.selected : ""
                          } ${isPendingSelection ? styles.pendingSelected : ""}`}
                          onClick={() => selectDecision(optionIndex)}
                        >
                          <strong>{String.fromCharCode(65 + optionIndex)}</strong>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!decisionLocked && !decision?.recorded ? (
                    <div className={styles.confirmPanel}>
                      <div className={styles.confirmCopy}>
                        <strong>
                          {pendingOptionIndex === undefined
                            ? "Select one response"
                            : `Selected ${String.fromCharCode(65 + pendingOptionIndex)} — review before confirming`}
                        </strong>
                        <span>
                          {pendingOptionIndex === undefined
                            ? "Your answer is not recorded until you confirm it."
                            : "You can choose a different option before confirmation."}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.confirmButton}
                        disabled={busy || pendingOptionIndex === undefined}
                        onClick={confirmDecision}
                      >
                        {busy ? "Confirming…" : "Confirm answer"}
                      </button>
                    </div>
                  ) : null}

                  {decisionLocked ? (
                    <div className={styles.lockOverlay} role="status">
                      <span className={styles.lockIcon} aria-hidden="true">⌕</span>
                      <strong>Inspection required</strong>
                      <p>Identify the unsafe condition in the scene to unlock the control decision.</p>
                      <span className={styles.lockHint}>Use the crosshair inspection surface on the left.</span>
                    </div>
                  ) : null}
                </div>

                {feedback ? (
                  <div className={`${styles.feedback} ${feedback.correct ? "" : styles.review}`}>
                    <strong>{feedback.correct ? "Recommended decision" : "Review this decision"}</strong>
                    <p>{feedback.text}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <div>
              {index > 0 ? (
                <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={previous}>
                  Previous
                </button>
              ) : null}
            </div>

            <div className={styles.statusText}>
              {decision?.recorded
                ? "Stage saved to your training record."
                : decisionLocked
                  ? "Identify the hazard to unlock the control decision."
                  : pendingOptionIndex !== undefined
                    ? "Review your selected response, then confirm it."
                    : "Select one response. It will not be recorded until you confirm."}
            </div>

            <div>
              {complete ? (
                <Link className={styles.linkButton} href={`/training/${activeModule.slug}/quiz`}>
                  Knowledge check →
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.button}
                  onClick={next}
                  disabled={!decision?.recorded || index >= activeModule.stages.length - 1}
                >
                  Next stage
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
