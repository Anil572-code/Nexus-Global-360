"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!employeeId.trim() || !password) {
      setError("Enter your employee ID and password to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, password }),
      });
      const data = (await response.json()) as { message?: string; user?: { role?: string } };
      if (!response.ok) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }
      window.location.assign(data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN" || data.user?.role === "TRAINING_MANAGER" || data.user?.role === "SAFETY_MANAGER" || data.user?.role === "SUPERVISOR" ? "/admin" : "/dashboard");
    } catch {
      setError("Unable to reach the training portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate aria-busy={loading}>
      <label className="field-label" htmlFor="employeeId">Employee ID</label>
      <input
        id="employeeId"
        className="text-input"
        value={employeeId}
        onChange={(event) => setEmployeeId(event.target.value)}
        autoComplete="username"
        spellCheck={false}
        placeholder="Enter employee ID"
        aria-describedby={error ? "login-error" : undefined}
      />

      <div className="password-row">
        <label className="field-label" htmlFor="password">Password</label>
        <span className="field-hint">Employee account</span>
      </div>
      <input
        id="password"
        className="text-input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        placeholder="Enter password"
        aria-describedby={error ? "login-error" : undefined}
      />

      {error ? <div id="login-error" className="form-error" role="alert">{error}</div> : null}

      <button className="primary-button login-button" disabled={loading} type="submit">
        {loading ? "Signing in…" : "Sign in to training"}
      </button>

      <div className="secure-note">
        <span className="secure-dot" aria-hidden="true" />
        Credentials are validated for authorized employee and administrator access.
      </div>
    </form>
  );
}
