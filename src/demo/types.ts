import type { SessionRole } from "@/lib/auth";

export type DemoUserStatus = "ACTIVE" | "DISABLED";
export type DemoAssignmentStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
export type DemoAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type DemoDepartment = { id:string; code:string; name:string; isActive:boolean; createdAt:string; updatedAt:string };
export type DemoModule = { id:string; slug:string; title:string; description:string; durationMinutes:number; maxScore:number; isActive:boolean; createdAt:string; updatedAt:string };
export type DemoUser = { id:string; employeeId:string; name:string; email:string|null; avatarKey:string; departmentId:string|null; department:string; role:SessionRole; status:DemoUserStatus; password:string; createdAt:string; lastLoginAt:string|null };
export type DemoAssignment = { id:string; userId:string; moduleId:string; status:DemoAssignmentStatus; assignedAt:string; dueAt:string|null; completedAt:string|null };
export type DemoControlDecision = { findingCode:string; optionIndex:number; isCorrect:boolean; points:number };
export type DemoQuizAnswer = { questionCode:string; optionIndex:number; isCorrect:boolean; points:number };
export type DemoAttempt = { id:string; userId:string; moduleId:string; assignmentId:string; moduleSlug:string; status:DemoAttemptStatus; startedAt:string; completedAt:string|null; durationSeconds:number|null; findings:string[]; controls:DemoControlDecision[]; quizAnswers:DemoQuizAnswer[]; inspectionScore:number; controlScore:number; knowledgeScore:number; completionBonus:number; totalScore:number };
export type DemoAudit = { id:string; action:string; targetType:string; targetId:string|null; reason:string|null; createdAt:string };
export type DemoCertificate = { id:string; certificateNumber:string; verificationToken:string; revision:number; status:"ACTIVE"|"SUPERSEDED"|"REVOKED"; userId:string; moduleId:string; sourceAttemptId:string; employeeName:string; employeeId:string; department:string; moduleTitle:string; moduleSlug:string; performanceScore:number; maxScore:number; knowledgeAccuracy:number; inspectionScore:number; controlScore:number; knowledgeScore:number; completionBonus:number; completedAt:string; issuedAt:string };
export type DemoState = { schemaVersion:number; departments:DemoDepartment[]; modules:DemoModule[]; users:DemoUser[]; assignments:DemoAssignment[]; attempts:DemoAttempt[]; certificates:DemoCertificate[]; audit:DemoAudit[] };
export type DemoSession = { userId:string; signedInAt:string };
