"use client";

import { useRouter } from "next/navigation";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./AccountWorkspace.module.css";

type AvatarIconKey =
  | "spartan"
  | "seafarer"
  | "swordsman"
  | "medic"
  | "awakened"
  | "ninja"
  | "executive"
  | "engineer"
  | "analyst"
  | "teamlead"
  | "specialist"
  | "supportlead"
  | "safetyofficer"
  | "inspector"
  | "instructor"
  | "logistics"
  | "warehouselead"
  | "maintenance";

type AccountProfile = {
  employeeId: string;
  name: string;
  email: string | null;
  avatarKey: string;
  department: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

type AccountResponse = {
  profile: AccountProfile;
  authority: {
    editable: string[];
    organizationManaged: string[];
  };
};

type ConfirmAction = "profile" | "password" | null;
type PasswordField = "current" | "new" | "confirm";
type ColorTarget = "background" | null;

type AvatarCategory =
  | "Premium characters"
  | "Professional"
  | "Safety & operations";

type AvatarOption = {
  key: AvatarIconKey;
  label: string;
  detail: string;
  category: AvatarCategory;
};

type Hsv = { h: number; s: number; v: number };

type AvatarDefinition = {
  icon: AvatarIconKey;
  background: string;
  backgroundEnabled: boolean;
};

const avatarOptions: AvatarOption[] = [
  { key: "spartan", label: "Kratos", detail: "God of War", category: "Premium characters" },
  { key: "seafarer", label: "Luffy", detail: "One Piece", category: "Premium characters" },
  { key: "swordsman", label: "Zoro", detail: "One Piece", category: "Premium characters" },
  { key: "medic", label: "Chopper", detail: "One Piece", category: "Premium characters" },
  { key: "awakened", label: "Luffy - Gear 5", detail: "One Piece", category: "Premium characters" },
  { key: "ninja", label: "Naruto", detail: "Naruto", category: "Premium characters" },

  { key: "executive", label: "Executive", detail: "Corporate leadership", category: "Professional" },
  { key: "engineer", label: "Engineer", detail: "Technical professional", category: "Professional" },
  { key: "analyst", label: "Analyst", detail: "Insight & planning", category: "Professional" },
  { key: "teamlead", label: "Team Lead", detail: "People leadership", category: "Professional" },
  { key: "specialist", label: "Specialist", detail: "Focused expertise", category: "Professional" },
  { key: "supportlead", label: "Support Lead", detail: "Service & coordination", category: "Professional" },

  { key: "safetyofficer", label: "Safety Officer", detail: "Operational safety", category: "Safety & operations" },
  { key: "inspector", label: "Safety Inspector", detail: "Inspection authority", category: "Safety & operations" },
  { key: "instructor", label: "Training Instructor", detail: "Learning leadership", category: "Safety & operations" },
  { key: "logistics", label: "Logistics Lead", detail: "Movement & coordination", category: "Safety & operations" },
  { key: "warehouselead", label: "Warehouse Supervisor", detail: "Floor operations", category: "Safety & operations" },
  { key: "maintenance", label: "Maintenance Engineer", detail: "Asset reliability", category: "Safety & operations" },
];

const avatarIconKeys = new Set<AvatarIconKey>(avatarOptions.map((item) => item.key));

const premiumCharacterPortraits: Partial<Record<AvatarIconKey, string>> = {
  spartan: "/avatars/premium/kratos.png",
  seafarer: "/avatars/premium/luffy.png",
  swordsman: "/avatars/premium/zoro.png",
  medic: "/avatars/premium/chopper.png",
  awakened: "/avatars/premium/luffy-gear-5.png",
  ninja: "/avatars/premium/naruto.png",
};

const premiumCharacterKeys = new Set<AvatarIconKey>(
  Object.keys(premiumCharacterPortraits) as AvatarIconKey[],
);


const legacyAvatarColors: Record<string, string> = {
  navy: "#0D6382",
  slate: "#627A87",
  forest: "#28755F",
  copper: "#B9652C",
  indigo: "#4D5E98",
  charcoal: "#354B57",
};

const legacyIconMap: Record<string, AvatarIconKey> = {
  profile: "executive",
  idbadge: "specialist",
  briefcase: "executive",
  shield: "safetyofficer",
  chart: "analyst",
  headset: "supportlead",
  document: "specialist",
  settings: "engineer",
  award: "teamlead",
  training: "instructor",
  hardhat: "safetyofficer",
  forklift: "logistics",
  loader: "maintenance",
  vest: "safetyofficer",
  cone: "inspector",
  pallet: "warehouselead",
  warehouse: "warehouselead",
  toolbox: "maintenance",
  goggles: "inspector",
  extinguisher: "safetyofficer",
  clipboard: "inspector",
  trolley: "logistics",
  barrier: "inspector",
  boot: "safetyofficer",
};

const premiumColors = [
  "#0E6685", "#1F7A64", "#34495E", "#C06A2C",
  "#4F5FA8", "#7C4D8B", "#C59522", "#8A4350",
  "#171F2A", "#DDE7ED", "#E5E9ED", "#0E3A52",
  "#177D63", "#D46826", "#AC2638", "#6B7280",
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  return /^[0-9A-Fa-f]{6}$/.test(raw) ? `#${raw.toUpperCase()}` : null;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex) ?? "#0E6685";
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const part = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${part(r)}${part(g)}${part(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (hh < 60) [rn, gn, bn] = [c, x, 0];
  else if (hh < 120) [rn, gn, bn] = [x, c, 0];
  else if (hh < 180) [rn, gn, bn] = [0, c, x];
  else if (hh < 240) [rn, gn, bn] = [0, x, c];
  else if (hh < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];

  return rgbToHex((rn + m) * 255, (gn + m) * 255, (bn + m) * 255);
}

function parseAvatarKey(value: string | null | undefined): AvatarDefinition {
  const fallback: AvatarDefinition = {
    icon: "executive",
    background: "#0E6685",
    backgroundEnabled: true,
  };

  if (!value) return fallback;

  if (legacyAvatarColors[value]) {
    return {
      icon: "safetyofficer",
      background: legacyAvatarColors[value],
      backgroundEnabled: true,
    };
  }

  const parts = value.split("|");
  const rawIcon = parts[0];
  const mappedIcon = legacyIconMap[rawIcon] ?? rawIcon;
  const icon = mappedIcon as AvatarIconKey;
  const background = normalizeHex(parts[1] ?? "");

  if (!avatarIconKeys.has(icon) || !background) return fallback;

  const persistedBackgroundMode = parts[2];
  const backgroundEnabled =
    persistedBackgroundMode === "on"
      ? true
      : persistedBackgroundMode === "off"
        ? false
        : !premiumCharacterKeys.has(icon);

  return { icon, background, backgroundEnabled };
}

function serializeAvatarKey(
  icon: AvatarIconKey,
  background: string,
  backgroundEnabled: boolean,
) {
  return `${icon}|${normalizeHex(background) ?? "#0E6685"}|${
    backgroundEnabled ? "on" : "off"
  }`;
}

function canonicalAvatarKey(value: string | null | undefined) {
  const parsed = parseAvatarKey(value);
  return serializeAvatarKey(
    parsed.icon,
    parsed.background,
    parsed.backgroundEnabled,
  );
}

function AvatarPortrait({ icon }: { icon: AvatarIconKey }) {
  const portraitSrc = premiumCharacterPortraits[icon];
  if (portraitSrc) {
    return (
      <img
        src={portraitSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={styles.avatarPortraitImage}
      />
    );
  }

  const common = {
    viewBox: "0 0 64 64",
    "aria-hidden": true,
  } as const;

  switch (icon) {
    case "spartan":
      return <svg {...common}><path fill="#D6A23B" d="M17 22 22 9h20l5 13-5 6H22l-5-6Z"/><path fill="#8B5C28" d="M25 27h14l-1 15-6 6-6-6-1-15Z"/><path fill="#CFA37D" d="M26 25h12v12l-6 5-6-5V25Z"/><path fill="#2B3945" d="M21 54c2-7 6-10 11-10s9 3 11 10H21Z"/><path fill="#8D2B32" d="M19 17c5-8 21-8 26 0-8-3-18-3-26 0Z"/><path fill="#172A38" d="M27 31h10v3H27zM28 37c3 2 5 2 8 0-1 5-7 5-8 0Z"/></svg>;
    case "seafarer":
      return <svg {...common}><path fill="#263D56" d="M18 18c4-8 24-8 28 0l-2 6H20l-2-6Z"/><path fill="#E2B083" d="M23 23h18v15l-9 7-9-7V23Z"/><path fill="#202E3A" d="M22 24c2-7 18-8 20 0-5-2-15-2-20 0Z"/><path fill="#D86A2A" d="M17 55c2-7 7-11 15-11s13 4 15 11H17Z"/><path fill="#F0D9B8" d="M24 27h3v3h-3zm13 0h3v3h-3z"/><path fill="#143248" d="M28 35c2 1 6 1 8 0-1 4-7 4-8 0Z"/><path fill="#D7B35A" d="M16 18h32v3H16z"/></svg>;
    case "swordsman":
      return <svg {...common}><path fill="#182B3A" d="M19 22c1-10 25-12 27 0l-3 6H22l-3-6Z"/><path fill="#E2B18B" d="M23 24h18v15l-9 7-9-7V24Z"/><path fill="#223342" d="M17 54c3-8 8-11 15-11s12 3 15 11H17Z"/><path fill="#586B7A" d="m18 49 10-7 4 5 4-5 10 7-2 7H20l-2-7Z"/><path fill="#101D26" d="M23 25c4-6 15-8 20-2-6 1-10-2-20 2Z"/><path fill="#0E2635" d="M27 33h3v2h-3zm8 0h3v2h-3zM28 38h8v2h-8z"/></svg>;
    case "medic":
      return <svg {...common}><circle cx="32" cy="28" r="17" fill="#F3D9B6"/><path fill="#DBEEE8" d="M18 21c4-12 24-12 28 0l-2 7H20l-2-7Z"/><path fill="#2F8C78" d="M29 15h6v4h4v6h-4v4h-6v-4h-4v-6h4v-4Z"/><path fill="#6C4B3E" d="M21 28c2 13 7 18 11 18s9-5 11-18c-4 2-18 2-22 0Z"/><path fill="#F5F8FA" d="M16 56c2-8 8-12 16-12s14 4 16 12H16Z"/><circle cx="27" cy="31" r="1.8" fill="#253E4B"/><circle cx="37" cy="31" r="1.8" fill="#253E4B"/><path fill="#2F8C78" d="M28 37c3 2 5 2 8 0-1 4-7 4-8 0Z"/></svg>;
    case "awakened":
      return <svg {...common}><path fill="#F3F5F8" d="m17 21 5-12 5 7 5-10 5 10 6-8 4 14-6 7H22l-5-8Z"/><path fill="#D9B69B" d="M23 24h18v15l-9 7-9-7V24Z"/><path fill="#DDEAF3" d="M16 55c2-9 8-12 16-12s14 3 16 12H16Z"/><path fill="#2D6F9B" d="m19 52 9-8 4 5 4-5 9 8-2 4H21l-2-4Z"/><path fill="#1E4D6D" d="M26 31h3v2h-3zm9 0h3v2h-3zM28 37h8v2h-8z"/><path fill="#B9D9EA" d="M19 25c6-4 20-4 26 0l-3-5H22l-3 5Z"/></svg>;
    case "ninja":
      return <svg {...common}><path fill="#1B2632" d="M18 24c2-12 26-12 28 0l-4 20H22l-4-20Z"/><path fill="#C9A68C" d="M23 24h18v11H23z"/><path fill="#111A22" d="M20 22h24v7H20zM21 35h22v10H21z"/><path fill="#415769" d="M15 56c3-9 9-13 17-13s14 4 17 13H15Z"/><path fill="#0F6B78" d="M18 20h28v4H18z"/><path fill="#E7EEF2" d="M26 29h4v2h-4zm8 0h4v2h-4z"/></svg>;
    case "executive":
      return <svg {...common}><path fill="#D7A47D" d="M23 18h18v20l-9 7-9-7V18Z"/><path fill="#253847" d="M20 22c1-11 23-13 25-1-7-5-13-4-25 1Z"/><path fill="#203F59" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F4F7F9" d="m26 44 6 5 6-5 4 12H22l4-12Z"/><path fill="#B9652C" d="m30 48 2 2 2-2 2 8h-8l2-8Z"/><path fill="#17364A" d="M27 29h3v2h-3zm7 0h3v2h-3zM28 36h8v2h-8z"/></svg>;
    case "engineer":
      return <svg {...common}><path fill="#E0AD83" d="M23 21h18v18l-9 7-9-7V21Z"/><path fill="#394B58" d="M21 22c0-11 22-11 22 0-7-3-15-3-22 0Z"/><path fill="#0D5E78" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#D9E6EC" d="M19 17c5-9 21-9 26 0l-2 5H21l-2-5Z"/><path fill="#F3C94A" d="M20 18h24v4H20z"/><path fill="#183749" d="M27 30h3v2h-3zm7 0h3v2h-3zM29 37h6v2h-6z"/></svg>;
    case "analyst":
      return <svg {...common}><path fill="#D9AC8A" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#2D3A48" d="M20 21c3-10 22-10 24 0-7-3-17-3-24 0Z"/><path fill="#5B5FA8" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#152F3E" d="M25 29h6v4h-6zm8 0h6v4h-6zM31 31h2"/><path fill="#D9E3E9" d="M26 45h12l-2 11h-8l-2-11Z"/><path fill="#1A3A4D" d="M29 37h6v2h-6z"/></svg>;
    case "teamlead":
      return <svg {...common}><path fill="#C99572" d="M23 19h18v20l-9 7-9-7V19Z"/><path fill="#263442" d="M20 22c2-10 23-12 24 0-5-5-18-4-24 0Z"/><path fill="#1F7A64" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#EAF4F1" d="m25 44 7 5 7-5 3 12H22l3-12Z"/><path fill="#17364A" d="M27 29h3v2h-3zm7 0h3v2h-3zM27 36c3 3 7 3 10 0-1 5-9 5-10 0Z"/></svg>;
    case "specialist":
      return <svg {...common}><path fill="#E0B18C" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#4B3D36" d="M19 23c2-12 24-13 26 0-7-4-18-4-26 0Z"/><path fill="#34495E" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#B9C7D1" d="M25 30h6v4h-6zm8 0h6v4h-6zM31 32h2"/><path fill="#183749" d="M29 38h6v2h-6z"/></svg>;
    case "supportlead":
      return <svg {...common}><path fill="#D6A27F" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#293A47" d="M20 22c2-10 22-12 24 0-7-4-17-4-24 0Z"/><path fill="#0E6685" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#15394D" d="M19 28c0-9 26-9 26 0h-3c0-6-20-6-20 0h-3Z"/><path fill="#15394D" d="M18 28h5v10h-3c-1 0-2-1-2-2v-8Zm28 0h-5v10h3c1 0 2-1 2-2v-8ZM41 37c0 4-3 6-7 6h-2v-2h2c3 0 5-1 5-4h2Z"/></svg>;
    case "safetyofficer":
      return <svg {...common}><path fill="#DCA780" d="M23 22h18v18l-9 7-9-7V22Z"/><path fill="#F1C84A" d="M18 20c3-12 25-12 28 0l-2 5H20l-2-5Z"/><path fill="#E2A51C" d="M18 21h28v4H18z"/><path fill="#173E53" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#E7F1F4" d="M23 45h18l4 11H19l4-11Z"/><path fill="#E27A28" d="M27 45h3v11h-3zm7 0h3v11h-3z"/></svg>;
    case "inspector":
      return <svg {...common}><path fill="#CFA27F" d="M23 21h18v19l-9 7-9-7V21Z"/><path fill="#3D4A55" d="M20 22c2-10 22-11 24 0-7-3-17-3-24 0Z"/><path fill="#1C5D76" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#89AFC0" d="M25 29h6v4h-6zm8 0h6v4h-6zM31 31h2"/><path fill="#F3F7F9" d="M25 46h14l2 10H23l2-10Z"/><path fill="#D26925" d="m29 50 2 2 4-4 2 2-6 6-4-4 2-2Z"/></svg>;
    case "instructor":
      return <svg {...common}><path fill="#D7A985" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#4A362E" d="M20 21c3-11 21-11 24 0-6-3-18-3-24 0Z"/><path fill="#496D7F" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F4F7F9" d="m25 44 7 6 7-6 3 12H22l3-12Z"/><path fill="#0E6685" d="M46 23h9v13h-9zM48 26h5v2h-5zm0 4h5v2h-5z"/><path fill="#17364A" d="M27 29h3v2h-3zm7 0h3v2h-3zM28 36h8v2h-8z"/></svg>;
    case "logistics":
      return <svg {...common}><path fill="#D5A57F" d="M23 21h18v18l-9 7-9-7V21Z"/><path fill="#233746" d="M20 22c2-10 22-11 24 0-7-4-17-4-24 0Z"/><path fill="#C06A2C" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F3F6F8" d="M24 45h16l3 11H21l3-11Z"/><path fill="#304C5D" d="M45 31h11v9H45zM47 28h7v3h-7z"/><path fill="#17364A" d="M27 29h3v2h-3zm7 0h3v2h-3zM29 36h6v2h-6z"/></svg>;
    case "warehouselead":
      return <svg {...common}><path fill="#D9A984" d="M23 22h18v18l-9 7-9-7V22Z"/><path fill="#F1C84A" d="M18 20c3-12 25-12 28 0l-2 5H20l-2-5Z"/><path fill="#1B4055" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F1F5F7" d="M23 45h18l4 11H19l4-11Z"/><path fill="#D26925" d="M25 45h3v11h-3zm11 0h3v11h-3z"/><path fill="#17364A" d="M27 30h3v2h-3zm7 0h3v2h-3zM28 37h8v2h-8z"/></svg>;
    case "maintenance":
      return <svg {...common}><path fill="#D5A27A" d="M23 21h18v19l-9 7-9-7V21Z"/><path fill="#3F4C56" d="M20 22c3-10 22-11 24 0-7-3-17-3-24 0Z"/><path fill="#425F70" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#E7EDF1" d="M24 45h16l3 11H21l3-11Z"/><path fill="#D26925" d="m46 30 3-3 4 4-3 3 5 5-2 2-5-5-3 3-4-4 3-3-4-4 2-2 4 4Z"/><path fill="#17364A" d="M27 29h3v2h-3zm7 0h3v2h-3zM29 37h6v2h-6z"/></svg>;
    default:
      return <svg {...common}><path fill="#D7A47D" d="M23 18h18v20l-9 7-9-7V18Z"/><path fill="#253847" d="M20 22c1-11 23-13 25-1-7-5-13-4-25 1Z"/><path fill="#203F59" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/></svg>;
  }
}

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function dateTimeLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed.");
  }
  return data;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c5.2 0 8.7 4.5 9.5 6-.4.8-1.6 2.5-3.4 3.9M6.2 6.2C4.3 7.4 3 9.2 2.5 10c.8 1.5 4.3 6 9.5 6 1 0 2-.2 2.9-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6S18 18 12 18 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M12 14v2" />
    </svg>
  );
}

export default function AccountWorkspace() {
  const router = useRouter();
  const passwordFirstFieldRef = useRef<HTMLInputElement | null>(null);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const savedAvatarKeyRef = useRef("executive|#0E6685|on");
  const colorStartRef = useRef("#0E6685");
  const iconStartRef = useRef<AvatarIconKey>("executive");
  const backgroundEnabledStartRef = useRef(true);

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarIcon, setAvatarIcon] = useState<AvatarIconKey>("executive");
  const [avatarBackground, setAvatarBackground] = useState("#0E6685");
  const [avatarBackgroundEnabled, setAvatarBackgroundEnabled] = useState(true);
  const [colorInput, setColorInput] = useState("#0E6685");
  const [iconPortalOpen, setIconPortalOpen] = useState(false);
  const [colorTarget, setColorTarget] = useState<ColorTarget>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPortalOpen, setPasswordPortalOpen] = useState(false);
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<
    Record<PasswordField, boolean>
  >({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applyAvatarState = useCallback(
    (value: string | null | undefined) => {
      const parsed = parseAvatarKey(value);
      setAvatarIcon(parsed.icon);
      setAvatarBackground(parsed.background);
      setAvatarBackgroundEnabled(parsed.backgroundEnabled);
      setColorInput(parsed.background);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await postJson<AccountResponse>("/api/account/me", {});
      setProfile(data.profile);
      setName(data.profile.name);
      setEmail(data.profile.email ?? "");
      applyAvatarState(data.profile.avatarKey);
      savedAvatarKeyRef.current = canonicalAvatarKey(data.profile.avatarKey);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Account information could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyAvatarState]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent("nexus:account-avatar-preview", {
          detail: { avatarKey: savedAvatarKeyRef.current },
        }),
      );
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    window.dispatchEvent(
      new CustomEvent("nexus:account-avatar-preview", {
        detail: {
          avatarKey: serializeAvatarKey(
            avatarIcon,
            avatarBackground,
            avatarBackgroundEnabled,
          ),
        },
      }),
    );
  }, [profile, avatarIcon, avatarBackground, avatarBackgroundEnabled]);

  useEffect(() => {
    const anyOverlay =
      passwordPortalOpen || Boolean(confirmAction) || iconPortalOpen || colorTarget;
    if (!anyOverlay) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirmAction) {
        setConfirmAction(null);
        return;
      }
      if (colorTarget) {
        cancelColorPortal();
        return;
      }
      if (iconPortalOpen) {
        cancelIconPortal();
        return;
      }
      if (passwordPortalOpen && !saving) closePasswordPortal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    passwordPortalOpen,
    confirmAction,
    iconPortalOpen,
    colorTarget,
    saving,
  ]);

  useEffect(() => {
    if (!passwordPortalOpen || confirmAction) return;
    const timer = window.setTimeout(
      () => passwordFirstFieldRef.current?.focus(),
      30,
    );
    return () => window.clearTimeout(timer);
  }, [passwordPortalOpen, confirmAction]);

  const avatarKeyValue = serializeAvatarKey(
    avatarIcon,
    avatarBackground,
    avatarBackgroundEnabled,
  );
  const activeColor = avatarBackground;
  const hsv = useMemo(() => {
    const rgb = hexToRgb(activeColor);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [activeColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);
  const selectedAvatar =
    avatarOptions.find((item) => item.key === avatarIcon) ?? avatarOptions[0];
  const profileDirty = Boolean(
    profile &&
      (name.trim() !== profile.name ||
        email.trim().toLowerCase() !== (profile.email ?? "") ||
        avatarKeyValue !== canonicalAvatarKey(profile.avatarKey)),
  );
  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length >= 14 &&
    confirmPassword.length >= 14 &&
    newPassword === confirmPassword;

  function setActiveColor(value: string) {
    const normalized = normalizeHex(value);
    if (!normalized) return;
    setAvatarBackground(normalized);
    setColorInput(normalized);
  }

  function updatePalette(clientX: number, clientY: number) {
    const element = paletteRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const s = clamp((clientX - rect.left) / rect.width);
    const v = 1 - clamp((clientY - rect.top) / rect.height);
    setActiveColor(hsvToHex(hsv.h, s, v));
  }

  function handlePalettePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePalette(event.clientX, event.clientY);
  }

  function handlePalettePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updatePalette(event.clientX, event.clientY);
    }
  }

  function handlePaletteKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.08 : 0.025;
    let nextS = hsv.s;
    let nextV = hsv.v;
    if (event.key === "ArrowLeft") nextS -= step;
    else if (event.key === "ArrowRight") nextS += step;
    else if (event.key === "ArrowUp") nextV += step;
    else if (event.key === "ArrowDown") nextV -= step;
    else return;
    event.preventDefault();
    setActiveColor(hsvToHex(hsv.h, clamp(nextS), clamp(nextV)));
  }

  function handleHueChange(value: number) {
    const saturation = hsv.s < 0.02 ? 0.72 : hsv.s;
    const brightness = hsv.v < 0.18 ? 0.72 : hsv.v;
    setActiveColor(hsvToHex(value, saturation, brightness));
  }

  function openColorPortal() {
    setError("");
    setNotice("");
    colorStartRef.current = avatarBackground;
    setColorInput(avatarBackground);
    setColorTarget("background");
  }

  function cancelColorPortal() {
    const start = colorStartRef.current;
    setAvatarBackground(start);
    setColorInput(start);
    setColorTarget(null);
  }

  function applyColorPortal() {
    setColorTarget(null);
  }

  function openIconPortal() {
    iconStartRef.current = avatarIcon;
    backgroundEnabledStartRef.current = avatarBackgroundEnabled;
    setIconPortalOpen(true);
    setError("");
    setNotice("");
  }

  function cancelIconPortal() {
    setAvatarIcon(iconStartRef.current);
    setAvatarBackgroundEnabled(backgroundEnabledStartRef.current);
    setIconPortalOpen(false);
  }

  function applyIconPortal() {
    setIconPortalOpen(false);
  }

  function selectAvatar(icon: AvatarIconKey) {
    if (icon === avatarIcon) return;
    setAvatarIcon(icon);
    setAvatarBackgroundEnabled(!premiumCharacterKeys.has(icon));
  }

  function closePasswordPortal() {
    if (saving) return;
    setPasswordPortalOpen(false);
    setConfirmAction(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVisiblePasswordFields({ current: false, new: false, confirm: false });
  }

  function openPasswordPortal() {
    setError("");
    setNotice("");
    setPasswordPortalOpen(true);
  }

  function togglePasswordVisibility(field: PasswordField) {
    setVisiblePasswordFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await postJson<{ ok: true; profile: AccountProfile }>(
        "/api/account/profile",
        {
          name: name.trim(),
          email: email.trim() || null,
          avatarKey: avatarKeyValue,
        },
      );
      setProfile(data.profile);
      setName(data.profile.name);
      setEmail(data.profile.email ?? "");
      applyAvatarState(data.profile.avatarKey);
      savedAvatarKeyRef.current = canonicalAvatarKey(data.profile.avatarKey);
      window.dispatchEvent(
        new CustomEvent("nexus:account-updated", { detail: data.profile }),
      );
      setNotice("Personal information and professional avatar updated successfully.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Personal information could not be updated.",
      );
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  }

  async function changePassword() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await postJson<{
        ok: true;
        otherSessionsRevoked: number;
      }>("/api/account/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordPortalOpen(false);
      setConfirmAction(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVisiblePasswordFields({ current: false, new: false, confirm: false });
      setNotice(
        data.otherSessionsRevoked > 0
          ? `Password updated successfully. ${data.otherSessionsRevoked} other active session${
              data.otherSessionsRevoked === 1 ? " was" : "s were"
            } signed out.`
          : "Password updated successfully.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Password could not be updated.",
      );
      setConfirmAction(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <strong>Loading your account</strong>
        <span>Reading your authenticated employee profile.</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.state}>
        <strong>Account workspace unavailable</strong>
        <span>{error || "Your account information could not be loaded."}</span>
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <section className={styles.page} aria-label="My account">
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Employee self-service</span>
            <h1>My account</h1>
            <p>
              Manage permitted personal information, your premium profile avatar and account security.
            </p>
          </div>
          <div className={styles.accountStatus}>
            <i /> Active account
          </div>
        </header>

        {error ? (
          <div className={styles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className={styles.alertSuccess} role="status">
            {notice}
          </div>
        ) : null}

        <div className={styles.workspace}>
          <aside className={styles.identityCard}>
            <div
              className={styles.heroAvatar}
              style={{
                background: avatarBackgroundEnabled ? avatarBackground : "transparent",
              }}
              data-background-enabled={avatarBackgroundEnabled ? "true" : "false"}
              aria-label={`${selectedAvatar.label} avatar`}
            >
              <AvatarPortrait icon={avatarIcon} />
            </div>
            <h2>{name || profile.name}</h2>
            <span>{profile.employeeId}</span>
            <div className={styles.identityMeta}>
              <div>
                <small>Department</small>
                <strong>{profile.department}</strong>
              </div>
              <div>
                <small>Role</small>
                <strong>{roleLabel(profile.role)}</strong>
              </div>
              <div>
                <small>Last sign-in</small>
                <strong>{dateTimeLabel(profile.lastLoginAt)}</strong>
              </div>
            </div>
            <p>
              Employee ID, department, role and account status are
              organization-managed and cannot be changed here.
            </p>
          </aside>

          <div className={styles.contentColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span>Personal information</span>
                  <h2>Profile details</h2>
                  <p>
                    Update the personal details and professional avatar
                    you are authorized to manage.
                  </p>
                </div>
                <span className={styles.permissionBadge}>Self-service</span>
              </div>

              <div className={styles.formGrid}>
                <label>
                  <span>Full name</span>
                  <input
                    value={name}
                    maxLength={120}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>Work email</span>
                  <input
                    value={email}
                    maxLength={180}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Optional"
                  />
                </label>
                <label className={styles.readOnlyField}>
                  <span>Employee ID</span>
                  <input value={profile.employeeId} readOnly aria-readonly="true" />
                </label>
                <label className={styles.readOnlyField}>
                  <span>Department</span>
                  <input value={profile.department} readOnly aria-readonly="true" />
                </label>
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatarIntro}>
                  <div>
                    <span className={styles.fieldLabel}>Professional avatar</span>
                    <p>
                      Choose a premium portrait avatar and control its optional background surface.
                    </p>
                  </div>
                  <span className={styles.liveBadge}>Live preview</span>
                </div>

                <div className={styles.avatarCompactCard}>
                  <div
                    className={styles.avatarCompactPreview}
                    style={{
                      background: avatarBackgroundEnabled
                        ? avatarBackground
                        : "transparent",
                    }}
                    data-background-enabled={avatarBackgroundEnabled ? "true" : "false"}
                  >
                    <AvatarPortrait icon={avatarIcon} />
                  </div>

                  <div className={styles.avatarCompactRows}>
                    <div className={styles.avatarSettingRow}>
                      <div>
                        <span>Avatar portrait</span>
                        <strong>{selectedAvatar.label}</strong>
                        <small>{selectedAvatar.detail}</small>
                      </div>
                      <button
                        type="button"
                        className={styles.compactAction}
                        onClick={openIconPortal}
                      >
                        Change avatar
                      </button>
                    </div>

                    <div className={styles.avatarSettingRow}>
                      <div>
                        <span>Background surface</span>
                        <strong>{avatarBackgroundEnabled ? "On" : "Off"}</strong>
                        <small>Optional color behind the selected avatar</small>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={avatarBackgroundEnabled}
                        aria-label="Toggle avatar background surface"
                        className={`${styles.avatarBackgroundSwitch} ${
                          avatarBackgroundEnabled ? styles.avatarBackgroundSwitchOn : ""
                        }`}
                        onClick={() =>
                          setAvatarBackgroundEnabled((current) => !current)
                        }
                      >
                        <span aria-hidden="true" />
                        <strong>{avatarBackgroundEnabled ? "On" : "Off"}</strong>
                      </button>
                    </div>

                    {avatarBackgroundEnabled ? (
                      <div className={styles.avatarSettingRow}>
                        <div>
                          <span>Background color</span>
                          <strong className={styles.colorValue}>
                            <i style={{ background: avatarBackground }} />
                            {avatarBackground}
                          </strong>
                          <small>Avatar surface color</small>
                        </div>
                        <button
                          type="button"
                          className={styles.compactAction}
                          onClick={openColorPortal}
                        >
                          Choose color
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={styles.panelActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={!profileDirty || saving}
                  onClick={() => {
                    setName(profile.name);
                    setEmail(profile.email ?? "");
                    applyAvatarState(profile.avatarKey);
                    window.dispatchEvent(
                      new CustomEvent("nexus:account-avatar-preview", {
                        detail: {
                          avatarKey: canonicalAvatarKey(profile.avatarKey),
                        },
                      }),
                    );
                    setError("");
                    setNotice("");
                  }}
                >
                  Discard changes
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!profileDirty || name.trim().length < 2 || saving}
                  onClick={() => setConfirmAction("profile")}
                >
                  Save changes
                </button>
              </div>
            </section>

            <section className={`${styles.panel} ${styles.securityPanel}`}>
              <div className={styles.securitySummary}>
                <div className={styles.securityIcon}>
                  <LockIcon />
                </div>
                <div className={styles.securityCopy}>
                  <span>Security</span>
                  <h2>Account password</h2>
                  <p>
                    Your password is protected and is never displayed. Use the
                    secure password workspace when you need to replace it.
                  </p>
                </div>
                <span className={styles.securityBadge}>Protected</span>
              </div>
              <div className={styles.securityFacts}>
                <div>
                  <span>Credential</span>
                  <strong>Password protected</strong>
                </div>
                <div>
                  <span>Authorization</span>
                  <strong>Current password required</strong>
                </div>
                <div>
                  <span>Session policy</span>
                  <strong>Other sessions revoked</strong>
                </div>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={openPasswordPortal}
                >
                  Change password
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>

      {iconPortalOpen ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelIconPortal();
          }}
        >
          <section
            className={styles.avatarPickerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-picker-title"
          >
            <header className={styles.pickerHeader}>
              <div>
                <span>Premium avatar library</span>
                <h2 id="avatar-picker-title">Choose your profile avatar</h2>
                <p>
                  Choose from premium character portraits and enterprise profile avatars. Your profile and sidebar preview update immediately.
                </p>
              </div>
              <button
                type="button"
                className={styles.iconClose}
                aria-label="Close avatar picker"
                onClick={cancelIconPortal}
              >
                ×
              </button>
            </header>

            <div className={styles.avatarPickerBody}>
              <div className={styles.avatarCategoryStack} role="radiogroup">
                {(["Premium characters", "Professional", "Safety & operations"] as AvatarCategory[]).map(
                  (category) => (
                    <section className={styles.avatarCategory} key={category}>
                      <div className={styles.avatarCategoryHeader}>
                        <span>{category}</span>
                        <small>
                          {category === "Premium characters"
                            ? "Character portrait avatars"
                            : category === "Professional"
                              ? "Clean enterprise profile portraits"
                              : "Safety and operational role portraits"}
                        </small>
                      </div>
                      <div className={styles.avatarPickerGrid}>
                        {avatarOptions
                          .filter((avatar) => avatar.category === category)
                          .map((avatar) => {
                            const selected = avatar.key === avatarIcon;
                            return (
                              <button
                                key={avatar.key}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                className={`${styles.pickerIconCard} ${
                                  selected ? styles.pickerIconSelected : ""
                                }`}
                                onClick={() => selectAvatar(avatar.key)}
                              >
                                <span
                                  className={`${styles.catalogIcon} ${
                                    premiumCharacterKeys.has(avatar.key)
                                      ? styles.characterPortraitThumb
                                      : ""
                                  }`}
                                >
                                  <AvatarPortrait icon={avatar.key} />
                                </span>
                                <div>
                                  <strong>{avatar.label}</strong>
                                  <small>{avatar.detail}</small>
                                </div>
                                <i aria-hidden="true">{selected ? "✓" : ""}</i>
                              </button>
                            );
                          })}
                      </div>
                    </section>
                  ),
                )}
              </div>
            </div>

            <footer className={styles.pickerFooter}>
              <button
                type="button"
                className={styles.secondary}
                onClick={cancelIconPortal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={applyIconPortal}
              >
                Use selected avatar
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {colorTarget ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelColorPortal();
          }}
        >
          <section
            className={styles.colorPickerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="color-picker-title"
          >
            <header className={styles.pickerHeader}>
              <div>
                <span>Avatar color studio</span>
                <h2 id="color-picker-title">Background color</h2>
                <p>
                  Drag across the palette for a live preview. The account avatar
                  and sidebar update as you move.
                </p>
              </div>
              <button
                type="button"
                className={styles.iconClose}
                aria-label="Close color picker"
                onClick={cancelColorPortal}
              >
                ×
              </button>
            </header>

            <div className={styles.colorPickerBody}>
              <div className={styles.pickerPreviewStrip}>
                <div
                  className={styles.pickerAvatarPreview}
                  style={{
                    background: avatarBackgroundEnabled
                      ? avatarBackground
                      : "transparent",
                  }}
                  data-background-enabled={avatarBackgroundEnabled ? "true" : "false"}
                >
                  <AvatarPortrait icon={avatarIcon} />
                </div>
                <div>
                  <span>Live avatar preview</span>
                  <strong>{selectedAvatar.label}</strong>
                  <small>Editing enabled avatar background surface</small>
                </div>
              </div>

              <div
                ref={paletteRef}
                className={styles.colorPalette}
                tabIndex={0}
                role="slider"
                aria-label="Saturation and brightness"
                aria-valuetext={activeColor}
                style={{
                  background: `linear-gradient(to top, #000 0%, transparent 100%), linear-gradient(to right, #fff 0%, hsl(${Math.round(
                    hsv.h,
                  )} 100% 50%) 100%)`,
                }}
                onPointerDown={handlePalettePointerDown}
                onPointerMove={handlePalettePointerMove}
                onKeyDown={handlePaletteKeyDown}
              >
                <span
                  className={styles.paletteMarker}
                  style={{
                    left: `${hsv.s * 100}%`,
                    top: `${(1 - hsv.v) * 100}%`,
                    background: activeColor,
                  }}
                />
              </div>

              <input
                className={styles.hueSlider}
                aria-label="Hue"
                type="range"
                min="0"
                max="360"
                step="1"
                value={Math.round(hsv.h)}
                onChange={(event) =>
                  handleHueChange(Number(event.target.value))
                }
              />

              <div className={styles.colorEditorGrid}>
                <label className={styles.colorIdField}>
                  <span>Color ID</span>
                  <div className={styles.hexField}>
                    <i style={{ background: activeColor }} />
                    <input
                      value={colorInput}
                      maxLength={7}
                      spellCheck={false}
                      aria-label="Color ID"
                      onChange={(event) => {
                        const raw = event.target.value.toUpperCase();
                        setColorInput(raw);
                        const valid = normalizeHex(raw);
                        if (valid) setActiveColor(valid);
                      }}
                      onBlur={() => setColorInput(activeColor)}
                    />
                  </div>
                </label>

                <div className={styles.rgbValues}>
                  <div>
                    <span>R</span>
                    <strong>{activeRgb.r}</strong>
                  </div>
                  <div>
                    <span>G</span>
                    <strong>{activeRgb.g}</strong>
                  </div>
                  <div>
                    <span>B</span>
                    <strong>{activeRgb.b}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.presetSection}>
                <span>Premium palette</span>
                <div className={styles.quickSwatches}>
                  {premiumColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Use ${color}`}
                      className={activeColor === color ? styles.swatchSelected : ""}
                      style={{ background: color }}
                      onClick={() => setActiveColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <footer className={styles.pickerFooter}>
              <button
                type="button"
                className={styles.secondary}
                onClick={cancelColorPortal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={applyColorPortal}
              >
                Apply color
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {passwordPortalOpen ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmAction) {
              closePasswordPortal();
            }
          }}
        >
          <section
            className={styles.passwordDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
          >
            <header className={styles.passwordDialogHeader}>
              <div className={styles.securityIcon}>
                <LockIcon />
              </div>
              <div>
                <span>Account security</span>
                <h2 id="password-dialog-title">Change password</h2>
                <p>
                  Verify your current credential, then set a strong replacement
                  password.
                </p>
              </div>
              <button
                type="button"
                className={styles.iconClose}
                aria-label="Close password workspace"
                disabled={saving}
                onClick={closePasswordPortal}
              >
                ×
              </button>
            </header>
            <div className={styles.passwordDialogBody}>
              <div className={styles.passwordFieldGroup}>
                <label>
                  <span>Current password</span>
                  <div className={styles.passwordInputWrap}>
                    <input
                      ref={passwordFirstFieldRef}
                      type={visiblePasswordFields.current ? "text" : "password"}
                      value={currentPassword}
                      name="currentPassword"
                      inputMode="text"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        visiblePasswordFields.current
                          ? "Hide current password"
                          : "Show current password"
                      }
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      <EyeIcon hidden={!visiblePasswordFields.current} />
                    </button>
                  </div>
                </label>
                <div className={styles.passwordDivider} />
                <label>
                  <span>New password</span>
                  <div className={styles.passwordInputWrap}>
                    <input
                      type={visiblePasswordFields.new ? "text" : "password"}
                      value={newPassword}
                      name="newPassword"
                      inputMode="text"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        visiblePasswordFields.new
                          ? "Hide new password"
                          : "Show new password"
                      }
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      <EyeIcon hidden={!visiblePasswordFields.new} />
                    </button>
                  </div>
                </label>
                <label>
                  <span>Confirm new password</span>
                  <div className={styles.passwordInputWrap}>
                    <input
                      type={visiblePasswordFields.confirm ? "text" : "password"}
                      value={confirmPassword}
                      name="confirmNewPassword"
                      inputMode="text"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        visiblePasswordFields.confirm
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      <EyeIcon hidden={!visiblePasswordFields.confirm} />
                    </button>
                  </div>
                </label>
              </div>
              <div className={styles.passwordStandard}>
                <span>Password standard</span>
                <ul>
                  <li>Minimum 14 characters.</li>
                  <li>Use uppercase, lowercase, number and symbol.</li>
                  <li>Do not include your employee ID or full name.</li>
                  <li>The replacement password must differ from the current password.</li>
                </ul>
              </div>
              {newPassword.length > 0 &&
              confirmPassword.length > 0 &&
              newPassword !== confirmPassword ? (
                <div className={styles.inlineWarning}>
                  New password and confirmation do not match.
                </div>
              ) : null}
              <div className={styles.sessionNotice}>
                <strong>Session protection</strong>
                <span>
                  After a successful change, your current session remains active
                  and all other active sessions are signed out.
                </span>
              </div>
            </div>
            <footer className={styles.passwordDialogFooter}>
              <button
                type="button"
                className={styles.secondary}
                disabled={saving}
                onClick={closePasswordPortal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={!passwordReady || saving}
                onClick={() => setConfirmAction("password")}
              >
                Review change
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          className={`${styles.overlay} ${styles.confirmOverlay}`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setConfirmAction(null);
            }
          }}
        >
          <section
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-confirm-title"
          >
            <div className={styles.confirmIcon}>
              {confirmAction === "password" ? <LockIcon /> : "?"}
            </div>
            <div className={styles.confirmCopy}>
              <span>Final confirmation</span>
              <h2 id="account-confirm-title">
                {confirmAction === "profile"
                  ? "Save profile changes?"
                  : "Confirm password change?"}
              </h2>
              <p>
                {confirmAction === "profile"
                  ? "Your permitted profile fields and professional avatar will be updated. The selected portrait and optional background-surface setting will be saved to your account. Organization-managed identity fields remain unchanged."
                  : "Your password will change immediately. For account protection, all other active sessions will be signed out. Password values are never displayed in this confirmation."}
              </p>
            </div>
            {confirmAction === "password" ? (
              <div className={styles.confirmSummary}>
                <div>
                  <span>Credential</span>
                  <strong>Account password</strong>
                </div>
                <div>
                  <span>Current session</span>
                  <strong>Remains active</strong>
                </div>
                <div>
                  <span>Other sessions</span>
                  <strong>Sign out after success</strong>
                </div>
              </div>
            ) : null}
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={saving}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={saving}
                onClick={() =>
                  void (confirmAction === "profile"
                    ? saveProfile()
                    : changePassword())
                }
              >
                {saving
                  ? "Saving…"
                  : confirmAction === "profile"
                    ? "Save changes"
                    : "Confirm password change"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
