"use client";

import { createPortal } from "react-dom";
import { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useId, useRef } from "react";
import styles from "./SignOutConfirmDialog.module.css";

type Props = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function SignOutConfirmDialog({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });

    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || busy || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocusRef.current?.focus?.());
    };
  }, [open, busy, onCancel]);

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  function onBackdropMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (!busy && event.currentTarget === event.target) onCancel();
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={onDialogKeyDown}
      >
        <div className={styles.header}>
          <div className={styles.icon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4.5H5.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9"/>
              <path d="m14.5 8 4 4-4 4M18.5 12H8"/>
            </svg>
          </div>
          <div>
            <span>Session confirmation</span>
            <h2 id={titleId}>Sign out of Safety 360?</h2>
          </div>
        </div>

        <div className={styles.body}>
          <p id={descriptionId}>
            Your current session will end. You&apos;ll need to sign in again to access your workspace.
          </p>
          <div className={styles.notice}>
            Any progress already saved in this browser will remain available for your account.
          </div>
        </div>

        <div className={styles.footer}>
          <button
            data-autofocus
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
