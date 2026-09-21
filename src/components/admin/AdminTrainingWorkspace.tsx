"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminConfirmDialog from "./AdminConfirmDialog";
import { useAdminPortalBehavior } from "./useAdminPortalBehavior";
import styles from "./AdminOperationsWorkspace.module.css";

type ModuleRow = {
  id: string; slug: string; title: string; description: string; durationMinutes: number;
  maxScore: number; isActive: boolean; assigned: number; inProgress: number; completed: number; completionRate: number;
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

export default function AdminTrainingWorkspace() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [selected, setSelected] = useState<ModuleRow | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<null | { title: string; description: string; durationMinutes: number; isActive: boolean; reason: string }>(null);

  const closePortal = useCallback(() => {
    if (busy) return;
    setPending(null);
    setSelected(null);
    setError("");
  }, [busy]);

  const portal = useAdminPortalBehavior<HTMLElement>({ open: !!selected, busy, onClose: closePortal });

  const load = useCallback(async () => {
    const result = await api("/api/admin/training");
    setModules(result.modules);
    setCanManage(result.canManage);
  }, []);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const next = {
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      durationMinutes: Number(form.get("durationMinutes")),
      isActive: form.get("isActive") === "on",
      reason: String(form.get("reason") || "").trim(),
    };
    if (next.title.length < 2 || next.description.length < 10 || !Number.isFinite(next.durationMinutes)) { setError("Complete the module details before continuing."); return; }
    if (next.reason.length < 3) { setError("Enter an administrative reason before changing the module."); return; }
    setError("");
    setPending(next);
  }

  async function commitModuleChange() {
    if (!selected || !pending) return;
    setBusy(true); setError("");
    try {
      await api(`/api/admin/training/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(pending),
      });
      setPending(null); setSelected(null);
      setNotice("Training module updated successfully.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update training module."); setPending(null); }
    finally { setBusy(false); }
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.heading}>
        <div><div className={styles.eyebrow}>Training operations</div><h1>Training modules</h1><p>Manage operational availability and metadata without exposing scoring or 360 runtime authority.</p></div>
      </section>

      {notice ? <div className={styles.success}>{notice}</div> : null}
      {error && !selected ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}><span>{modules.length} modules</span><span>Scoring and runtime rules remain protected</span></div>
        <div style={{overflowX:"auto"}}>
          <table className={styles.table}>
            <thead><tr><th>Module</th><th>Duration</th><th>Assigned</th><th>In progress</th><th>Completed</th><th>Rate</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {modules.map((item) => <tr key={item.id}>
                <td><strong>{item.title}</strong><span className={styles.subtle}>{item.slug}</span></td>
                <td>{item.durationMinutes} min</td><td>{item.assigned}</td><td>{item.inProgress}</td><td>{item.completed}</td><td>{item.completionRate}%</td>
                <td><span className={`${styles.status} ${!item.isActive ? styles.inactive : ""}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                <td><div className={styles.actions}>{canManage ? <button className={styles.secondary} onClick={() => { setSelected(item); setError(""); }}>Manage</button> : null}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? <div className={styles.overlay} role="presentation" onMouseDown={portal.onBackdropMouseDown}>
        <section ref={portal.dialogRef} data-admin-layer="true" className={styles.dialog} role="dialog" aria-modal="true" aria-label="Manage training module" onKeyDown={portal.onDialogKeyDown}>
          <header className={styles.dialogHeader}><div><span>Operational module authority</span><h2>{selected.title}</h2></div><button data-autofocus className={styles.close} onClick={closePortal}>×</button></header>
          <div className={styles.dialogBody}>
            {error ? <div className={styles.error}>{error}</div> : null}
            <form id="training-module-form" onSubmit={save} className={styles.grid2}>
              <label className={styles.field}>Title<input name="title" defaultValue={selected.title} required/></label>
              <label className={styles.field}>Duration (minutes)<input name="durationMinutes" type="number" min={1} max={240} defaultValue={selected.durationMinutes} required/></label>
              <label className={styles.field} style={{gridColumn:"1 / -1"}}>Description<textarea name="description" defaultValue={selected.description} required minLength={10}/></label>
              <label className={styles.checkCard} style={{gridColumn:"1 / -1"}}><input name="isActive" type="checkbox" defaultChecked={selected.isActive}/><span><strong>Available for assignment and employee access</strong><span>Turning this off prevents new attempts and hides the module from employee assignment visibility.</span></span></label>
              <label className={styles.field} style={{gridColumn:"1 / -1"}}>Administrative reason<input name="reason" required minLength={3} placeholder="Reason for this module change"/></label>
              <div className={styles.notice} style={{gridColumn:"1 / -1"}}>Module slug and max-score/scoring authority are deliberately not editable from Admin.</div>
            </form>
          </div>
          <footer className={styles.dialogFooter}><button className={styles.secondary} onClick={closePortal} disabled={busy}>Cancel</button><button className={styles.primary} form="training-module-form" type="submit" disabled={busy}>Review changes</button></footer>
        </section>
      </div> : null}

      <AdminConfirmDialog
        open={!!pending}
        title="Apply training module changes?"
        description="This changes operational training availability. Scoring rules and 360 runtime authority remain protected and are not part of this action."
        confirmLabel={pending?.isActive === false && selected?.isActive ? "Deactivate module" : "Confirm module changes"}
        tone={pending?.isActive === false && selected?.isActive ? "danger" : "default"}
        busy={busy}
        details={selected && pending ? [
          { label: "Module", value: selected.title },
          { label: "Next status", value: pending.isActive ? "Active" : "Inactive" },
          { label: "Assigned", value: selected.assigned },
          { label: "Reason", value: pending.reason },
        ] : []}
        onCancel={() => setPending(null)}
        onConfirm={commitModuleChange}
      />
    </div>
  );
}
