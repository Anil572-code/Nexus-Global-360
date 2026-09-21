"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SignOutConfirmDialog from "@/components/SignOutConfirmDialog";
import type { SessionUser } from "@/lib/auth";
import styles from "./AdminShell.module.css";

type IconName = "overview" | "users" | "departments" | "training" | "assignments" | "shield" | "logout" | "menu";

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
  };
  if (name === "overview") return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>;
  if (name === "users") return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 0 0 0-8M22 20v-1.5a4 4 0 0 0-3-3.65"/></svg>;
  if (name === "departments") return <svg {...common}><path d="M4 21V8l8-4 8 4v13"/><path d="M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01"/></svg>;
  if (name === "training") return <svg {...common}><path d="M4 5.5h12a2 2 0 0 1 2 2V19H6a2 2 0 0 1-2-2V5.5Z"/><path d="M18 8.5h2a1 1 0 0 1 1 1V19h-3M8 9h6M8 12h6"/></svg>;
  if (name === "assignments") return <svg {...common}><path d="M9 5h10v14H5V9"/><path d="m4 5 2 2 4-4M9 10h6M9 14h6"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3.2 19 6v5.4c0 4.4-2.7 7.6-7 9.4-4.3-1.8-7-5-7-9.4V6l7-2.8Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "logout") return <svg {...common}><path d="M9 4.5H5.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9"/><path d="m14.5 8 4 4-4 4M18.5 12H8"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

function roleLabel(role: SessionUser["role"]): string {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Administrator";
    case "SAFETY_MANAGER":
    case "TRAINING_MANAGER": return "Safety Manager";
    case "SUPERVISOR": return "Supervisor";
    default: return "Employee";
  }
}

type NavLink = { href: string; label: string; icon: IconName; exact?: boolean; permission: string };

export default function AdminShell({
  children,
  user,
  scopeLabel,
  permissions,
}: {
  children: React.ReactNode;
  user: SessionUser;
  scopeLabel: string;
  permissions: string[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const initials = user.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const allowed = new Set(permissions);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setMenuOpen(false); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function logout() {
    setSignOutBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  const controlPlane: NavLink[] = [
    { href: "/admin", label: "Overview", icon: "overview", exact: true, permission: "admin.access" },
    { href: "/admin/users", label: "Users", icon: "users", permission: "users.read" },
    { href: "/admin/departments", label: "Departments", icon: "departments", permission: "departments.read" },
  ];
  const trainingOps: NavLink[] = [
    { href: "/admin/training", label: "Training modules", icon: "training", permission: "training.read" },
    { href: "/admin/assignments", label: "Assignments", icon: "assignments", permission: "assignments.read" },
  ];

  function renderLinks(links: NavLink[]) {
    return links.filter((link) => allowed.has(link.permission)).map((link) => {
      const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
      return <Link key={link.href} href={link.href} className={active ? styles.active : ""} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><span className={styles.navIcon}><Icon name={link.icon}/></span><span>{link.label}</span></Link>;
    });
  }

  return (
    <div className={styles.layout}>
      <a className={styles.skipLink} href="#admin-main-content">Skip to administration content</a>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <Link href="/admin" className={styles.brand} aria-label="Nexus Global Safety 360 Administration overview" onClick={() => setMenuOpen(false)}>
          <img src="/brand/nexus-global-logo.png" alt="Nexus Global Logistics" />
          <div><strong>Safety 360</strong><span>Administration</span></div>
        </Link>
        <div className={styles.sectionLabel}>Control plane</div>
        <nav className={styles.nav} aria-label="Administration control plane">{renderLinks(controlPlane)}</nav>
        <div className={styles.sectionLabel}>Training operations</div>
        <nav className={styles.nav} aria-label="Administration training operations">{renderLinks(trainingOps)}</nav>
        <div className={styles.releaseNote}><span><Icon name="shield"/></span><div><strong>Authority protected</strong><p>Role permissions, authority scope and audit controls govern administrative actions.</p></div></div>
        <div className={styles.userPanel}>
          <div className={styles.avatar} aria-hidden="true">{initials}</div>
          <div className={styles.userCopy}><strong>{user.name}</strong><span>{roleLabel(user.role)}</span></div>
          <button type="button" onClick={() => setSignOutOpen(true)} className={styles.iconButton} title="Sign out" aria-label="Sign out"><Icon name="logout"/></button>
        </div>
      </aside>
      {menuOpen ? <button type="button" className={styles.scrim} aria-label="Close administration navigation" onClick={() => setMenuOpen(false)}/> : null}
      <div className={styles.mainFrame}>
        <header className={styles.header}>
          <button type="button" className={styles.menuButton} onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle administration navigation" aria-expanded={menuOpen}><Icon name="menu"/></button>
          <div className={styles.breadcrumb}><span>Nexus Global Logistics</span><i>/</i><strong>Administration</strong></div>
          <div className={styles.scope} title={`Authority scope: ${scopeLabel}`}><span className={styles.statusDot} aria-hidden="true"/><span>{scopeLabel}</span></div>
        </header>
        <main id="admin-main-content" tabIndex={-1} className={styles.content}>{children}</main>
      </div>

      <SignOutConfirmDialog
        open={signOutOpen}
        busy={signOutBusy}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}
