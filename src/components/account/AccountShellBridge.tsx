"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AvatarIconKey =
  | "spartan" | "seafarer" | "swordsman" | "medic" | "awakened" | "ninja"
  | "executive" | "engineer" | "analyst" | "teamlead" | "specialist" | "supportlead"
  | "safetyofficer" | "inspector" | "instructor" | "logistics" | "warehouselead" | "maintenance";

type AccountProfile = {
  employeeId: string;
  name: string;
  avatarKey: string;
};

type AccountResponse = { profile: AccountProfile };

const avatarIconKeys = new Set<AvatarIconKey>([
  "spartan", "seafarer", "swordsman", "medic", "awakened", "ninja",
  "executive", "engineer", "analyst", "teamlead", "specialist", "supportlead",
  "safetyofficer", "inspector", "instructor", "logistics", "warehouselead", "maintenance",
]);

const legacyAvatarColors: Record<string, string> = {
  navy: "#0D6382", slate: "#627A87", forest: "#28755F",
  copper: "#B9652C", indigo: "#4D5E98", charcoal: "#354B57",
};

const legacyIconMap: Record<string, AvatarIconKey> = {
  profile: "executive", idbadge: "specialist", briefcase: "executive", shield: "safetyofficer",
  chart: "analyst", headset: "supportlead", document: "specialist", settings: "engineer",
  award: "teamlead", training: "instructor", hardhat: "safetyofficer", forklift: "logistics",
  loader: "maintenance", vest: "safetyofficer", cone: "inspector", pallet: "warehouselead",
  warehouse: "warehouselead", toolbox: "maintenance", goggles: "inspector", extinguisher: "safetyofficer",
  clipboard: "inspector", trolley: "logistics", barrier: "inspector", boot: "safetyofficer",
};

const portraitMarkup: Record<AvatarIconKey, string> = {
  spartan: '<img src="/avatars/premium/kratos.png" alt="" aria-hidden="true" draggable="false" />',
  seafarer: '<img src="/avatars/premium/luffy.png" alt="" aria-hidden="true" draggable="false" />',
  swordsman: '<img src="/avatars/premium/zoro.png" alt="" aria-hidden="true" draggable="false" />',
  medic: '<img src="/avatars/premium/chopper.png" alt="" aria-hidden="true" draggable="false" />',
  awakened: '<img src="/avatars/premium/luffy-gear-5.png" alt="" aria-hidden="true" draggable="false" />',
  ninja: '<img src="/avatars/premium/naruto.png" alt="" aria-hidden="true" draggable="false" />',
  executive: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D7A47D" d="M23 18h18v20l-9 7-9-7V18Z"/><path fill="#253847" d="M20 22c1-11 23-13 25-1-7-5-13-4-25 1Z"/><path fill="#203F59" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F4F7F9" d="m26 44 6 5 6-5 4 12H22l4-12Z"/><path fill="#B9652C" d="m30 48 2 2 2-2 2 8h-8l2-8Z"/></svg>',
  engineer: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#E0AD83" d="M23 21h18v18l-9 7-9-7V21Z"/><path fill="#394B58" d="M21 22c0-11 22-11 22 0-7-3-15-3-22 0Z"/><path fill="#0D5E78" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#D9E6EC" d="M19 17c5-9 21-9 26 0l-2 5H21l-2-5Z"/><path fill="#F3C94A" d="M20 18h24v4H20z"/></svg>',
  analyst: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D9AC8A" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#2D3A48" d="M20 21c3-10 22-10 24 0-7-3-17-3-24 0Z"/><path fill="#5B5FA8" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#152F3E" d="M25 29h6v4h-6zm8 0h6v4h-6zM31 31h2"/><path fill="#D9E3E9" d="M26 45h12l-2 11h-8l-2-11Z"/></svg>',
  teamlead: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#C99572" d="M23 19h18v20l-9 7-9-7V19Z"/><path fill="#263442" d="M20 22c2-10 23-12 24 0-5-5-18-4-24 0Z"/><path fill="#1F7A64" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#EAF4F1" d="m25 44 7 5 7-5 3 12H22l3-12Z"/></svg>',
  specialist: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#E0B18C" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#4B3D36" d="M19 23c2-12 24-13 26 0-7-4-18-4-26 0Z"/><path fill="#34495E" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#B9C7D1" d="M25 30h6v4h-6zm8 0h6v4h-6zM31 32h2"/></svg>',
  supportlead: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D6A27F" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#293A47" d="M20 22c2-10 22-12 24 0-7-4-17-4-24 0Z"/><path fill="#0E6685" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#15394D" d="M19 28c0-9 26-9 26 0h-3c0-6-20-6-20 0h-3Z"/><path fill="#15394D" d="M18 28h5v10h-3c-1 0-2-1-2-2v-8Zm28 0h-5v10h3c1 0 2-1 2-2v-8Z"/></svg>',
  safetyofficer: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#DCA780" d="M23 22h18v18l-9 7-9-7V22Z"/><path fill="#F1C84A" d="M18 20c3-12 25-12 28 0l-2 5H20l-2-5Z"/><path fill="#173E53" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#E7F1F4" d="M23 45h18l4 11H19l4-11Z"/><path fill="#E27A28" d="M27 45h3v11h-3zm7 0h3v11h-3z"/></svg>',
  inspector: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#CFA27F" d="M23 21h18v19l-9 7-9-7V21Z"/><path fill="#3D4A55" d="M20 22c2-10 22-11 24 0-7-3-17-3-24 0Z"/><path fill="#1C5D76" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#89AFC0" d="M25 29h6v4h-6zm8 0h6v4h-6zM31 31h2"/><path fill="#D26925" d="m29 50 2 2 4-4 2 2-6 6-4-4 2-2Z"/></svg>',
  instructor: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D7A985" d="M23 20h18v19l-9 7-9-7V20Z"/><path fill="#4A362E" d="M20 21c3-11 21-11 24 0-6-3-18-3-24 0Z"/><path fill="#496D7F" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F4F7F9" d="m25 44 7 6 7-6 3 12H22l3-12Z"/><path fill="#0E6685" d="M46 23h9v13h-9z"/></svg>',
  logistics: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D5A57F" d="M23 21h18v18l-9 7-9-7V21Z"/><path fill="#233746" d="M20 22c2-10 22-11 24 0-7-4-17-4-24 0Z"/><path fill="#C06A2C" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F3F6F8" d="M24 45h16l3 11H21l3-11Z"/><path fill="#304C5D" d="M45 31h11v9H45zM47 28h7v3h-7z"/></svg>',
  warehouselead: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D9A984" d="M23 22h18v18l-9 7-9-7V22Z"/><path fill="#F1C84A" d="M18 20c3-12 25-12 28 0l-2 5H20l-2-5Z"/><path fill="#1B4055" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#F1F5F7" d="M23 45h18l4 11H19l4-11Z"/><path fill="#D26925" d="M25 45h3v11h-3zm11 0h3v11h-3z"/></svg>',
  maintenance: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#D5A27A" d="M23 21h18v19l-9 7-9-7V21Z"/><path fill="#3F4C56" d="M20 22c3-10 22-11 24 0-7-3-17-3-24 0Z"/><path fill="#425F70" d="M16 56c3-9 9-13 16-13s13 4 16 13H16Z"/><path fill="#E7EDF1" d="M24 45h16l3 11H21l3-11Z"/><path fill="#D26925" d="m46 30 3-3 4 4-3 3 5 5-2 2-5-5-3 3-4-4 3-3-4-4 2-2 4 4Z"/></svg>'
};

function normalizeHex(value: string | undefined) {
  if (!value) return null;
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : null;
}

function parseAvatarKey(value: string | null | undefined) {
  if (value && legacyAvatarColors[value]) {
    return {
      icon: "safetyofficer" as AvatarIconKey,
      background: legacyAvatarColors[value],
      backgroundEnabled: true,
    };
  }

  const parts = value?.split("|") ?? [];
  const rawIcon = parts[0];
  const mapped = legacyIconMap[rawIcon] ?? rawIcon;
  const icon = mapped as AvatarIconKey;
  const background = normalizeHex(parts[1]);

  if (!avatarIconKeys.has(icon) || !background) {
    return {
      icon: "executive" as AvatarIconKey,
      background: "#0E6685",
      backgroundEnabled: true,
    };
  }

  const premiumCharacter =
    icon === "spartan" ||
    icon === "seafarer" ||
    icon === "swordsman" ||
    icon === "medic" ||
    icon === "awakened" ||
    icon === "ninja";
  const persistedBackgroundMode = parts[2];
  const backgroundEnabled =
    persistedBackgroundMode === "on"
      ? true
      : persistedBackgroundMode === "off"
        ? false
        : !premiumCharacter;

  return { icon, background, backgroundEnabled };
}

function decorateAvatar(element: HTMLElement | null, avatarKey: string) {
  if (!element) return;
  const parsed = parseAvatarKey(avatarKey);
  element.innerHTML = portraitMarkup[parsed.icon];
  const surfaceBackground = parsed.backgroundEnabled
    ? parsed.background
    : "transparent";
  element.style.setProperty("background", surfaceBackground, "important");
  element.style.setProperty("background-color", surfaceBackground, "important");
  element.style.setProperty("display", "grid", "important");
  element.style.setProperty("place-items", "center", "important");
  element.style.setProperty("overflow", "hidden", "important");
  element.style.setProperty(
    "box-shadow",
    parsed.backgroundEnabled
      ? "inset 0 0 0 1px rgba(255,255,255,.2)"
      : "none",
    "important",
  );
  const svg = element.querySelector<SVGElement>("svg");
  if (svg) {
    svg.style.width = "94%";
    svg.style.height = "94%";
    svg.style.display = "block";
    svg.style.filter = "drop-shadow(0 2px 3px rgba(4,22,34,.12))";
  }
  const image = element.querySelector<HTMLImageElement>("img");
  if (image) {
    image.style.width = parsed.backgroundEnabled ? "92%" : "100%";
    image.style.height = parsed.backgroundEnabled ? "92%" : "100%";
    image.style.display = "block";
    image.style.objectFit = "contain";
    image.style.borderRadius = "999px";
    image.style.filter = "drop-shadow(0 2px 3px rgba(4,22,34,.12))";
    image.style.userSelect = "none";
    image.style.pointerEvents = "none";
  }
}

export default function AccountShellBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [previewAvatarKey, setPreviewAvatarKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/account/me", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: "{}",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as AccountResponse;
        if (!cancelled && data?.profile) setProfile(data.profile);
      } catch {
        /* shell remains functional */
      }
    }
    void load();

    const onAccountUpdated = (event: Event) => {
      const custom = event as CustomEvent<AccountProfile>;
      if (custom.detail) {
        setProfile(custom.detail);
        setPreviewAvatarKey(null);
      }
    };
    const onAvatarPreview = (event: Event) => {
      const custom = event as CustomEvent<{ avatarKey?: string }>;
      if (custom.detail?.avatarKey) setPreviewAvatarKey(custom.detail.avatarKey);
    };

    window.addEventListener("nexus:account-updated", onAccountUpdated);
    window.addEventListener("nexus:account-avatar-preview", onAvatarPreview);
    return () => {
      cancelled = true;
      window.removeEventListener("nexus:account-updated", onAccountUpdated);
      window.removeEventListener("nexus:account-avatar-preview", onAvatarPreview);
    };
  }, []);

  useEffect(() => {
    const breadcrumb = document.querySelector<HTMLElement>(
      ".header-breadcrumb-v6 strong",
    );
    if (breadcrumb && pathname.startsWith("/account")) {
      breadcrumb.textContent = "My Account";
    }
  }, [pathname]);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(
      ".sidebar-footer-v6, .sidebar-footer",
    );
    if (!footer) return;
    const avatar = footer.querySelector<HTMLElement>(
      ".sidebar-user-avatar, [class*='user-avatar']",
    );
    const copy = footer.querySelector<HTMLElement>(
      ".sidebar-user-copy, [class*='user-copy']",
    );
    const name = copy?.querySelector<HTMLElement>("strong");
    const employeeId = copy?.querySelector<HTMLElement>("span");

    if (profile) {
      decorateAvatar(avatar, previewAvatarKey ?? profile.avatarKey);
      if (name) name.textContent = profile.name;
      if (employeeId) employeeId.textContent = profile.employeeId;
    }

    const openAccount = () => router.push("/account");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAccount();
      }
    };

    for (const element of [avatar, copy]) {
      if (!element) continue;
      element.style.cursor = "pointer";
      element.title = "My account";
      element.addEventListener("click", openAccount);
    }
    if (copy) {
      copy.setAttribute("role", "link");
      copy.setAttribute("tabindex", "0");
      copy.setAttribute("aria-label", "Open my account");
      copy.addEventListener("keydown", onKeyDown);
    }

    return () => {
      for (const element of [avatar, copy]) {
        if (element) element.removeEventListener("click", openAccount);
      }
      if (copy) copy.removeEventListener("keydown", onKeyDown);
    };
  }, [profile, previewAvatarKey, router, pathname]);

  return null;
}
