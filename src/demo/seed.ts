import { trainingModules } from "@/data/training";
import type { DemoAssignment, DemoAttempt, DemoCertificate, DemoDepartment, DemoModule, DemoState, DemoUser } from "./types";

const minus = (base:Date, amount:number, unit:"day"|"hour"|"minute") => {
  const ms = unit === "day" ? 86400000 : unit === "hour" ? 3600000 : 60000;
  return new Date(base.getTime() - amount * ms).toISOString();
};
const plus = (base:Date, amount:number, unit:"day"|"hour") => new Date(base.getTime() + amount * (unit === "day" ? 86400000 : 3600000)).toISOString();

export function createDemoSeed(): DemoState {
  const now = new Date();
  const departments: DemoDepartment[] = [
    {id:"dep-safety",code:"SAFE",name:"Safety & Training",isActive:true,createdAt:minus(now,180,"day"),updatedAt:minus(now,5,"day")},
    {id:"dep-warehouse",code:"WH",name:"Warehouse Operations",isActive:true,createdAt:minus(now,180,"day"),updatedAt:minus(now,8,"day")},
    {id:"dep-logistics",code:"LOG",name:"Logistics",isActive:true,createdAt:minus(now,180,"day"),updatedAt:minus(now,9,"day")},
    {id:"dep-maintenance",code:"MNT",name:"Maintenance",isActive:true,createdAt:minus(now,180,"day"),updatedAt:minus(now,11,"day")},
  ];
  const modules: DemoModule[] = trainingModules.map((m,index)=>({
    id:`module-${index+1}`,slug:m.id,title:m.title,description:m.description,
    durationMinutes: Number.parseInt(m.duration,10) || (index===2?8:6), maxScore:1000,isActive:true,
    createdAt:minus(now,150-index,"day"),updatedAt:minus(now,index+1,"day")
  }));
  const users: DemoUser[] = [
    {id:"user-employee-1",employeeId:"NGL-001",name:"Aarav Shrestha",email:"aarav.shrestha@nexus.demo",avatarKey:"awakened|#34495E|off",departmentId:"dep-warehouse",department:"Warehouse Operations",role:"EMPLOYEE",status:"ACTIVE",password:"Nexus@2026!",createdAt:minus(now,90,"day"),lastLoginAt:minus(now,25,"minute")},
    {id:"user-admin-1",employeeId:"NGL-ADMIN",name:"Training Administrator",email:"admin@nexus.demo",avatarKey:"executive|#0E6685|on",departmentId:"dep-safety",department:"Safety & Training",role:"ADMIN",status:"ACTIVE",password:"NexusAdmin@2026!",createdAt:minus(now,160,"day"),lastLoginAt:minus(now,8,"minute")},
    {id:"user-2",employeeId:"NGL-014",name:"Maya Gurung",email:"maya.gurung@nexus.demo",avatarKey:"instructor|#496D7F|on",departmentId:"dep-safety",department:"Safety & Training",role:"TRAINING_MANAGER",status:"ACTIVE",password:"Demo@2026!",createdAt:minus(now,130,"day"),lastLoginAt:minus(now,2,"hour")},
    {id:"user-3",employeeId:"NGL-028",name:"Suman Rai",email:"suman.rai@nexus.demo",avatarKey:"warehouselead|#1B4055|on",departmentId:"dep-warehouse",department:"Warehouse Operations",role:"EMPLOYEE",status:"ACTIVE",password:"Demo@2026!",createdAt:minus(now,120,"day"),lastLoginAt:minus(now,4,"hour")},
    {id:"user-4",employeeId:"NGL-037",name:"Priya Karki",email:"priya.karki@nexus.demo",avatarKey:"logistics|#C06A2C|on",departmentId:"dep-logistics",department:"Logistics",role:"EMPLOYEE",status:"ACTIVE",password:"Demo@2026!",createdAt:minus(now,110,"day"),lastLoginAt:minus(now,1,"day")},
    {id:"user-5",employeeId:"NGL-042",name:"Rohan Thapa",email:"rohan.thapa@nexus.demo",avatarKey:"maintenance|#425F70|on",departmentId:"dep-maintenance",department:"Maintenance",role:"EMPLOYEE",status:"ACTIVE",password:"Demo@2026!",createdAt:minus(now,100,"day"),lastLoginAt:minus(now,6,"hour")},
    {id:"user-6",employeeId:"NGL-051",name:"Nisha Lama",email:"nisha.lama@nexus.demo",avatarKey:"safetyofficer|#173E53|on",departmentId:"dep-warehouse",department:"Warehouse Operations",role:"SUPERVISOR",status:"ACTIVE",password:"Demo@2026!",createdAt:minus(now,80,"day"),lastLoginAt:minus(now,3,"hour")},
    {id:"user-disabled",employeeId:"NGL-099",name:"Demo Disabled User",email:"disabled@nexus.demo",avatarKey:"analyst|#5B5FA8|on",departmentId:"dep-logistics",department:"Logistics",role:"EMPLOYEE",status:"DISABLED",password:"Demo@2026!",createdAt:minus(now,70,"day"),lastLoginAt:minus(now,30,"day")},
  ];
  const assignments: DemoAssignment[]=[];
  const attempts: DemoAttempt[]=[];
  const certificates: DemoCertificate[]=[];
  let ac=1, tc=1, cc=1;
  const moduleBySlug=(slug:string)=>modules.find(m=>m.slug===slug)!;
  const addAssignment=(userId:string,slug:string,status:DemoAssignment["status"],assignedDaysAgo:number,dueDaysFromNow:number|null,completedAt:string|null=null)=>{
    const mod=moduleBySlug(slug); const id=`assignment-${ac++}`;
    assignments.push({id,userId,moduleId:mod.id,status,assignedAt:minus(now,assignedDaysAgo,"day"),dueAt:dueDaysFromNow===null?null:plus(now,dueDaysFromNow,"day"),completedAt});
    return id;
  };
  const addCompleted=(userId:string,slug:string,score:number,duration:number,daysAgo:number,quizCorrect:number,controlCorrect:number,inspectionScore:number,controlScore:number,knowledgeScore:number)=>{
    const completedAt=minus(now,daysAgo,"day");
    let assignment=assignments.find(a=>a.userId===userId&&a.moduleId===moduleBySlug(slug).id);
    if(!assignment){ const aid=addAssignment(userId,slug,"COMPLETED",daysAgo+20,null,completedAt); assignment=assignments.find(a=>a.id===aid)!; }
    assignment.status="COMPLETED"; assignment.completedAt=completedAt;
    const id=`attempt-${tc++}`; const mod=moduleBySlug(slug);
    attempts.push({id,userId,moduleId:mod.id,assignmentId:assignment.id,moduleSlug:slug,status:"COMPLETED",startedAt:new Date(new Date(completedAt).getTime()-duration*1000).toISOString(),completedAt,durationSeconds:duration,findings:[],controls:Array.from({length:controlCorrect},(_,i)=>({findingCode:`seed-${i}`,optionIndex:0,isCorrect:true,points:100})),quizAnswers:Array.from({length:slug==="hazard-perception"?3:4},(_,i)=>({questionCode:`seed-q${i}`,optionIndex:0,isCorrect:i<quizCorrect,points:i<quizCorrect?(slug==="hazard-perception"?100:75):0})),inspectionScore,controlScore,knowledgeScore,completionBonus:100,totalScore:score});
    const knowledgeTotal=slug==="hazard-perception"?3:4; const certNo=`NGL-S360-${String(cc).padStart(4,"0")}`; const user=users.find(u=>u.id===userId)!;
    certificates.push({id:`certificate-${cc}`,certificateNumber:certNo,verificationToken:`demo-${user.employeeId.toLowerCase()}-${slug}-${cc}`,revision:1,status:"ACTIVE",userId,moduleId:mod.id,sourceAttemptId:id,employeeName:user.name,employeeId:user.employeeId,department:user.department,moduleTitle:mod.title,moduleSlug:slug,performanceScore:score,maxScore:1000,knowledgeAccuracy:Math.round((quizCorrect/knowledgeTotal)*100),inspectionScore,controlScore,knowledgeScore,completionBonus:100,completedAt,issuedAt:completedAt}); cc++;
  };

  // Main employee: two completed, one active, three ready.
  addAssignment("user-employee-1","hazard-perception","COMPLETED",40,null,minus(now,18,"day"));
  addAssignment("user-employee-1","working-at-height","COMPLETED",35,null,minus(now,11,"day"));
  const inductionAid=addAssignment("user-employee-1","safety-induction","IN_PROGRESS",20,12,null);
  addAssignment("user-employee-1","fire-safety-emergency-evacuation","ASSIGNED",14,18,null);
  addAssignment("user-employee-1","forklift-pedestrian-safety","ASSIGNED",14,20,null);
  addAssignment("user-employee-1","manual-handling-ergonomics","ASSIGNED",14,22,null);
  addCompleted("user-employee-1","hazard-perception",900,302,18,3,0,600,0,300);
  addCompleted("user-employee-1","working-at-height",925,388,11,3,4,200,400,225);
  const induction=moduleBySlug("safety-induction");
  attempts.push({id:`attempt-${tc++}`,userId:"user-employee-1",moduleId:induction.id,assignmentId:inductionAid,moduleSlug:induction.slug,status:"IN_PROGRESS",startedAt:minus(now,32,"minute"),completedAt:null,durationSeconds:null,findings:["induction-entry","induction-site-controls"],controls:[{findingCode:"induction-entry",optionIndex:2,isCorrect:true,points:100},{findingCode:"induction-site-controls",optionIndex:1,isCorrect:true,points:100}],quizAnswers:[],inspectionScore:100,controlScore:200,knowledgeScore:0,completionBonus:0,totalScore:300});

  // Demo organization activity.
  addCompleted("user-3","hazard-perception",1000,276,2,3,0,600,0,300);
  addCompleted("user-3","working-at-height",850,422,1,2,4,200,400,150);
  addCompleted("user-4","hazard-perception",900,318,3,3,0,600,0,300);
  addCompleted("user-4","fire-safety-emergency-evacuation",925,402,2,3,4,200,400,225);
  addCompleted("user-5","hazard-perception",800,346,5,2,0,600,0,200);
  addCompleted("user-5","manual-handling-ergonomics",1000,371,1,4,4,200,400,300);
  addCompleted("user-6","hazard-perception",1000,290,4,3,0,600,0,300);
  addCompleted("user-6","forklift-pedestrian-safety",925,395,2,3,4,200,400,225);
  for(const uid of ["user-2","user-3","user-4","user-5","user-6"]){
    for(const m of modules){ if(!assignments.some(a=>a.userId===uid&&a.moduleId===m.id)) addAssignment(uid,m.slug,"ASSIGNED",10,25,null); }
  }

  return {schemaVersion:1,departments,modules,users,assignments,attempts,certificates,audit:[
    {id:"audit-1",action:"DEMO_WORKSPACE_INITIALIZED",targetType:"SYSTEM",targetId:null,reason:"Frontend-only Vercel demo authority",createdAt:minus(now,1,"hour")},
    {id:"audit-2",action:"TRAINING_ASSIGNED",targetType:"USER",targetId:"user-employee-1",reason:"Demo training plan",createdAt:minus(now,1,"day")},
    {id:"audit-3",action:"PROFILE_UPDATED",targetType:"USER",targetId:"user-3",reason:"Demo administrative activity",createdAt:minus(now,2,"day")},
  ]};
}
