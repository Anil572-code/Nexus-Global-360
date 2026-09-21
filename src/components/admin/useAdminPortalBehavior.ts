"use client";

import { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useRef } from "react";

type Options = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
};

export function useAdminPortalBehavior<T extends HTMLElement = HTMLElement>({
  open,
  busy = false,
  onClose,
}: Options) {
  const dialogRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      target?.focus();
    });

    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || busy || event.defaultPrevented) return;

      // Dropdown owns the first Escape. Its capture listener closes the menu and
      // stops propagation before this portal layer can react.
      if (document.querySelector('[data-admin-dropdown-open="true"]')) return;

      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-admin-layer="true"]'));
      if (layers.length > 0 && layers[layers.length - 1] !== dialogRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocusRef.current?.focus?.());
    };
  }, [open, busy, onClose]);

  function onDialogKeyDown(event: ReactKeyboardEvent<T>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  function onBackdropMouseDown(event: ReactMouseEvent<HTMLElement>) {
    if (!busy && event.currentTarget === event.target) onClose();
  }

  return { dialogRef, onDialogKeyDown, onBackdropMouseDown };
}
