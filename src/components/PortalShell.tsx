"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignOutConfirmDialog from "@/components/SignOutConfirmDialog";
import AuthoritativeProgressWorkspace from "@/components/progress/AuthoritativeProgressWorkspace";

type IconName = "overview" | "training" | "progress" | "certificates" | "leaderboard" | "achievements" | "logout" | "menu";

function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "overview") return <svg {...common}><path d="M3.5 10.4 12 3.5l8.5 6.9"/><path d="M5.5 9.5v10h13v-10"/><path d="M9.5 19.5v-5h5v5"/></svg>;
  if (name === "training") return <svg {...common}><rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/></svg>;
  if (name === "progress") return <svg {...common}><path d="M4 18.5V12m6 6.5V8m6 10.5V4.5m4 14H3"/></svg>;
  if (name === "certificates") return <svg {...common}><path d="M7 3.5h10a2 2 0 0 1 2 2v13H5v-13a2 2 0 0 1 2-2Z"/><path d="M8 7.5h8M8 11h5"/><path d="m9 18.5 3 2 3-2"/></svg>;
  if (name === "leaderboard") return <svg {...common}><path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z"/></svg>;
  if (name === "achievements") return <svg {...common}><path d="M8 3.5h8v5a4 4 0 0 1-8 0v-5Z"/><path d="M8 5.5H4.5v1.2A4.3 4.3 0 0 0 8.8 11M16 5.5h3.5v1.2a4.3 4.3 0 0 1-4.3 4.3M12 12.5v4M8.5 20.5h7M10 16.5h4"/></svg>;
  if (name === "logout") return <svg {...common}><path d="M9 4.5H5.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9"/><path d="m14.5 8 4 4-4 4M18.5 12H8"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

const links: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/training", label: "Training", icon: "training" },
  { href: "/progress", label: "Progress", icon: "progress" },
  { href: "/certificates", label: "Certificates", icon: "certificates" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/achievements", label: "Achievements", icon: "achievements" },
];

function pageLabel(pathname: string) {
  if (pathname.startsWith("/training/working-at-height")) return "Working at Height";
  if (pathname.startsWith("/training/hazard-perception")) return "Hazard Perception";
  if (pathname.startsWith("/training")) return "Training";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/certificates")) return "Certificates";
  if (pathname.startsWith("/leaderboard")) return "Leaderboard";
  if (pathname.startsWith("/achievements")) return "Achievements";
  return "Overview";
}

export default function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { id: string; name: string; department: string };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const currentPage = pageLabel(pathname);
  const immersiveTraining = pathname.endsWith("/challenge");
  const authoritativeProgress = pathname === "/progress";
  const userInitials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  async function logout() {
    setSignOutBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <div className={`portal-layout portal-layout-v6 ${immersiveTraining ? "portal-training-workspace-v825" : ""}`}>
      <a className="skip-link-v610" href="#portal-main-content">Skip to main content</a>

      <aside className={`sidebar sidebar-v6 ${menuOpen ? "open" : ""}`}>
        <Link
          href="/dashboard"
          className="sidebar-brand sidebar-brand-v6 sidebar-brand-home-v601"
          aria-label="Go to Safety 360 overview"
          title="Go to overview"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar-logo-surface-v18">
            <img src="/brand/nexus-global-logo.png" alt="Nexus Global Logistics" />
          </span>
          <div>
            <strong>Safety 360</strong>
            <span>Employee Training</span>
          </div>
        </Link>

        <div className="sidebar-section-label">Workspace</div>

        <nav className="sidebar-nav sidebar-nav-v6" aria-label="Main navigation">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

            return (
              <Link
                className={active ? "active" : ""}
                href={href}
                key={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-icon"><Icon name={icon} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer sidebar-footer-v6">
          <div className="sidebar-user-avatar" aria-hidden="true">{userInitials}</div>
          <div className="sidebar-user-copy">
            <strong>{user.name}</strong>
            <span>{user.id}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSignOutOpen(true);
            }}
            className="icon-button signout-button"
            title="Sign out"
            aria-label="Sign out"
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="portal-main portal-main-v6">
        <header className="portal-header portal-header-v6">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" />
          </button>

          <Link href="/dashboard" className="header-home-v18" aria-label="Go to overview" title="Overview">
            <Icon name="overview" />
          </Link>

          <div className="header-breadcrumb-v6">
            <span>Nexus Global Logistics</span>
            <i>/</i>
            <strong>{currentPage}</strong>
          </div>

          <div className="header-user header-user-v6">
            <span className="status-dot" aria-hidden="true" />
            <span>{user.department}</span>
          </div>
        </header>

        <main id="portal-main-content" tabIndex={-1} className="portal-content portal-content-v6">
          {authoritativeProgress ? <AuthoritativeProgressWorkspace /> : children}
        </main>
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
