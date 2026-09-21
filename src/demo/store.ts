"use client";
import { createDemoSeed } from "./seed";
import type { DemoSession, DemoState } from "./types";

export const DEMO_STATE_KEY = "nexus-global-360:demo-state:v1";
export const DEMO_SESSION_KEY = "nexus-global-360:demo-session:v1";
export const DEMO_STATE_EVENT = "nexus:demo-state-changed";

function isBrowser(){ return typeof window !== "undefined"; }
export function readDemoState(): DemoState {
  if(!isBrowser()) return createDemoSeed();
  try {
    const raw=window.localStorage.getItem(DEMO_STATE_KEY);
    if(raw){ const parsed=JSON.parse(raw) as DemoState; if(parsed?.schemaVersion===1 && Array.isArray(parsed.users) && Array.isArray(parsed.certificates)) return parsed; }
  } catch {}
  const seed=createDemoSeed(); saveDemoState(seed); return seed;
}
export function saveDemoState(state:DemoState){ if(!isBrowser()) return; window.localStorage.setItem(DEMO_STATE_KEY,JSON.stringify(state)); window.dispatchEvent(new CustomEvent(DEMO_STATE_EVENT)); }
export function updateDemoState<T>(mutate:(state:DemoState)=>T):T { const state=readDemoState(); const result=mutate(state); saveDemoState(state); return result; }
export function resetDemoState(){ const seed=createDemoSeed(); saveDemoState(seed); return seed; }
export function readDemoSession():DemoSession|null { if(!isBrowser()) return null; try { const raw=window.localStorage.getItem(DEMO_SESSION_KEY); return raw?JSON.parse(raw) as DemoSession:null; } catch { return null; } }
export function writeDemoSession(session:DemoSession|null){ if(!isBrowser()) return; if(session) window.localStorage.setItem(DEMO_SESSION_KEY,JSON.stringify(session)); else window.localStorage.removeItem(DEMO_SESSION_KEY); window.dispatchEvent(new CustomEvent("nexus:demo-session-changed")); }
export function currentDemoUser(state=readDemoState()){ const session=readDemoSession(); return session?state.users.find(u=>u.id===session.userId)??null:null; }
export function demoId(prefix:string){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
