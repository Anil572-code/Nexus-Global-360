"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminDropdown from "./AdminDropdown";
import { useAdminPortalBehavior } from "./useAdminPortalBehavior";
import styles from "./AdminOperationsWorkspace.module.css";

type Department = { id: string; code: string; name: string };
type Module = { id: string; slug: string; title: string; durationMinutes: number };
type User = { id: string; employeeId: string; name: string; department: string; departmentId: string | null };
type Assignment = {
  id: string; status: string; assignedAt: string; dueAt: string | null; completedAt: string | null; attemptCount: number;
  user: User & { status: string };
  module: { id: string; slug: string; title: string; isActive: boolean };
};
type Payload = {
  departments: Department[]; modules: Module[]; users: User[]; assignments: Assignment[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
type Review = {
  targetType: string; targetLabel: string; employeesAffected: number; modulesSelected: number; requestedPairs: number;
  alreadyAssigned: number; newAssignments: number; dueAt: string | null; modules: Array<{id:string;title:string}>;
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

export default function AdminAssignmentsWorkspace() {
  const [data, setData] = useState<Payload | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState("DEPARTMENT");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [reason, setReason] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (departmentFilter) params.set("departmentId", departmentFilter);
    if (moduleFilter) params.set("moduleId", moduleFilter);
    setData(await api(`/api/admin/assignments?${params.toString()}`));
  }, [q, status, departmentFilter, moduleFilter, page]);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  const plan = useMemo(() => ({
    targetType,
    ...(targetType === "DEPARTMENT" ? { departmentId } : { userIds: selectedUsers }),
    moduleIds: selectedModules,
    ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
  }), [targetType, departmentId, selectedUsers, selectedModules, dueAt]);

  function resetDialog() {
    setTargetType("DEPARTMENT"); setDepartmentId(""); setSelectedUsers([]); setSelectedModules([]);
    setDueAt(""); setReason(""); setReview(null); setFinalConfirm(false); setError("");
  }

  const closePortal = useCallback(() => {
    if (busy) return;
    setOpen(false);
    resetDialog();
  }, [busy]);

  const portal = useAdminPortalBehavior<HTMLElement>({ open, busy, onClose: closePortal });

  async function preview(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { setReview(await api("/api/admin/assignments/preview", { method: "POST", body: JSON.stringify(plan) })); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to review assignment."); }
    finally { setBusy(false); }
  }

  async function apply() {
    if (!review) return;
    setBusy(true); setError("");
    try {
      const result = await api("/api/admin/assignments/bulk", {
        method: "POST",
        body: JSON.stringify({ ...plan, reason }),
      });
      setFinalConfirm(false); setOpen(false); resetDialog();
      setNotice(`${result.created} new training assignment(s) created; ${result.skippedExisting} existing assignment(s) preserved.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to assign training."); }
    finally { setBusy(false); }
  }

  function toggle(list: string[], value: string, setter: (value: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setReview(null);
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.heading}>
        <div><div className={styles.eyebrow}>Training operations</div><h1>Assignments</h1><p>Assign active training to departments or selected employees with server-side duplicate protection.</p></div>
        <button className={styles.primary} onClick={() => { resetDialog(); setOpen(true); }}>Assign training</button>
      </section>

      {notice ? <div className={styles.success}>{notice}</div> : null}
      {error && !open ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.toolbar}>
        <input value={q} onChange={(e) => {setQ(e.target.value);setPage(1);}} placeholder="Search employee" aria-label="Search assignments"/>
        <AdminDropdown ariaLabel="Assignment status" value={status} onChange={(v)=>{setStatus(v);setPage(1);}} options={[
          { value:"", label:"All statuses" }, { value:"ASSIGNED", label:"Assigned" }, { value:"IN_PROGRESS", label:"In progress" }, { value:"COMPLETED", label:"Completed" },
        ]}/>
        <AdminDropdown ariaLabel="Department filter" value={departmentFilter} onChange={(v)=>{setDepartmentFilter(v);setPage(1);}} options={[
          {value:"",label:"All departments"}, ...(data?.departments.map((d)=>({value:d.id,label:d.name})) ?? [])
        ]}/>
        <AdminDropdown ariaLabel="Module filter" value={moduleFilter} onChange={(v)=>{setModuleFilter(v);setPage(1);}} options={[
          {value:"",label:"All modules"}, ...(data?.modules.map((m)=>({value:m.id,label:m.title})) ?? [])
        ]}/>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><span>{data?.pagination.total ?? 0} assignments</span><span>Browser-local demo training access</span></div>
        <div style={{overflowX:"auto"}}>
          <table className={styles.table}>
            <thead><tr><th>Employee</th><th>Department</th><th>Module</th><th>Status</th><th>Due</th><th>Assigned</th></tr></thead>
            <tbody>{data?.assignments.map((item)=><tr key={item.id}>
              <td><strong>{item.user.name}</strong><span className={styles.subtle}>{item.user.employeeId}</span></td>
              <td>{item.user.department}</td><td>{item.module.title}</td>
              <td><span className={`${styles.status} ${item.status==="IN_PROGRESS"?styles.warning:""} ${item.status==="COMPLETED"?"":""}`}>{item.status.replace("_"," ")}</span></td>
              <td>{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "—"}</td><td>{new Date(item.assignedAt).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table>
          {data && data.assignments.length===0?<div className={styles.empty}>No assignments match the current filters.</div>:null}
        </div>
        {data && data.pagination.totalPages>1?<div className={styles.pagination}><button className={styles.secondary} disabled={page<=1} onClick={()=>setPage((p)=>p-1)}>Previous</button><span>Page {data.pagination.page} of {data.pagination.totalPages}</span><button className={styles.secondary} disabled={page>=data.pagination.totalPages} onClick={()=>setPage((p)=>p+1)}>Next</button></div>:null}
      </section>

      {open ? <div className={styles.overlay} role="presentation" onMouseDown={portal.onBackdropMouseDown}>
        <section ref={portal.dialogRef} data-admin-layer="true" className={styles.dialog} role="dialog" aria-modal="true" aria-label="Assign training" onKeyDown={portal.onDialogKeyDown}>
          <header className={styles.dialogHeader}><div><span>Bulk assignment authority</span><h2>Assign training</h2></div><button data-autofocus className={styles.close} onClick={closePortal}>×</button></header>
          <div className={styles.dialogBody}>
            {error?<div className={styles.error}>{error}</div>:null}
            {!review ? <form id="assignment-plan" onSubmit={preview} className={styles.workspace}>
              <div className={styles.grid2}>
                <label className={styles.field}>Target
                  <AdminDropdown ariaLabel="Assignment target" value={targetType} onChange={(v)=>{setTargetType(v);setReview(null);}} options={[
                    {value:"DEPARTMENT",label:"Department"}, {value:"USERS",label:"Selected employees"}
                  ]}/>
                </label>
                {targetType==="DEPARTMENT"?<label className={styles.field}>Department
                  <AdminDropdown ariaLabel="Target department" value={departmentId} onChange={(v)=>{setDepartmentId(v);setReview(null);}} placeholder="Select department" options={data?.departments.map((d)=>({value:d.id,label:d.name}))??[]}/>
                </label>:<label className={styles.field}>Due date <input type="datetime-local" value={dueAt} onChange={(e)=>{setDueAt(e.target.value);setReview(null);}}/></label>}
                {targetType==="DEPARTMENT"?<label className={styles.field}>Due date <input type="datetime-local" value={dueAt} onChange={(e)=>{setDueAt(e.target.value);setReview(null);}}/></label>:null}
              </div>

              {targetType==="USERS"?<div><div className={styles.eyebrow}>Employees</div><div className={styles.cards}>{data?.users.map((user)=><label className={styles.checkCard} key={user.id}><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={()=>toggle(selectedUsers,user.id,setSelectedUsers)}/><span><strong>{user.name}</strong><span>{user.employeeId} · {user.department}</span></span></label>)}</div></div>:null}

              <div><div className={styles.eyebrow}>Modules</div><div className={styles.cards}>{data?.modules.map((module)=><label className={styles.checkCard} key={module.id}><input type="checkbox" checked={selectedModules.includes(module.id)} onChange={()=>toggle(selectedModules,module.id,setSelectedModules)}/><span><strong>{module.title}</strong><span>{module.durationMinutes} min · active</span></span></label>)}</div></div>
            </form> : <div className={styles.workspace}>
              <div className={styles.notice}><strong>{review.targetLabel}</strong><br/>Review the affected employee/module combinations before committing.</div>
              <div className={styles.review}>
                <div><strong>{review.employeesAffected}</strong><span>Employees</span></div>
                <div><strong>{review.modulesSelected}</strong><span>Modules</span></div>
                <div><strong>{review.newAssignments}</strong><span>New</span></div>
                <div><strong>{review.alreadyAssigned}</strong><span>Already assigned</span></div>
              </div>
              <label className={styles.field}>Administrative reason<input value={reason} onChange={(e)=>setReason(e.target.value)} minLength={3} required placeholder="Reason for this assignment batch"/></label>
            </div>}
          </div>
          <footer className={styles.dialogFooter}>
            <button className={styles.secondary} onClick={()=>{if(review){setReview(null);setFinalConfirm(false);setError("");}else{closePortal();}}}>{review?"Back":"Cancel"}</button>
            {!review?<button className={styles.primary} form="assignment-plan" type="submit" disabled={busy}>Review assignment</button>:<button className={styles.primary} onClick={()=>setFinalConfirm(true)} disabled={busy||reason.trim().length<3}>Final confirmation</button>}
          </footer>
        </section>
      </div>:null}

      <AdminConfirmDialog
        open={finalConfirm && !!review}
        title="Create these training assignments?"
        description="This is the final commit. Existing assignments are preserved and duplicates are skipped by the demo data layer."
        confirmLabel="Confirm assignments"
        busy={busy}
        details={review ? [
          { label: "Target", value: review.targetLabel },
          { label: "Employees", value: review.employeesAffected },
          { label: "New assignments", value: review.newAssignments },
          { label: "Already assigned", value: review.alreadyAssigned },
          { label: "Due", value: review.dueAt ? new Date(review.dueAt).toLocaleString() : "No due date" },
          { label: "Reason", value: reason },
        ] : []}
        onCancel={() => setFinalConfirm(false)}
        onConfirm={apply}
      />
    </div>
  );
}
