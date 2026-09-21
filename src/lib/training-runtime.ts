export type RuntimeModuleSlug =
  | "hazard-perception"
  | "working-at-height"
  | "safety-induction"
  | "fire-safety-emergency-evacuation"
  | "forklift-pedestrian-safety"
  | "manual-handling-ergonomics";

export type RuntimeAttempt = {
  id: string;
  moduleSlug: RuntimeModuleSlug;
  status: string;
  startedAt: string;
  elapsedSeconds: number;
  findingCodes: string[];
  controlAnswers: Record<string, number>;
  inspectionScore: number;
  controlScore: number;
};

export type RuntimeCompletion = {
  attemptId: string;
  moduleSlug: RuntimeModuleSlug;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  inspectionScore: number;
  controlScore: number;
  knowledgeScore: number;
  completionBonus: number;
  totalScore: number;
  findingsCount: number;
  controlCorrect: number;
  quizCorrect: number;
  quizTotal: number;
};

async function jsonRequest<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "Training record could not be updated.");
  return data;
}

export function startTrainingAttempt(moduleSlug: RuntimeModuleSlug, restart = false) {
  return jsonRequest<RuntimeAttempt>("/api/training/attempts/start", { moduleSlug, restart });
}

export function recordTrainingFinding(attemptId: string, code: string) {
  return jsonRequest<{ ok: true; findingCode: string; findingsRecorded: number; inspectionScore: number }>(
    `/api/training/attempts/${encodeURIComponent(attemptId)}/findings`,
    { code },
  );
}

export function recordTrainingControl(attemptId: string, findingCode: string, optionIndex: number) {
  return jsonRequest<{
    ok: true;
    findingCode: string;
    optionIndex: number;
    isCorrect: boolean;
    points: number;
    controlsRecorded?: number;
    controlScore?: number;
    immutable?: boolean;
  }>(`/api/training/attempts/${encodeURIComponent(attemptId)}/controls`, { findingCode, optionIndex });
}

export function completeTrainingAttempt(
  attemptId: string,
  answers: Array<{ questionCode: string; optionIndex: number }>,
) {
  return jsonRequest<RuntimeCompletion>(
    `/api/training/attempts/${encodeURIComponent(attemptId)}/complete`,
    { answers },
  );
}
