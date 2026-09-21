"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import EquirectangularViewport from "@/components/training/EquirectangularViewport";
import {
  premiumVisualTrainingModuleFor,
  type PremiumVisualModuleSlug,
  type VisualHitRegion,
} from "@/data/module-2-3-visual-training";
import {
  recordTrainingControl,
  recordTrainingFinding,
  startTrainingAttempt,
  type RuntimeAttempt,
} from "@/lib/training-runtime";
import styles from "./PremiumVisualTraining.module.css";

type DecisionState = {
  optionIndex: number;
  recorded: boolean;
  isCorrect: boolean;
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const remainder = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

type NormalizedPoint = { x: number; y: number };

function pointInPolygon(point: NormalizedPoint, polygon: Array<[number, number]>) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[previous];

    const intersects =
      y1 > point.y !== y2 > point.y &&
      point.x < ((x2 - x1) * (point.y - y1)) / (y2 - y1 || Number.EPSILON) + x1;

    if (intersects) inside = !inside;
  }

  return inside;
}

function distanceToSegment(
  point: NormalizedPoint,
  start: [number, number],
  end: [number, number],
) {
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - x1, point.y - y1);
  }

  const projection = Math.max(
    0,
    Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / (dx * dx + dy * dy)),
  );

  const closestX = x1 + projection * dx;
  const closestY = y1 + projection * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

function hitRegionContains(
  region: VisualHitRegion,
  point: NormalizedPoint,
  tolerance: number,
) {
  if (region.type === "rect") {
    return (
      point.x >= region.x - tolerance &&
      point.x <= region.x + region.width + tolerance &&
      point.y >= region.y - tolerance &&
      point.y <= region.y + region.height + tolerance
    );
  }

  if (pointInPolygon(point, region.points)) return true;

  return region.points.some((start, index) => {
    const end = region.points[(index + 1) % region.points.length];
    return distanceToSegment(point, start, end) <= tolerance;
  });
}

export default function PremiumVisualTrainingRuntime({
  moduleSlug,
}: {
  moduleSlug: PremiumVisualModuleSlug;
}) {
  const module = premiumVisualTrainingModuleFor(moduleSlug);
  const [attempt, setAttempt] = useState<RuntimeAttempt | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [draftSelections, setDraftSelections] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [fov, setFov] = useState(module.stages[0].camera.fov);
  const [showHint, setShowHint] = useState(false);
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [missMessage, setMissMessage] = useState("");
  const [pulseHazard, setPulseHazard] = useState(false);
  const [inspectionMarker, setInspectionMarker] = useState<{
    x: number;
    y: number;
    kind: "wrong" | "correct";
  } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    startTrainingAttempt(module.slug)
      .then((started) => {
        if (cancelled) return;
        setAttempt(started);
        startedAtRef.current = Date.now() - Math.max(0, started.elapsedSeconds) * 1000;
        setElapsed(Math.max(0, started.elapsedSeconds));

        const restored: Record<string, DecisionState> = {};
        for (const stage of module.stages) {
          const optionIndex = started.controlAnswers[stage.code];
          if (optionIndex !== undefined) {
            restored[stage.code] = {
              optionIndex,
              recorded: true,
              isCorrect: optionIndex === stage.correctIndex,
            };
          }
        }
        setDecisions(restored);
        setDraftSelections(
          Object.fromEntries(
            Object.entries(restored).map(([code, state]) => [code, state.optionIndex]),
          ),
        );

        const firstOpen = module.stages.findIndex(
          (stage) => started.controlAnswers[stage.code] === undefined,
        );
        const nextIndex = firstOpen === -1 ? module.stages.length - 1 : firstOpen;
        setIndex(nextIndex);
        setFov(module.stages[nextIndex].camera.fov);
        setInspectionMarker(null);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Training could not be started.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [module]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!showHint) return;
      event.preventDefault();
      event.stopPropagation();
      setShowHint(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [showHint]);

  const stage = module.stages[index];
  const decision = decisions[stage.code];
  const findingRecorded = attempt?.findingCodes.includes(stage.code) ?? false;
  const requiresInspection = stage.mode === "VISUAL_INSPECTION" && !!stage.inspection;
  const stageReadyForDecision = !requiresInspection || findingRecorded;
  const stageFindingIdentified = requiresInspection && findingRecorded;
  const stageHintLevel = hintLevels[stage.code] ?? 0;
  const maxHintLevel = requiresInspection ? 3 : 1;
  const completedCount = useMemo(
    () => module.stages.filter((item) => decisions[item.code]?.recorded).length,
    [module.stages, decisions],
  );
  const complete = completedCount === module.stages.length;
  const progress = Math.round((completedCount / module.stages.length) * 100);

  function setStage(stageIndex: number) {
    const firstIncomplete = module.stages.findIndex((item) => !decisions[item.code]?.recorded);
    const furthest = firstIncomplete === -1 ? module.stages.length - 1 : firstIncomplete;
    if (stageIndex > furthest) return;
    setIndex(stageIndex);
    setFov(module.stages[stageIndex].camera.fov);
    setInspectionMarker(null);
    setMissMessage("");
    setShowHint(false);
  }

  function normaliseImageClick(event: React.PointerEvent<HTMLImageElement>) {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return null;

    const rect = image.getBoundingClientRect();
    const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const renderedWidth = image.naturalWidth * scale;
    const renderedHeight = image.naturalHeight * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;

    if (localX < 0 || localY < 0 || localX > renderedWidth || localY > renderedHeight) {
      return null;
    }

    return {
      x: (localX / renderedWidth) * 100,
      y: (localY / renderedHeight) * 100,
      displayX: ((offsetX + localX) / rect.width) * 100,
      displayY: ((offsetY + localY) / rect.height) * 100,
    };
  }

  async function inspectVisual(event: React.PointerEvent<HTMLImageElement>) {
    const activeAttempt = attempt;
    const inspection = stage.inspection;

    if (!activeAttempt || !inspection || !requiresInspection || stageFindingIdentified || busy) return;

    const point = normaliseImageClick(event);
    if (!point) return;

    const hit = inspection.hitRegions.some((region) =>
      hitRegionContains(region, point, inspection.tolerance),
    );

    if (!hit) {
      setInspectionMarker({
        x: point.displayX,
        y: point.displayY,
        kind: "wrong",
      });
      setMissMessage(inspection.wrongMessage);

      window.setTimeout(() => {
        setInspectionMarker((current) =>
          current?.kind === "wrong" ? null : current,
        );
        setMissMessage("");
      }, 1350);

      return;
    }

    setBusy(true);
    setError("");
    setMissMessage("");

    try {
      await recordTrainingFinding(activeAttempt.id, stage.code);

      setInspectionMarker({
        x: point.displayX,
        y: point.displayY,
        kind: "correct",
      });

      setAttempt((current) =>
        current
          ? {
              ...current,
              findingCodes: current.findingCodes.includes(stage.code)
                ? current.findingCodes
                : [...current.findingCodes, stage.code],
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The identified risk could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  function revealNextHint() {
    const next = Math.min(maxHintLevel, stageHintLevel + 1);
    setHintLevels((current) => ({ ...current, [stage.code]: next }));

    if (requiresInspection && next === 3) {
      setPulseHazard(true);
      window.setTimeout(() => setPulseHazard(false), 2600);
    }
  }

  async function confirmDecision() {
    const activeAttempt = attempt;
    const optionIndex = draftSelections[stage.code];
    if (!activeAttempt || optionIndex === undefined || decision?.recorded || busy) return;
    setBusy(true);
    setError("");

    try {
      if (!activeAttempt.findingCodes.includes(stage.code)) {
        await recordTrainingFinding(activeAttempt.id, stage.code);
      }

      const result = await recordTrainingControl(activeAttempt.id, stage.code, optionIndex);

      setDecisions((current) => ({
        ...current,
        [stage.code]: {
          optionIndex,
          recorded: true,
          isCorrect: result.isCorrect,
        },
      }));

      setAttempt((current) =>
        current
          ? {
              ...current,
              findingCodes: current.findingCodes.includes(stage.code)
                ? current.findingCodes
                : [...current.findingCodes, stage.code],
              controlAnswers: {
                ...current.controlAnswers,
                [stage.code]: optionIndex,
              },
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your decision could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  const feedback = decision?.recorded
    ? {
        correct: decision.isCorrect,
        message: decision.isCorrect ? stage.positiveFeedback : stage.reviewFeedback,
      }
    : null;

  if (error && !attempt) {
    return (
      <div className={styles.error}>
        <div className={styles.errorCard}>
          <strong>Training session could not be prepared</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return <div className={styles.loading}>Preparing your visual training session…</div>;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span className={styles.badge}>{module.accentLabel}</span>
          <div className={styles.identityCopy}>
            <strong>{module.scenarioLabel}</strong>
            <span>{module.modeLabel} · Training attempt</span>
          </div>
        </div>

        <div className={styles.sessionMeta}>
          <span className={styles.secureChip}><i /> Local record</span>
          <span className={styles.timerChip}>Time <strong>{formatTime(elapsed)}</strong></span>
          <div className={styles.progressWrap}>
            <div className={styles.progressCopy}>
              <span>Progress</span>
              <strong>{completedCount} / {module.stages.length}</strong>
            </div>
            <div className={styles.progressBar}><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railLabel}>Training stages</div>
          {module.stages.map((item, stageIndex) => {
            const done = !!decisions[item.code]?.recorded;
            const firstIncomplete = module.stages.findIndex((entry) => !decisions[entry.code]?.recorded);
            const furthest = firstIncomplete === -1 ? module.stages.length - 1 : firstIncomplete;
            const locked = stageIndex > furthest;

            return (
              <button
                key={item.code}
                type="button"
                disabled={locked}
                onClick={() => setStage(stageIndex)}
                className={`${styles.step} ${stageIndex === index ? styles.stepActive : ""} ${done ? styles.stepDone : ""}`}
              >
                <span className={styles.stepIndex}>{done ? "✓" : String(stageIndex + 1).padStart(2, "0")}</span>
                <span className={styles.stepCopy}>
                  <strong>{item.title}</strong>
                  <span>{done ? "Decision recorded" : item.label.replace(/^Stage \d+ · /, "")}</span>
                </span>
              </button>
            );
          })}
          <div className={styles.railPrinciple}>{module.intro}</div>
        </aside>

        <section className={styles.main}>
          <div className={styles.trainingGrid}>
            <div className={styles.visualColumn}>
              <div className={styles.visualFrame}>
                {stage.imageSrc ? (
                  <div className={styles.staticVisual}>
                    <img
                      ref={imageRef}
                      src={stage.imageSrc}
                      alt={stage.imageAlt ?? module.assetLabel}
                      className={`${styles.staticImage} ${
                        stageFindingIdentified ? styles.staticImageResolved : ""
                      } ${!requiresInspection ? styles.staticImageScenario : ""}`}
                      style={{ objectPosition: stage.imagePosition ?? "center center" }}
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      onPointerDown={
                        requiresInspection && !stageFindingIdentified
                          ? (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void inspectVisual(event);
                            }
                          : undefined
                      }
                    />

                    {inspectionMarker ? (
                      <div
                        className={`${styles.clickMarker} ${
                          inspectionMarker.kind === "correct"
                            ? styles.clickMarkerCorrect
                            : styles.clickMarkerWrong
                        }`}
                        style={{
                          left: `${inspectionMarker.x}%`,
                          top: `${inspectionMarker.y}%`,
                        }}
                        aria-label={
                          inspectionMarker.kind === "correct"
                            ? "Correct risk location"
                            : "Incorrect inspection selection"
                        }
                      >
                        <span>{inspectionMarker.kind === "correct" ? "✓" : "×"}</span>
                      </div>
                    ) : null}

                    {!inspectionMarker && stage.inspection && stageFindingIdentified ? (
                      <div
                        className={`${styles.clickMarker} ${styles.clickMarkerCorrect} ${styles.clickMarkerRestored}`}
                        style={{
                          left: `${stage.inspection.x + stage.inspection.width / 2}%`,
                          top: `${stage.inspection.y + stage.inspection.height / 2}%`,
                        }}
                        aria-label="Recorded risk identified"
                      >
                        <span>✓</span>
                      </div>
                    ) : null}

                    {stage.inspection && pulseHazard ? (
                      <div
                        className={styles.hazardPulse}
                        style={{
                          left: `${stage.inspection.x}%`,
                          top: `${stage.inspection.y}%`,
                          width: `${stage.inspection.width}%`,
                          height: `${stage.inspection.height}%`,
                        }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ) : (
                  <EquirectangularViewport
                    src={module.assetSrc}
                    yaw={stage.camera.yaw}
                    pitch={stage.camera.pitch}
                    fov={fov}
                    exposure={module.exposure}
                    className={styles.visualCanvas}
                    ariaHidden
                  />
                )}
                <div className={styles.visualShade} />
                <div className={styles.visualTop}>
                  <div className={styles.visualLabel}>
                    <span>Visual scenario · {index + 1} / {module.stages.length}</span>
                    <strong>{module.assetLabel}</strong>
                  </div>
                  {!stage.imageSrc ? (
                    <div className={styles.zoomControls} aria-label="Visual zoom controls">
                      <button type="button" aria-label="Zoom in" onClick={() => setFov((value) => Math.max(48, value - 8))}>+</button>
                      <button type="button" aria-label="Reset visual zoom" onClick={() => setFov(stage.camera.fov)}>⌂</button>
                      <button type="button" aria-label="Zoom out" onClick={() => setFov((value) => Math.min(112, value + 8))}>−</button>
                    </div>
                  ) : (
                    <div className={`${styles.inspectChip} ${!requiresInspection ? styles.inspectChipScenario : ""}`}>
                      {requiresInspection
                        ? stageFindingIdentified
                          ? "Condition identified"
                          : stage.inspection?.actionLabel ?? "Click to inspect"
                        : "Scenario review"}
                    </div>
                  )}
                </div>
                <div className={`${styles.observationCard} ${stageFindingIdentified ? styles.observationCardResolved : ""}`}>
                  <span>
                    {requiresInspection
                      ? stageFindingIdentified
                        ? "Condition identified"
                        : "Inspection task"
                      : "Scenario context"}
                  </span>
                  <p>
                    {requiresInspection
                      ? stageFindingIdentified
                        ? stage.inspection?.foundMessage ?? stage.observationPrompt
                        : stage.inspection?.prompt ?? stage.observationPrompt
                      : stage.observationPrompt}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.decisionColumn}>
              <div className={styles.eyebrow}>{stage.label}</div>
              <h1>{stage.title}</h1>
              <p className={styles.principle}>{stage.principle}</p>

              <div className={styles.situation}>
                <span>Situation</span>
                <p>{stage.situation}</p>
              </div>

              {!stageReadyForDecision ? (
                <div className={styles.detectPanel}>
                  <div className={styles.detectIcon}>01</div>
                  <div>
                    <span>Phase 1 · Inspect</span>
                    <strong>Identify the specified condition before making the control decision.</strong>
                    <p>The decision phase unlocks only after the correct visual condition is identified.</p>
                  </div>
                </div>
              ) : (
                <>
                  {requiresInspection ? (
                    <div className={styles.phaseUnlocked}>
                      <span>✓</span>
                      <div>
                        <strong>{stage.inspection?.label ?? "Condition identified"}</strong>
                        <small>Phase 2 · Decision unlocked</small>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.phaseReady}>
                      <span>02</span>
                      <div>
                        <strong>Decision scenario</strong>
                        <small>No visual hotspot is required for this stage</small>
                      </div>
                    </div>
                  )}

                  <h2 className={styles.question}>{stage.question}</h2>

                  <div className={styles.options}>
                    {stage.options.map((option, optionIndex) => {
                      const selected = decision?.recorded
                        ? decision.optionIndex === optionIndex
                        : draftSelections[stage.code] === optionIndex;
                      const correct = !!decision?.recorded && optionIndex === stage.correctIndex;
                      const wrong = !!decision?.recorded && selected && optionIndex !== stage.correctIndex;

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={busy || !!decision?.recorded}
                          className={`${styles.option} ${selected ? styles.optionSelected : ""} ${correct ? styles.optionCorrect : ""} ${wrong ? styles.optionWrong : ""}`}
                          onClick={() =>
                            setDraftSelections((current) => ({
                              ...current,
                              [stage.code]: optionIndex,
                            }))
                          }
                        >
                          <span className={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</span>
                          <span className={styles.optionText}>{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.assistRow}>
                    <button type="button" className={styles.hintButton} onClick={() => setShowHint(true)}>
                      Need a hint?
                    </button>

                    {!decision?.recorded ? (
                      <button
                        type="button"
                        className={styles.button}
                        disabled={busy || draftSelections[stage.code] === undefined}
                        onClick={confirmDecision}
                      >
                        {busy ? "Recording…" : "Confirm decision"}
                      </button>
                    ) : (
                      <span className={styles.decisionStatus}>Decision saved</span>
                    )}
                  </div>

                  {feedback ? (
                    <div className={`${styles.feedback} ${feedback.correct ? "" : styles.feedbackReview}`}>
                      <strong>{feedback.correct ? "Preferred decision" : "Review this decision"}</strong>
                      <p>{feedback.message}</p>
                      <div className={styles.learning}>{stage.learning}</div>
                    </div>
                  ) : null}
                </>
              )}

              {!stageReadyForDecision ? (
                <div className={styles.assistRow}>
                  <button type="button" className={styles.hintButton} onClick={() => setShowHint(true)}>
                    Need a hint?
                  </button>
                  <span className={styles.decisionStatus}>
                    {missMessage || "No marker is shown until you identify the risk."}
                  </span>
                </div>
              ) : null}

              {error ? <div className={styles.error}>{error}</div> : null}
            </div>
          </div>

          <footer className={styles.footer}>
            <div>
              {index > 0 ? (
                <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={() => setStage(index - 1)}>
                  Previous
                </button>
              ) : (
                <Link className={`${styles.linkButton} ${styles.secondary}`} href={`/training/${module.slug}`}>
                  Exit
                </Link>
              )}
            </div>

            <div className={styles.footerStatus}>
              {!stageReadyForDecision
                ? "Phase 1 of 2 · Inspect the image and identify the specified condition."
                : decision?.recorded
                  ? "Decision recorded securely. Review the learning point or continue."
                  : draftSelections[stage.code] !== undefined
                    ? `${requiresInspection ? "Phase 2 of 2" : "Decision stage"} · You can change your selection before confirming.`
                    : `${requiresInspection ? "Phase 2 of 2" : "Decision stage"} · Select the strongest control response.`}
            </div>

            <div>
              {complete ? (
                <Link className={styles.linkButton} href={`/training/${module.slug}/quiz`}>
                  Knowledge check →
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.button}
                  disabled={!decision?.recorded || index >= module.stages.length - 1}
                  onClick={() => setStage(index + 1)}
                >
                  Next stage
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>

      {showHint ? (
        <>
          <button
            type="button"
            className={styles.scrim}
            aria-label="Close hint"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setShowHint(false);
            }}
          />
          <aside className={styles.hintPanel} aria-label="Training hint" onPointerDown={(event) => event.stopPropagation()}>
            <div className={styles.hintHead}>
              <div>
                <span>Assisted learning</span>
                <strong>{requiresInspection ? "Observation hint" : "Decision hint"}</strong>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Close hint" onClick={() => setShowHint(false)}>×</button>
            </div>
            <div className={styles.hintBody}>
              <span>
                {stageHintLevel === 0
                  ? "Assistance available"
                  : requiresInspection
                    ? stageHintLevel === 1
                      ? "Hint 1 · Safety clue"
                      : stageHintLevel === 2
                        ? "Hint 2 · Broad area"
                        : "Hint 3 · Search-zone pulse"
                    : "Decision clue"}
              </span>
              <p>
                {stageHintLevel === 0
                  ? requiresInspection
                    ? "Use assistance progressively. Try the visual inspection yourself before revealing a clue."
                    : "Review the situation first, then reveal one decision clue if you need it."
                  : requiresInspection
                    ? stageHintLevel === 1
                      ? stage.inspection?.clue ?? stage.hint
                      : stageHintLevel === 2
                        ? stage.inspection?.direction ?? stage.focusArea
                        : "A broad search zone has been pulsed briefly on the visual. Inspect that area and make the identification yourself."
                    : stage.hint}
              </p>
            </div>

            <div className={styles.hintFocus}>
              <span>Current assistance</span>
              <strong>Level {stageHintLevel} / {maxHintLevel}</strong>
            </div>

            {stageHintLevel < maxHintLevel && (!requiresInspection || !stageFindingIdentified) ? (
              <button type="button" className={styles.hintRevealButton} onClick={revealNextHint}>
                {stageHintLevel === 0
                  ? requiresInspection
                    ? "Reveal safety clue"
                    : "Reveal decision clue"
                  : stageHintLevel === 1
                    ? "Show broad area"
                    : "Pulse search zone"}
              </button>
            ) : null}

            <p className={styles.hintNote}>Hints support learning only and do not change the governed training score.</p>
          </aside>
        </>
      ) : null}
    </div>
  );
}
