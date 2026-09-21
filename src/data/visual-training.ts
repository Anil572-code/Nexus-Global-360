export type VisualTrainingSlug =
  | "fire-safety-emergency-evacuation"
  | "forklift-pedestrian-safety"
  | "manual-handling-ergonomics";

export type VisualInteraction = "context" | "hotspot";

export type VisualHotspotPoint = {
  x: number;
  y: number;
};

export type VisualHotspotRegion = {
  points: VisualHotspotPoint[];
};

export type VisualStage = {
  code: string;
  label: string;
  title: string;
  situation: string;
  principle: string;
  image: string;
  imageAlt: string;
  interaction: VisualInteraction;
  hotspot?: {
    x: number;
    y: number;
    radius: number;
    regions?: VisualHotspotRegion[];
    foundTitle: string;
    foundCopy: string;
  };
  question: string;
  options: string[];
  recommendedIndex: number;
  positiveFeedback: string;
  reviewFeedback: string;
};

export type VisualQuizQuestion = {
  code: string;
  question: string;
  options: string[];
};

export type VisualTrainingModule = {
  slug: VisualTrainingSlug;
  code: string;
  contentType: string;
  scenarioLabel: string;
  stageIntro: string;
  stages: VisualStage[];
  quiz: VisualQuizQuestion[];
};

export const visualTrainingModules: Record<VisualTrainingSlug, VisualTrainingModule> = {
  "fire-safety-emergency-evacuation": {
    slug: "fire-safety-emergency-evacuation",
    code: "NGL-SAF-004",
    contentType: "Emergency response simulation",
    scenarioLabel: "Warehouse fire & evacuation",
    stageIntro: "Recognise early warning signs, protect emergency access and escape routes, evacuate without delay, and complete the site's assembly and accountability process. Site alarms, emergency plans and authorised instructions remain the operational authority.",
    stages: [
      {
        code: "fire-recognise",
        label: "01 · Recognise",
        title: "Recognise the developing fire risk",
        situation: "Light smoke is developing beside stored combustible materials while normal warehouse activity is still underway.",
        principle: "Treat smoke or another credible fire warning as an emergency signal. Follow the site's alarm and reporting procedure promptly rather than delaying to investigate alone.",
        image: "/training-scenes/pro/fire/01-developing-fire-risk.png",
        imageAlt: "Realistic warehouse electrical or charging area showing early smoke beside combustible storage while a worker notices the developing condition.",
        interaction: "context",
        question: "What is the safest immediate response to this developing condition?",
        options: [
          "Raise the alarm or follow the site's emergency reporting procedure immediately and move to safety.",
          "Continue working until visible flames appear.",
          "Move the smoking equipment deeper into the storage area.",
          "Investigate alone before telling anyone.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Treat smoke as an early emergency warning, communicate the emergency promptly and preserve a safe escape route.",
        reviewFeedback: "Do not delay notification to investigate independently. Early alarm and the site's emergency procedure take priority.",
      },
      {
        code: "fire-route",
        label: "02 · Access",
        title: "Keep emergency equipment accessible",
        situation: "A marked fire point is visible, but stored materials obstruct immediate access to the emergency equipment.",
        principle: "Emergency equipment must remain readily accessible before an incident occurs. Visibility alone is not enough when access is obstructed.",
        image: "/training-scenes/pro/fire/02-blocked-fire-point.png",
        imageAlt: "Realistic warehouse fire point with extinguisher access obstructed by palletised stock and stored materials.",
        interaction: "context",
        question: "What should be done about this fire point before an emergency occurs?",
        options: [
          "Leave the obstruction because the equipment can still be seen.",
          "Move the equipment somewhere unmarked so it is easier to reach.",
          "Remove the obstruction and keep the marked fire point immediately accessible.",
          "Wait until an emergency before clearing the area.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct. Emergency equipment should remain immediately accessible and the marked fire point should not be used for storage.",
        reviewFeedback: "Visible equipment is not sufficient if access is obstructed. Keep the marked fire point clear at all times.",
      },
      {
        code: "fire-assist",
        label: "03 · Evacuate",
        title: "Protect the evacuation route",
        situation: "Materials are reducing the width of a designated emergency escape route leading toward an exit.",
        principle: "Emergency escape routes must remain clear and usable before an incident. Do not rely on people squeezing around stored materials during evacuation.",
        image: "/training-scenes/pro/fire/03-blocked-evacuation-route.png",
        imageAlt: "Realistic warehouse emergency exit route with stored materials obstructing part of the designated escape path.",
        interaction: "context",
        question: "What is the safest response to this obstructed evacuation route?",
        options: [
          "Leave it if there is still enough room for one person to pass.",
          "Clear the obstruction promptly and keep the full designated evacuation route available.",
          "Move the materials only after an alarm sounds.",
          "Tell employees to use whichever route appears shortest during an emergency.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Escape routes should be fully available before an emergency begins, not cleared after evacuation is already required.",
        reviewFeedback: "An emergency route should not depend on people squeezing around stored materials. Remove the obstruction and preserve the designated escape path.",
      },
      {
        code: "fire-assembly",
        label: "04 · Account",
        title: "Complete the evacuation safely",
        situation: "Employees have evacuated toward the designated assembly area while one person considers returning to the building for personal belongings.",
        principle: "Evacuation includes accountability. Proceed to the designated assembly point, follow site instructions and do not re-enter unless authorised under the emergency procedure.",
        image: "/training-scenes/pro/fire/04-assembly-accountability.png",
        imageAlt: "Realistic warehouse evacuation scene with employees moving toward the designated outdoor assembly area while one person turns back toward the building.",
        interaction: "context",
        question: "What should an employee do after evacuating the building?",
        options: [
          "Proceed to the designated assembly or accountability point and follow authorised instructions.",
          "Return inside for belongings if smoke appears limited.",
          "Leave the site immediately without reporting to anyone.",
          "Wait near the entrance to watch the incident.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Report to the designated assembly process, remain available for accountability and do not re-enter unless authorised.",
        reviewFeedback: "Reaching the outside is not the end of the emergency procedure. Complete the site's assembly and accountability process.",
      },
    ],
    quiz: [
      {
        code: "fire-q1",
        question: "Why must fire points and emergency equipment remain unobstructed?",
        options: [
          "So the area looks organised.",
          "So trained responders can reach the equipment immediately when its use is appropriate and safe.",
          "Because the equipment must be moved frequently.",
          "Only so visitors can see it.",
        ],
      },
      {
        code: "fire-q2",
        question: "What should happen to materials obstructing a designated evacuation route?",
        options: [
          "They should be removed and the route kept clear.",
          "They can remain if one person can pass.",
          "They should only be moved after an alarm sounds.",
          "They can remain during quiet periods.",
        ],
      },
      {
        code: "fire-q3",
        question: "What should you do when smoke or another credible fire warning is first noticed?",
        options: [
          "Investigate alone before reporting it.",
          "Continue working until flames become visible.",
          "Follow the site's alarm or emergency reporting procedure promptly.",
          "Move nearby materials before telling anyone.",
        ],
      },
      {
        code: "fire-q4",
        question: "What should an employee normally do after evacuating?",
        options: [
          "Leave the site without reporting.",
          "Report to the designated assembly or accountability point and follow authorised instructions.",
          "Return for personal belongings.",
          "Wait close to the entrance.",
        ],
      },
    ],
  },

  "forklift-pedestrian-safety": {
    slug: "forklift-pedestrian-safety",
    code: "NGL-SAF-005",
    contentType: "Visual hazard inspection",
    scenarioLabel: "Warehouse vehicle movement",
    stageIntro: "Inspect each warehouse traffic scene, identify the primary pedestrian–vehicle conflict by clicking anywhere on the hazard object or conflict zone, then confirm the safer pedestrian control. This is pedestrian safety awareness, not forklift-operator certification.",
    stages: [
      {
        code: "forklift-walkway",
        label: "01 · Inspect",
        title: "Find the route conflict",
        situation: "A pedestrian has left the protected green walkway and is walking inside the active forklift travel lane while a loaded forklift is operating nearby.",
        principle: "Physical separation is a primary control. Use designated pedestrian routes and defined crossing points rather than trading separation for convenience.",
        image: "/training-scenes/pro/forklift/01-route-conflict.png",
        imageAlt: "Realistic warehouse scene showing a loaded forklift beside a protected pedestrian walkway while one pedestrian walks inside the vehicle travel lane.",
        interaction: "hotspot",
        hotspot: {
          x: 72,
          y: 58,
          radius: 10,
          regions: [
            {
              points: [
                { x: 64, y: 22 },
                { x: 77, y: 20 },
                { x: 82, y: 39 },
                { x: 80, y: 72 },
                { x: 76, y: 96 },
                { x: 66, y: 91 },
                { x: 63, y: 58 },
              ],
            },
            {
              points: [
                { x: 57, y: 46 },
                { x: 75, y: 43 },
                { x: 80, y: 69 },
                { x: 62, y: 74 },
              ],
            },
          ],
          foundTitle: "Pedestrian route conflict identified",
          foundCopy: "The worker has left the protected pedestrian route and entered the active vehicle travel lane.",
        },
        question: "What should the pedestrian do to maintain safe separation from forklift traffic?",
        options: [
          "Remain within the designated pedestrian route and use the site's defined crossing points.",
          "Use the vehicle lane whenever no forklift appears close.",
          "Take the shortest route between stored pallets.",
          "Walk closely behind a forklift because the driver already knows you are there.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Designated pedestrian routes reduce unnecessary exposure to workplace vehicle movement.",
        reviewFeedback: "Do not exchange separation for convenience. Stay within the pedestrian route and use controlled crossing points.",
      },
      {
        code: "forklift-crossing",
        label: "02 · Inspect",
        title: "Find the crossing conflict",
        situation: "A pedestrian is crossing the active forklift route directly in front of a loaded forklift while the protected pedestrian route remains available to the side.",
        principle: "A marked crossing does not automatically mean the vehicle route is clear. Crossing should occur only when vehicle movement is controlled and the route is confirmed safe.",
        image: "/training-scenes/pro/forklift/02-crossing-conflict.png",
        imageAlt: "Realistic warehouse scene showing a pedestrian crossing an active forklift lane directly in front of a loaded forklift.",
        interaction: "hotspot",
        hotspot: {
          x: 58,
          y: 59,
          radius: 11,
          regions: [
            {
              points: [
                { x: 45, y: 19 },
                { x: 57, y: 18 },
                { x: 64, y: 38 },
                { x: 68, y: 71 },
                { x: 61, y: 94 },
                { x: 47, y: 91 },
                { x: 43, y: 57 },
              ],
            },
            {
              points: [
                { x: 39, y: 48 },
                { x: 64, y: 43 },
                { x: 69, y: 76 },
                { x: 48, y: 86 },
              ],
            },
          ],
          foundTitle: "Unsafe crossing conflict identified",
          foundCopy: "The pedestrian has entered the forklift route before the loaded vehicle movement is safely controlled.",
        },
        question: "What should the pedestrian do before crossing this active forklift route?",
        options: [
          "Cross quickly before the forklift reaches the crossing.",
          "Assume the driver will stop because the pedestrian is visible.",
          "Wait at the protected position until vehicle movement is controlled and the crossing is safe.",
          "Walk around the front of the forklift to save time.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct. Wait until vehicle movement is controlled and independently confirm the crossing is safe before entering the route.",
        reviewFeedback: "A marked crossing is not automatic clearance. Do not enter the forklift route until the movement is controlled and the crossing is safe.",
      },
      {
        code: "forklift-visibility",
        label: "03 · Inspect",
        title: "Find the blind-corner conflict",
        situation: "High racking blocks the direct sightline between a pedestrian route and an approaching forklift at the end of a warehouse aisle.",
        principle: "Restricted visibility requires deliberate controls. Use protected positions, mirrors, barriers or site crossing controls rather than relying on sound or assumption.",
        image: "/training-scenes/pro/forklift/03-blind-corner.png",
        imageAlt: "Realistic warehouse scene showing tall racking obstructing the sightline between a pedestrian and an approaching forklift at an aisle corner.",
        interaction: "hotspot",
        hotspot: {
          x: 45,
          y: 54,
          radius: 10,
          regions: [
            {
              points: [
                { x: 39, y: 2 },
                { x: 64, y: 2 },
                { x: 65, y: 78 },
                { x: 61, y: 90 },
                { x: 42, y: 86 },
                { x: 38, y: 58 },
              ],
            },
            {
              points: [
                { x: 31, y: 34 },
                { x: 48, y: 26 },
                { x: 58, y: 53 },
                { x: 45, y: 72 },
                { x: 30, y: 62 },
              ],
            },
          ],
          foundTitle: "Restricted sightline identified",
          foundCopy: "The rack corner blocks the direct sightline between the pedestrian route and the approaching forklift.",
        },
        question: "How should the pedestrian approach this restricted-visibility corner?",
        options: [
          "Step into the vehicle route to get a better view.",
          "Slow or stop at the protected position, use the site's visibility controls and proceed only when safe.",
          "Listen for engine noise and cross if nothing is heard.",
          "Follow another pedestrian without making an independent check.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Blind corners require deliberate visibility and crossing controls before the pedestrian enters the vehicle route.",
        reviewFeedback: "Sound, assumption or following another person is not reliable clearance. Use the site's visibility controls and proceed only when safe.",
      },
      {
        code: "forklift-load",
        label: "04 · Inspect",
        title: "Find the moving-load exposure",
        situation: "A forklift is transporting a long oversized load whose operating envelope extends toward the pedestrian side of the aisle while driver visibility is restricted.",
        principle: "The load is part of the vehicle's hazard envelope. Pedestrians should remain outside the vehicle and load operating area until movement is controlled and fully clear.",
        image: "/training-scenes/pro/forklift/04-moving-load.png",
        imageAlt: "Realistic warehouse scene showing an oversized moving forklift load extending toward the pedestrian side of the aisle while a pedestrian is nearby.",
        interaction: "hotspot",
        hotspot: {
          x: 29,
          y: 52,
          radius: 12,
          regions: [
            {
              points: [
                { x: 34, y: 40 },
                { x: 99, y: 40 },
                { x: 99, y: 69 },
                { x: 37, y: 70 },
              ],
            },
            {
              points: [
                { x: 7, y: 18 },
                { x: 24, y: 17 },
                { x: 29, y: 48 },
                { x: 27, y: 89 },
                { x: 13, y: 96 },
                { x: 7, y: 63 },
              ],
            },
            {
              points: [
                { x: 20, y: 42 },
                { x: 43, y: 40 },
                { x: 47, y: 72 },
                { x: 21, y: 79 },
              ],
            },
          ],
          foundTitle: "Oversized-load exposure identified",
          foundCopy: "The load extends the forklift's operating envelope toward the pedestrian side while driver visibility is restricted.",
        },
        question: "What is the safest pedestrian response to this oversized moving load?",
        options: [
          "Maintain separation and wait outside the vehicle/load operating area until the movement has fully cleared.",
          "Walk beside the forklift so the driver can see you.",
          "Pass around the load when movement slows.",
          "Approach the load and signal the driver from close range.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Keep clear of the entire vehicle and load operating envelope until the movement is controlled and fully clear.",
        reviewFeedback: "Do not enter the operating envelope of a moving vehicle or its load, especially where visibility or load dimensions are restricted.",
      },
    ],
    quiz: [
      {
        code: "forklift-q1",
        question: "What is the safest assumption when working near workplace vehicles?",
        options: [
          "The driver always sees pedestrians in marked areas.",
          "Slow-moving vehicles can be approached closely.",
          "Do not assume the driver has seen you; maintain separation and use site controls.",
          "A marked floor line removes all vehicle risk.",
        ],
      },
      {
        code: "forklift-q2",
        question: "What should a pedestrian do at a restricted-visibility corner?",
        options: [
          "Enter the vehicle route to improve the view.",
          "Use the site's visibility or crossing controls and proceed only when safe.",
          "Rely only on engine noise.",
          "Follow the person ahead without checking.",
        ],
      },
      {
        code: "forklift-q3",
        question: "Why are designated pedestrian routes important?",
        options: [
          "They help maintain separation between pedestrians and workplace vehicle movement.",
          "They allow employees to walk faster.",
          "They remove the need to remain alert.",
          "They are intended only for visitors.",
        ],
      },
      {
        code: "forklift-q4",
        question: "What should a pedestrian do around an oversized moving load?",
        options: [
          "Walk alongside it so the driver can see you.",
          "Move closer when the vehicle slows down.",
          "Stay outside the vehicle/load operating envelope until movement is controlled and clear.",
          "Pass around the front if there appears to be enough room.",
        ],
      },
    ],
  },

  "manual-handling-ergonomics": {
    slug: "manual-handling-ergonomics",
    code: "NGL-SAF-006",
    contentType: "Visual task-risk simulation",
    scenarioLabel: "Warehouse manual handling",
    stageIntro: "Assess the task before handling, use suitable assistance or equipment where practical, maintain controlled body positioning and improve the work setup when repeated handling creates unnecessary strain.",
    stages: [
      {
        code: "manual-assess",
        label: "01 · Assess",
        title: "Assess the task before handling",
        situation: "A carton at low level must be moved to storage, but its weight, stability, route and destination have not yet been assessed.",
        principle: "A safer handling decision starts before the lift. Assess the task, load, route, destination, grip, environment and available assistance first.",
        image: "/training-scenes/pro/manual/01-assess-before-lift.png",
        imageAlt: "Realistic warehouse worker preparing to handle a large carton before the load, route and destination have been assessed.",
        interaction: "context",
        question: "Before lifting this load, what should the worker do first?",
        options: [
          "Lift one side quickly to estimate the weight.",
          "Assess the load, route, destination, grip and available handling assistance before moving it.",
          "Begin carrying it and stop only if it feels too heavy.",
          "Drag it until another employee becomes available.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Assess the whole handling task before deciding whether and how the load should be moved.",
        reviewFeedback: "Do not use the lift itself as the assessment. Check the task conditions and available controls first.",
      },
      {
        code: "manual-aid",
        label: "02 · Choose",
        title: "Choose the safer handling method",
        situation: "A bulky load needs to be moved across the warehouse and suitable handling equipment is available for the route.",
        principle: "Where practical, reduce unnecessary manual effort by using suitable mechanical assistance or appropriate help rather than forcing a manual lift.",
        image: "/training-scenes/pro/manual/02-use-handling-aid.png",
        imageAlt: "Realistic warehouse worker preparing a bulky carton while a suitable wheeled handling aid is immediately available nearby.",
        interaction: "context",
        question: "What is the safest way to move this bulky load?",
        options: [
          "Use the appropriate handling aid or obtain suitable assistance rather than forcing the manual lift.",
          "Carry it manually because the travel distance is short.",
          "Lift faster to reduce the time under load.",
          "Hold it away from the body to improve visibility.",
        ],
        recommendedIndex: 0,
        positiveFeedback: "Correct. Appropriate handling equipment or assistance can remove avoidable manual effort and reduce exposure.",
        reviewFeedback: "A short distance does not justify an avoidable risky lift. Use suitable equipment or assistance when it is available and appropriate.",
      },
      {
        code: "manual-position",
        label: "03 · Position",
        title: "Avoid twisting under load",
        situation: "A worker is transferring a carton toward shelving while keeping the feet planted and rotating the torso under load.",
        principle: "Reposition the feet and turn the whole body rather than forcing loaded twisting through the torso or lower back.",
        image: "/training-scenes/pro/manual/03-avoid-twisting.png",
        imageAlt: "Realistic warehouse worker handling a carton with an awkward loaded turn that requires better whole-body repositioning.",
        interaction: "context",
        question: "How should the worker change direction while holding this load?",
        options: [
          "Keep the feet planted and rotate through the lower back.",
          "Hold the load farther from the body so turning is easier.",
          "Reposition the feet and turn the whole body while keeping the load controlled and close.",
          "Twist quickly so the movement takes less time.",
        ],
        recommendedIndex: 2,
        positiveFeedback: "Correct. Turning with the feet and whole body reduces unnecessary loaded twisting and supports a more controlled movement.",
        reviewFeedback: "Avoid compensating with a loaded torso twist. Reposition the feet and body so the movement can be completed under control.",
      },
      {
        code: "manual-repeat",
        label: "04 · Improve",
        title: "Reduce repeated awkward handling",
        situation: "Small packages are repeatedly picked from a poor working height, requiring the worker to reach or bend excessively throughout the shift.",
        principle: "Work design matters. Reposition frequent handling within a more suitable working zone rather than repeatedly compensating with awkward posture.",
        image: "/training-scenes/pro/manual/04-reduce-awkward-reach.png",
        imageAlt: "Realistic warehouse picking task showing repeated excessive reach into shelving and an awkward sustained working position.",
        interaction: "context",
        question: "What is the most effective way to reduce repeated strain in this task?",
        options: [
          "Work faster so the total exposure time is shorter.",
          "Reposition the work or load to reduce excessive reach and keep frequent handling within a more suitable working zone.",
          "Stretch farther so the feet can remain in one position.",
          "Continue until discomfort occurs, then change technique.",
        ],
        recommendedIndex: 1,
        positiveFeedback: "Correct. Improving the task setup reduces repeated exposure instead of relying on the worker to compensate with awkward posture.",
        reviewFeedback: "Repeated light handling can still create strain when the work height or reach is poor. Improve the task layout where practicable.",
      },
    ],
    quiz: [
      {
        code: "manual-q1",
        question: "What should happen before an unfamiliar load is manually moved?",
        options: [
          "Assess the load, route, destination and available assistance or equipment.",
          "Lift it once to test the weight.",
          "Always use a team lift regardless of the task.",
          "Always move it manually if the distance is short.",
        ],
      },
      {
        code: "manual-q2",
        question: "When a suitable handling aid is available and appropriate, what should normally be considered?",
        options: [
          "Ignore it if a manual lift appears faster.",
          "Use it only after discomfort begins.",
          "Use the suitable aid according to the workplace procedure.",
          "Carry multiple items manually to save trips.",
        ],
      },
      {
        code: "manual-q3",
        question: "What can reduce unnecessary twisting while handling a load?",
        options: [
          "Moving faster.",
          "Repositioning the feet and whole body or improving the work setup.",
          "Holding the load farther away.",
          "Keeping the feet fixed.",
        ],
      },
      {
        code: "manual-q4",
        question: "Why can repeated handling of light items still create a manual-handling concern?",
        options: [
          "Frequency, awkward posture and poor work positioning can contribute to strain.",
          "Light items never create handling risk.",
          "Only single heavy lifts matter.",
          "Repetition automatically improves technique.",
        ],
      },
    ],
  },
};

export function visualTrainingModuleFor(slug: string): VisualTrainingModule | undefined {
  if (slug in visualTrainingModules) return visualTrainingModules[slug as VisualTrainingSlug];
  return undefined;
}
