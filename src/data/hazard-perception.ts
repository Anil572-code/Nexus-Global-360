export type Hazard = {
  id: string;
  title: string;
  category: string;
  severity: "Medium" | "High" | "Critical";
  yaw: number;
  pitch: number;
  sceneY: number;
  points: number;
  why: string;
  action: string;
  learning: string;
};

export const hazardPerceptionHazards: Hazard[] = [
  {
    id: "blocked-exit",
    title: "Blocked emergency exit",
    category: "Emergency access",
    severity: "Critical",
    yaw: -145,
    pitch: -5,
    sceneY: 0.55,
    points: 100,
    why: "Stored cartons are obstructing an emergency exit and could delay evacuation when every second matters.",
    action: "Remove the obstruction immediately and keep the full exit route clearly marked and permanently accessible.",
    learning: "Emergency exits and escape routes must remain continuously available; temporary storage is never an acceptable control for an evacuation route.",
  },
  {
    id: "wet-floor",
    title: "Uncontrolled spill",
    category: "Slips and trips",
    severity: "High",
    yaw: 90,
    pitch: -34,
    sceneY: 0.80,
    points: 100,
    why: "Liquid on a pedestrian route creates a slip hazard for employees and can also affect nearby material-handling traffic.",
    action: "Isolate the area, place suitable warning controls and clean the spill using the approved response procedure.",
    learning: "Treat spills as an active exposure: isolate first, warn others, remove the contamination and only reopen the route when it is safe.",
  },
  {
    id: "unstable-stack",
    title: "Unstable stacked load",
    category: "Storage safety",
    severity: "High",
    yaw: 161,
    pitch: -2,
    sceneY: 0.58,
    points: 100,
    why: "The stacked materials present poor load stability and inadequate containment, creating a falling-material risk for people and equipment nearby.",
    action: "Stop access to the immediate area and restack or secure the load so it remains stable within the pallet or racking limits.",
    learning: "Stable storage depends on a level footprint, controlled height and keeping the load inside the pallet or racking envelope.",
  },
  {
    id: "missing-ppe",
    title: "Required PPE missing",
    category: "Personal protection",
    severity: "Medium",
    yaw: -58,
    pitch: -8,
    sceneY: 0.60,
    points: 100,
    why: "The employee is working in an active warehouse operating area without the required high-visibility PPE.",
    action: "Pause the task and ensure the required high-visibility PPE is correctly worn before the employee re-enters the operational area.",
    learning: "PPE is the final protective layer, so designated PPE zones must have clear rules and consistent compliance before work starts.",
  },
  {
    id: "unsafe-lift",
    title: "Unsafe lifting posture",
    category: "Manual handling",
    severity: "High",
    yaw: -124,
    pitch: -12,
    sceneY: 0.66,
    points: 100,
    why: "The worker is reaching and bending through the back while lifting from a low position, increasing musculoskeletal risk.",
    action: "Assess the load first, use a stable stance, bend through the knees, keep the load close and avoid twisting while moving.",
    learning: "Good manual handling starts before the lift: assess the task, reduce the load where possible and keep the movement controlled and close to the body.",
  },
  {
    id: "forklift-conflict",
    title: "Forklift and pedestrian conflict",
    category: "Vehicle movement",
    severity: "Critical",
    yaw: 32,
    pitch: -11,
    sceneY: 0.60,
    points: 100,
    why: "A pedestrian is entering the same movement zone as an operating forklift without effective separation.",
    action: "Separate pedestrian and vehicle routes, use controlled crossings and stop movement whenever safe separation cannot be maintained.",
    learning: "Vehicle-pedestrian safety should rely on separation and controlled crossings rather than expecting either person to simply see or hear the other.",
  },
];

export type HazardQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

export const hazardPerceptionQuestions: HazardQuestion[] = [
  {
    id: "exit-route",
    question: "You discover cartons stored in front of a marked emergency exit. What is the most appropriate immediate action?",
    options: [
      "Leave them until the end of the shift if the door can still open",
      "Move the cartons and restore an unobstructed evacuation route",
      "Add a warning sign and keep the cartons where they are",
      "Ask employees to use a different exit permanently",
    ],
    correct: 1,
    explanation: "Emergency routes need to remain unobstructed and readily usable. The obstruction should be removed rather than managed around.",
  },
  {
    id: "manual-lift",
    question: "Before lifting a heavy package from floor level, what should the worker do first?",
    options: [
      "Lift quickly before fatigue starts",
      "Twist the upper body toward the destination",
      "Assess the load and decide whether help or equipment is required",
      "Keep the legs straight and bend from the waist",
    ],
    correct: 2,
    explanation: "The safest first step is to assess the load, route and capability required before committing to the lift.",
  },
  {
    id: "vehicle-separation",
    question: "Which control most directly reduces forklift and pedestrian collision risk in a busy warehouse?",
    options: [
      "Increasing forklift speed so routes clear faster",
      "Separating vehicle and pedestrian routes with controlled crossing points",
      "Relying on pedestrians to listen for the forklift",
      "Allowing crossing anywhere when visibility appears clear",
    ],
    correct: 1,
    explanation: "Physical or procedural separation with controlled crossings is stronger than relying only on individual awareness.",
  },
];
