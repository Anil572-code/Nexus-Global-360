export type HeightRisk = {
  id: string;
  title: string;
  category: string;
  severity: "Medium" | "High" | "Critical";
  yaw: number;
  pitch: number;
  sceneY: number;
  why: string;
  learning: string;
  controlPrompt: string;
  controls: string[];
  correctControl: number;
  controlExplanation: string;
};

export const workingAtHeightRisks: HeightRisk[] = [
  {
    id: "open-edge",
    title: "Unprotected mezzanine edge",
    category: "Edge protection",
    severity: "Critical",
    yaw: 149,
    pitch: 12,
    sceneY: 0.17,
    why: "The elevated work platform has an exposed edge where a person could fall to the warehouse floor below.",
    learning: "Collective edge protection should be in place wherever people can approach an exposed elevated edge.",
    controlPrompt: "What is the strongest immediate control before work continues?",
    controls: [
      "Tell the worker to stay at least one step away from the edge",
      "Install compliant edge protection or prevent access until protection is in place",
      "Place a warning cone on the floor below",
    ],
    correctControl: 1,
    controlExplanation: "Preventing access or providing suitable edge protection controls the fall exposure at source rather than relying only on worker behaviour.",
  },
  {
    id: "ladder-angle",
    title: "Unsafe ladder setup",
    category: "Access equipment",
    severity: "High",
    yaw: 108,
    pitch: -10,
    sceneY: 0.56,
    why: "The portable ladder is set on an uneven surface and at an unstable angle, increasing the chance of movement or loss of balance.",
    learning: "Portable access equipment must be suitable for the task, positioned on a stable surface and secured where necessary.",
    controlPrompt: "What should happen before the ladder is used?",
    controls: [
      "Ask another employee to hold it while the worker climbs quickly",
      "Reposition and secure the ladder on a stable surface, or use safer access equipment",
      "Use the ladder only for short tasks under five minutes",
    ],
    correctControl: 1,
    controlExplanation: "The equipment must be stable and suitable before use. Holding an unsafe setup or relying on short duration does not remove the fall risk.",
  },
  {
    id: "top-rung",
    title: "Worker overreaching from ladder",
    category: "Work positioning",
    severity: "Critical",
    yaw: 157,
    pitch: 14,
    sceneY: 0.19,
    why: "The worker is positioned too high on the ladder and reaching sideways, moving their centre of gravity outside a stable position.",
    learning: "The worker should maintain stable contact and reposition access equipment rather than overreach from height.",
    controlPrompt: "What is the safest response?",
    controls: [
      "Continue if the worker keeps one hand on the ladder",
      "Move the ladder closer or use a suitable platform so the task can be completed without overreaching",
      "Ask a colleague below to guide the worker verbally",
    ],
    correctControl: 1,
    controlExplanation: "The task should be repositioned so the worker can remain stable. Overreaching should not be accepted as part of the method.",
  },
  {
    id: "loose-tools",
    title: "Loose tools near an elevated edge",
    category: "Falling objects",
    severity: "High",
    yaw: 132,
    pitch: 3,
    sceneY: 0.66,
    why: "Tools and small materials are unsecured close to an elevated edge and could fall onto people or equipment below.",
    learning: "Work at height planning must control both people falling and objects falling from the work area.",
    controlPrompt: "Which control best addresses this risk?",
    controls: [
      "Move pedestrians slightly further from the platform",
      "Secure tools and materials, use suitable containment, and control the area below",
      "Warn workers below to look upward regularly",
    ],
    correctControl: 1,
    controlExplanation: "Securing the items and controlling the drop zone provides a stronger control than relying on awareness below.",
  },
  {
    id: "open-gate",
    title: "Access gate left open",
    category: "Platform access",
    severity: "Critical",
    yaw: 126,
    pitch: 8,
    sceneY: 0.39,
    why: "The self-closing access gate to the elevated platform is left open, creating a direct fall opening at the access point.",
    learning: "Access openings should return to a protected condition immediately after entry or exit.",
    controlPrompt: "What should be done before work continues?",
    controls: [
      "Close and secure the gate and verify the access point returns to a protected condition",
      "Place a warning sign beside the open gate",
      "Allow access only to experienced workers",
    ],
    correctControl: 0,
    controlExplanation: "The opening itself must be controlled. Experience and warning signs do not replace physical protection at an exposed access point.",
  },
  {
    id: "drop-zone",
    title: "Pedestrian inside the drop zone",
    category: "Area control",
    severity: "High",
    yaw: 145,
    pitch: -27,
    sceneY: 0.73,
    why: "A pedestrian route passes directly beneath active elevated work with no effective exclusion zone.",
    learning: "The area below elevated work should be controlled when there is any credible risk of falling tools, materials or debris.",
    controlPrompt: "What is the best control?",
    controls: [
      "Create and enforce an exclusion zone or reroute pedestrians away from the work below",
      "Ask the pedestrian to walk faster through the area",
      "Rely on the worker above to shout a warning if something falls",
    ],
    correctControl: 0,
    controlExplanation: "Separating people from the potential drop zone removes the exposure rather than relying on reaction after an object falls.",
  },
];

export type HeightQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

export const workingAtHeightQuestions: HeightQuestion[] = [
  {
    id: "edge-control",
    question: "An elevated work area has an exposed edge next to the task. Which approach provides the strongest control?",
    options: [
      "Remind workers to avoid the edge",
      "Provide suitable edge protection or prevent access until it is installed",
      "Mark the floor below with tape",
      "Reduce the task duration",
    ],
    correct: 1,
    explanation: "Controlling the exposed edge itself is stronger than relying on reminders, floor markings or short exposure time.",
  },
  {
    id: "ladder-use",
    question: "A ladder cannot be positioned securely enough for the task. What should the worker do?",
    options: [
      "Use it carefully with a colleague watching",
      "Use alternative suitable access equipment rather than proceed with an unstable setup",
      "Climb only halfway up",
      "Work faster to reduce exposure time",
    ],
    correct: 1,
    explanation: "If safe positioning cannot be achieved, the task should use a more suitable access method instead of accepting an unstable setup.",
  },
  {
    id: "falling-objects",
    question: "Which action best controls the risk of tools falling from an elevated work platform?",
    options: [
      "Secure or contain the tools and control access below",
      "Ask workers below to wear high-visibility clothing",
      "Place the tools closer to the edge so they are easy to reach",
      "Allow pedestrians through if they look up first",
    ],
    correct: 0,
    explanation: "Securing tools and controlling the area below addresses both the source of the falling-object risk and exposure to it.",
  },
];
