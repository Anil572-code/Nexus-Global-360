export type RuntimeFindingRule = {
  code: string;
  category: string;
  title: string;
  points: number;
};

export type RuntimeControlRule = {
  findingCode: string;
  correctOptionIndex: number;
  points: number;
};

export type RuntimeQuizRule = {
  questionCode: string;
  correctOptionIndex: number;
  points: number;
};

export type RuntimeModuleSlug =
  | "hazard-perception"
  | "working-at-height"
  | "safety-induction"
  | "fire-safety-emergency-evacuation"
  | "forklift-pedestrian-safety"
  | "manual-handling-ergonomics";

export type RuntimeModuleRule = {
  slug: RuntimeModuleSlug;
  findings: RuntimeFindingRule[];
  controls: RuntimeControlRule[];
  quiz: RuntimeQuizRule[];
  completionBonus: number;
};

const interactiveStagePoints = 50;
const interactiveDecisionPoints = 100;
const interactiveQuizPoints = 75;

export const runtimeModuleRules: Record<string, RuntimeModuleRule> = {
  "hazard-perception": {
    slug: "hazard-perception",
    findings: [
      { code: "blocked-exit", category: "Emergency access", title: "Blocked emergency exit", points: 100 },
      { code: "wet-floor", category: "Slips and trips", title: "Uncontrolled spill", points: 100 },
      { code: "unstable-stack", category: "Storage safety", title: "Unstable stacked load", points: 100 },
      { code: "missing-ppe", category: "Personal protection", title: "Required PPE missing", points: 100 },
      { code: "unsafe-lift", category: "Manual handling", title: "Unsafe lifting posture", points: 100 },
      { code: "forklift-conflict", category: "Vehicle movement", title: "Forklift and pedestrian conflict", points: 100 },
    ],
    controls: [],
    quiz: [
      { questionCode: "exit-route", correctOptionIndex: 1, points: 100 },
      { questionCode: "manual-lift", correctOptionIndex: 2, points: 100 },
      { questionCode: "vehicle-separation", correctOptionIndex: 1, points: 100 },
    ],
    completionBonus: 100,
  },
  "working-at-height": {
    slug: "working-at-height",
    findings: [
      { code: "wah-plan", category: "Planning", title: "Assess whether work at height is necessary", points: interactiveStagePoints },
      { code: "wah-access", category: "Access equipment", title: "Select suitable access equipment", points: interactiveStagePoints },
      { code: "wah-inspect", category: "Pre-use inspection", title: "Verify the complete setup before use", points: interactiveStagePoints },
      { code: "wah-position", category: "Work positioning", title: "Respond to unsafe reach and positioning", points: interactiveStagePoints },
    ],
    controls: [
      { findingCode: "wah-plan", correctOptionIndex: 1, points: interactiveDecisionPoints },
      { findingCode: "wah-access", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "wah-inspect", correctOptionIndex: 0, points: interactiveDecisionPoints },
      { findingCode: "wah-position", correctOptionIndex: 1, points: interactiveDecisionPoints },
    ],
    quiz: [
      { questionCode: "wah-q1", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "wah-q2", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "wah-q3", correctOptionIndex: 2, points: interactiveQuizPoints },
      { questionCode: "wah-q4", correctOptionIndex: 1, points: interactiveQuizPoints },
    ],
    completionBonus: 100,
  },
  "safety-induction": {
    slug: "safety-induction",
    findings: [
      { code: "induction-entry", category: "Operational entry", title: "Confirm operational-area entry requirements", points: interactiveStagePoints },
      { code: "induction-site-controls", category: "Site controls", title: "Follow designated routes and boundaries", points: interactiveStagePoints },
      { code: "induction-emergency", category: "Emergency readiness", title: "Keep emergency routes immediately usable", points: interactiveStagePoints },
      { code: "induction-reporting", category: "Incident reporting", title: "Report hazards and near misses promptly", points: interactiveStagePoints },
    ],
    controls: [
      { findingCode: "induction-entry", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "induction-site-controls", correctOptionIndex: 1, points: interactiveDecisionPoints },
      { findingCode: "induction-emergency", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "induction-reporting", correctOptionIndex: 2, points: interactiveDecisionPoints },
    ],
    quiz: [
      { questionCode: "induction-q1", correctOptionIndex: 2, points: interactiveQuizPoints },
      { questionCode: "induction-q2", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "induction-q3", correctOptionIndex: 3, points: interactiveQuizPoints },
      { questionCode: "induction-q4", correctOptionIndex: 2, points: interactiveQuizPoints },
    ],
    completionBonus: 100,
  },
  "fire-safety-emergency-evacuation": {
    slug: "fire-safety-emergency-evacuation",
    findings: [
      { code: "fire-recognise", category: "Emergency recognition", title: "Recognise and raise the alarm", points: interactiveStagePoints },
      { code: "fire-route", category: "Evacuation", title: "Choose a safe available evacuation route", points: interactiveStagePoints },
      { code: "fire-assist", category: "Evacuation behaviour", title: "Maintain an orderly evacuation", points: interactiveStagePoints },
      { code: "fire-assembly", category: "Assembly", title: "Remain at the assembly point until authorized", points: interactiveStagePoints },
    ],
    controls: [
      { findingCode: "fire-recognise", correctOptionIndex: 0, points: interactiveDecisionPoints },
      { findingCode: "fire-route", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "fire-assist", correctOptionIndex: 1, points: interactiveDecisionPoints },
      { findingCode: "fire-assembly", correctOptionIndex: 0, points: interactiveDecisionPoints },
    ],
    quiz: [
      { questionCode: "fire-q1", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "fire-q2", correctOptionIndex: 0, points: interactiveQuizPoints },
      { questionCode: "fire-q3", correctOptionIndex: 2, points: interactiveQuizPoints },
      { questionCode: "fire-q4", correctOptionIndex: 1, points: interactiveQuizPoints },
    ],
    completionBonus: 100,
  },
  "forklift-pedestrian-safety": {
    slug: "forklift-pedestrian-safety",
    findings: [
      { code: "forklift-walkway", category: "Segregation", title: "Use designated pedestrian routes", points: interactiveStagePoints },
      { code: "forklift-crossing", category: "Crossing points", title: "Cross vehicle routes only when safe", points: interactiveStagePoints },
      { code: "forklift-visibility", category: "Visibility", title: "Manage blind-corner risk", points: interactiveStagePoints },
      { code: "forklift-load", category: "Vehicle awareness", title: "Maintain safe distance from moving loads", points: interactiveStagePoints },
    ],
    controls: [
      { findingCode: "forklift-walkway", correctOptionIndex: 0, points: interactiveDecisionPoints },
      { findingCode: "forklift-crossing", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "forklift-visibility", correctOptionIndex: 1, points: interactiveDecisionPoints },
      { findingCode: "forklift-load", correctOptionIndex: 0, points: interactiveDecisionPoints },
    ],
    quiz: [
      { questionCode: "forklift-q1", correctOptionIndex: 2, points: interactiveQuizPoints },
      { questionCode: "forklift-q2", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "forklift-q3", correctOptionIndex: 0, points: interactiveQuizPoints },
      { questionCode: "forklift-q4", correctOptionIndex: 2, points: interactiveQuizPoints },
    ],
    completionBonus: 100,
  },
  "manual-handling-ergonomics": {
    slug: "manual-handling-ergonomics",
    findings: [
      { code: "manual-assess", category: "Task assessment", title: "Assess the load, route and available help", points: interactiveStagePoints },
      { code: "manual-aid", category: "Handling method", title: "Use mechanical assistance when appropriate", points: interactiveStagePoints },
      { code: "manual-position", category: "Body position", title: "Avoid unnecessary twisting and overreaching", points: interactiveStagePoints },
      { code: "manual-repeat", category: "Ergonomics", title: "Reduce repetitive and poorly positioned handling", points: interactiveStagePoints },
    ],
    controls: [
      { findingCode: "manual-assess", correctOptionIndex: 1, points: interactiveDecisionPoints },
      { findingCode: "manual-aid", correctOptionIndex: 0, points: interactiveDecisionPoints },
      { findingCode: "manual-position", correctOptionIndex: 2, points: interactiveDecisionPoints },
      { findingCode: "manual-repeat", correctOptionIndex: 1, points: interactiveDecisionPoints },
    ],
    quiz: [
      { questionCode: "manual-q1", correctOptionIndex: 0, points: interactiveQuizPoints },
      { questionCode: "manual-q2", correctOptionIndex: 2, points: interactiveQuizPoints },
      { questionCode: "manual-q3", correctOptionIndex: 1, points: interactiveQuizPoints },
      { questionCode: "manual-q4", correctOptionIndex: 0, points: interactiveQuizPoints },
    ],
    completionBonus: 100,
  },
};

export function runtimeRuleFor(slug: string): RuntimeModuleRule | undefined {
  return runtimeModuleRules[slug];
}
