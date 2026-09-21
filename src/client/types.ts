import type { SessionRole } from "@/lib/auth";

export type ClientUserStatus = "ACTIVE" | "DISABLED";
export type ClientAssignmentStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
export type ClientAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type ClientDepartment = { id:string; code:string; name:string; isActive:boolean; createdAt:string; updatedAt:string };
export type ClientModule = { id:string; slug:string; title:string; description:string; durationMinutes:number; maxScore:number; isActive:boolean; createdAt:string; updatedAt:string };
export type ClientUser = { id:string; employeeId:string; name:string; email:string|null; avatarKey:string; departmentId:string|null; department:string; role:SessionRole; status:ClientUserStatus; password:string; createdAt:string; lastLoginAt:string|null };
export type ClientAssignment = { id:string; userId:string; moduleId:string; status:ClientAssignmentStatus; assignedAt:string; dueAt:string|null; completedAt:string|null };
export type ClientControlDecision = { findingCode:string; optionIndex:number; isCorrect:boolean; points:number };
export type ClientQuizAnswer = { questionCode:string; optionIndex:number; isCorrect:boolean; points:number };
export type ClientAttempt = { id:string; userId:string; moduleId:string; assignmentId:string; moduleSlug:string; status:ClientAttemptStatus; startedAt:string; completedAt:string|null; durationSeconds:number|null; findings:string[]; controls:ClientControlDecision[]; quizAnswers:ClientQuizAnswer[]; inspectionScore:number; controlScore:number; knowledgeScore:number; completionBonus:number; totalScore:number };
export type ClientAudit = { id:string; action:string; targetType:string; targetId:string|null; reason:string|null; createdAt:string };
export type ClientCertificate = { id:string; certificateNumber:string; verificationToken:string; revision:number; status:"ACTIVE"|"SUPERSEDED"|"REVOKED"; userId:string; moduleId:string; sourceAttemptId:string; employeeName:string; employeeId:string; department:string; moduleTitle:string; moduleSlug:string; performanceScore:number; maxScore:number; knowledgeAccuracy:number; inspectionScore:number; controlScore:number; knowledgeScore:number; completionBonus:number; completedAt:string; issuedAt:string };
export type ClientState = { schemaVersion:number; departments:ClientDepartment[]; modules:ClientModule[]; users:ClientUser[]; assignments:ClientAssignment[]; attempts:ClientAttempt[]; certificates:ClientCertificate[]; audit:ClientAudit[] };
export type ClientSession = { userId:string; signedInAt:string };
