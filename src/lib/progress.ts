export const PROGRESS_KEY = "nexus-safety-360:progress:v1";

export type ModuleResult = {
  attempts: number;
  bestScore: number;
  lastScore: number;
  bestDurationSeconds: number;
  lastDurationSeconds: number;
  quizCorrect: number;
  completedAt: string;
};

export type TrainingProgress = {
  completedModules: string[];
  bestScore: number;
  hazardsFound: number;
  quizCorrect: number;
  attempts: number;
  moduleResults: Record<string, ModuleResult>;
};

export const emptyProgress: TrainingProgress = {
  completedModules: [],
  bestScore: 0,
  hazardsFound: 0,
  quizCorrect: 0,
  attempts: 0,
  moduleResults: {},
};

export function readProgress(): TrainingProgress {
  if (typeof window === "undefined") return emptyProgress;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<TrainingProgress>;
    return {
      ...emptyProgress,
      ...parsed,
      completedModules: Array.isArray(parsed.completedModules) ? parsed.completedModules : [],
      moduleResults: parsed.moduleResults && typeof parsed.moduleResults === "object" ? parsed.moduleResults : {},
    };
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(progress: TrainingProgress) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }
}

export function recordModuleResult(
  moduleId: string,
  result: { score: number; durationSeconds: number; quizCorrect: number; hazardsFound: number },
) {
  const current = readProgress();
  const previous = current.moduleResults[moduleId];
  const now = new Date().toISOString();
  const bestDuration = previous?.bestDurationSeconds
    ? Math.min(previous.bestDurationSeconds, result.durationSeconds)
    : result.durationSeconds;

  const next: TrainingProgress = {
    ...current,
    completedModules: Array.from(new Set([...current.completedModules, moduleId])),
    bestScore: Math.max(current.bestScore, result.score),
    hazardsFound: result.hazardsFound,
    quizCorrect: result.quizCorrect,
    attempts: current.attempts + 1,
    moduleResults: {
      ...current.moduleResults,
      [moduleId]: {
        attempts: (previous?.attempts ?? 0) + 1,
        bestScore: Math.max(previous?.bestScore ?? 0, result.score),
        lastScore: result.score,
        bestDurationSeconds: bestDuration,
        lastDurationSeconds: result.durationSeconds,
        quizCorrect: result.quizCorrect,
        completedAt: now,
      },
    },
  };

  writeProgress(next);
  return next;
}

export function resetProgress() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PROGRESS_KEY);
    window.sessionStorage.removeItem("nexus-safety-360:hazard-attempt:v1");
    window.sessionStorage.removeItem("nexus-safety-360:last-result:v1");
    window.sessionStorage.removeItem("nexus-safety-360:hazard-quiz-state:v1");
    window.sessionStorage.removeItem("nexus-safety-360:height-attempt:v1");
    window.sessionStorage.removeItem("nexus-safety-360:height-quiz-state:v1");
    window.sessionStorage.removeItem("nexus-safety-360:height-last-result:v1");
  }
}
