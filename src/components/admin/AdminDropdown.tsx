"use client";

import { CSSProperties, KeyboardEvent, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AdminDropdown.module.css";

export type AdminDropdownOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type Props = {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: AdminDropdownOption[];
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  compact?: boolean;
  onChange?: (value: string) => void;
};

export default function AdminDropdown({
  name,
  value,
  defaultValue = "",
  options,
  placeholder = "Select option",
  ariaLabel,
  disabled = false,
  compact = false,
  onChange,
}: Props) {
  const listboxId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selectedValue = controlled ? value ?? "" : internalValue;
  const selected = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const enabledOptions = useMemo(
    () => options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled),
    [options],
  );

  function positionMenu() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const margin = 8;
    const maxHeight = Math.min(300, Math.max(140, window.innerHeight - margin * 2));
    const estimatedHeight = Math.min(maxHeight, Math.max(44, options.length * 42 + 10));
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const openAbove = spaceBelow < Math.min(estimatedHeight, 190) && rect.top > spaceBelow;
    const top = openAbove
      ? Math.max(margin, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - margin - estimatedHeight, rect.bottom + 6);

    setMenuStyle({
      position: "fixed",
      left: Math.max(margin, Math.min(rect.left, window.innerWidth - rect.width - margin)),
      top,
      width: rect.width,
      maxHeight,
      zIndex: 160,
    });
  }

  function select(nextValue: string) {
    if (!controlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function openMenu(direction: 1 | -1 = 1) {
    if (disabled || !enabledOptions.length) return;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    const fallback = direction === 1 ? enabledOptions[0].index : enabledOptions[enabledOptions.length - 1].index;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : fallback);
    setOpen(true);
  }

  function moveActive(direction: 1 | -1) {
    if (!enabledOptions.length) return;
    const currentEnabled = enabledOptions.findIndex(({ index }) => index === activeIndex);
    const start = currentEnabled >= 0 ? currentEnabled : 0;
    const next = (start + direction + enabledOptions.length) % enabledOptions.length;
    setActiveIndex(enabledOptions[next].index);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      if (!open) openMenu(1);
      else moveActive(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      if (!open) openMenu(-1);
      else moveActive(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      if (!open) {
        openMenu(1);
      } else {
        const option = options[activeIndex];
        if (option && !option.disabled) select(option.value);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    const reposition = () => positionMenu();
    const outside = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const escapeFirst = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(false);
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escapeFirst, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escapeFirst, true);
    };
  }, [open, options.length]);

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""} ${disabled ? styles.disabled : ""}`}>
      {name ? <input type="hidden" name={name} value={selectedValue} disabled={disabled} /> : null}
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""} ${!selected ? styles.placeholder : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => { if (open) setOpen(false); else openMenu(1); }}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.value}>{selected?.label ?? placeholder}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel}
              className={styles.menu}
              data-admin-dropdown-open="true"
              style={menuStyle}
            >
              <div className={styles.menuInner}>
                {options.map((option, index) => (
                  <button
                    key={`${option.value}:${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={option.value === selectedValue}
                    disabled={option.disabled}
                    className={`${styles.option} ${option.value === selectedValue ? styles.selected : ""} ${index === activeIndex ? styles.activeOption : ""}`}
                    onMouseEnter={() => { if (!option.disabled) setActiveIndex(index); }}
                    onClick={() => select(option.value)}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      {option.description ? <small>{option.description}</small> : null}
                    </span>
                    {option.value === selectedValue ? <i aria-hidden="true">✓</i> : null}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
