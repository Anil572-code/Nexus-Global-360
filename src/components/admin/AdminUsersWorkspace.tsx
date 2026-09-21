"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminDropdown from "./AdminDropdown";
import styles from "./AdminUsersWorkspace.module.css";

type Role = "EMPLOYEE" | "TRAINING_MANAGER" | "SUPERVISOR" | "SAFETY_MANAGER" | "ADMIN" | "SUPER_ADMIN";
type Module = { id: string; slug: string; title: string; description: string; durationMinutes: number; maxScore: number; isActive: boolean };
type Assignment = { id: string; status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"; dueAt: string | null; assignedAt: string; attemptCount: number; module: { id: string; slug: string; title: string; isActive: boolean } };
type User = { id: string; employeeId: string; name: string; email: string | null; department: string; role: Role; status: "ACTIVE" | "DISABLED"; lastLoginAt: string | null; createdAt: string; assignments: Assignment[]; _count: { attempts: number; userAchievements: number; authSessions: number } };
type Data = { currentUserId: string; capabilities: Record<string, boolean>; assignableRoles: Role[]; departments: string[]; modules: Module[]; pagination: { page: number; pageSize: number; total: number; totalPages: number }; users: User[]; scope: { kind: string; label: string } };

type Mode = "create" | "manage" | null;
type ManageTab = "profile" | "training" | "security";
type SecurityAction = "password" | "sessions" | "status" | "delete" | null;
type PendingConfirmation =
  | { kind: "role"; employeeId: string; name: string; email: string; department: string; nextRole: Role; roleReason: string }
  | { kind: "training"; moduleIds: string[]; added: number; removed: number }
  | { kind: "security"; action: Exclude<SecurityAction, null>; reason: string; password?: string };

const roleLabel: Record<Role, string> = {
  EMPLOYEE: "Employee",
  TRAINING_MANAGER: "Training Manager (legacy)",
  SUPERVISOR: "Supervisor",
  SAFETY_MANAGER: "Safety Manager",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Admin",
};

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) throw new Error(body?.message || "The administration operation failed.");
  return body;
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passwordIssue(value: string) {
  if (value.length < 14 || value.length > 128) return "Password must contain 14–128 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must include a symbol.";
  return "";
}

export default function AdminUsersWorkspace() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [manageTab, setManageTab] = useState<ManageTab>("profile");
  const [securityAction, setSecurityAction] = useState<SecurityAction>(null);
  const [busy, setBusy] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async (): Promise<Data | null> => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    if (department) params.set("department", department);
    try {
      const result = await api(`/api/admin/users?${params.toString()}`, { method: "GET", headers: {} }) as Data;
      setData(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load users.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [page, q, status, role, department]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!mode) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus], input:not([disabled]), select:not([disabled]), button:not([disabled])");
      first?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [mode]);

  const activeModules = useMemo(() => data?.modules.filter((m) => m.isActive) ?? [], [data]);
  const canShowSecurityTab = !!data && Boolean(
    data.capabilities.canResetPassword || data.capabilities.canRevokeSessions || data.capabilities.canDisable || data.capabilities.canDelete,
  );

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4200);
  }

  function openCreate() {
    setError("");
    setSelected(null);
    setManageTab("profile");
    setSecurityAction(null);
    setMode("create");
  }

  function openManage(user: User) {
    setError("");
    setSelected(user);
    setManageTab("profile");
    setSecurityAction(null);
    setMode("manage");
  }

  function closeModal() {
    if (busy) return;
    setMode(null);
    setSecurityAction(null);
    setPendingConfirmation(null);
    setSelected(null);
    setError("");
  }

  function switchTab(tab: ManageTab) {
    setManageTab(tab);
    setSecurityAction(null);
    setError("");
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !busy) {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((item) => !item.hasAttribute("hidden") && item.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const form = new FormData(event.currentTarget);
    const employeeId = String(form.get("employeeId") || "").trim();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const departmentValue = String(form.get("department") || "").trim();
    const roleValue = String(form.get("role") || "EMPLOYEE") as Role;
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    const moduleIds = activeModules.filter((m) => form.get(`module:${m.id}`) === "on").map((m) => m.id);

    if (!employeeId || !name || !departmentValue) { setError("Employee ID, full name and department are required."); return; }
    if (!isValidEmail(email)) { setError("Enter a valid email address or leave the field blank."); return; }
    const issue = passwordIssue(password);
    if (issue) { setError(issue); return; }
    if (password !== confirm) { setError("Initial passwords do not match."); return; }

    setBusy(true);
    setError("");
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ employeeId, name, email: email || undefined, department: departmentValue, role: roleValue, password, moduleIds }),
      });
      setMode(null); setSelected(null); setSecurityAction(null); setError("");
      announce("Employee account created successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create employee.");
    } finally {
      setBusy(false);
    }
  }

  async function commitProfile(payload: Extract<PendingConfirmation, { kind: "role" }> | { employeeId: string; name: string; email: string; department: string; nextRole: Role; roleReason: string }) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ employeeId: payload.employeeId, name: payload.name, email: payload.email || null, department: payload.department }),
      });
      if (payload.nextRole !== selected.role) {
        await api(`/api/admin/users/${selected.id}/role`, {
          method: "POST",
          body: JSON.stringify({ role: payload.nextRole, reason: payload.roleReason }),
        });
      }
      setPendingConfirmation(null);
      setMode(null);
      setSelected(null);
      setSecurityAction(null);
      setError("");
      announce("Employee profile updated successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update employee.");
      setPendingConfirmation(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const employeeId = String(form.get("employeeId") || "").trim();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const departmentValue = String(form.get("department") || "").trim();
    const nextRole = String(form.get("role") || selected.role) as Role;
    const roleReason = String(form.get("roleReason") || "").trim();

    if (!employeeId || !name || !departmentValue) { setError("Employee ID, full name and department are required."); return; }
    if (!isValidEmail(email)) { setError("Enter a valid email address or leave the field blank."); return; }
    if (nextRole !== selected.role && roleReason.length < 3) { setError("Enter a reason for the role change."); return; }

    const payload = { employeeId, name, email, department: departmentValue, nextRole, roleReason };
    if (nextRole !== selected.role) {
      setError("");
      setPendingConfirmation({ kind: "role", ...payload });
      return;
    }
    await commitProfile(payload);
  }

  function saveTraining(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !data) return;
    const form = new FormData(event.currentTarget);
    const editable = activeModules.filter((m) => form.get(`training:${m.id}`) === "on").map((m) => m.id);
    const protectedIds = selected.assignments
      .filter((assignment) => assignment.status !== "ASSIGNED" || assignment.attemptCount > 0)
      .map((assignment) => assignment.module.id);
    const moduleIds = Array.from(new Set([...editable, ...protectedIds]));
    const currentIds = new Set(selected.assignments.map((assignment) => assignment.module.id));
    const nextIds = new Set(moduleIds);
    const added = moduleIds.filter((id) => !currentIds.has(id)).length;
    const removed = selected.assignments.filter((assignment) => !nextIds.has(assignment.module.id)).length;

    if (added === 0 && removed === 0) { announce("Training access is already up to date."); return; }
    setError("");
    setPendingConfirmation({ kind: "training", moduleIds, added, removed });
  }

  async function commitTraining() {
    if (!selected || pendingConfirmation?.kind !== "training") return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/users/${selected.id}/training`, { method: "PUT", body: JSON.stringify({ moduleIds: pendingConfirmation.moduleIds }) });
      setPendingConfirmation(null); setMode(null); setSelected(null); setSecurityAction(null);
      announce("Training access updated successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update training access.");
      setPendingConfirmation(null);
    } finally {
      setBusy(false);
    }
  }

  function runSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !securityAction) return;
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") || "").trim();
    if (reason.length < 3) { setError("Enter an administrative reason with at least 3 characters."); return; }

    let password: string | undefined;
    if (securityAction === "password") {
      password = String(form.get("password") || "");
      const confirm = String(form.get("confirm") || "");
      const issue = passwordIssue(password);
      if (issue) { setError(issue); return; }
      if (password !== confirm) { setError("New passwords do not match."); return; }
    }

    setError("");
    setPendingConfirmation({ kind: "security", action: securityAction, reason, ...(password ? { password } : {}) });
  }

  async function commitSecurity() {
    if (!selected || pendingConfirmation?.kind !== "security") return;
    const { action, reason, password } = pendingConfirmation;
    setBusy(true);
    setError("");
    try {
      let result: any = null;
      if (action === "password") {
        result = await api(`/api/admin/users/${selected.id}/password-reset`, {
          method: "POST",
          body: JSON.stringify({ password, reason }),
        });
        if (result?.self) { window.location.assign("/login"); return; }
        announce("Password reset and existing sessions revoked.");
      } else if (action === "sessions") {
        result = await api(`/api/admin/users/${selected.id}/sessions/revoke`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        });
        if (result?.self) { window.location.assign("/login"); return; }
        announce("Active sessions revoked.");
      } else if (action === "status") {
        const nextStatus = selected.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
        await api(`/api/admin/users/${selected.id}/status`, {
          method: "POST",
          body: JSON.stringify({ status: nextStatus, reason }),
        });
        announce(nextStatus === "DISABLED" ? "Employee account disabled." : "Employee account enabled.");
      } else if (action === "delete") {
        await api(`/api/admin/users/${selected.id}`, { method: "DELETE", body: JSON.stringify({ reason }) });
        announce("Employee account permanently deleted.");
      }
      setPendingConfirmation(null); setSecurityAction(null); setMode(null); setSelected(null); setError("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete security operation.");
      setPendingConfirmation(null);
    } finally {
      setBusy(false);
    }
  }

  function securityTitle(action: SecurityAction) {
    if (action === "password") return "Reset password";
    if (action === "sessions") return "Revoke active sessions";
    if (action === "delete") return "Delete account";
    if (action === "status") return selected?.status === "ACTIVE" ? "Disable account" : "Enable account";
    return "Security action";
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p>Identity & training authority</p>
          <h1>Users</h1>
          <span>Create and govern employee accounts, security and training access.</span>
        </div>
        {data?.capabilities.canCreate ? <button className={styles.primary} onClick={openCreate}>Create user</button> : null}
      </div>

      {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
      {error && !mode ? <div className={styles.error} role="alert">{error}</div> : null}

      <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search employee, ID, email or department" aria-label="Search users" />
        <AdminDropdown
          value={status}
          onChange={(value) => { setStatus(value); setPage(1); }}
          ariaLabel="Filter status"
          options={[
            { value: "", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "DISABLED", label: "Disabled" },
          ]}
          compact
        />
        <AdminDropdown
          value={role}
          onChange={(value) => { setRole(value); setPage(1); }}
          ariaLabel="Filter role"
          options={[
            { value: "", label: "All roles" },
            { value: "EMPLOYEE", label: "Employee" },
            { value: "SUPERVISOR", label: "Supervisor" },
            { value: "SAFETY_MANAGER", label: "Safety Manager" },
            { value: "ADMIN", label: "Administrator" },
            { value: "SUPER_ADMIN", label: "Super Admin" },
          ]}
          compact
        />
        <AdminDropdown
          value={department}
          onChange={(value) => { setDepartment(value); setPage(1); }}
          ariaLabel="Filter department"
          options={[
            { value: "", label: "All departments" },
            ...(data?.departments.map((item) => ({ value: item, label: item })) ?? []),
          ]}
          compact
        />
        <button className={styles.secondary} type="submit">Search</button>
      </form>

      <section className={styles.tablePanel} aria-busy={loading}>
        <div className={styles.tableMeta}>
          <span>{data ? `${data.pagination.total} employees` : "Employees"}</span>
          <span>{data ? `${activeModules.length} active training modules` : ""}</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Training access</th><th>Status</th><th>Last login</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className={styles.empty}>Loading authorized employees…</td></tr> : data?.users.length ? data.users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><span>{user.employeeId}{user.email ? ` · ${user.email}` : ""}</span></td>
                  <td>{user.department}</td>
                  <td><span className={styles.role}>{roleLabel[user.role]}</span></td>
                  <td><strong>{user.assignments.length}</strong><span>{user.assignments.filter((assignment) => assignment.status === "COMPLETED").length} completed</span></td>
                  <td><span className={`${styles.status} ${user.status === "ACTIVE" ? styles.active : styles.disabled}`}>{user.status === "ACTIVE" ? "Active" : "Disabled"}</span></td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td>
                  <td><button className={styles.manage} onClick={() => openManage(user)}>Manage</button></td>
                </tr>
              )) : <tr><td colSpan={7} className={styles.empty}>No employees match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {data && data.pagination.totalPages > 1 ? (
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        ) : null}
      </section>

      {mode ? (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
            ref={dialogRef}
            onKeyDown={handleDialogKeyDown}
            tabIndex={-1}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIdentity}>
                <span>{mode === "create" ? "New account" : selected?.employeeId}</span>
                <h2 id="user-dialog-title">{mode === "create" ? "Create employee" : selected?.name}</h2>
                {mode === "manage" && selected ? <p>{selected.department} · {roleLabel[selected.role]}</p> : <p>Set identity, authority and initial training access.</p>}
              </div>
              <button onClick={closeModal} disabled={busy} aria-label="Close">×</button>
            </div>

            <div className={styles.dialogBody}>
              {error ? <div className={styles.dialogError} role="alert">{error}</div> : null}

              {mode === "create" && data ? (
              <form onSubmit={submitCreate} className={styles.workspaceForm} noValidate>
                <div className={styles.workspaceScroll}>
                  <section className={styles.workspaceSection}>
                    <div className={styles.sectionTitle}>
                      <div><span>Account identity</span><h3>Employee details</h3></div>
                      <p>Core identity and organizational placement.</p>
                    </div>
                    <div className={styles.grid}>
                      <label>Employee ID<input data-autofocus name="employeeId" maxLength={64} autoComplete="off" /></label>
                      <label>Full name<input name="name" maxLength={120} autoComplete="off" /></label>
                      <label>Email <em>Optional</em><input name="email" type="email" maxLength={180} autoComplete="off" /></label>
                      <label>Department
                        <AdminDropdown
                          name="department"
                          defaultValue=""
                          placeholder="Select department"
                          ariaLabel="Department"
                          options={data.departments.map((item) => ({ value: item, label: item }))}
                        />
                      </label>
                      <label>Role
                        <AdminDropdown
                          name="role"
                          defaultValue="EMPLOYEE"
                          ariaLabel="Role"
                          options={data.assignableRoles.map((item) => ({ value: item, label: roleLabel[item] }))}
                        />
                      </label>
                    </div>
                  </section>

                  <section className={styles.workspaceSection}>
                    <div className={styles.sectionTitle}>
                      <div><span>Account security</span><h3>Initial password</h3></div>
                      <p>Passwords are never retrievable from Admin.</p>
                    </div>
                    <div className={styles.passwordGrid}>
                      <label>Initial password<input name="password" type="password" autoComplete="new-password" /></label>
                      <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" /></label>
                    </div>
                    <p className={styles.help}>Use 14–128 characters with uppercase, lowercase, number and symbol.</p>
                  </section>

                  <section className={styles.workspaceSection}>
                    <div className={styles.sectionTitle}>
                      <div><span>Training entitlement</span><h3>Initial module access</h3></div>
                      <p>Assign only the modules this employee should receive now.</p>
                    </div>
                    <div className={styles.moduleGrid}>
                      {activeModules.map((module) => (
                        <label className={styles.moduleCard} key={module.id}>
                          <input type="checkbox" name={`module:${module.id}`} />
                          <span><strong>{module.title}</strong><small>{module.durationMinutes} min · {module.maxScore} pts</small></span>
                        </label>
                      ))}
                    </div>
                  </section>
                </div>
                <div className={styles.modalFooter}>
                  <span>New account actions are audited.</span>
                  <div className={styles.actions}>
                    <button type="button" className={styles.secondary} onClick={closeModal}>Cancel</button>
                    <button className={styles.primary} disabled={busy}>{busy ? "Creating…" : "Create employee"}</button>
                  </div>
                </div>
              </form>
            ) : null}

            {mode === "manage" && selected && data ? (
              <div className={styles.manageWorkspace}>
                <div className={styles.userSummary}>
                  <span className={`${styles.summaryStatus} ${selected.status === "ACTIVE" ? styles.active : styles.disabled}`}>{selected.status === "ACTIVE" ? "Active" : "Disabled"}</span>
                  <div><b>{roleLabel[selected.role]}</b><small>Role</small></div>
                  <div><b>{selected.assignments.length}</b><small>Assigned modules</small></div>
                  <div><b>{selected._count.authSessions}</b><small>Active sessions</small></div>
                  <div><b>{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString() : "Never"}</b><small>Last login</small></div>
                </div>

                <div className={styles.tabs} role="tablist" aria-label="Employee administration">
                  <button type="button" role="tab" aria-selected={manageTab === "profile"} className={manageTab === "profile" ? styles.tabActive : ""} onClick={() => switchTab("profile")}>Profile</button>
                  {data.capabilities.canManageTraining ? <button type="button" role="tab" aria-selected={manageTab === "training"} className={manageTab === "training" ? styles.tabActive : ""} onClick={() => switchTab("training")}>Training</button> : null}
                  {canShowSecurityTab ? <button type="button" role="tab" aria-selected={manageTab === "security"} className={manageTab === "security" ? styles.tabActive : ""} onClick={() => switchTab("security")}>Security</button> : null}
                </div>

                {manageTab === "profile" ? (
                  <form onSubmit={saveProfile} className={styles.tabForm} noValidate>
                    <div className={styles.tabScroll}>
                      <div className={styles.sectionTitle}>
                        <div><span>Profile & authority</span><h3>Employee identity</h3></div>
                        <p>Identity changes are applied through the local demo authority layer.</p>
                      </div>
                      <div className={styles.grid}>
                        <label>Employee ID<input data-autofocus name="employeeId" defaultValue={selected.employeeId} readOnly={selected.id === data.currentUserId} /></label>
                        <label>Full name<input name="name" defaultValue={selected.name} /></label>
                        <label>Email <em>Optional</em><input name="email" type="email" defaultValue={selected.email ?? ""} /></label>
                        <label>Department
                          {selected.id === data.currentUserId ? (
                            <input name="department" value={selected.department} readOnly />
                          ) : (
                            <AdminDropdown
                              name="department"
                              defaultValue={selected.department}
                              ariaLabel="Department"
                              options={[
                                ...(!data.departments.includes(selected.department)
                                  ? [{ value: selected.department, label: selected.department }]
                                  : []),
                                ...data.departments.map((item) => ({ value: item, label: item })),
                              ]}
                            />
                          )}
                        </label>
                        <label>Role
                          <AdminDropdown
                            name="role"
                            defaultValue={selected.role}
                            ariaLabel="Role"
                            disabled={selected.id === data.currentUserId || !data.capabilities.canAssignOperationalRoles || ((selected.role === "ADMIN" || selected.role === "SUPER_ADMIN") && !data.capabilities.canAssignPrivilegedRoles)}
                            options={[
                              { value: selected.role, label: roleLabel[selected.role] },
                              ...data.assignableRoles
                                .filter((item) => item !== selected.role)
                                .map((item) => ({ value: item, label: roleLabel[item] })),
                            ]}
                          />
                        </label>
                        <label>Role-change reason <em>Only when role changes</em><input name="roleReason" placeholder="Administrative reason" maxLength={240} /></label>
                      </div>
                      <div className={styles.infoNote}>Your own employee ID, department and role are protected from casual self-modification.</div>
                    </div>
                    <div className={styles.modalFooter}>
                      <span>Profile updates are audited.</span>
                      {data.capabilities.canUpdate ? <button className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save profile"}</button> : null}
                    </div>
                  </form>
                ) : null}

                {manageTab === "training" && data.capabilities.canManageTraining ? (
                  <form onSubmit={saveTraining} className={styles.tabForm} noValidate>
                    <div className={styles.tabScroll}>
                      <div className={styles.sectionTitle}>
                        <div><span>Training entitlement</span><h3>Module access</h3></div>
                        <p>Completed or in-progress history cannot be silently removed.</p>
                      </div>
                      <div className={styles.moduleGrid}>
                        {activeModules.map((module) => {
                          const assignment = selected.assignments.find((item) => item.module.id === module.id);
                          const locked = !!assignment && (assignment.status !== "ASSIGNED" || assignment.attemptCount > 0);
                          return (
                            <label className={`${styles.moduleCard} ${locked ? styles.locked : ""}`} key={module.id}>
                              <input type="checkbox" name={`training:${module.id}`} defaultChecked={!!assignment} disabled={locked} />
                              <span>
                                <strong>{module.title}</strong>
                                <small>{assignment ? `${assignment.status.replace("_", " ").toLowerCase()}${locked ? " · history protected" : ""}` : "Not assigned"}</small>
                              </span>
                              <i>{assignment ? "Assigned" : "Available"}</i>
                            </label>
                          );
                        })}
                      </div>
                      <div className={styles.infoNote}>Removing an untouched ASSIGNED module is allowed. In-progress or historical training is retained for reporting and audit integrity.</div>
                    </div>
                    <div className={styles.modalFooter}>
                      <span>{selected.assignments.length} module assignment{selected.assignments.length === 1 ? "" : "s"} currently recorded.</span>
                      <button className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save training access"}</button>
                    </div>
                  </form>
                ) : null}

                {manageTab === "security" && canShowSecurityTab ? (
                  <div className={styles.securityWorkspace}>
                    <div className={styles.securityMenu}>
                      <div className={styles.sectionTitleCompact}><span>Account security</span><h3>Administrative actions</h3></div>
                      {data.capabilities.canResetPassword ? <button type="button" className={securityAction === "password" ? styles.securitySelected : ""} onClick={() => { setSecurityAction("password"); setError(""); }}><span><b>Reset password</b><small>Set a new credential and revoke existing sessions.</small></span><strong>›</strong></button> : null}
                      {data.capabilities.canRevokeSessions ? <button type="button" className={securityAction === "sessions" ? styles.securitySelected : ""} onClick={() => { setSecurityAction("sessions"); setError(""); }}><span><b>Revoke sessions</b><small>Immediately sign this employee out of active sessions.</small></span><strong>›</strong></button> : null}
                      {data.capabilities.canDisable && selected.id !== data.currentUserId ? <button type="button" className={securityAction === "status" ? styles.securitySelected : ""} onClick={() => { setSecurityAction("status"); setError(""); }}><span><b>{selected.status === "ACTIVE" ? "Disable account" : "Enable account"}</b><small>{selected.status === "ACTIVE" ? "Block future access and revoke active sessions." : "Restore access for this retained employee record."}</small></span><strong>›</strong></button> : null}
                      {data.capabilities.canDelete && selected.id !== data.currentUserId ? <button type="button" className={`${styles.securityDanger} ${securityAction === "delete" ? styles.securitySelected : ""}`} onClick={() => { setSecurityAction("delete"); setError(""); }}><span><b>Delete account</b><small>Permanent deletion only when no protected history exists.</small></span><strong>›</strong></button> : null}
                    </div>

                    <div className={styles.securityEditor}>
                      {!securityAction ? (
                        <div className={styles.securityPlaceholder}>
                          <div className={styles.securityMark}>✓</div>
                          <h3>Security authority protected</h3>
                          <p>Select an administrative action. Each operation is checked and recorded by the local demo authority layer.</p>
                        </div>
                      ) : (
                        <form onSubmit={runSecurity} className={styles.securityForm} noValidate>
                          <div className={styles.securityFormHeader}>
                            <span>Selected action</span>
                            <h3>{securityTitle(securityAction)}</h3>
                            <p>{securityAction === "delete" ? "This request cannot erase protected training or achievement history." : "A reason is required for this privileged operation."}</p>
                          </div>
                          {securityAction === "password" ? (
                            <div className={styles.securityFields}>
                              <label>New password<input data-autofocus name="password" type="password" autoComplete="new-password" /></label>
                              <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" /></label>
                              <p>Use 14–128 characters with uppercase, lowercase, number and symbol.</p>
                            </div>
                          ) : null}
                          <label className={styles.reasonField}>Administrative reason<input data-autofocus={securityAction !== "password" ? true : undefined} name="reason" maxLength={240} placeholder="Why is this action required?" /></label>
                          {securityAction === "delete" ? <div className={styles.deleteWarning}><b>Permanent operation</b><span>If protected training history exists, the demo authority layer will reject deletion and the account should be disabled instead.</span></div> : null}
                          <div className={styles.securityFormActions}>
                            <button type="button" className={styles.secondary} onClick={() => { setSecurityAction(null); setError(""); }}>Cancel</button>
                            <button className={securityAction === "delete" ? styles.danger : styles.primary} disabled={busy}>{busy ? "Working…" : "Review action"}</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={pendingConfirmation?.kind === "role"}
        title="Apply this role change?"
        description="Role changes alter server-side authorization immediately and are recorded in the audit trail."
        confirmLabel="Confirm role change"
        busy={busy}
        details={selected && pendingConfirmation?.kind === "role" ? [
          { label: "Employee", value: `${selected.name} · ${selected.employeeId}` },
          { label: "Current role", value: roleLabel[selected.role] },
          { label: "New role", value: roleLabel[pendingConfirmation.nextRole] },
          { label: "Reason", value: pendingConfirmation.roleReason },
        ] : []}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => pendingConfirmation?.kind === "role" ? commitProfile(pendingConfirmation) : undefined}
      />

      <AdminConfirmDialog
        open={pendingConfirmation?.kind === "training"}
        title="Apply training access changes?"
        description="This changes the modules visible and accessible to the employee. History-protected assignments are retained automatically."
        confirmLabel="Confirm training access"
        busy={busy}
        details={selected && pendingConfirmation?.kind === "training" ? [
          { label: "Employee", value: `${selected.name} · ${selected.employeeId}` },
          { label: "Assignments added", value: pendingConfirmation.added },
          { label: "Assignments removed", value: pendingConfirmation.removed },
          { label: "Protected history", value: selected.assignments.filter((a) => a.status !== "ASSIGNED" || a.attemptCount > 0).length },
        ] : []}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={commitTraining}
      />

      <AdminConfirmDialog
        open={pendingConfirmation?.kind === "security"}
        title={pendingConfirmation?.kind === "security" ? securityTitle(pendingConfirmation.action) : "Confirm security action"}
        description={pendingConfirmation?.kind === "security" && pendingConfirmation.action === "delete"
          ? "Permanent deletion is attempted only when no protected training or achievement history exists. Otherwise the demo authority layer rejects it."
          : "This privileged account-security operation will take effect immediately after local demo authorization."}
        confirmLabel={pendingConfirmation?.kind === "security" && pendingConfirmation.action === "delete" ? "Permanently delete" : "Confirm security action"}
        tone={pendingConfirmation?.kind === "security" && (pendingConfirmation.action === "delete" || (pendingConfirmation.action === "status" && selected?.status === "ACTIVE")) ? "danger" : "default"}
        busy={busy}
        details={selected && pendingConfirmation?.kind === "security" ? [
          { label: "Employee", value: `${selected.name} · ${selected.employeeId}` },
          { label: "Action", value: securityTitle(pendingConfirmation.action) },
          { label: "Active sessions", value: selected._count.authSessions },
          { label: "Reason", value: pendingConfirmation.reason },
        ] : []}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={commitSecurity}
      />
    </div>
  );
}
