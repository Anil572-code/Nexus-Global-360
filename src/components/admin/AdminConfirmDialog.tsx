"use client";

import { createPortal } from "react-dom";
import { useCallback, useId } from "react";
import { useAdminPortalBehavior } from "./useAdminPortalBehavior";
import styles from "./AdminConfirmDialog.module.css";

export type AdminConfirmDetail = {
  label: string;
  value: string | number;
};

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  details?: AdminConfirmDetail[];
  tone?: "default" | "danger";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  details = [],
  tone = "default",
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const close = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);
  const portal = useAdminPortalBehavior<HTMLDivElement>({ open, busy, onClose: close });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={portal.onBackdropMouseDown}>
      <div
        ref={portal.dialogRef}
        data-admin-layer="true"
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={portal.onDialogKeyDown}
      >
        <header className={styles.header}>
          <div className={`${styles.mark} ${tone === "danger" ? styles.dangerMark : ""}`} aria-hidden="true">
            {tone === "danger" ? "!" : "✓"}
          </div>
          <div>
            <span>Final confirmation</span>
            <h2 id={titleId}>{title}</h2>
          </div>
        </header>

        <div className={styles.body}>
          <p>{description}</p>
          {details.length > 0 ? (
            <dl className={styles.details}>
              {details.map((item) => (
                <div key={`${item.label}:${String(item.value)}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className={`${styles.notice} ${tone === "danger" ? styles.dangerNotice : ""}`}>
            {tone === "danger"
              ? "This action has material account or data consequences. Confirm only if the details above are correct."
              : "The demo authority layer will re-check your role and record the operation in the local audit trail."}
          </div>
        </div>

        <footer className={styles.footer}>
          <button data-autofocus type="button" className={styles.cancel} onClick={close} disabled={busy}>Cancel</button>
          <button
            type="button"
            className={tone === "danger" ? styles.danger : styles.confirm}
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
