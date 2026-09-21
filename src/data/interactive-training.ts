export type InteractiveModuleSlug =
  | "working-at-height"
  | "safety-induction"
  | "fire-safety-emergency-evacuation"
  | "forklift-pedestrian-safety"
  | "manual-handling-ergonomics";

export type InteractiveStage = {
  code: string;
  label: string;
  title: string;
  situation: string;
  question: string;
  options: string[];
  recommendedIndex: number;
  positiveFeedback: string;
  reviewFeedback: string;
  principle: string;
};

export type InteractiveQuizQuestion = {
  code: string;
  question: string;
  options: string[];
};

export type InteractiveTrainingModule = {
  slug: InteractiveModuleSlug;
  code: string;
  contentType: string;
  theme: "height" | "core" | "fire" | "traffic" | "manual";
  scenarioLabel: string;
  stageIntro: string;
  stages: InteractiveStage[];
  quiz: InteractiveQuizQuestion[];
};

export const interactiveTrainingModules: Record<InteractiveModuleSlug, InteractiveTrainingModule> = {
  "working-at-height": {
    slug: "working-at-height",
    code: "NGL-SAF-002",
    contentType: "Risk decision",
    theme: "height",
    scenarioLabel: "Elevated maintenance task",
    stageIntro: "Assess the job before work begins. The scenario is awareness training and does not replace site-specific permits, competent-person requirements or task procedures.",
    stages: [
      {
        code: "wah-plan",
        label: "01 · Plan",
        title: "Decide whether work at height is necessary",
        situation: "A maintenance check is requested above normal floor level. The task has not yet started.",
        question: "What is the most appropriate first approach?",
        options: [
          "Start immediately because the task is expected to be short.",
          "Assess whether the work can be avoided at height and plan a suitable method before starting.",
          "Use the nearest ladder without reviewing the task conditions.",
          "Ask a colleague to watch while the work is completed quickly.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Good decision. Planning starts by considering whether exposure to work-at-height risk can be avoided or reduced.",
        reviewFeedback: "Review the planning principle before continuing. Short duration does not remove the need to assess the task and choose a suitable method.",
        principle: "Avoid or reduce work at height where reasonably practicable, then plan and select suitable controls for the actual task.",
      },
      {
        code: "wah-access",
        label: "02 · Access",
        title: "Select suitable access equipment",
        situation: "The task requires both hands and several minutes of stable work at an elevated position.",
        question: "Which decision best reflects a controlled approach?",
        options: [
          "Use any portable ladder because it is quicker to position.",
          "Stand on stored materials to reduce setup time.",
          "Select stable access equipment suited to the task, duration and work environment.",
          "Ask another employee to hold the worker in position.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct principle. Access equipment should suit the task, duration, conditions and required work position.",
        reviewFeedback: "Convenience is not the selection criterion. Choose access equipment based on the task and risk conditions.",
        principle: "Use suitable, stable access equipment and follow the site procedure for its inspection and use.",
      },
      {
        code: "wah-inspect",
        label: "03 · Inspect",
        title: "Check the setup before use",
        situation: "The access equipment is in position, but work has not started.",
        question: "What should happen next?",
        options: [
          "Check condition, footing, access, edge/fall controls, the area below and relevant environmental conditions.",
          "Begin work and stop only if a problem becomes visible.",
          "Check only that the equipment reaches the task.",
          "Ask another worker whether the equipment looked safe yesterday.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Good. A pre-use and work-area check helps identify conditions that could make the planned method unsafe.",
        reviewFeedback: "A suitable setup must be checked before use, not only after a problem appears.",
        principle: "Inspect the equipment and surrounding work area according to site requirements before starting.",
      },
      {
        code: "wah-position",
        label: "04 · Position",
        title: "Respond to unsafe reach",
        situation: "During the task, the worker cannot comfortably reach the final work point from the current position.",
        question: "What is the safest decision?",
        options: [
          "Lean farther while keeping one hand on the equipment.",
          "Stop and reposition or change the access method before continuing.",
          "Stand on the highest available step to gain extra reach.",
          "Ask a colleague to hold the equipment while the worker overreaches.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. If the work position becomes unsafe, stop and restore a suitable work position rather than extending beyond the safe setup.",
        reviewFeedback: "Overreaching changes the stability and work position. Reposition or change the method instead.",
        principle: "Maintain a stable working position and stop when the planned method no longer provides safe access.",
      },
    ],
    quiz: [
      { code: "wah-q1", question: "What should be considered before choosing work-at-height equipment?", options: ["Only equipment availability", "The task, duration, conditions and required work position", "Only the height of the task", "Only how quickly the job can be completed"] },
      { code: "wah-q2", question: "What should happen if the worker cannot safely reach the task?", options: ["Stop and reposition or change the method", "Lean farther for a short period", "Stand on nearby materials", "Continue if another person is watching"] },
      { code: "wah-q3", question: "Which statement best describes a pre-use check?", options: ["It is needed only after equipment damage is reported", "It only checks whether the equipment reaches", "It considers equipment condition and the surrounding work area", "It can be replaced by yesterday's inspection"] },
      { code: "wah-q4", question: "What is the core planning principle for work at height?", options: ["Always use a ladder first", "Avoid or reduce the need to work at height where reasonably practicable", "Work quickly to reduce exposure time", "Use the same method for every task"] },
    ],
  },

  "safety-induction": {
    slug: "safety-induction",
    code: "NGL-SAF-003",
    contentType: "Core learning",
    theme: "core",
    scenarioLabel: "New employee induction",
    stageIntro: "Build the safety habits expected across Nexus operations. Site procedures and supervisor instructions remain authoritative for the specific workplace.",
    stages: [
      {
        code: "induction-responsibility",
        label: "01 · Responsibility",
        title: "Recognise and report a workplace hazard",
        situation: "You notice damaged packaging partially obstructing a marked pedestrian route.",
        question: "What should you do?",
        options: [
          "Ignore it because another team may be responsible.",
          "Follow site procedure to make the situation safe where authorized and report the hazard promptly.",
          "Walk around it and continue without reporting.",
          "Move it only if nobody is watching.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Safety responsibility includes recognising, controlling where authorized and reporting unsafe conditions.",
        reviewFeedback: "Walking around a hazard does not remove the risk to other people. Follow the reporting and control process.",
        principle: "Recognise hazards, take only authorized immediate controls and report them through the defined workplace process.",
      },
      {
        code: "induction-emergency",
        label: "02 · Emergency",
        title: "Respond to an alarm",
        situation: "The site emergency alarm activates while you are working.",
        question: "What is the appropriate response?",
        options: [
          "Follow the site emergency procedure and proceed to the designated safe assembly process.",
          "Wait until someone personally confirms there is an emergency.",
          "Finish the current task before leaving.",
          "Use any route even if it conflicts with emergency instructions.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Good. Emergency response should follow the site's established alarm, evacuation and assembly procedure.",
        reviewFeedback: "Do not delay an emergency response to finish routine work. Follow the site procedure.",
        principle: "Know the alarm, evacuation route, assembly arrangement and who provides emergency direction at your site.",
      },
      {
        code: "induction-ppe",
        label: "03 · PPE",
        title: "Follow task and area PPE requirements",
        situation: "You are asked to enter an operational area with posted PPE requirements.",
        question: "What should guide your PPE decision?",
        options: [
          "What other employees happen to be wearing.",
          "Personal preference if the visit is brief.",
          "The task, area rules and site risk-control requirements.",
          "Whether a supervisor is currently nearby.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct. PPE requirements come from the task, area and risk-control rules, not personal preference.",
        reviewFeedback: "A short visit does not automatically remove PPE requirements. Follow the posted and task-specific controls.",
        principle: "Use the PPE required by the task, work area and site risk controls, and report damaged or unsuitable PPE.",
      },
      {
        code: "induction-reporting",
        label: "04 · Reporting",
        title: "Report incidents and near misses",
        situation: "A load shifts unexpectedly but nobody is injured and no property is damaged.",
        question: "What is the professional response?",
        options: [
          "Do nothing because there was no injury.",
          "Report the near miss through the site process so the underlying risk can be reviewed.",
          "Mention it informally only if it happens again.",
          "Record it only at the end of the month.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Near misses provide useful information before a more serious event occurs.",
        reviewFeedback: "The absence of injury does not make the event irrelevant. Near misses should be reported according to site procedure.",
        principle: "Prompt reporting supports investigation, corrective action and prevention.",
      },
    ],
    quiz: [
      { code: "induction-q1", question: "What should you do when you identify an unsafe condition?", options: ["Follow the authorized control/reporting process", "Ignore it if it is outside your task", "Wait until the next safety meeting", "Only tell a coworker"] },
      { code: "induction-q2", question: "What determines required PPE?", options: ["Personal preference", "How long the task will take", "Task, area and risk-control requirements", "What was worn on a previous shift"] },
      { code: "induction-q3", question: "Why should a near miss be reported?", options: ["Only to record employee performance", "It can reveal risk before a more serious event occurs", "Only when equipment is damaged", "It is optional when nobody is injured"] },
      { code: "induction-q4", question: "What should you do when the emergency alarm activates?", options: ["Follow the site emergency and evacuation procedure", "Wait for a personal confirmation", "Complete the current task first", "Leave by any route regardless of instructions"] },
    ],
  },

  "fire-safety-emergency-evacuation": {
    slug: "fire-safety-emergency-evacuation",
    code: "NGL-SAF-004",
    contentType: "Emergency scenario",
    theme: "fire",
    scenarioLabel: "Warehouse emergency",
    stageIntro: "Practise evacuation awareness. Always follow the emergency arrangements, alarms and instructions established for your site.",
    stages: [
      {
        code: "fire-recognise",
        label: "01 · Recognise",
        title: "Respond to signs of fire",
        situation: "Smoke is noticed near a storage area while employees are working nearby.",
        question: "What is the correct priority?",
        options: [
          "Raise/communicate the emergency according to site procedure and begin the required evacuation response.",
          "Investigate alone before telling anyone.",
          "Continue working until flames are visible.",
          "Open nearby doors to find the source.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Promptly following the site's alarm and emergency procedure is the priority.",
        reviewFeedback: "Do not delay the emergency response to investigate independently. Follow the site's alarm and evacuation arrangements.",
        principle: "Recognise the emergency, raise the alarm through the defined process and follow site instructions.",
      },
      {
        code: "fire-route",
        label: "02 · Evacuate",
        title: "Choose a safe available route",
        situation: "Your usual exit route is affected by smoke. An alternative designated exit remains available.",
        question: "What should you do?",
        options: [
          "Use the usual route because it is familiar.",
          "Wait inside until the smoke clears.",
          "Use the available safe designated route in accordance with the emergency procedure.",
          "Use a lift to leave more quickly.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Good. Use the safe available designated route and follow emergency instructions.",
        reviewFeedback: "A familiar route should not be used when conditions make it unsafe. Follow the safe designated alternative.",
        principle: "Know alternative evacuation routes and never enter a route that has become unsafe.",
      },
      {
        code: "fire-assist",
        label: "03 · Evacuate safely",
        title: "Maintain an orderly evacuation",
        situation: "People are moving toward the exit and one employee wants to return for personal belongings.",
        question: "Which response best supports a safe evacuation?",
        options: [
          "Let them return if they know where the item is.",
          "Continue evacuation and follow the site's arrangements rather than returning for belongings.",
          "Stop the evacuation until the item is collected.",
          "Send another person back instead.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Do not delay evacuation for belongings or re-enter an affected area.",
        reviewFeedback: "Personal belongings are not a reason to interrupt or reverse an emergency evacuation.",
        principle: "Leave promptly, support an orderly evacuation and do not re-enter unless authorized.",
      },
      {
        code: "fire-assembly",
        label: "04 · Account",
        title: "Complete the assembly process",
        situation: "You have reached the designated assembly point.",
        question: "What should happen next?",
        options: [
          "Remain available for accountability and wait for authorized instructions before leaving or re-entering.",
          "Go home immediately because you are outside.",
          "Return inside if the smoke appears to have stopped.",
          "Move to another area without telling anyone.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Assembly and accountability are part of the emergency process.",
        reviewFeedback: "Reaching the outside is not the end of the emergency procedure. Remain available for accountability and instructions.",
        principle: "Report to the designated assembly process and do not re-enter until authorized.",
      },
    ],
    quiz: [
      { code: "fire-q1", question: "What is the safest response when your usual evacuation route is unsafe?", options: ["Wait inside indefinitely", "Use a safe designated alternative according to the emergency procedure", "Use a lift", "Return to your work area"] },
      { code: "fire-q2", question: "What should happen after reaching the assembly point?", options: ["Remain for accountability and instructions", "Leave without telling anyone", "Re-enter when it looks clear", "Return for belongings"] },
      { code: "fire-q3", question: "What should you do if you notice signs of a possible fire?", options: ["Investigate alone first", "Continue working until flames appear", "Follow the site's alarm/emergency procedure promptly", "Open doors to locate the source"] },
      { code: "fire-q4", question: "Which statement best describes re-entry?", options: ["Re-enter once personal belongings are needed", "Do not re-enter until authorized under the site emergency process", "Re-enter if another employee does", "Re-entry is always allowed after five minutes"] },
    ],
  },

  "forklift-pedestrian-safety": {
    slug: "forklift-pedestrian-safety",
    code: "NGL-SAF-005",
    contentType: "Hazard scene",
    theme: "traffic",
    scenarioLabel: "Warehouse vehicle movement",
    stageIntro: "This is pedestrian safety awareness, not forklift-operator certification. Follow site traffic-management rules at all times.",
    stages: [
      {
        code: "forklift-walkway",
        label: "01 · Separate",
        title: "Use the pedestrian route",
        situation: "A marked pedestrian walkway runs beside an active forklift route.",
        question: "Which choice best controls pedestrian exposure?",
        options: [
          "Remain within the designated pedestrian route and follow site crossings.",
          "Walk in the vehicle lane when it looks quiet.",
          "Take the shortest route between parked pallets.",
          "Follow closely behind a forklift because the driver knows you are there.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Separation and designated pedestrian routes reduce unnecessary vehicle–pedestrian interaction.",
        reviewFeedback: "Do not trade separation for convenience. Use the pedestrian route and defined crossings.",
        principle: "Maintain physical and procedural separation between pedestrians and workplace vehicles wherever provided.",
      },
      {
        code: "forklift-crossing",
        label: "02 · Cross",
        title: "Cross an active vehicle route",
        situation: "You need to cross a route used by forklifts. A designated crossing point is available.",
        question: "What is the safest approach?",
        options: [
          "Cross immediately if the forklift is moving slowly.",
          "Assume the driver will stop because you are at the crossing.",
          "Use the designated crossing, check that movement is controlled and cross only when it is safe.",
          "Walk behind a moving forklift because it is facing away from you.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Good. A crossing point still requires attention to vehicle movement and visibility.",
        reviewFeedback: "A marked crossing does not automatically make the route clear. Confirm it is safe before crossing.",
        principle: "Use designated crossing points and never assume a driver has seen you.",
      },
      {
        code: "forklift-visibility",
        label: "03 · Visibility",
        title: "Approach a blind corner",
        situation: "Racking blocks your view of vehicle traffic around a warehouse corner.",
        question: "What should you do?",
        options: [
          "Step into the vehicle route to get a better view.",
          "Slow/stop at the protected pedestrian position, use the site's visibility controls and proceed only when safe.",
          "Listen for engine noise and cross if you hear nothing.",
          "Follow another pedestrian without checking.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Blind corners require deliberate visibility and crossing controls.",
        reviewFeedback: "Sound alone is not a reliable indication that the route is clear.",
        principle: "Treat restricted visibility as a hazard and use the site's mirrors, crossings, barriers and other traffic controls.",
      },
      {
        code: "forklift-load",
        label: "04 · Distance",
        title: "Stay clear of moving loads",
        situation: "A forklift is travelling with a load that limits the driver's view.",
        question: "Which pedestrian action is appropriate?",
        options: [
          "Maintain safe separation and wait until the vehicle movement is controlled before entering the area.",
          "Walk beside the forklift to guide it without being asked.",
          "Move close to the load so the driver can see you.",
          "Pass underneath or beside raised handling equipment if there is space.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Keep clear of vehicle movement and loads, especially where visibility is restricted.",
        reviewFeedback: "Do not enter the operating envelope of moving vehicles or loads.",
        principle: "Maintain safe distance and follow the traffic-management system rather than relying on driver awareness alone.",
      },
    ],
    quiz: [
      { code: "forklift-q1", question: "What is the safest assumption around a workplace vehicle?", options: ["The driver always sees pedestrians", "A marked route removes all risk", "Do not assume the driver has seen you", "Slow-moving vehicles can be approached closely"] },
      { code: "forklift-q2", question: "What should you do at a blind corner?", options: ["Enter the route to check", "Use the site's visibility/crossing controls and proceed only when safe", "Rely only on engine noise", "Follow the person ahead"] },
      { code: "forklift-q3", question: "Why are designated pedestrian routes important?", options: ["They help separate pedestrians from vehicle movement", "They allow faster walking", "They replace the need for attention", "They are only for visitors"] },
      { code: "forklift-q4", question: "What should a pedestrian do near a moving load?", options: ["Walk alongside it", "Move closer so the driver notices", "Maintain safe separation until movement is controlled", "Pass beside raised equipment"] },
    ],
  },

  "manual-handling-ergonomics": {
    slug: "manual-handling-ergonomics",
    code: "NGL-SAF-006",
    contentType: "Decision simulation",
    theme: "manual",
    scenarioLabel: "Warehouse handling task",
    stageIntro: "Assess the task before moving the load. The right method depends on the load, route, environment, available equipment and local procedure.",
    stages: [
      {
        code: "manual-assess",
        label: "01 · Assess",
        title: "Assess the handling task",
        situation: "A carton must be moved from receiving to storage. Its weight and stability are not yet clear.",
        question: "What should happen before lifting?",
        options: [
          "Lift immediately to judge the weight.",
          "Assess the load, route, destination, grip, environment and available assistance/equipment.",
          "Ask someone else to lift it without assessment.",
          "Drag the carton to avoid lifting.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. A task assessment comes before choosing the handling method.",
        reviewFeedback: "Do not use the lift itself as the assessment. Check the task and available controls first.",
        principle: "Assess the task, individual capability, load and environment before deciding how the item should be moved.",
      },
      {
        code: "manual-aid",
        label: "02 · Choose",
        title: "Choose a safer handling method",
        situation: "A suitable handling aid is available and the route allows it to be used.",
        question: "What is the preferred approach?",
        options: [
          "Use the suitable handling aid according to site procedure.",
          "Lift manually because it may be faster.",
          "Carry two items at once to reduce trips.",
          "Move the load by twisting it across the floor.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Good. Appropriate handling equipment can reduce unnecessary manual effort and exposure.",
        reviewFeedback: "Where suitable handling equipment is provided and appropriate, use it according to the workplace procedure.",
        principle: "Avoid unnecessary manual handling and use suitable aids or assistance where appropriate.",
      },
      {
        code: "manual-position",
        label: "03 · Position",
        title: "Avoid poor body position",
        situation: "The load is being placed onto storage behind and to the side of the worker.",
        question: "Which decision best reduces avoidable strain?",
        options: [
          "Keep the feet fixed and twist the upper body.",
          "Reach farther so the task ends sooner.",
          "Reposition the feet/body and work area so the movement can be completed without unnecessary twisting or overreach.",
          "Place the load from the current position regardless of reach.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct. Repositioning the body or work setup can avoid unnecessary twisting and overreaching.",
        reviewFeedback: "Do not force the body to compensate for poor positioning. Change the position or setup.",
        principle: "Use a stable position and keep the movement controlled; redesign or reposition the task when practicable.",
      },
      {
        code: "manual-repeat",
        label: "04 · Ergonomics",
        title: "Reduce repetitive poor handling",
        situation: "Small packages are repeatedly picked from floor level for several hours.",
        question: "What is the best improvement to consider?",
        options: [
          "Work faster so exposure time is shorter.",
          "Adjust the work setup, height, flow or equipment to reduce repeated low-level handling where practicable.",
          "Keep the arrangement because each package is light.",
          "Alternate hands without changing the work setup.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Repeated handling can still create strain even when individual items are light.",
        reviewFeedback: "Low individual weight does not remove the effect of repetition and poor working height.",
        principle: "Consider frequency, posture and work design—not only the weight of a single item.",
      },
    ],
    quiz: [
      { code: "manual-q1", question: "What should happen before deciding how to move a load?", options: ["Assess the task, load, route and available controls", "Lift it once to test the weight", "Always use a team lift", "Always move it manually"] },
      { code: "manual-q2", question: "What is a good response when a suitable handling aid is available?", options: ["Ignore it if manual lifting is quicker", "Use it only for very heavy items", "Use the appropriate aid according to site procedure", "Carry more items at once"] },
      { code: "manual-q3", question: "What can reduce unnecessary twisting?", options: ["Moving faster", "Repositioning the feet/body or work setup", "Holding the load farther away", "Keeping the feet fixed"] },
      { code: "manual-q4", question: "Why can repeated handling of light items still matter?", options: ["Frequency and poor posture can contribute to strain", "Light items never create handling risk", "Only single heavy lifts matter", "Repetition automatically improves technique"] },
    ],
  },
};

export function interactiveTrainingModuleFor(slug: string): InteractiveTrainingModule | undefined {
  return interactiveTrainingModules[slug as InteractiveModuleSlug];
}
