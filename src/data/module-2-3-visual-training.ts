export type PremiumVisualModuleSlug = "working-at-height" | "safety-induction";

export type TrainingSceneMode = "VISUAL_INSPECTION" | "DECISION_ONLY";

export type VisualCamera = {
  yaw: number;
  pitch: number;
  fov: number;
};

export type VisualHitRegion =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "polygon";
      points: Array<[number, number]>;
    };

export type VisualInspectionAuthority = {
  x: number;
  y: number;
  width: number;
  height: number;
  hitRegions: VisualHitRegion[];
  tolerance: number;
  label: string;
  actionLabel: string;
  prompt: string;
  wrongMessage: string;
  foundMessage: string;
  clue: string;
  direction: string;
};

export type VisualTrainingStage = {
  code: string;
  mode: TrainingSceneMode;
  label: string;
  title: string;
  principle: string;
  situation: string;
  observationPrompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  positiveFeedback: string;
  reviewFeedback: string;
  learning: string;
  hint: string;
  focusArea: string;
  camera: VisualCamera;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  inspection?: VisualInspectionAuthority;
};

export type VisualTrainingQuestion = {
  code: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type PremiumVisualTrainingModule = {
  slug: PremiumVisualModuleSlug;
  code: string;
  title: string;
  scenarioLabel: string;
  modeLabel: string;
  intro: string;
  assetSrc: string;
  assetLabel: string;
  accentLabel: string;
  exposure: number;
  stages: VisualTrainingStage[];
  quiz: VisualTrainingQuestion[];
};

const workingAtHeight: PremiumVisualTrainingModule = {
  slug: "working-at-height",
  code: "NGL-SAF-WAH",
  title: "Working at Height",
  scenarioLabel: "Elevated work risk assessment",
  modeLabel: "Inspect · Identify · Decide",
  intro:
    "Work through the full work-at-height control lifecycle: challenge the need for exposure, select suitable access, verify the setup and maintain a stable work position.",
  assetSrc: "/panoramas/working-at-height-production-v8.webp",
  assetLabel: "Working at Height training scene",
  accentLabel: "HEIGHT",
  exposure: 1,
  stages: [
    {
      code: "wah-plan",
      mode: "VISUAL_INSPECTION",
      label: "Stage 01 · Planning",
      title: "Decide whether work at height is necessary",
      principle: "Avoid or reduce exposure before selecting access equipment.",
      situation:
        "A maintenance team is assessing an overhead warehouse task before anyone begins elevated work. Access equipment is available, but the task method has not yet been confirmed.",
      observationPrompt:
        "Inspect where the maintenance activity would place a worker relative to normal floor level.",
      question: "What is the strongest first planning decision?",
      options: [
        "Select the most suitable access equipment first, then consider whether the task itself can be changed.",
        "Determine whether the work can be completed from ground level or by another method; if not, plan controlled work at height.",
        "Proceed with the planned elevated method because trained workers and purpose-designed access equipment are available.",
      ],
      correctIndex: 1,
      positiveFeedback:
        "Correct. The task should first be challenged so work at height is avoided or reduced where reasonably practicable.",
      reviewFeedback:
        "Training and suitable equipment do not remove the need to challenge the exposure first. Equipment choice comes after the task method has been reviewed.",
      learning:
        "A professional work-at-height plan starts with the task itself. Only once the need for elevated work is confirmed should the access method and supporting controls be selected.",
      hint:
        "Start with the task itself rather than the equipment that happens to be nearby.",
      focusArea: "Elevated maintenance point above the warehouse floor",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/working-at-height/01-plan.webp",
      imageAlt:
        "Two warehouse safety professionals assessing an overhead maintenance task before elevated work begins.",
      imagePosition: "center center",
      inspection: {
        x: 42,
        y: 17,
        width: 28,
        height: 24,
        hitRegions: [
          {
            type: "polygon",
            points: [
              [42, 17],
              [70, 17],
              [72, 28],
              [63, 35],
              [49, 34],
              [40, 27],
            ],
          },
        ],
        tolerance: 1.8,
        label: "Work-at-height exposure",
        actionLabel: "Click the elevated work exposure",
        prompt:
          "Inspect the planned task and click the part of the scene that creates the work-at-height exposure.",
        wrongMessage:
          "That is not the primary exposure. Focus on where the maintenance work would place the employee relative to floor level.",
        foundMessage:
          "Work-at-height exposure identified. Now decide how the task should be planned before anyone is exposed.",
        clue:
          "Start with the task itself, not with the access equipment.",
        direction:
          "Look at where the maintenance work must be performed above normal floor level.",
      },
    },
    {
      code: "wah-access",
      mode: "VISUAL_INSPECTION",
      label: "Stage 02 · Access",
      title: "Select suitable access equipment",
      principle: "Access equipment must suit the task, duration, position and environment.",
      situation:
        "The task genuinely requires elevated access. A stable work platform is in use, while another access option is also present in the work area.",
      observationPrompt:
        "Compare the actual work position with the different ways the worker could reach it.",
      question: "Which access decision is most appropriate?",
      options: [
        "Use the ladder if the task is brief and another employee can help keep the setup stable.",
        "Use the scissor lift because it is already available, without reassessing the actual work position.",
        "Select access equipment suitable for the required height, duration, work position and supporting conditions.",
      ],
      correctIndex: 2,
      positiveFeedback:
        "Correct. Access equipment should be selected against the real task and environment rather than convenience.",
      reviewFeedback:
        "A convenient or improvised access method does not become suitable simply because the task appears short or another person is available to assist.",
      learning:
        "Equipment selection should consider the required working height, reach, duration, load, supporting surface and whether the worker can maintain a stable position for the task.",
      hint:
        "Compare the task position with the available access methods.",
      focusArea: "Alternative access equipment beside the elevated work position",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/working-at-height/02-access.webp",
      imageAlt:
        "Warehouse technician using a scissor lift for overhead work with a portable ladder visible nearby.",
      imagePosition: "center center",
      inspection: {
        x: 73,
        y: 38,
        width: 20,
        height: 56,
        hitRegions: [
          {
            type: "polygon",
            points: [
              [80, 40],
              [88, 40],
              [93, 91],
              [77, 91],
            ],
          },
        ],
        tolerance: 1.6,
        label: "Unsuitable alternative access option",
        actionLabel: "Click the access concern",
        prompt:
          "Inspect the available access methods and click the condition that could lead to an unsuitable access choice.",
        wrongMessage:
          "That is not the access concern being assessed. Compare the work position with the available ways of reaching it.",
        foundMessage:
          "Access-method risk identified. Now select the control that best matches the actual task.",
        clue:
          "Consider whether the worker can maintain a stable working position.",
        direction:
          "Compare the elevated work platform with the alternative access equipment visible on the right.",
      },
    },
    {
      code: "wah-inspect",
      mode: "VISUAL_INSPECTION",
      label: "Stage 03 · Pre-use inspection",
      title: "Verify the complete setup before use",
      principle: "A pre-use check must cover the equipment and the conditions in which it will be used.",
      situation:
        "The scissor lift is at floor level and the team is carrying out its pre-use inspection before the elevated task is released to start.",
      observationPrompt:
        "Identify a platform access or protection feature that must form part of the pre-use inspection.",
      question: "Which statement best describes an adequate pre-use check?",
      options: [
        "Verify the access equipment, platform protection, controls, supporting conditions and surrounding work/drop area before work begins.",
        "Confirm the platform and required PPE first; the floor and surrounding area can be checked after the worker is elevated.",
        "Rely on the earlier inspection if the same machine is being used and no damage is obvious.",
      ],
      correctIndex: 0,
      positiveFeedback:
        "Correct. A professional pre-use inspection checks both the equipment and the conditions in which it will operate.",
      reviewFeedback:
        "A partial or earlier inspection does not confirm that the current equipment, supporting surface and surrounding work area are ready for use.",
      learning:
        "The pre-use check should verify the equipment condition, platform protection and access, operating controls, wheels/base, supporting conditions and the surrounding area before work begins.",
      hint:
        "Think about the features that keep the worker safely contained and supported.",
      focusArea: "Platform access, guardrail and control area",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/working-at-height/03-inspect.webp",
      imageAlt:
        "Two warehouse workers carrying out a pre-use inspection of a scissor lift at floor level.",
      imagePosition: "center center",
      inspection: {
        x: 29,
        y: 8,
        width: 43,
        height: 42,
        hitRegions: [
          { type: "rect", x: 29, y: 12, width: 17, height: 31 },
          { type: "rect", x: 44, y: 10, width: 18, height: 33 },
          { type: "rect", x: 60, y: 9, width: 16, height: 34 },
        ],
        tolerance: 1.5,
        label: "Platform protection and access inspection point",
        actionLabel: "Click the inspection point",
        prompt:
          "Click a platform access or protection feature that must be included in the pre-use inspection.",
        wrongMessage:
          "That is not the inspection point being assessed. Focus on the platform access, guardrails and control area.",
        foundMessage:
          "Inspection point identified. Now decide what the complete pre-use check must cover.",
        clue:
          "Look at the equipment features that keep the worker contained on the platform.",
        direction:
          "Inspect the platform gate, guardrails and nearby control area.",
      },
    },
    {
      code: "wah-position",
      mode: "VISUAL_INSPECTION",
      label: "Stage 04 · Positioning",
      title: "Respond to unsafe reach",
      principle: "Reposition the work method instead of compensating with an unstable body position.",
      situation:
        "During the elevated task, the work point is beyond a comfortable stable reach from the current platform position.",
      observationPrompt:
        "Inspect the relationship between the worker's body position, guardrails and the overhead work point.",
      question: "What is the safest response?",
      options: [
        "Continue if the reach is brief and another employee is observing the task.",
        "Stop and reposition the access equipment or use a more suitable platform so the work can be completed from a stable position.",
        "Keep the platform where it is and use a spotter to guide the worker through the reach.",
      ],
      correctIndex: 1,
      positiveFeedback:
        "Correct. Repositioning the work method removes the need to overreach and restores a stable work position.",
      reviewFeedback:
        "An observer or handhold does not correct an unstable work position. The setup should be changed.",
      learning:
        "Unsafe reach is a signal that the work method is wrong. The task should be repositioned so the worker can remain inside a stable operating position.",
      hint:
        "Look at the relationship between the worker's body and the work point.",
      focusArea: "Worker upper body and reach toward the overhead service",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/working-at-height/04-position.webp",
      imageAlt:
        "Worker on a scissor lift overreaching toward an overhead service while a colleague observes from floor level.",
      imagePosition: "center center",
      inspection: {
        x: 55,
        y: 2,
        width: 31,
        height: 55,
        hitRegions: [
          {
            type: "polygon",
            points: [
              [53, 10],
              [65, 5],
              [79, 10],
              [83, 26],
              [76, 38],
              [65, 45],
              [56, 40],
              [51, 26],
            ],
          },
        ],
        tolerance: 1.7,
        label: "Unsafe work position",
        actionLabel: "Click the unsafe position",
        prompt:
          "Inspect the worker's position and click the condition that requires the task to be stopped and corrected.",
        wrongMessage:
          "That is not the positioning concern. Focus on whether the worker can complete the task while remaining stable inside the platform.",
        foundMessage:
          "Unsafe positioning identified. Now choose the strongest corrective action.",
        clue:
          "Look at the relationship between the worker's body and the work point.",
        direction:
          "Focus on the elevated worker's upper body and reach toward the overhead service.",
      },
    },
  ],
  quiz: [
    {
      code: "wah-q1",
      question:
        "An elevated maintenance task has been proposed. What should happen before the access method is finalised?",
      options: [
        "Select suitable access equipment first, then consider whether the task itself can be changed.",
        "Determine whether the work at height can be avoided or reduced by changing the task or method.",
        "Proceed with elevated work if a trained worker and inspected equipment are available.",
        "Use the shortest-duration method because brief exposure requires less planning.",
      ],
      correctIndex: 1,
      explanation:
        "The hierarchy starts by challenging the exposure itself. Access equipment is selected only after elevated work is genuinely required.",
    },
    {
      code: "wah-q2",
      question:
        "Which factor set provides the strongest basis for selecting access equipment?",
      options: [
        "The equipment with the highest rated capacity, regardless of the work position.",
        "The required height, task duration, working position, load and supporting conditions.",
        "The equipment the team is most familiar with, provided it has a current inspection.",
        "The equipment that can be set up fastest once an exclusion area is established.",
      ],
      correctIndex: 1,
      explanation:
        "Selection should be matched to the real task and environment. Capacity, familiarity or setup speed alone is not enough.",
    },
    {
      code: "wah-q3",
      question:
        "A lift was inspected earlier but has since been moved to a different work area. What should happen before it is used there?",
      options: [
        "Rely on the earlier inspection if no visible damage occurred during the move.",
        "Check only the worker's PPE because the equipment itself was already inspected.",
        "Recheck the relevant equipment condition and the new supporting and surrounding work conditions before use.",
        "Begin work and stop only if instability or access difficulty becomes apparent.",
      ],
      correctIndex: 2,
      explanation:
        "A pre-use check must reflect the current setup and environment. Moving the equipment can change supporting, access and surrounding conditions.",
    },
    {
      code: "wah-q4",
      question:
        "A worker can reach the task only by leaning beyond a stable working position. What is the appropriate response?",
      options: [
        "Keep the current setup and add a spotter for the difficult part of the task.",
        "Stop and reposition the access method or choose equipment that allows the task to be completed from a stable position.",
        "Allow brief overreach provided both feet remain on the platform floor.",
        "Reduce the time spent reaching by having another worker pass tools from below.",
      ],
      correctIndex: 1,
      explanation:
        "The work method should be changed so the task can be completed from a stable position without overreach.",
    },
  ],
};

const safetyInduction: PremiumVisualTrainingModule = {
  slug: "safety-induction",
  code: "NGL-SAF-IND",
  title: "Nexus Safety Induction",
  scenarioLabel: "Operational safety induction",
  modeLabel: "Prepare · Follow · Respond · Report",
  intro:
    "Complete four practical onboarding situations covering entry requirements, site controls, emergency response and speaking up when something could cause harm.",
  assetSrc: "/panoramas/warehouse-hazard-production-v10.webp",
  assetLabel: "Nexus Safety Induction training scene",
  accentLabel: "CORE",
  exposure: 1,
  stages: [
    {
      code: "induction-entry",
      mode: "VISUAL_INSPECTION",
      label: "Stage 01 · Enter ready",
      title: "Enter the operational area prepared",
      principle: "Understand access, PPE and task requirements before exposure.",
      situation:
        "An employee is approaching the controlled transition into an active warehouse area. Site entry controls and PPE provisions are available before the operational floor begins.",
      observationPrompt:
        "Inspect the transition point between general access and the controlled operational area.",
      question: "What should the employee confirm before entering?",
      options: [
        "Enter once the mandatory area PPE is available; task-specific controls can be confirmed at the work location.",
        "Follow an authorised employee through the access point if they are entering the same operational area.",
        "Confirm site access requirements, mandatory area PPE and any task-specific instructions before proceeding.",
      ],
      correctIndex: 2,
      positiveFeedback:
        "Correct. Entry into an operational area should be deliberate and based on the site's access and protection requirements.",
      reviewFeedback:
        "Seeing other people inside or knowing only the task location does not establish the controls required for safe entry.",
      learning:
        "Before entering an operational area, employees should understand where they are authorised to go, the mandatory area controls and any additional requirements created by the task.",
      hint:
        "Think about the transition from general access into the operational warehouse.",
      focusArea: "Controlled warehouse entry point and access gate",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/safety-induction/01-enter-ready.webp",
      imageAlt:
        "Employee approaching a controlled warehouse entry point beside PPE storage and access gates.",
      imagePosition: "center center",
      inspection: {
        x: 46,
        y: 38,
        width: 42,
        height: 45,
        hitRegions: [
          { type: "rect", x: 48, y: 43, width: 12, height: 37 },
          { type: "rect", x: 57, y: 44, width: 27, height: 36 },
          { type: "rect", x: 82, y: 43, width: 8, height: 37 },
        ],
        tolerance: 1.6,
        label: "Operational entry control",
        actionLabel: "Click the entry control",
        prompt:
          "Before this employee enters the operational area, click the control point where site requirements should be confirmed.",
        wrongMessage:
          "That is not the controlled entry point. Look for the transition between general access and the operational floor.",
        foundMessage:
          "Operational entry point identified. Now decide what the employee must confirm before proceeding.",
        clue:
          "Think about where normal access ends and controlled warehouse entry begins.",
        direction:
          "Look at the access gate and reader system in front of the operational floor.",
      },
    },
    {
      code: "induction-site-controls",
      mode: "VISUAL_INSPECTION",
      label: "Stage 02 · Site controls",
      title: "Follow designated routes and boundaries",
      principle: "Established site controls take priority over convenient shortcuts.",
      situation:
        "A protected pedestrian route runs through an active warehouse aisle while forklift traffic is operating nearby.",
      observationPrompt:
        "Inspect the marked route intended to separate pedestrian movement from vehicle activity.",
      question: "What is the expected behavior when moving through an operational workplace?",
      options: [
        "Take a direct shortcut when no vehicle is currently moving through the area.",
        "Follow designated routes, barriers, crossings and local instructions even when a shortcut appears clear.",
        "Leave the pedestrian route at a clear point after making eye contact with nearby operators.",
      ],
      correctIndex: 1,
      positiveFeedback:
        "Correct. Designated routes and boundaries should be followed even when a shortcut appears temporarily clear.",
      reviewFeedback:
        "Personal judgement that an operational route looks clear is not a substitute for the site's established movement controls.",
      learning:
        "Site controls exist because operational conditions change quickly. Employees should use designated pedestrian routes, barriers and crossings instead of creating their own route.",
      hint:
        "Look for the control designed specifically for pedestrian movement.",
      focusArea: "Protected green pedestrian walkway",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/safety-induction/02-site-controls.webp",
      imageAlt:
        "Warehouse employee moving beside a protected green pedestrian walkway while a forklift operates in the adjacent aisle.",
      imagePosition: "center center",
      inspection: {
        x: 0,
        y: 36,
        width: 43,
        height: 64,
        hitRegions: [
          {
            type: "polygon",
            points: [
              [17, 34],
              [30, 30],
              [45, 100],
              [15, 100],
            ],
          },
        ],
        tolerance: 1.8,
        label: "Designated pedestrian route",
        actionLabel: "Click the designated route",
        prompt:
          "Identify the site control that should determine the employee's route through this operating area.",
        wrongMessage:
          "That is not the designated pedestrian control. Compare the protected route with the open vehicle aisle.",
        foundMessage:
          "Designated pedestrian route identified. Now decide how employees should move through the operational area.",
        clue:
          "Look for the site control created specifically for pedestrian movement.",
        direction:
          "Focus on the protected green route along the left side of the operating aisle.",
      },
    },
    {
      code: "induction-emergency",
      mode: "VISUAL_INSPECTION",
      label: "Stage 03 · Emergency readiness",
      title: "Keep emergency routes immediately usable",
      principle: "Emergency routes must remain clear so evacuation can begin without delay.",
      situation:
        "An emergency exit is visible, but stored pallets are obstructing the route immediately in front of it. The condition could delay or prevent an orderly evacuation.",
      observationPrompt:
        "Inspect the emergency route and identify the condition that prevents it from being immediately usable.",
      question: "What is the strongest response to this condition?",
      options: [
        "Leave the pallets in place if another exit is available and report the issue at the end of the shift.",
        "Keep the route as it is but brief nearby employees to use an alternative door if an alarm occurs.",
        "Have the obstruction removed through the site's authorised process and report or escalate the condition so the emergency route is restored immediately.",
      ],
      correctIndex: 2,
      positiveFeedback:
        "Correct. Emergency routes should be restored immediately rather than relying on alternative behaviour during an actual emergency.",
      reviewFeedback:
        "An alternative exit or verbal warning does not justify leaving a designated emergency route obstructed.",
      learning:
        "Emergency routes must remain clear and immediately usable. If an alarm activates, employees should then follow the site's emergency procedure and proceed to the designated assembly point.",
      hint:
        "Ask whether this route could be used immediately if an alarm activated right now.",
      focusArea: "Pallets obstructing the emergency exit",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/safety-induction/03-emergency.webp",
      imageAlt:
        "Warehouse emergency exit with palletised goods obstructing the route in front of the door.",
      imagePosition: "center center",
      inspection: {
        x: 38,
        y: 20,
        width: 44,
        height: 61,
        hitRegions: [
          {
            type: "polygon",
            points: [
              [40, 27],
              [62, 25],
              [78, 40],
              [77, 78],
              [56, 79],
              [39, 70],
            ],
          },
        ],
        tolerance: 1.8,
        label: "Obstructed emergency route",
        actionLabel: "Click the evacuation concern",
        prompt:
          "An emergency alarm could occur at any time. Click the condition in this scene that could delay evacuation.",
        wrongMessage:
          "That is not the recorded evacuation concern. Inspect whether the emergency route is clear and immediately usable.",
        foundMessage:
          "Emergency-route obstruction identified. Now decide what should happen before an emergency occurs.",
        clue:
          "The route to safety must remain immediately available.",
        direction:
          "Look at the area directly in front of the emergency exit door.",
      },
    },
    {
      code: "induction-reporting",
      mode: "DECISION_ONLY",
      label: "Stage 04 · Report & speak up",
      title: "Report hazards and near misses promptly",
      principle: "A near miss is useful safety information even when nobody is injured.",
      situation:
        "A workplace event has just occurred. Nobody was injured, but a small change in circumstances could reasonably have resulted in harm. The team has stopped and is reviewing what happened.",
      observationPrompt:
        "The event is already known. This stage assesses what should happen next rather than asking you to locate another visual hotspot.",
      question: "What should happen next?",
      options: [
        "No formal report is needed when nobody was injured and no equipment was damaged.",
        "Record the event only if a supervisor believes the same situation is likely to happen again.",
        "Make the area safe where authorised and report the near miss promptly through the approved process.",
      ],
      correctIndex: 2,
      positiveFeedback:
        "Correct. Near-miss reporting allows the organisation to learn and strengthen controls before a similar event causes injury.",
      reviewFeedback:
        "The absence of injury does not make the event unimportant. Near misses reveal weaknesses that should be reviewed before the event repeats.",
      learning:
        "Employees should speak up, make conditions safe within their authority and report hazards, incidents and near misses promptly through the approved process.",
      hint:
        "Consider whether the organisation can learn from an event even when nobody was hurt.",
      focusArea: "Near-miss reporting and safety discussion",
      camera: { yaw: 0, pitch: 0, fov: 90 },
      imageSrc: "/training/safety-induction/04-report.webp",
      imageAlt:
        "Two warehouse employees discussing a safety event and documenting the review on a tablet.",
      imagePosition: "center center",
    },
  ],
  quiz: [
    {
      code: "induction-q1",
      question:
        "Before entering an unfamiliar operational area, what should an employee confirm?",
      options: [
        "Enter with the mandatory PPE and receive any task-specific briefing once at the workstation.",
        "Follow another authorised employee through the access point and confirm local rules later.",
        "Confirm access requirements, mandatory area PPE and task-specific instructions before proceeding.",
        "Enter when no active vehicle movement is visible and review the area requirements inside.",
      ],
      correctIndex: 2,
      explanation:
        "Operational entry should be based on the area's access controls, mandatory protection and the requirements of the task.",
    },
    {
      code: "induction-q2",
      question:
        "A marked pedestrian route is available but a shortcut across an operational area appears clear. What should the employee do?",
      options: [
        "Use the shortcut if no vehicle is currently moving.",
        "Use the designated route and crossing controls.",
        "Leave the route after making eye contact with any nearby operator.",
        "Use barriers and crossings only during periods of heavy vehicle activity.",
      ],
      correctIndex: 1,
      explanation:
        "Designated routes and crossings remain the expected control even when an alternative route appears temporarily clear.",
    },
    {
      code: "induction-q3",
      question:
        "An emergency alarm activates while normal work is underway. What is the appropriate response?",
      options: [
        "Wait for a supervisor to confirm the cause before leaving the work area.",
        "Secure tools and finish the immediate task before responding.",
        "Collect personal belongings if they are close to the normal exit route.",
        "Follow the emergency procedure and proceed to the designated assembly point without unnecessary delay.",
      ],
      correctIndex: 3,
      explanation:
        "Emergency instructions should be followed promptly and orderly without avoidable delay.",
    },
    {
      code: "induction-q4",
      question:
        "A workplace event causes no injury but could reasonably have harmed someone. What should happen?",
      options: [
        "No report is required if nobody was injured and no equipment was damaged.",
        "Keep a note of it and report only if a similar event happens again.",
        "Report the near miss promptly so the circumstances and controls can be reviewed.",
        "Discuss it informally with the team and continue once the area appears normal.",
      ],
      correctIndex: 2,
      explanation:
        "Near misses provide useful information before an injury occurs and should be reported so conditions and controls can be reviewed.",
    },
  ],
};

const modules: Record<PremiumVisualModuleSlug, PremiumVisualTrainingModule> = {
  "working-at-height": workingAtHeight,
  "safety-induction": safetyInduction,
};

export function premiumVisualTrainingModuleFor(slug: PremiumVisualModuleSlug) {
  return modules[slug];
}
