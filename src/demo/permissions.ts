import type { SessionRole } from "@/lib/auth";
const supervisor=["admin.access","users.read","departments.read","training.read","assignments.read","results.read","achievements.read"];
const safety=[...supervisor,"users.update","training.manage","assignments.manage","results.export","leaderboard.manage","achievements.manage"];
const admin=[...safety,"users.create","users.disable","users.delete","users.reset_password","users.revoke_sessions","roles.read","roles.assign_operational","departments.manage","audit.read","settings.manage"];
const superAdmin=[...admin,"roles.assign_privileged","security.manage"];
export function demoPermissions(role:SessionRole):string[]{ if(role==="SUPER_ADMIN") return superAdmin; if(role==="ADMIN") return admin; if(role==="SAFETY_MANAGER"||role==="TRAINING_MANAGER") return safety; if(role==="SUPERVISOR") return supervisor; return []; }
export function isAdminRole(role:SessionRole){ return demoPermissions(role).includes("admin.access"); }
