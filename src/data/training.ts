export type TrainingMode =
  | "inspect"
  | "risk-decision"
  | "core-learning"
  | "emergency-scenario"
  | "hazard-scene"
  | "decision-simulation";

export type TrainingModule = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  duration: string;
  category: string;
  difficulty: string;
  mode: TrainingMode;
  modeLabel: string;
  scenario: string;
  accent: string;
  objectiveSummary: string;
  objectives: string[];
  metrics: Array<{ label: string; value: string }>;
  nextBuild: string;
};

export const trainingModules: TrainingModule[] = [
  {
    id: "hazard-perception",
    number: "01",
    title: "Hazard Perception",
    shortTitle: "Warehouse Hazard Perception",
    description: "Explore a warehouse environment and identify workplace risks before they become incidents.",
    duration: "5–7 min",
    category: "360° immersive",
    difficulty: "Introductory",
    mode: "inspect",
    modeLabel: "Observe · Identify · Learn",
    scenario: "Warehouse operations",
    accent: "360°",
    objectiveSummary: "Inspect the environment, identify unsafe conditions and reinforce each decision with immediate safety guidance.",
    objectives: [
      "Identify common warehouse hazards before they escalate.",
      "Understand why each unsafe condition creates risk.",
      "Select the appropriate corrective action.",
      "Complete a short knowledge check after the scene.",
    ],
    metrics: [
      { label: "Hazards", value: "6 to find" },
      { label: "Knowledge check", value: "3 questions" },
      { label: "Interaction", value: "360° inspection" },
    ],
    nextBuild: "Production 360° warehouse inspection.",
  },
  {
    id: "working-at-height",
    number: "02",
    title: "Working at Height",
    shortTitle: "Working at Height",
    description: "Assess elevated-work tasks, choose suitable controls and make safer work-positioning decisions.",
    duration: "6–8 min",
    category: "Risk decision",
    difficulty: "Core safety",
    mode: "risk-decision",
    modeLabel: "Assess · Inspect · Decide",
    scenario: "Elevated maintenance task",
    accent: "HEIGHT",
    objectiveSummary: "Work through a guided risk-assessment scenario before elevated work begins.",
    objectives: [
      "Assess whether work at height can be avoided or reduced.",
      "Choose suitable access equipment for the task and conditions.",
      "Inspect the setup before work begins.",
      "Respond safely when reach or positioning becomes unsafe.",
    ],
    metrics: [
      { label: "Decisions", value: "4 scenarios" },
      { label: "Knowledge check", value: "4 questions" },
      { label: "Interaction", value: "Guided decisions" },
    ],
    nextBuild: "Reusable non-360 decision scenario.",
  },
  {
    id: "safety-induction",
    number: "03",
    title: "Nexus Safety Induction",
    shortTitle: "Nexus Safety Induction",
    description: "Learn the core safety responsibilities, emergency expectations and reporting principles used across Nexus operations.",
    duration: "8–10 min",
    category: "Core learning",
    difficulty: "Foundation",
    mode: "core-learning",
    modeLabel: "Learn · Decide · Reinforce",
    scenario: "New employee induction",
    accent: "CORE",
    objectiveSummary: "Build a consistent safety foundation before starting operational training.",
    objectives: [
      "Understand individual safety responsibilities.",
      "Know how to respond to alarms and emergency instructions.",
      "Follow task and area PPE requirements.",
      "Report hazards, incidents and near misses promptly.",
    ],
    metrics: [
      { label: "Learning stages", value: "4 scenarios" },
      { label: "Knowledge check", value: "4 questions" },
      { label: "Audience", value: "All employees" },
    ],
    nextBuild: "Core employee safety induction.",
  },
  {
    id: "fire-safety-emergency-evacuation",
    number: "04",
    title: "Fire Safety & Emergency Evacuation",
    shortTitle: "Fire Safety & Evacuation",
    description: "Respond to a developing emergency, choose a safe evacuation route and follow assembly procedures.",
    duration: "6–8 min",
    category: "Emergency scenario",
    difficulty: "Core safety",
    mode: "emergency-scenario",
    modeLabel: "Recognise · Evacuate · Account",
    scenario: "Warehouse emergency",
    accent: "FIRE",
    objectiveSummary: "Use a branching emergency scenario to practise calm, procedure-led evacuation decisions.",
    objectives: [
      "Recognise when emergency action is required.",
      "Follow the alarm and site emergency procedure.",
      "Choose a safe available evacuation route.",
      "Remain accountable at the assembly point until authorized.",
    ],
    metrics: [
      { label: "Decisions", value: "4 emergency stages" },
      { label: "Knowledge check", value: "4 questions" },
      { label: "Interaction", value: "Branching scenario" },
    ],
    nextBuild: "Emergency response awareness scenario.",
  },
  {
    id: "forklift-pedestrian-safety",
    number: "05",
    title: "Forklift & Pedestrian Safety",
    shortTitle: "Forklift & Pedestrian Safety",
    description: "Recognise vehicle–pedestrian conflict points and make safer route, crossing and visibility decisions.",
    duration: "6–8 min",
    category: "Hazard scene",
    difficulty: "Operational",
    mode: "hazard-scene",
    modeLabel: "Observe · Separate · Cross safely",
    scenario: "Warehouse vehicle movement",
    accent: "TRAFFIC",
    objectiveSummary: "Practise safe pedestrian decisions around moving workplace vehicles without implying operator certification.",
    objectives: [
      "Use designated pedestrian routes where provided.",
      "Recognise blind-corner and crossing-point risk.",
      "Avoid assuming a driver has seen you.",
      "Maintain safe separation from moving vehicles and loads.",
    ],
    metrics: [
      { label: "Hazard decisions", value: "4 scenarios" },
      { label: "Knowledge check", value: "4 questions" },
      { label: "Scope", value: "Awareness training" },
    ],
    nextBuild: "Pedestrian safety awareness around workplace vehicles.",
  },
  {
    id: "manual-handling-ergonomics",
    number: "06",
    title: "Manual Handling & Ergonomics",
    shortTitle: "Manual Handling & Ergonomics",
    description: "Assess handling tasks, choose safer methods and reduce unnecessary strain during repetitive work.",
    duration: "5–7 min",
    category: "Decision simulation",
    difficulty: "Core safety",
    mode: "decision-simulation",
    modeLabel: "Assess · Choose · Move safely",
    scenario: "Warehouse handling task",
    accent: "MOVE",
    objectiveSummary: "Use realistic work decisions to reduce avoidable manual-handling and ergonomic risk.",
    objectives: [
      "Assess the load, task, route and environment before handling.",
      "Use equipment or assistance when appropriate.",
      "Avoid unnecessary twisting, overreaching and awkward positions.",
      "Reduce repeated poorly positioned handling where possible.",
    ],
    metrics: [
      { label: "Decisions", value: "4 scenarios" },
      { label: "Knowledge check", value: "4 questions" },
      { label: "Interaction", value: "Decision simulation" },
    ],
    nextBuild: "Manual-handling decision simulation.",
  },
];

export function getTrainingModule(id: string) {
  return trainingModules.find((module) => module.id === id);
}
