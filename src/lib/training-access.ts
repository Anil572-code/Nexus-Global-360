export type LatestTrainingResult = {
  attemptId: string;
  moduleSlug: string;
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
