"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CertificateVerification.module.css";

type VerificationRecord = {
  certificateNumber: string;
  status: "ACTIVE" | "SUPERSEDED" | "REVOKED";
  employeeName: string;
  employeeId: string;
  moduleTitle: string;
  moduleSlug: string;
  performanceScore: number;
  maxScore: number;
  knowledgeAccuracy: number;
  completedAt: string;
  issuedAt: string;
  revision: number;
  currentCertificateNumber: string | null;
  valid: boolean;
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CertificateVerification({
  token,
}: {
  token: string;
}) {
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`/api/certificates/verify/${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as
          | VerificationRecord
          | { message?: string };

        if (!response.ok || !("certificateNumber" in data)) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Certificate could not be verified.",
          );
        }

        if (active) setRecord(data);
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Certificate could not be verified.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!record && !error) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <strong>Verifying certificate</strong>
          <span>Checking the governed Safety 360 certificate record.</span>
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className={styles.page}>
        <header className={styles.publicHeader}>
          <div className={styles.brand}>
            <img
              src="/brand/nexus-global-logo.png"
              alt="Nexus Global Logistics"
            />
            <div>
              <strong>Nexus Global Logistics</strong>
              <span>Safety 360 Certificate Verification</span>
            </div>
          </div>
        </header>

        <section className={styles.error}>
          <div className={styles.errorIcon}>!</div>
          <span>Certificate verification</span>
          <h1>Record not verified</h1>
          <p>{error}</p>
          <Link href="/certificates">Open Certificates</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.publicHeader}>
        <div className={styles.brand}>
          <img
            src="/brand/nexus-global-logo.png"
            alt="Nexus Global Logistics"
          />
          <div>
            <strong>Nexus Global Logistics</strong>
            <span>Safety 360 Certificate Verification</span>
          </div>
        </div>

        <div className={styles.publicBadge}>Public verification</div>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.eyebrow}>Governed training record</span>
            <h1>{record.moduleTitle}</h1>
            <p>
              Certificate evidence returned directly from the Nexus Safety 360
              certification authority.
            </p>
          </div>

          <div
            className={`${styles.validity} ${
              record.valid ? styles.valid : styles.notCurrent
            }`}
          >
            <span className={styles.validityDot} />
            {record.valid ? "Valid certificate" : record.status}
          </div>
        </div>

        <div className={styles.identity}>
          <div className={styles.avatar}>
            {record.employeeName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <span>Certificate holder</span>
            <strong>{record.employeeName}</strong>
            <small>Employee ID {record.employeeId}</small>
          </div>
        </div>

        <div className={styles.metrics}>
          <div>
            <span>Performance</span>
            <strong>
              {record.performanceScore} / {record.maxScore}
            </strong>
          </div>
          <div>
            <span>Knowledge accuracy</span>
            <strong>{record.knowledgeAccuracy}%</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{dateLabel(record.completedAt)}</strong>
          </div>
          <div>
            <span>Issued</span>
            <strong>{dateLabel(record.issuedAt)}</strong>
          </div>
        </div>

        <div className={styles.certificateNumber}>
          <div>
            <span>Certificate number</span>
            <strong>{record.certificateNumber}</strong>
          </div>
          <small>Revision {record.revision}</small>
        </div>

        {!record.valid && record.currentCertificateNumber ? (
          <div className={styles.notice}>
            <strong>Newer certificate revision available</strong>
            <span>
              This revision has been superseded. Current certificate:{" "}
              {record.currentCertificateNumber}
            </span>
          </div>
        ) : null}

        <footer className={styles.footer}>
          <div>
            <strong>Nexus Safety 360</strong>
            <span>
              Verification exposes only the certificate evidence required to
              confirm this training record.
            </span>
          </div>

          <Link href="/certificates">Open Certificates</Link>
        </footer>
      </section>
    </main>
  );
}
