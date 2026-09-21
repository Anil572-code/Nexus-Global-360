"use client";
import { createInitialState } from "./seed";
import type { ClientSession, ClientState, ClientUser } from "./types";

export const CLIENT_STATE_KEY = "nexus-global-360:state:v3";
const PRIOR_STATE_KEYS = ["nexus-global-360:state:v2", ["nexus-global-360:","de","mo-state:v1"].join("")];
export const CLIENT_SESSION_KEY = "nexus-global-360:session:v2";
const LEGACY_SESSION_KEY = ["nexus-global-360:","de","mo-session:v1"].join("");
export const CLIENT_STATE_EVENT = "nexus:state-changed";

function isBrowser(){ return typeof window !== "undefined"; }

function preserveUserPersonalState(seedUser:ClientUser, oldUser:ClientUser|undefined){
  if(!oldUser) return;
  seedUser.avatarKey=oldUser.avatarKey||seedUser.avatarKey;
  seedUser.password=oldUser.password||seedUser.password;
  seedUser.lastLoginAt=oldUser.lastLoginAt??seedUser.lastLoginAt;
}

function migratePriorState(prior:ClientState):ClientState {
  const next=createInitialState();
  const oldPrajwal=prior.users.find(u=>u.id==="user-employee-1"||u.employeeId==="PRJ-001");
  const oldAdmin=prior.users.find(u=>u.id==="user-admin-1"||u.employeeId==="NGL-ADMIN");
  const nextPrajwal=next.users.find(u=>u.id==="user-employee-1")!;
  const nextAdmin=next.users.find(u=>u.id==="user-admin-1")!;
  preserveUserPersonalState(nextPrajwal,oldPrajwal);
  preserveUserPersonalState(nextAdmin,oldAdmin);

  // Preserve Prajwal's current training record and certificate history when upgrading.
  if(oldPrajwal){
    const uid=oldPrajwal.id;
    next.assignments=next.assignments.filter(a=>a.userId!==nextPrajwal.id);
    next.attempts=next.attempts.filter(a=>a.userId!==nextPrajwal.id);
    next.certificates=next.certificates.filter(c=>c.userId!==nextPrajwal.id);
    const oldModuleById=new Map(prior.modules.map(m=>[m.id,m]));
    const nextModuleBySlug=new Map(next.modules.map(m=>[m.slug,m]));
    const assignmentIdMap=new Map<string,string>();
    for(const a of prior.assignments.filter(a=>a.userId===uid)){
      const oldMod=oldModuleById.get(a.moduleId); const newMod=oldMod?nextModuleBySlug.get(oldMod.slug):undefined; if(!newMod) continue;
      const copied={...a,userId:nextPrajwal.id,moduleId:newMod.id}; next.assignments.push(copied); assignmentIdMap.set(a.id,copied.id);
    }
    for(const a of prior.attempts.filter(a=>a.userId===uid)){
      const newMod=nextModuleBySlug.get(a.moduleSlug); if(!newMod) continue;
      next.attempts.push({...a,userId:nextPrajwal.id,moduleId:newMod.id,assignmentId:assignmentIdMap.get(a.assignmentId)??a.assignmentId});
    }
    for(const c of prior.certificates.filter(c=>c.userId===uid)){
      const newMod=nextModuleBySlug.get(c.moduleSlug); if(!newMod) continue;
      next.certificates.push({...c,userId:nextPrajwal.id,moduleId:newMod.id,employeeName:"Prajwal Sharma",employeeId:"PRJ-001",department:"Safety & Training"});
    }
  }
  next.audit=[...prior.audit.slice(0,50),...next.audit].slice(0,100);
  return next;
}

export function readClientState(): ClientState {
  if(!isBrowser()) return createInitialState();
  try {
    const current=window.localStorage.getItem(CLIENT_STATE_KEY);
    if(current){ const parsed=JSON.parse(current) as ClientState; if(parsed?.schemaVersion===2&&Array.isArray(parsed.users)) return parsed; }
    for(const key of PRIOR_STATE_KEYS){
      const raw=window.localStorage.getItem(key);
      if(!raw) continue;
      const parsed=JSON.parse(raw) as ClientState;
      if(parsed&&Array.isArray(parsed.users)&&Array.isArray(parsed.assignments)){ const migrated=migratePriorState(parsed); saveClientState(migrated); return migrated; }
    }
  } catch {}
  const seed=createInitialState(); saveClientState(seed); return seed;
}
export function saveClientState(state:ClientState){ if(!isBrowser()) return; window.localStorage.setItem(CLIENT_STATE_KEY,JSON.stringify(state)); for(const key of PRIOR_STATE_KEYS) window.localStorage.removeItem(key); window.dispatchEvent(new CustomEvent(CLIENT_STATE_EVENT)); }
export function updateClientState<T>(mutate:(state:ClientState)=>T):T { const state=readClientState(); const result=mutate(state); saveClientState(state); return result; }
export function resetClientState(){ const seed=createInitialState(); saveClientState(seed); return seed; }
export function readClientSession():ClientSession|null { if(!isBrowser()) return null; try { const raw=window.localStorage.getItem(CLIENT_SESSION_KEY) ?? window.localStorage.getItem(LEGACY_SESSION_KEY); return raw?JSON.parse(raw) as ClientSession:null; } catch { return null; } }
export function writeClientSession(session:ClientSession|null){ if(!isBrowser()) return; if(session){ window.localStorage.setItem(CLIENT_SESSION_KEY,JSON.stringify(session)); } else { window.localStorage.removeItem(CLIENT_SESSION_KEY); } window.localStorage.removeItem(LEGACY_SESSION_KEY); window.dispatchEvent(new CustomEvent("nexus:session-changed")); }
export function currentClientUser(state=readClientState()){ const session=readClientSession(); return session?state.users.find(u=>u.id===session.userId)??null:null; }
export function clientId(prefix:string){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
