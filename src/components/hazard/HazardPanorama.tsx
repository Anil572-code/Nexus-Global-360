"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import { useRouter } from "next/navigation";
import { hazardPerceptionHazards, type Hazard } from "@/data/hazard-perception";
import { recordTrainingFinding, startTrainingAttempt } from "@/lib/training-runtime";
import EquirectangularViewport, { type EquirectangularViewportHandle, type PanoramaMarker } from "@/components/training/EquirectangularViewport";
import { panoramaPointToScreen, panoramaScreenToDirection } from "@/lib/panorama-projection";

const ATTEMPT_KEY = "nexus-safety-360:hazard-attempt:v1";
const QUIZ_STATE_KEY = "nexus-safety-360:hazard-quiz-state:v1";
const RESULT_KEY = "nexus-safety-360:last-result:v1";
const DEFAULT_YAW = 0;
const DEFAULT_FOV = 104;
const MIN_FOV = 50;
const MAX_FOV = 116;
const PITCH_LIMIT = 84;
const HORIZONTAL_DRAG_MULTIPLIER = 1.45;
const VERTICAL_DRAG_MULTIPLIER = 1.58;
const DRAG_THRESHOLD_MOUSE = 7;
const DRAG_THRESHOLD_TOUCH = 11;
const TAP_MAX_MS = 650;
const MAX_RESUME_AGE_MS = 6 * 60 * 60 * 1000;

type ObjectHitZone = { yawRadius: number; pitchRadius: number };
const HAZARD_HIT_ZONES: Record<string, ObjectHitZone> = {
  "blocked-exit": { yawRadius: 12.5, pitchRadius: 12.5 },
  "wet-floor": { yawRadius: 15.0, pitchRadius: 9.5 },
  "unstable-stack": { yawRadius: 13.0, pitchRadius: 12.5 },
  "missing-ppe": { yawRadius: 10.5, pitchRadius: 14.0 },
  "unsafe-lift": { yawRadius: 11.5, pitchRadius: 13.5 },
  "forklift-conflict": { yawRadius: 16.0, pitchRadius: 15.0 },
};

const HAZARD_HINTS: Record<string, string> = {
  "blocked-exit": "Check whether emergency access remains immediately usable.",
  "wet-floor": "Inspect pedestrian routes for a surface condition that could cause loss of footing.",
  "unstable-stack": "Inspect stored loads for poor stability or inadequate containment.",
  "missing-ppe": "Compare workers' protective clothing in active operating zones.",
  "unsafe-lift": "Observe how employees handle loads close to floor level.",
  "forklift-conflict": "Look for a place where pedestrian and powered-vehicle movement overlap.",
};

const HINT_LEVEL_COSTS = [0, 10, 20, 35] as const;
const OBSERVATION_BONUS = 25;
const PRECISION_BONUS = 10;
const INDEPENDENT_INSPECTION_BONUS = 100;
const CLEAN_INSPECTION_BONUS = 50;
const HINT_PULSE_MS = 2800;

function compassSector(yaw: number) {
  const degrees = ((yaw % 360) + 360) % 360;
  const points = ["NORTH", "NORTH-EAST", "EAST", "SOUTH-EAST", "SOUTH", "SOUTH-WEST", "WEST", "NORTH-WEST"];
  return points[Math.round(degrees / 45) % 8];
}

function normaliseAngle(value: number) {
  let angle = value;
  while (angle < -180) angle += 360;
  while (angle >= 180) angle -= 360;
  return angle;
}

function angleDelta(from: number, to: number) {
  return normaliseAngle(to - from);
}

type KeyboardLockManager = {
  lock?: (keys?: string[]) => Promise<void>;
  unlock?: () => void;
};

function getKeyboardLockManager() {
  return (navigator as Navigator & { keyboard?: KeyboardLockManager }).keyboard;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, "0");
  const remainder = (safeSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${remainder}` : `${minutes}:${remainder}`;
}

function headingLabel(yaw: number) {
  const degrees = ((Math.round(((yaw % 360) + 360) % 360) % 360) + 360) % 360;
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const point = points[Math.round(degrees / 45) % 8];
  return `${point} ${degrees.toString().padStart(3, "0")}°`;
}

function pitchLabel(pitch: number) {
  const degrees = Math.abs(Math.round(pitch));
  if (degrees <= 1) return "LEVEL 0°";
  return `${pitch > 0 ? "UP" : "DOWN"} ${degrees.toString().padStart(2, "0")}°`;
}

type ViewState = { yaw: number; pitch: number; fov: number };
type DragState = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  startedAt: number;
  startYaw: number;
  startPitch: number;
  startFov: number;
  dragging: boolean;
};

type StoredAttempt = {
  startedAt: number;
  seconds: number;
  foundIds: string[];
  sceneScore: number;
  backendAttemptId?: string;
  hintLevels?: Record<string, number>;
  bonusAwards?: Record<string, number>;
  misses?: number;
  missesSinceFinding?: number;
  performancePoints?: number;
  hintPenalty?: number;
  hintsUsed?: number;
};

const initialView: ViewState = { yaw: DEFAULT_YAW, pitch: 0, fov: DEFAULT_FOV };

export default function HazardPanorama() {
  const router = useRouter();
  const experienceRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const panoramaRendererRef = useRef<EquirectangularViewportHandle>(null);
  const feedbackDrawerRef = useRef<HTMLElement>(null);
  const restartCancelRef = useRef<HTMLButtonElement>(null);
  const restartTriggerRef = useRef<HTMLButtonElement>(null);
  const checklistTriggerRef = useRef<HTMLButtonElement>(null);
  const hintTriggerRef = useRef<HTMLButtonElement>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const hintPulseRef = useRef<HTMLDivElement>(null);
  const hintPulseIdRef = useRef<string | null>(null);
  const hintPulseTimerRef = useRef<number | null>(null);
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const safeNoticeTimerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const viewRef = useRef<ViewState>({ ...initialView });
  const targetViewRef = useRef<ViewState>({ ...initialView });
  const frameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const liveHeadingRef = useRef<HTMLElement>(null);
  const liveFovRef = useRef<HTMLElement>(null);
  const livePitchRef = useRef<HTMLElement>(null);

  const [view, setView] = useState<ViewState>({ ...initialView });
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Hazard | null>(null);
  const [selectedAwarded, setSelectedAwarded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintTargetId, setHintTargetId] = useState<string | null>(null);
  const [hintPulseId, setHintPulseId] = useState<string | null>(null);
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [bonusAwards, setBonusAwards] = useState<Record<string, number>>({});
  const [misses, setMisses] = useState(0);
  const [missesSinceFinding, setMissesSinceFinding] = useState(0);
  const [selectedPerformanceBonus, setSelectedPerformanceBonus] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [safeNotice, setSafeNotice] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [backendAttemptId, setBackendAttemptId] = useState<string | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<"idle" | "connecting" | "synced" | "error">("idle");
  const [runtimeMessage, setRuntimeMessage] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const { yaw, pitch, fov } = view;
  const foundSet = useMemo(() => new Set(foundIds), [foundIds]);
  const confirmedMarkers = useMemo<PanoramaMarker[]>(() => foundIds.flatMap((id) => {
    const hazard = hazardPerceptionHazards.find((item) => item.id === id);
    return hazard ? [{ id: hazard.id, yaw: hazard.yaw, pitch: hazard.pitch }] : [];
  }), [foundIds]);
  const sceneScore = foundIds.length * 100;
  const complete = foundIds.length === hazardPerceptionHazards.length;
  const hintPenalty = useMemo(
    () => Object.values(hintLevels).reduce((total, level) => {
      let cost = 0;
      if (level >= 1) cost += HINT_LEVEL_COSTS[1];
      if (level >= 2) cost += HINT_LEVEL_COSTS[2];
      if (level >= 3) cost += HINT_LEVEL_COSTS[3];
      return total + cost;
    }, 0),
    [hintLevels],
  );
  const hintsUsed = useMemo(() => Object.values(hintLevels).reduce((total, level) => total + level, 0), [hintLevels]);
  const earnedPerformanceBonus = useMemo(() => Object.values(bonusAwards).reduce((total, value) => total + value, 0), [bonusAwards]);
  const independentInspectionBonus = complete && hintPenalty === 0 ? INDEPENDENT_INSPECTION_BONUS : 0;
  const cleanInspectionBonus = complete && misses === 0 ? CLEAN_INSPECTION_BONUS : 0;
  const performancePoints = Math.max(
    0,
    earnedPerformanceBonus + independentInspectionBonus + cleanInspectionBonus - hintPenalty,
  );
  const selectedIndex = selected ? hazardPerceptionHazards.findIndex((hazard) => hazard.id === selected.id) + 1 : 0;
  const hintTarget = hintTargetId ? hazardPerceptionHazards.find((hazard) => hazard.id === hintTargetId) ?? null : null;

  function updateElapsedSeconds(value: number) {
    const next = Math.max(0, Math.floor(value));
    secondsRef.current = next;
    const root = experienceRef.current;
    root?.querySelectorAll<HTMLElement>("[data-training-timer]").forEach((node) => {
      node.textContent = formatTime(next);
    });
  }

  function updateHintPulse(next: ViewState) {
    const element = hintPulseRef.current;
    const viewer = viewerRef.current;
    const pulseId = hintPulseIdRef.current;
    if (!element || !viewer || !pulseId) return;

    const hazard = hazardPerceptionHazards.find((item) => item.id === pulseId);
    if (!hazard) {
      element.style.opacity = "0";
      return;
    }

    const width = Math.max(viewer.clientWidth, 1);
    const height = Math.max(viewer.clientHeight, 1);
    const projection = panoramaPointToScreen(
      hazard.yaw,
      hazard.pitch,
      next.yaw,
      next.pitch,
      next.fov,
      width,
      height,
    );

    if (!projection.visible) {
      element.style.opacity = "0";
      return;
    }

    element.style.opacity = "1";
    element.style.transform = `translate3d(${Math.round(projection.x)}px, ${Math.round(projection.y)}px, 0) translate(-50%, -50%)`;
  }

  function updateLiveViewTelemetry(next: ViewState) {
    if (liveHeadingRef.current) liveHeadingRef.current.textContent = headingLabel(next.yaw);
    if (liveFovRef.current) liveFovRef.current.textContent = `${Math.round(next.fov)}° FOV`;
    if (livePitchRef.current) livePitchRef.current.textContent = pitchLabel(next.pitch);
    updateHintPulse(next);
  }


  useEffect(() => {
    const lockEscape = async () => {
      const manager = getKeyboardLockManager();
      try {
        await manager?.lock?.(["Escape"]);
      } catch {
        // Keyboard Lock is progressive enhancement; fullscreen remains usable.
      }
    };

    const onFullscreenChange = () => {
      const active = document.fullscreenElement === experienceRef.current;
      setIsFullscreen(active);

      if (active) {
        void lockEscape();
        window.setTimeout(() => viewerRef.current?.focus(), 0);
      } else {
        getKeyboardLockManager()?.unlock?.();
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      getKeyboardLockManager()?.unlock?.();
    };
  }, []);

  useEffect(() => {
    const element = viewerRef.current;
    if (!element) return;
    const preventDocumentZoom = (event: globalThis.WheelEvent) => {
      if (!started) return;
      event.preventDefault();
    };
    element.addEventListener("wheel", preventDocumentZoom, { passive: false });
    return () => element.removeEventListener("wheel", preventDocumentZoom);
  }, [started]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingPointerRef.current = null;
  }, []);

  function ensureCameraAnimation() {
    if (frameRef.current !== null) return;
    let previous = performance.now();
    let wasAnimating = false;

    const animate = (now: number) => {
      frameRef.current = null;
      const dt = Math.min(Math.max((now - previous) / 16.667, 0.45), 2.4);
      previous = now;
      const activeDrag = dragRef.current;

      if (activeDrag?.dragging) {
        const pending = pendingPointerRef.current;
        pendingPointerRef.current = null;
        if (pending) applyDragPosition(pending.x, pending.y);
        return;
      }

      const current = viewRef.current;
      const target = targetViewRef.current;
      const yawRemaining = angleDelta(current.yaw, target.yaw);
      const pitchRemaining = target.pitch - current.pitch;
      const fovRemaining = target.fov - current.fov;
      const needsFrame = Math.abs(yawRemaining) > 0.01 || Math.abs(pitchRemaining) > 0.01 || Math.abs(fovRemaining) > 0.01;

      if (needsFrame) {
        const positionBlend = 1 - Math.pow(0.68, dt);
        const zoomBlend = 1 - Math.pow(0.74, dt);
        const next: ViewState = {
          yaw: normaliseAngle(current.yaw + yawRemaining * positionBlend),
          pitch: current.pitch + pitchRemaining * positionBlend,
          fov: current.fov + fovRemaining * zoomBlend,
        };
        renderCameraFrame(next, true);
        wasAnimating = true;
        frameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      if (wasAnimating) {
        const settled = { ...target };
        viewRef.current = settled;
        panoramaRendererRef.current?.settle(settled);
        updateLiveViewTelemetry(settled);
        setView(settled);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);
  }

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(ATTEMPT_KEY);
      if (!raw) return;
      const attempt = JSON.parse(raw) as Partial<StoredAttempt>;
      if (!attempt.startedAt || !Array.isArray(attempt.foundIds)) return;
      if (Date.now() - attempt.startedAt > MAX_RESUME_AGE_MS) {
        window.sessionStorage.removeItem(ATTEMPT_KEY);
        return;
      }
      setStarted(true);
      setStartedAt(attempt.startedAt);
      setFoundIds(attempt.foundIds.filter((id) => hazardPerceptionHazards.some((hazard) => hazard.id === id)));
      setBackendAttemptId(attempt.backendAttemptId ?? null);
      setHintLevels(attempt.hintLevels ?? {});
      setBonusAwards(attempt.bonusAwards ?? {});
      setMisses(Math.max(0, attempt.misses ?? 0));
      setMissesSinceFinding(Math.max(0, attempt.missesSinceFinding ?? 0));
      setRuntimeStatus(attempt.backendAttemptId ? "synced" : "idle");
      updateElapsedSeconds(Math.max(attempt.seconds ?? 0, Math.floor((Date.now() - attempt.startedAt) / 1000)));
    } catch {
      window.sessionStorage.removeItem(ATTEMPT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!started || !startedAt) return;
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      updateElapsedSeconds(elapsed);
      const attempt: StoredAttempt = {
        startedAt,
        seconds: elapsed,
        foundIds,
        sceneScore,
        backendAttemptId: backendAttemptId ?? undefined,
        hintLevels,
        bonusAwards,
        misses,
        missesSinceFinding,
        performancePoints,
        hintPenalty,
        hintsUsed,
      };
      window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    };
    tick();
    if (complete) return;
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [started, startedAt, complete, foundIds, sceneScore, backendAttemptId, hintLevels, bonusAwards, misses, missesSinceFinding, performancePoints, hintPenalty, hintsUsed]);

  // v8.2.2: legacy document-level inspection page classes are intentionally
  // retired. They forced the challenge route into the old viewport-sized
  // layout and collapsed the contained panorama when the training attempt
  // started. The portal shell now owns normal layout; native Fullscreen API
  // owns fullscreen layout.


  useEffect(() => {
    if (!selected) return;
    window.setTimeout(() => feedbackDrawerRef.current?.focus(), 0);
  }, [selected]);

  useEffect(() => {
    if (!showRestartConfirm) return;
    window.setTimeout(() => restartCancelRef.current?.focus(), 0);
  }, [showRestartConfirm]);

  useEffect(() => {
    const cancelForWindowState = () => cancelActiveGesture();
    const cancelWhenHidden = () => { if (document.hidden) cancelActiveGesture(); };
    window.addEventListener("blur", cancelForWindowState);
    document.addEventListener("visibilitychange", cancelWhenHidden);
    return () => {
      window.removeEventListener("blur", cancelForWindowState);
      document.removeEventListener("visibilitychange", cancelWhenHidden);
    };
  }, []);

  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (showRestartConfirm || selected || showHint || showChecklist || showHelp) {
        handleEscapeAction();
        return;
      }

      if (document.fullscreenElement === experienceRef.current) {
        void exitFullscreen();
        return;
      }

      viewerRef.current?.focus();
    };

    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [showRestartConfirm, selected, showHint, showHelp, showChecklist, isFullscreen]);

  useEffect(() => () => {
    if (safeNoticeTimerRef.current !== null) window.clearTimeout(safeNoticeTimerRef.current);
    if (hintPulseTimerRef.current !== null) window.clearTimeout(hintPulseTimerRef.current);
  }, []);


  function trapDialogFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("hidden"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function cancelActiveGesture() {
    const drag = dragRef.current;
    dragRef.current = null;
    pendingPointerRef.current = null;
    const settled = { ...viewRef.current };
    targetViewRef.current = settled;
    viewerRef.current?.classList.remove("is-dragging");
    if (drag && viewerRef.current) {
      try { viewerRef.current.releasePointerCapture(drag.pointerId); } catch {}
      panoramaRendererRef.current?.settle(settled);
      setView(settled);
    }
  }

  function closeChecklist(returnFocus = true) {
    setShowChecklist(false);
    if (returnFocus) window.setTimeout(() => checklistTriggerRef.current?.focus(), 0);
  }

  function closeHelp(returnFocus = true) {
    setShowHelp(false);
    if (returnFocus) window.setTimeout(() => helpTriggerRef.current?.focus(), 0);
  }

  function closeHint(returnFocus = true) {
    setShowHint(false);
    if (returnFocus) window.setTimeout(() => hintTriggerRef.current?.focus(), 0);
  }

  function handleEscapeAction() {
    cancelActiveGesture();
    clearSafeNotice();
    if (showRestartConfirm) { closeRestartConfirm(); return; }
    if (selected) { closeSelected(); return; }
    if (showHint) { closeHint(); return; }
    if (showChecklist) { closeChecklist(); return; }
    if (showHelp) { closeHelp(); return; }
    if (isFullscreen) {
      void exitFullscreen();
      return;
    }
    window.setTimeout(() => viewerRef.current?.focus(), 0);
  }

  function closeRestartConfirm() {
    setShowRestartConfirm(false);
    window.setTimeout(() => restartTriggerRef.current?.focus(), 0);
  }

  function setTargetView(update: Partial<ViewState>) {
    const current = targetViewRef.current;
    targetViewRef.current = {
      yaw: update.yaw === undefined ? current.yaw : normaliseAngle(update.yaw),
      pitch: update.pitch === undefined ? current.pitch : clamp(update.pitch, -PITCH_LIMIT, PITCH_LIMIT),
      fov: update.fov === undefined ? current.fov : clamp(update.fov, MIN_FOV, MAX_FOV),
    };
    ensureCameraAnimation();
  }

  function renderCameraFrame(next: ViewState, interactive: boolean) {
    viewRef.current = next;
    panoramaRendererRef.current?.renderCamera(next, interactive);
    updateLiveViewTelemetry(next);
  }

  function publishView(next: ViewState, interactive: boolean) {
    targetViewRef.current = { ...next };
    renderCameraFrame(next, interactive);
    if (!interactive) setView(next);
  }

  function resetView() {
    const reset = { ...initialView };
    targetViewRef.current = reset;
    viewRef.current = reset;
    panoramaRendererRef.current?.settle(reset);
    updateLiveViewTelemetry(reset);
    setView(reset);
  }

  function clearSafeNotice() {
    if (safeNoticeTimerRef.current !== null) window.clearTimeout(safeNoticeTimerRef.current);
    safeNoticeTimerRef.current = null;
    setSafeNotice(false);
  }

  function showSafeAreaNotice() {
    if (complete || reviewMode) return;
    clearSafeNotice();
    setMisses((current) => current + 1);
    setMissesSinceFinding((current) => current + 1);
    setSafeNotice(true);
    safeNoticeTimerRef.current = window.setTimeout(() => {
      setSafeNotice(false);
      safeNoticeTimerRef.current = null;
    }, 2400);
  }

  function pickHintTarget(excludeId?: string) {
    const unresolved = hazardPerceptionHazards.filter((hazard) => !foundSet.has(hazard.id) && hazard.id !== excludeId);
    if (!unresolved.length) return null;
    const camera = viewRef.current;
    return [...unresolved].sort((a, b) => {
      const aDistance = Math.abs(angleDelta(camera.yaw, a.yaw)) + Math.abs(camera.pitch - a.pitch) * 0.35;
      const bDistance = Math.abs(angleDelta(camera.yaw, b.yaw)) + Math.abs(camera.pitch - b.pitch) * 0.35;
      return aDistance - bDistance;
    })[0];
  }

  function openHintPanel() {
    const target = hintTarget && !foundSet.has(hintTarget.id) ? hintTarget : pickHintTarget();
    setHintTargetId(target?.id ?? null);
    setShowChecklist(false);
    setShowHelp(false);
    setShowHint(true);
  }

  function chooseAnotherHintTarget() {
    const target = pickHintTarget(hintTargetId ?? undefined) ?? pickHintTarget();
    setHintTargetId(target?.id ?? null);
  }

  function clearHintPulse() {
    if (hintPulseTimerRef.current !== null) window.clearTimeout(hintPulseTimerRef.current);
    hintPulseTimerRef.current = null;
    hintPulseIdRef.current = null;
    setHintPulseId(null);
    if (hintPulseRef.current) hintPulseRef.current.style.opacity = "0";
  }

  function triggerHintPulse(hazard: Hazard) {
    clearHintPulse();
    hintPulseIdRef.current = hazard.id;
    setHintPulseId(hazard.id);
    setTargetView({ yaw: hazard.yaw, pitch: hazard.pitch });
    window.setTimeout(() => updateHintPulse(viewRef.current), 0);
    hintPulseTimerRef.current = window.setTimeout(clearHintPulse, HINT_PULSE_MS);
  }

  function revealNextHint() {
    if (!hintTarget || foundSet.has(hintTarget.id)) {
      chooseAnotherHintTarget();
      return;
    }

    const currentLevel = Math.max(0, Math.min(3, hintLevels[hintTarget.id] ?? 0));
    if (currentLevel >= 3) {
      chooseAnotherHintTarget();
      return;
    }

    const nextLevel = currentLevel + 1;
    setHintLevels((current) => ({ ...current, [hintTarget.id]: nextLevel }));
    if (nextLevel === 3) triggerHintPulse(hintTarget);
  }

  async function startInspection(restart = false) {
    setRuntimeStatus("connecting");
    setRuntimeMessage(restart ? "Creating a fresh governed attempt…" : "Opening your training record…");
    try {
      const remote = await startTrainingAttempt("hazard-perception", restart);
      const remoteStartedAt = Date.parse(remote.startedAt);
      const now = Number.isFinite(remoteStartedAt) ? remoteStartedAt : Date.now();
      window.sessionStorage.removeItem(RESULT_KEY);
      window.sessionStorage.removeItem(QUIZ_STATE_KEY);
      setBackendAttemptId(remote.id);
      setStarted(true);
      setStartedAt(now);
      updateElapsedSeconds(remote.elapsedSeconds);
      setFoundIds(remote.findingCodes.filter((id) => hazardPerceptionHazards.some((hazard) => hazard.id === id)));
      setSelected(null);
      setSelectedAwarded(false);
      setShowChecklist(false);
      setShowHint(false);
      setHintTargetId(null);
      clearHintPulse();
      setHintLevels({});
      setBonusAwards({});
      setMisses(0);
      setMissesSinceFinding(0);
      setSelectedPerformanceBonus(0);
      setShowHelp(false);
      setReviewMode(false);
      setShowRestartConfirm(false);
      clearSafeNotice();
      resetView();
      window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({
        startedAt: now,
        seconds: remote.elapsedSeconds,
        foundIds: remote.findingCodes,
        sceneScore: remote.inspectionScore,
        backendAttemptId: remote.id,
        hintLevels: {},
        bonusAwards: {},
        misses: 0,
        missesSinceFinding: 0,
        performancePoints: 0,
        hintPenalty: 0,
        hintsUsed: 0,
      } satisfies StoredAttempt));
      setRuntimeStatus("synced");
      setRuntimeMessage("Employee training record synced");
      window.setTimeout(() => viewerRef.current?.focus(), 50);
    } catch (error) {
      setRuntimeStatus("error");
      setRuntimeMessage(error instanceof Error ? error.message : "Training record is unavailable.");
    }
  }

  async function restartInspection() {
    await startInspection(true);
  }

  function closeSelected() {
    setSelected(null);
    setSelectedAwarded(false);
    setSelectedPerformanceBonus(0);
    window.setTimeout(() => (focusReturnRef.current ?? viewerRef.current)?.focus(), 0);
  }

  function hazardAtClientPoint(clientX: number, clientY: number) {
    const element = viewerRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

    const direction = panoramaScreenToDirection(
      x,
      y,
      viewRef.current.yaw,
      viewRef.current.pitch,
      viewRef.current.fov,
      rect.width,
      rect.height,
    );

    // Object-level spherical hit regions: the learner may select the visible
    // unsafe object/condition, not a tiny point around its centre. Regions are
    // intentionally asymmetric because workers, exits, spills and pallet loads
    // occupy very different angular footprints inside the panorama.
    let best: { hazard: Hazard; score: number } | null = null;
    for (const hazard of hazardPerceptionHazards) {
      const zone = HAZARD_HIT_ZONES[hazard.id] ?? { yawRadius: 8, pitchRadius: 9 };
      const yawOffset = angleDelta(hazard.yaw, direction.yaw) * Math.cos((hazard.pitch * Math.PI) / 180);
      const pitchOffset = direction.pitch - hazard.pitch;
      const score = (yawOffset / zone.yawRadius) ** 2 + (pitchOffset / zone.pitchRadius) ** 2;
      if (score <= 1 && (!best || score < best.score)) best = { hazard, score };
    }
    return best?.hazard ?? null;
  }

  function inspectHazard(hazard: Hazard) {
    if (!started) return;
    focusReturnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const awarded = !foundSet.has(hazard.id);
    const observationBonus = awarded && (hintLevels[hazard.id] ?? 0) === 0 ? OBSERVATION_BONUS : 0;
    const precisionBonus = awarded && missesSinceFinding === 0 ? PRECISION_BONUS : 0;
    const performanceAward = observationBonus + precisionBonus;
    setSelectedAwarded(awarded);
    setSelectedPerformanceBonus(performanceAward);
    setSelected(hazard);
    setShowChecklist(false);
    setShowHint(false);
    setShowHelp(false);
    if (hintPulseIdRef.current === hazard.id) clearHintPulse();
    clearSafeNotice();
    targetViewRef.current = { ...viewRef.current };
    if (!awarded) return;
    setFoundIds((current) => [...current, hazard.id]);
    setBonusAwards((current) => ({ ...current, [hazard.id]: performanceAward }));
    setMissesSinceFinding(0);
    if (backendAttemptId) {
      setRuntimeStatus("connecting");
      void recordTrainingFinding(backendAttemptId, hazard.id)
        .then(() => { setRuntimeStatus("synced"); setRuntimeMessage("Finding saved to your employee training record"); })
        .catch((error) => { setRuntimeStatus("error"); setRuntimeMessage(error instanceof Error ? error.message : "Finding could not be saved."); });
    }
  }

  async function continueToQuiz() {
    if (!complete || transitioning) return;
    setTransitioning(true);
    setRuntimeStatus("connecting");
    setRuntimeMessage("Verifying inspection findings…");
    try {
      let attemptId = backendAttemptId;
      if (!attemptId) {
        const remote = await startTrainingAttempt("hazard-perception");
        attemptId = remote.id;
        setBackendAttemptId(remote.id);
      }
      for (const findingId of foundIds) await recordTrainingFinding(attemptId, findingId);
      const payload: StoredAttempt = {
        startedAt: startedAt ?? Date.now(),
        seconds: secondsRef.current,
        foundIds,
        sceneScore,
        backendAttemptId: attemptId,
        hintLevels,
        bonusAwards,
        misses,
        missesSinceFinding,
        performancePoints,
        hintPenalty,
        hintsUsed,
      };
      window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(payload));
      window.sessionStorage.removeItem(QUIZ_STATE_KEY);
      setRuntimeStatus("synced");
      setRuntimeMessage("Inspection verified");
      router.push("/training/hazard-perception/quiz");
    } catch (error) {
      setRuntimeStatus("error");
      setRuntimeMessage(error instanceof Error ? error.message : "Inspection could not be verified.");
      setTransitioning(false);
    }
  }

  function applyDragPosition(clientX: number, clientY: number) {
    const drag = dragRef.current;
    const element = viewerRef.current;
    if (!drag || !element) return;
    const width = Math.max(element.clientWidth, 1);
    const height = Math.max(element.clientHeight, 1);
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    const horizontalDegrees = clamp(
      drag.startFov * HORIZONTAL_DRAG_MULTIPLIER,
      82,
      168,
    );
    const verticalDegrees = clamp(
      drag.startFov * VERTICAL_DRAG_MULTIPLIER,
      92,
      178,
    );
    const next: ViewState = {
      yaw: normaliseAngle(drag.startYaw - (dx / width) * horizontalDegrees),
      pitch: clamp(drag.startPitch + (dy / height) * verticalDegrees, -PITCH_LIMIT, PITCH_LIMIT),
      fov: drag.startFov,
    };
    publishView(next, true);
  }

  function queueDragPosition(clientX: number, clientY: number) {
    // One event-driven camera RAF consumes only the latest coalesced pointer sample.
    // This keeps drag input and camera easing on a single frame authority.
    pendingPointerRef.current = { x: clientX, y: clientY };
    ensureCameraAnimation();
  }

  function flushDragPosition(clientX: number, clientY: number) {
    pendingPointerRef.current = null;
    applyDragPosition(clientX, clientY);
    const settled = { ...viewRef.current };
    panoramaRendererRef.current?.settle(settled);
    setView(settled);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!started || selected || showRestartConfirm || event.button !== 0) return;

    // Utility surfaces are dismissed as their own interaction. The same pointer
    // is never reused to rotate the panorama or inspect a condition.
    if (showHint) { closeHint(false); return; }
    if (showChecklist) { closeChecklist(false); return; }
    if (showHelp) { closeHelp(false); return; }

    clearSafeNotice();
    targetViewRef.current = { ...viewRef.current };
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: now,
      startYaw: viewRef.current.yaw,
      startPitch: viewRef.current.pitch,
      startFov: viewRef.current.fov,
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !started || selected) return;

    const totalDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const threshold = drag.pointerType === "touch" ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
    if (!drag.dragging && totalDistance < threshold) return;

    if (!drag.dragging) {
      drag.dragging = true;
      event.currentTarget.classList.add("is-dragging");
    }

    event.preventDefault();
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const latest = samples.length ? samples[samples.length - 1] : event.nativeEvent;
    queueDragPosition(latest.clientX, latest.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const elapsed = performance.now() - drag.startedAt;
    const totalDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const threshold = drag.pointerType === "touch" ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
    const wasInspectionTap = !drag.dragging && totalDistance < threshold && elapsed <= TAP_MAX_MS && started && !selected && !complete;

    if (drag.dragging) flushDragPosition(event.clientX, event.clientY);
    dragRef.current = null;
    event.currentTarget.classList.remove("is-dragging");
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}

    if (!wasInspectionTap) return;
    targetViewRef.current = { ...viewRef.current };
    const hazard = hazardAtClientPoint(event.clientX, event.clientY);
    if (hazard) inspectHazard(hazard);
    else showSafeAreaNotice();
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    cancelActiveGesture();
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (!started || selected) return;
    event.preventDefault();
    clearSafeNotice();
    const delta = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 130) * 0.15;
    setTargetView({ fov: targetViewRef.current.fov + delta });
  }

  function adjustZoom(amount: number) {
    clearSafeNotice();
    setTargetView({ fov: targetViewRef.current.fov + amount });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!started || selected) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); setTargetView({ yaw: targetViewRef.current.yaw - 8 }); }
    if (event.key === "ArrowRight") { event.preventDefault(); setTargetView({ yaw: targetViewRef.current.yaw + 8 }); }
    if (event.key === "ArrowUp") { event.preventDefault(); setTargetView({ pitch: targetViewRef.current.pitch - 3 }); }
    if (event.key === "ArrowDown") { event.preventDefault(); setTargetView({ pitch: targetViewRef.current.pitch + 3 }); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); adjustZoom(-12); }
    if (event.key === "-" || event.key === "_") { event.preventDefault(); adjustZoom(12); }
    if (event.key.toLowerCase() === "h") { event.preventDefault(); setShowHint(false); setShowChecklist(false); setShowHelp((value) => !value); }
    if (event.key.toLowerCase() === "c") { event.preventDefault(); setShowHint(false); setShowHelp(false); setShowChecklist((value) => !value); }
    if (event.key.toLowerCase() === "i") { event.preventDefault(); if (showHint) closeHint(); else openHintPanel(); }
    if (event.key === "Home") { event.preventDefault(); resetView(); }
  }

  async function enterFullscreen() {
    const target = experienceRef.current;
    if (!target?.requestFullscreen) return;

    try {
      await target.requestFullscreen();
      try {
        await getKeyboardLockManager()?.lock?.(["Escape"]);
      } catch {
        // Chrome may reject keyboard lock in unsupported contexts.
      }
      window.setTimeout(() => viewerRef.current?.focus(), 0);
    } catch {
      getKeyboardLockManager()?.unlock?.();
    }
  }

  async function exitFullscreen() {
    getKeyboardLockManager()?.unlock?.();

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Native fullscreen exit can fail transiently; fullscreenchange remains
        // the source of truth for the UI state.
      }
    }

    window.setTimeout(() => viewerRef.current?.focus(), 0);
  }

  function toggleFullscreen() {
    cancelActiveGesture();

    setShowChecklist(false);
    setShowHint(false);
    setShowHelp(false);

    if (document.fullscreenElement === experienceRef.current) void exitFullscreen();
    else void enterFullscreen();
  }

  return (
    <div ref={experienceRef} className={`hazard-experience hazard-experience-v4 hazard-experience-v41 hazard-experience-v42 hazard-experience-v43 hazard-experience-v44 hazard-experience-v72 hazard-experience-v73 runtime-ui-v741 runtime-ui-v742 runtime-ui-v80 runtime-ui-v81 runtime-ui-v811 runtime-ui-v820 runtime-ui-v821 runtime-ui-v830 runtime-ui-v840 runtime-ui-v841 runtime-ui-v842r1 runtime-ui-v844 runtime-ui-v845 runtime-ui-v849 runtime-ui-v8411 ${started ? "inspection-active-v43 inspection-active-v44" : ""}`}>
      <section className="challenge-toolbar challenge-toolbar-v3 challenge-toolbar-v4 challenge-toolbar-v41 challenge-toolbar-v43">
        <div>
          <span className="eyebrow">Immersive safety inspection</span>
          <h1>Warehouse Hazard Perception</h1>
          <p>Inspect a realistic warehouse workspace, identify six operational risks and review the correct control for each finding.</p>
        </div>
        <div className="challenge-kpis challenge-kpis-live challenge-kpis-v41 challenge-kpis-v43" aria-live="polite">
          <div><span>Hazards</span><strong>{foundIds.length} / 6</strong></div>
          <div><span>Score</span><strong>{sceneScore.toString().padStart(3, "0")}</strong></div>
          <div><span>Time</span><strong data-training-timer>{formatTime(secondsRef.current)}</strong></div>
        </div>
      </section>

      <div
        className={`panorama-viewer panorama-viewer-v4 panorama-viewer-v41 panorama-viewer-v42 panorama-viewer-v43 panorama-viewer-v44 panorama-viewer-v72 panorama-viewer-v73 panorama-viewer-v80 ${started ? "started" : ""} ${complete ? "complete" : ""}`}
        ref={viewerRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive 360 degree warehouse hazard inspection"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <EquirectangularViewport
          ref={panoramaRendererRef}
          src="/panoramas/warehouse-hazard-production-v10.webp"
          yaw={yaw}
          pitch={pitch}
          fov={fov}
          exposure={0.98}
          className="panorama-webgl-stage panorama-webgl-stage-hazard"
          markers={confirmedMarkers}
        />
        <div className="immersive-environment-grade immersive-environment-grade-v72 immersive-environment-grade-v73 immersive-environment-grade-v74" aria-hidden="true" />


        <div className="panorama-vignette panorama-vignette-v4 panorama-vignette-v41" aria-hidden="true" />
        <div className="panorama-hud-top panorama-hud-top-v4 panorama-hud-top-v41 panorama-hud-top-v43 panorama-hud-top-v44 panorama-hud-top-v73">
          <div className="scene-status-cluster">
            <div className="runtime-mission-caption-v742 runtime-mission-caption-v844"><span>HAZARD PERCEPTION</span>{started && !complete && <em className="runtime-live-session-v844">LIVE SESSION</em>}<strong>Warehouse inspection</strong></div>
            <div className="scene-status-chip scene-status-chip-v41"><span className="live-dot" /> {started ? (complete ? (reviewMode ? "Reviewing findings" : "Inspection complete") : "Inspection in progress") : "Ready to begin"}</div>
            {started && <div className="scene-progress-chip scene-progress-chip-v41 scene-progress-chip-v43"><span style={{ width: `${(foundIds.length / hazardPerceptionHazards.length) * 100}%` }} /></div>}
            {started && (
              <>
                <div className="scene-session-summary-v43 scene-session-summary-v44" aria-label="Inspection progress summary">
                  <span><small>Hazards</small><strong>{foundIds.length} / 6</strong></span>
                  <span><small>Score</small><strong>{sceneScore.toString().padStart(3, "0")}</strong></span>
                  <span><small>Time</small><strong data-training-timer>{formatTime(secondsRef.current)}</strong></span>
                </div>
                <div className="scene-performance-strip-v845" aria-label="Training performance points">
                  <span>Performance <strong>+{performancePoints}</strong></span>
                  <span>Hints <strong>{hintsUsed}</strong></span>
                </div>
              </>
            )}
          </div>
          <div className="scene-hud-right-v71 scene-hud-right-v844"><div className={`training-sync-chip ${runtimeStatus}`}><span aria-hidden="true" />{runtimeStatus === "connecting" ? "Saving" : runtimeStatus === "error" ? "Record issue" : runtimeStatus === "synced" ? "Local record" : "Ready"}</div><div className="scene-view-chip scene-view-chip-v41 scene-view-chip-v43 scene-view-chip-v844" aria-label="Live camera orientation"><strong ref={liveHeadingRef}>{headingLabel(yaw)}</strong><span ref={liveFovRef}>{Math.round(fov)}° FOV</span><em ref={livePitchRef}>{pitchLabel(pitch)}</em></div></div>
        </div>

        {started && (
          <aside className="scene-mission-brief-v73" aria-label="Hazard Perception mission status" onPointerDown={(event) => event.stopPropagation()}>
            <span className="scene-mission-kicker-v73">HAZARD PERCEPTION</span>
            <strong>Inspect the warehouse</strong>
            <p>Identify unsafe conditions, then review the strongest control before completing the knowledge check.</p>
            <div className="scene-mission-progress-v73"><span style={{ width: `${(foundIds.length / hazardPerceptionHazards.length) * 100}%` }} /></div>
            <small>{foundIds.length} of {hazardPerceptionHazards.length} hazards recorded</small>
          </aside>
        )}

        {started && !complete && <div className="inspection-reticle-v80" aria-hidden="true"><span /><small>Click suspicious conditions</small></div>}


        {!started && (
          <div className="scene-start-overlay scene-start-overlay-v4 scene-start-overlay-v41">
            <div className="scene-start-card scene-start-card-v4 scene-start-card-v41">
              <div className="scene-start-header">
                <span className="scene-start-icon">360°</span>
                <div><span className="eyebrow">Warehouse inspection mission</span><h2>Find six workplace hazards</h2></div>
              </div>
              <p>Move naturally through the warehouse, inspect suspicious conditions and learn the correct control before the final knowledge check.</p>
              <div className="scene-mission-grid">
                <div><strong>6</strong><span>risk findings</span></div>
                <div><strong>600</strong><span>governed scene points</span></div>
                <div><strong>3</strong><span>knowledge questions</span></div>
              </div>
              <div className="scene-start-guidance"><span>01</span><p><strong>Inspect, don&apos;t hunt icons.</strong> Select the unsafe condition itself. A miss simply confirms that the checked area is not a governed finding.</p></div>
              <button className="primary-button scene-start-button" type="button" onClick={(event) => { event.stopPropagation(); startInspection(); }}>Begin warehouse inspection →</button>
            </div>
          </div>
        )}

        {started && (
          <div className="scene-controls scene-controls-v4 scene-controls-v41 scene-controls-v43 scene-controls-v44 scene-controls-v73" onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => adjustZoom(-10)} aria-label="Zoom in" title="Zoom in" data-label="Zoom in"><span aria-hidden="true">＋</span></button>
            <button type="button" onClick={() => adjustZoom(10)} aria-label="Zoom out" title="Zoom out" data-label="Zoom out"><span aria-hidden="true">−</span></button>
            <button type="button" onClick={resetView} aria-label="Reset view" title="Reset view" data-label="Reset view"><span aria-hidden="true">⌂</span></button>
            <span className="scene-control-divider" />
            <button ref={checklistTriggerRef} type="button" onClick={() => { setShowHint(false); setShowHelp(false); setShowChecklist((value) => !value); }} aria-label="Inspection checklist" title="Inspection checklist" data-label="Checklist"><span aria-hidden="true">☷</span></button>
            <button ref={hintTriggerRef} type="button" onClick={() => { if (showHint) closeHint(); else openHintPanel(); }} aria-label="Get an inspection hint" title="Hint" data-label="Hint"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18h6M10 22h4M8.2 14.5C6.8 13.3 6 11.6 6 9.7A6 6 0 0 1 18 9.7c0 1.9-.8 3.6-2.2 4.8-.8.7-1.3 1.5-1.4 2.5h-4.8c-.1-1-.6-1.8-1.4-2.5Z" /></svg></button>
            <button ref={helpTriggerRef} type="button" onClick={() => { setShowHint(false); setShowChecklist(false); setShowHelp((value) => !value); }} aria-label="Show controls" title="Help" data-label="Help"><span aria-hidden="true">?</span></button>
            <button className="fullscreen-control-v821" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"} title={isFullscreen ? "Exit full screen" : "Full screen"} data-label={isFullscreen ? "Exit full screen" : "Full screen"}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{isFullscreen ? <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" /> : <path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5" />}</svg></button>
          </div>
        )}

        {started && <div className="drag-hint drag-hint-v4 drag-hint-v41 drag-hint-v43 drag-hint-v44 drag-hint-v73"><span className="drag-hint-dot" />Drag to inspect · click unsafe conditions · wheel to zoom · Hint if needed</div>}

        {safeNotice && started && (
          <div className="safe-area-notice safe-area-notice-v42 safe-area-notice-v43" role="status" aria-live="polite">
            <span>✓</span><div><strong>Area checked</strong><small>No training hazard is registered at this point. Continue inspecting.</small></div>
          </div>
        )}

        {(showHint || showHelp || showChecklist) && started && (
          <button
            type="button"
            className="scene-utility-scrim-v820"
            aria-label="Close open training panel"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (showHint) closeHint();
              else if (showChecklist) closeChecklist();
              else closeHelp();
            }}
          />
        )}

        {showHelp && started && (
          <div className="scene-help-panel scene-help-panel-v4 scene-help-panel-v41 scene-help-panel-v43 scene-help-panel-v44" onPointerDown={(event) => event.stopPropagation()}>
            <div className="scene-panel-title"><div><span>Navigation</span><strong>Full 360° scene controls</strong></div><div className="runtime-panel-actions-v842r1"><span className="runtime-esc-key-v842r1" aria-hidden="true">Esc</span><button type="button" onClick={() => closeHelp()} aria-label="Close help">×</button></div></div>
            <p className="scene-panel-intro">Drag horizontally, vertically or diagonally to inspect the warehouse. Release to hold the view exactly where you stop.</p>
            <span><kbd>Drag</kbd> Look around</span>
            <span><kbd>Wheel</kbd> Smooth zoom</span>
            <span><kbd>← ↑ ↓ →</kbd> Fine adjustment</span>
            <span><kbd>Home</kbd> Reset view</span>
            <span><kbd>C</kbd> Checklist</span>
            <span><kbd>I</kbd> Assisted hint</span>
            <div className="runtime-escape-row-v842r1"><kbd>Esc</kbd><span>Close this panel first</span></div>
          </div>
        )}

        {showHint && started && (
          <aside className="scene-hint-panel-v845 scene-hint-panel-v847" onPointerDown={(event) => event.stopPropagation()} aria-label="Assisted inspection hint">
            <div className="scene-hint-header-v847">
              <div className="scene-hint-heading-v847">
                <span className="scene-hint-kicker-v847">Assisted inspection</span>
                <strong>Inspection assistance</strong>
                <small>Use only when you need help locating an unresolved risk.</small>
              </div>
              <div className="runtime-panel-actions-v842r1 scene-hint-actions-v847">
                <span className="runtime-esc-key-v842r1" aria-hidden="true">Esc</span>
                <button type="button" onClick={() => closeHint()} aria-label="Close hint">×</button>
              </div>
            </div>

            <div className="scene-hint-governance-v847">
              <span>Training record protected</span>
              <p>Hints affect only optional performance points. Your governed completion score remains unchanged.</p>
            </div>

            {hintTarget ? (
              <>
                <div className="scene-hint-progress-v847">
                  <div>
                    <span>Unresolved finding</span>
                    <strong>{hazardPerceptionHazards.length - foundIds.length} remaining</strong>
                  </div>
                  <div className="scene-hint-level-pill-v847">Level {hintLevels[hintTarget.id] ?? 0} / 3</div>
                </div>

                <div className="scene-hint-ladder-v847" aria-label="Hint assistance levels">
                  <div className={`scene-hint-step-v847 ${(hintLevels[hintTarget.id] ?? 0) >= 1 ? "is-complete" : "is-next"}`}>
                    <span className="scene-hint-step-index-v847">01</span>
                    <div><strong>Safety clue</strong><small>Conceptual observation prompt</small></div>
                    <em>−10</em>
                  </div>
                  <div className={`scene-hint-step-v847 ${(hintLevels[hintTarget.id] ?? 0) >= 2 ? "is-complete" : (hintLevels[hintTarget.id] ?? 0) === 1 ? "is-next" : ""}`}>
                    <span className="scene-hint-step-index-v847">02</span>
                    <div><strong>Compass sector</strong><small>Directional assistance</small></div>
                    <em>−20</em>
                  </div>
                  <div className={`scene-hint-step-v847 ${(hintLevels[hintTarget.id] ?? 0) >= 3 ? "is-complete" : (hintLevels[hintTarget.id] ?? 0) === 2 ? "is-next" : ""}`}>
                    <span className="scene-hint-step-index-v847">03</span>
                    <div><strong>Search-zone pulse</strong><small>Brief broad visual assist</small></div>
                    <em>−35</em>
                  </div>
                </div>

                {(hintLevels[hintTarget.id] ?? 0) >= 1 && (
                  <div className="scene-hint-reveal-v845 scene-hint-reveal-v847">
                    <span>Safety clue</span>
                    <p>{HAZARD_HINTS[hintTarget.id]}</p>
                  </div>
                )}

                {(hintLevels[hintTarget.id] ?? 0) >= 2 && (
                  <div className="scene-hint-reveal-v845 compact scene-hint-reveal-v847 scene-hint-direction-v847">
                    <span>Compass sector</span>
                    <strong>{compassSector(hintTarget.yaw)}</strong>
                  </div>
                )}

                {(hintLevels[hintTarget.id] ?? 0) >= 3 && (
                  <div className="scene-hint-reveal-v845 compact scene-hint-reveal-v847">
                    <span>Search-zone assist</span>
                    <strong>Broad pulse used</strong>
                  </div>
                )}

                <div className="scene-hint-performance-v847">
                  <div>
                    <span>Performance balance</span>
                    <strong>+{performancePoints}</strong>
                  </div>
                  <div>
                    <span>Hint deductions</span>
                    <strong className="deduction">−{hintPenalty}</strong>
                  </div>
                </div>

                {(hintLevels[hintTarget.id] ?? 0) < 3 ? (
                  <button type="button" className="primary-button scene-hint-action-v845 scene-hint-action-v847" onClick={revealNextHint}>
                    {(hintLevels[hintTarget.id] ?? 0) === 0 && <><span>Reveal safety clue</span><strong>−10 performance</strong></>}
                    {(hintLevels[hintTarget.id] ?? 0) === 1 && <><span>Show compass sector</span><strong>−20 performance</strong></>}
                    {(hintLevels[hintTarget.id] ?? 0) === 2 && <><span>Pulse broad search zone</span><strong>−35 performance</strong></>}
                  </button>
                ) : (
                  <button type="button" className="secondary-button scene-hint-action-v845 scene-hint-action-v847" onClick={chooseAnotherHintTarget}>
                    <span>Assist another unresolved finding</span>
                  </button>
                )}

                <div className="scene-hint-footer-v847">
                  <span>Tip</span>
                  <p>Try the lowest hint level first. Stronger assistance should be a last resort.</p>
                </div>
              </>
            ) : (
              <div className="scene-hint-complete-v845 scene-hint-complete-v847">
                <span>Inspection assistance</span>
                <strong>No hint required</strong>
                <p>All governed findings have been identified.</p>
              </div>
            )}
          </aside>
        )}

        {hintPulseId && <div ref={hintPulseRef} className="scene-hint-pulse-v845" aria-hidden="true"><span>Search zone</span></div>}

        {showChecklist && started && (
          <aside className="scene-checklist-panel scene-checklist-panel-v41 scene-checklist-panel-v42 scene-checklist-panel-v43 scene-checklist-panel-v44" onPointerDown={(event) => event.stopPropagation()}>
            <div className="scene-panel-title">
              <div><span>Inspection mission</span><strong>{foundIds.length} of 6 risks identified</strong></div>
              <div className="runtime-panel-actions-v842r1"><span className="runtime-esc-key-v842r1" aria-hidden="true">Esc</span><button type="button" onClick={() => closeChecklist()} aria-label="Close checklist">×</button></div>
            </div>
            <div className="inspection-progress inspection-progress-v41"><span style={{ width: `${(foundIds.length / hazardPerceptionHazards.length) * 100}%` }} /></div>
            <div className="inspection-checklist-list inspection-checklist-list-v41 inspection-checklist-list-v42 inspection-checklist-list-v43 inspection-checklist-list-v44">
              {hazardPerceptionHazards.map((hazard, index) => {
                const found = foundSet.has(hazard.id);
                if (found) {
                  return (
                    <button key={hazard.id} type="button" className="found" onClick={() => inspectHazard(hazard)}>
                      <span className="inspection-index">✓</span>
                      <div><strong>{hazard.category}</strong><span>{hazard.title}</span></div>
                      <em>Review</em>
                    </button>
                  );
                }
                return (
                  <div key={hazard.id} className="pending">
                    <span className="inspection-index">{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{hazard.category}</strong><span>Risk still to identify</span></div>
                  </div>
                );
              })}
            </div>
            <p className="checklist-note">Risk categories provide orientation without revealing the exact unsafe condition. Identified findings can be reopened for review.</p>
          </aside>
        )}

        {selected && (
          <>
            <button
              className="hazard-drawer-scrim hazard-drawer-scrim-v41"
              aria-label="Close hazard feedback"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                closeSelected();
              }}
            />
            <aside
              className="hazard-feedback-drawer hazard-feedback-drawer-v4 hazard-feedback-drawer-v41 hazard-feedback-drawer-v42 hazard-feedback-drawer-v43 hazard-feedback-drawer-v44"
              ref={feedbackDrawerRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="hazard-feedback-title"
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={trapDialogFocus}
            >
              <div className="hazard-feedback-head hazard-feedback-head-v41">
                <div>
                  <span className="feedback-section-kicker">Safety finding {String(selectedIndex).padStart(2, "0")} / 06</span>
                  <div className="feedback-chip-row"><span className={`risk-chip risk-${selected.severity.toLowerCase()}`}>{selected.severity} risk</span><span className="hazard-category">{selected.category}</span></div>
                </div>
                <div className="runtime-panel-actions-v842r1"><span className="runtime-esc-key-v842r1" aria-hidden="true">Esc</span><button className="drawer-close" type="button" onClick={closeSelected} aria-label="Close">×</button></div>
              </div>
              <div className={`hazard-feedback-status hazard-feedback-status-v4 hazard-feedback-status-v41 ${selectedAwarded ? "awarded" : "reviewed"}`}>
                <span className="feedback-check">✓</span>
                <div><span>{selectedAwarded ? "Finding recorded" : "Finding reviewed"}</span><strong>{selectedAwarded ? `+${selected.points} governed pts${selectedPerformanceBonus > 0 ? ` · +${selectedPerformanceBonus} performance` : ""}` : "Score already awarded"}</strong></div>
              </div>
              <h2 id="hazard-feedback-title">{selected.title}</h2>
              <div className="feedback-meta-grid">
                <div><span>Control priority</span><strong>{selected.severity === "Critical" ? "Immediate" : selected.severity === "High" ? "High" : "Required"}</strong></div>
                <div><span>Learning stage</span><strong>Observe → Control</strong></div>
              </div>
              <div className="feedback-block feedback-block-v41"><span>Why this matters</span><p>{selected.why}</p></div>
              <div className="feedback-block corrective feedback-block-v41"><span>Required control</span><p>{selected.action}</p></div>
              <div className="feedback-learning-note feedback-learning-note-v41"><strong>Learning point</strong><span>{selected.learning}</span></div>
              <button className="primary-button full-button feedback-continue-v41" type="button" onClick={closeSelected}>{complete ? "Return to findings →" : "Continue inspection →"}</button>
            </aside>
          </>
        )}

        {complete && !selected && (
          <div className="scene-complete-bar scene-complete-bar-v4 scene-complete-bar-v41 scene-complete-bar-v42 scene-complete-bar-v43 scene-complete-bar-v44 scene-complete-bar-v45" onPointerDown={(event) => event.stopPropagation()}>
            <div className="scene-complete-copy scene-complete-copy-v45"><span className="completion-check completion-check-v45" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5.5 12.5 10 17l8.5-10" /></svg></span><div><strong>Warehouse inspection complete</strong><span>All six hazards identified · governed score {sceneScore}/600 · performance +{performancePoints}</span></div></div>
            <div className="scene-complete-actions">
              <button className="secondary-button" type="button" onClick={() => { setReviewMode(true); setShowHelp(false); setShowChecklist(true); }}>Review findings</button>
              <button className="primary-button" type="button" disabled={transitioning} onClick={continueToQuiz}>{transitioning ? "Verifying…" : "Knowledge check →"}</button>
            </div>
          </div>
        )}
      </div>

      {runtimeStatus === "error" && <div className="training-runtime-alert" role="alert"><strong>Training record needs attention</strong><span>{runtimeMessage}</span></div>}

      <div className="challenge-footer challenge-footer-v3 challenge-footer-v4 challenge-footer-v41 challenge-footer-v43 challenge-footer-v44 challenge-footer-v72 challenge-footer-v73 challenge-footer-v742">
        <div className="runtime-bottom-dock-v742">
          <button ref={restartTriggerRef} type="button" className="text-action" onClick={() => started ? setShowRestartConfirm(true) : restartInspection()}>Restart scene</button>
          <span className="runtime-drag-guide-v742"><i aria-hidden="true" />Drag to inspect · click unsafe conditions · wheel to zoom · Hint if needed</span>
          <a href="/training/hazard-perception">Exit training</a>
        </div>
      </div>

      {showRestartConfirm && (
        <div
          className="prototype-modal-layer prototype-modal-layer-v42"
          role="presentation"
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) {
              event.preventDefault();
              event.stopPropagation();
              closeRestartConfirm();
            }
          }}
        >
          <section className="prototype-confirm-modal prototype-confirm-modal-v42" role="dialog" aria-modal="true" aria-labelledby="restart-title" onKeyDown={trapDialogFocus}>
            <span className="prototype-confirm-icon">↻</span>
            <div className="eyebrow">Restart inspection</div>
            <h2 id="restart-title">Clear the current scene attempt?</h2>
            <p>Your current hazard findings, timer and in-progress knowledge-check state will be cleared. Completed historical progress is not affected.</p>
            <div className="prototype-confirm-actions">
              <button ref={restartCancelRef} type="button" className="secondary-button" onClick={closeRestartConfirm}>Keep current attempt</button>
              <button type="button" className="danger-button" onClick={restartInspection}>Restart inspection</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
