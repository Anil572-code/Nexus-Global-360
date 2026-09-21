"use client";

import { useEffect, useState } from "react";
import { resetProgress } from "@/lib/progress";

export default function ResetProgressButton() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function reset() {
    resetProgress();
    setDone(true);
    setOpen(false);
    window.setTimeout(() => window.location.reload(), 550);
  }

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => setOpen(true)}>{done ? "Progress reset" : "Reset prototype progress"}</button>
      {open && (
        <div className="modal-layer" role="presentation">
          <button className="modal-scrim" aria-label="Close reset confirmation" onClick={() => setOpen(false)} />
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <div className="confirm-icon">↺</div>
            <div className="eyebrow">Prototype control</div>
            <h2 id="reset-title">Reset training progress?</h2>
            <p>This clears local attempts, scores and achievements on this device. Prototype authentication is not affected.</p>
            <div className="confirm-actions"><button className="secondary-button" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="danger-button" type="button" onClick={reset}>Reset progress</button></div>
          </section>
        </div>
      )}
    </>
  );
}
