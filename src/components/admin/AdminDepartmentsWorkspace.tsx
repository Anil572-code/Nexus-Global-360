"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminDropdown from "./AdminDropdown";
import { useAdminPortalBehavior } from "./useAdminPortalBehavior";
import styles from "./AdminOperationsWorkspace.module.css";

type Department = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  employeeCount: number;
  activeEmployeeCount: number;
};

type Payload = {
  canManage: boolean;
  departments: Department[];
};

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "Administrative request failed.");
  return data;
}

export default function AdminDepartmentsWorkspace() {
  const [data, setData] = useState<Payload | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState<"create" | "manage" | null>(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [manageReason, setManageReason] = useState("");
  const [confirmation, setConfirmation] = useState<null |
    { kind: "update"; name: string; code: string; reason: string } |
    { kind: "status" }
  >(null);

  const closePortal = useCallback(() => {
    if (busy) return;
    setConfirmation(null);
    setMode(null);
    setSelected(null);
    setManageReason("");
    setError("");
  }, [busy]);

  const portal = useAdminPortalBehavior<HTMLElement>({ open: !!mode, busy, onClose: closePortal });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("status", status);
    const result = await api(`/api/admin/departments?${params.toString()}`);
    setData(result);
  }, [q, status]);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/departments", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), code: form.get("code") }),
      });
      setMode(null);
      setNotice("Department created successfully.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create department."); }
    finally { setBusy(false); }
  }

  function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const code = String(form.get("code") || "").trim();
    const reason = manageReason.trim();
    if (name.length < 2 || code.length < 2) { setError("Department name and code are required."); return; }
    if (reason.length < 3) { setError("Enter an administrative reason before saving department changes."); return; }
    setError("");
    setConfirmation({ kind: "update", name, code, reason });
  }

  async function commitUpdate() {
    if (!selected || confirmation?.kind !== "update") return;
    setBusy(true); setError("");
    try {
      await api(`/api/admin/departments/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: confirmation.name, code: confirmation.code, reason: confirmation.reason }),
      });
      setConfirmation(null); setMode(null); setSelected(null); setManageReason("");
      setNotice("Department updated successfully.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update department."); setConfirmation(null); }
    finally { setBusy(false); }
  }

  function toggleStatus() {
    if (!selected) return;
    if (manageReason.trim().length < 3) {
      setError("Enter an administrative reason before changing department status.");
      return;
    }
    setError("");
    setConfirmation({ kind: "status" });
  }

  async function commitStatus() {
    if (!selected || confirmation?.kind !== "status") return;
    setBusy(true); setError("");
    try {
      await api(`/api/admin/departments/${selected.id}/status`, {
        method: "POST",
        body: JSON.stringify({ isActive: !selected.isActive, reason: manageReason.trim() }),
      });
      setConfirmation(null); setMode(null); setSelected(null); setManageReason("");
      setNotice(`Department ${selected.isActive ? "deactivated" : "activated"} successfully.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to change department status."); setConfirmation(null); }
    finally { setBusy(false); }
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.heading}>
        <div><div className={styles.eyebrow}>Organization authority</div><h1>Departments</h1><p>Govern organizational units used for employee scope and bulk training assignment.</p></div>
        {data?.canManage ? <button className={styles.primary} onClick={() => { setSelected(null); setManageReason(""); setMode("create"); setError(""); }}>Create department</button> : null}
      </section>

      {notice ? <div className={styles.success}>{notice}</div> : null}
      {error && !mode ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.toolbar}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search department or code" aria-label="Search departments"/>
        <AdminDropdown ariaLabel="Department status" value={status} onChange={setStatus} options={[
          { value: "ALL", label: "All statuses" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}/>
        <div />
        <button className={styles.secondary} onClick={() => load().catch((e) => setError(e.message))}>Refresh</button>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><span>{data?.departments.length ?? 0} departments</span><span>Normalized organization registry</span></div>
        <div style={{overflowX:"auto"}}>
          <table className={styles.table}>
            <thead><tr><th>Department</th><th>Code</th><th>Employees</th><th>Active</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data?.departments.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td><td>{item.code}</td><td>{item.employeeCount}</td><td>{item.activeEmployeeCount}</td>
                  <td><span className={`${styles.status} ${!item.isActive ? styles.inactive : ""}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td><div className={styles.actions}>{data.canManage ? <button className={styles.secondary} onClick={() => { setSelected(item); setManageReason(""); setMode("manage"); setError(""); }}>Manage</button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.departments.length === 0 ? <div className={styles.empty}>No departments match the current filters.</div> : null}
        </div>
      </section>

      {mode ? <div className={styles.overlay} role="presentation" onMouseDown={portal.onBackdropMouseDown}>
        <section ref={portal.dialogRef} data-admin-layer="true" className={styles.dialog} role="dialog" aria-modal="true" aria-label={mode === "create" ? "Create department" : "Manage department"} onKeyDown={portal.onDialogKeyDown}>
          <header className={styles.dialogHeader}><div><span>Department authority</span><h2>{mode === "create" ? "Create department" : selected?.name}</h2></div><button data-autofocus className={styles.close} onClick={closePortal}>×</button></header>
          <div className={styles.dialogBody}>
            {error ? <div className={styles.error}>{error}</div> : null}
            {mode === "create" ? <form id="department-form" onSubmit={create} className={styles.grid2}>
              <label className={styles.field}>Department name<input name="name" required minLength={2}/></label>
              <label className={styles.field}>Department code<input name="code" required minLength={2} maxLength={32} placeholder="WAREHOUSE"/></label>
            </form> : selected ? <form id="department-form" onSubmit={update} className={styles.grid2}>
              <label className={styles.field}>Department name<input name="name" defaultValue={selected.name} required/></label>
              <label className={styles.field}>Department code<input name="code" defaultValue={selected.code} required/></label>
              <label className={styles.field} style={{gridColumn:"1 / -1"}}>Administrative reason<input value={manageReason} onChange={(e) => setManageReason(e.target.value)} required minLength={3} placeholder="Reason for this change"/></label>
              <div className={styles.notice} style={{gridColumn:"1 / -1"}}>{selected.activeEmployeeCount} active employee(s). A department cannot be deactivated until active employees are moved or disabled.</div>
            </form> : null}
          </div>
          <footer className={styles.dialogFooter}>
            {mode === "manage" && selected ? <button type="button" className={selected.isActive ? styles.danger : styles.secondary} disabled={busy} onClick={toggleStatus}>{selected.isActive ? "Deactivate" : "Activate"}</button> : null}
            <button className={styles.secondary} type="button" onClick={closePortal} disabled={busy}>Cancel</button>
            <button className={styles.primary} form="department-form" type="submit" disabled={busy}>{mode === "create" ? "Create department" : "Save changes"}</button>
          </footer>
        </section>
      </div> : null}

      <AdminConfirmDialog
        open={confirmation?.kind === "update"}
        title="Apply department changes?"
        description="Department identity is organizational authority. Renaming a department also synchronizes linked employee department values."
        confirmLabel="Confirm changes"
        busy={busy}
        details={selected && confirmation?.kind === "update" ? [
          { label: "Department", value: selected.name },
          { label: "New name", value: confirmation.name },
          { label: "New code", value: confirmation.code },
          { label: "Active employees", value: selected.activeEmployeeCount },
        ] : []}
        onCancel={() => setConfirmation(null)}
        onConfirm={commitUpdate}
      />

      <AdminConfirmDialog
        open={confirmation?.kind === "status"}
        title={selected?.isActive ? "Deactivate department?" : "Activate department?"}
        description={selected?.isActive
          ? "Deactivation is governed by the demo authority while active employees remain. Confirm only after organizational placement is correct."
          : "Activation makes this department available again for user placement and training operations."}
        confirmLabel={selected?.isActive ? "Deactivate department" : "Activate department"}
        tone={selected?.isActive ? "danger" : "default"}
        busy={busy}
        details={selected ? [
          { label: "Department", value: selected.name },
          { label: "Active employees", value: selected.activeEmployeeCount },
          { label: "Reason", value: manageReason },
        ] : []}
        onCancel={() => setConfirmation(null)}
        onConfirm={commitStatus}
      />
    </div>
  );
}
