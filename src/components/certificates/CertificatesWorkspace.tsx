"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadCertificatePdf,
  type CertificatePdfData,
} from "@/lib/certificate-pdf";
import styles from "./CertificatesWorkspace.module.css";

type CertificateModule = {
  moduleSlug: string;
  moduleTitle: string;
  maxScore: number;
  status: "AVAILABLE" | "IN_PROGRESS" | "LOCKED";
  retakeInProgress: boolean;
  certificate: CertificatePdfData | null;
};

type CertificateResponse = {
  generatedAt: string;
  user: {
    id: string;
    name: string;
    department: string;
  };
  summary: {
    available: number;
    total: number;
    inProgress: number;
  };
  modules: CertificateModule[];
};

type Confirmation =
  | {
      type: "download";
      certificate: CertificatePdfData;
    }
  | {
      type: "verify";
      certificate: CertificatePdfData;
    }
  | {
      type: "training";
      module: CertificateModule;
    };

const moduleNumbers: Record<string, string> = {
  "hazard-perception": "01",
  "working-at-height": "02",
  "safety-induction": "03",
  "fire-safety-emergency-evacuation": "04",
  "forklift-pedestrian-safety": "05",
  "manual-handling-ergonomics": "06",
};

const moduleOrder = [
  "hazard-perception",
  "working-at-height",
  "safety-induction",
  "fire-safety-emergency-evacuation",
  "forklift-pedestrian-safety",
  "manual-handling-ergonomics",
];

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CertificateArtwork({
  certificate,
}: {
  certificate: CertificatePdfData;
}) {
  return (
    <div className={styles.formalCertificate}>
      <div className={styles.formalOuterFrame} />
      <div className={styles.formalInnerFrame} />

      <header className={styles.formalHeader}>
        <div className={styles.formalBrand}>
          <img
            src="/brand/nexus-global-logo.png"
            alt="Nexus Global Logistics"
          />
          <div>
            <strong>Nexus Global Logistics</strong>
            <span>Safety 360 Employee Training</span>
          </div>
        </div>

        <div className={styles.formalReference}>
          <span>Certificate number</span>
          <strong>{certificate.certificateNumber}</strong>
        </div>
      </header>

      <main className={styles.formalBody}>
        <span className={styles.formalKicker}>Certificate of Competency</span>
        <div className={styles.formalAccentRule} />

        <p className={styles.formalIntro}>
          This certificate is proudly presented to
        </p>

        <h2 className={styles.formalRecipient}>{certificate.employeeName}</h2>

        <div className={styles.formalRecipientMeta}>
          <span>Employee ID {certificate.employeeId}</span>
          <i />
          <span>{certificate.department}</span>
        </div>

        <p className={styles.formalStatement}>
          for successfully fulfilling all course and assessment requirements for
        </p>

        <h3 className={styles.formalModule}>{certificate.moduleTitle}</h3>

        <p className={styles.formalRecognition}>
          This competency record is issued from the browser-local Nexus Safety
          360 demo training record.
        </p>

        <div className={styles.formalIssueLine}>
          <div>
            <span>Date of issue</span>
            <strong>{dateLabel(certificate.issuedAt)}</strong>
          </div>
          <div className={styles.formalIssueDivider} />
          <div>
            <span>Date completed</span>
            <strong>{dateLabel(certificate.completedAt)}</strong>
          </div>
          <div className={styles.formalIssueDivider} />
          <div>
            <span>Issuing authority</span>
            <strong>Nexus Safety 360</strong>
          </div>
        </div>

        <section className={styles.formalEvidence}>
          <span className={styles.formalEvidenceLabel}>
            Recorded performance
          </span>
          <div className={styles.formalEvidenceGrid}>
            <div>
              <span>Overall score</span>
              <strong>
                {certificate.performanceScore} / {certificate.maxScore}
              </strong>
            </div>
            <div>
              <span>Knowledge accuracy</span>
              <strong>{certificate.knowledgeAccuracy}%</strong>
            </div>
            <div>
              <span>Revision</span>
              <strong>{certificate.revision}</strong>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.formalFooter}>
        <div>
          <span>Credential validation</span>
          <strong>
            Certificate authenticity and current status can be checked through
            the Nexus public validation record.
          </strong>
        </div>

        <div className={styles.formalSeal} aria-label="Nexus Safety 360 issuing seal">
          <span>NGL</span>
          <strong>SAFETY 360</strong>
        </div>
      </footer>
    </div>
  );
}

export default function CertificatesWorkspace() {
  const router = useRouter();
  const [record, setRecord] = useState<CertificateResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState<CertificatePdfData | null>(null);
  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/certificates/me", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: "{}",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as
        | CertificateResponse
        | { message?: string };

      if (!response.ok || !("modules" in data)) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Certificates could not be loaded.",
        );
      }

      setRecord(data);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Certificates could not be loaded.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!preview && !confirmation) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (confirmation) {
        setConfirmation(null);
        return;
      }

      setPreview(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [preview, confirmation]);

  const orderedModules = useMemo(() => {
    if (!record) return [];

    const order = new Map(
      moduleOrder.map((slug, index): [string, number] => [slug, index]),
    );

    return [...record.modules].sort(
      (left, right) =>
        (order.get(left.moduleSlug) ?? 99) -
        (order.get(right.moduleSlug) ?? 99),
    );
  }, [record]);

  const executeConfirmation = () => {
    if (!confirmation) return;

    if (confirmation.type === "download") {
      downloadCertificatePdf(confirmation.certificate);
      setConfirmation(null);
      return;
    }

    if (confirmation.type === "verify") {
      const token = encodeURIComponent(
        confirmation.certificate.verificationToken,
      );
      setConfirmation(null);
      router.push(`/certificates/verify?token=${token}`);
      return;
    }

    const href = `/training/${confirmation.module.moduleSlug}`;
    setConfirmation(null);
    router.push(href);
  };

  if (!record && !error) {
    return (
      <div className={styles.portalState}>
        <div className={styles.spinner} />
        <strong>Loading certification workspace</strong>
        <span>
          Reconciling completed training records and certificate authority.
        </span>
      </div>
    );
  }

  if (!record) {
    return (
      <main className={styles.portalState}>
        <div className={styles.portalStateError}>
          <strong>Certification workspace unavailable</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <section
        className={styles.page}
        aria-label="Training certification workspace"
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Certification center</span>
            <h1>Training certificates</h1>
            <p>
              Review the credential issued for each completed Safety 360 module,
              preview it in A4 landscape format, then download the governed PDF.
            </p>
          </div>

          <button
            className={styles.refresh}
            type="button"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <span aria-hidden="true">↻</span>
            {refreshing ? "Refreshing…" : "Refresh record"}
          </button>
        </header>

        <div className={styles.summary}>
          <article>
            <span>Certificates earned</span>
            <strong>
              {record.summary.available} / {record.summary.total}
            </strong>
            <small>Current governed certificate records.</small>
          </article>

          <article>
            <span>Training in progress</span>
            <strong>{record.summary.inProgress}</strong>
            <small>Certificates remain locked until completion.</small>
          </article>

          <article>
            <span>Certificate owner</span>
            <strong>{record.user.name}</strong>
            <small>{record.user.id}</small>
          </article>

          <article>
            <span>Issuing authority</span>
            <strong>Safety 360</strong>
            <small>Nexus Global Logistics.</small>
          </article>
        </div>

        <section className={styles.registry}>
          <div className={styles.registryHead}>
            <div>
              <span className={styles.sectionEyebrow}>
                Certification registry
              </span>
              <h2>Six-module credential record</h2>
            </div>

            <div className={styles.registryKey}>
              <span><i className={styles.dotAvailable} /> Available</span>
              <span><i className={styles.dotProgress} /> In progress</span>
              <span><i className={styles.dotLocked} /> Not earned</span>
            </div>
          </div>

          <div className={styles.tableHead}>
            <span>Module</span>
            <span>Score</span>
            <span>Knowledge</span>
            <span>Issued</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          <div className={styles.rows}>
            {orderedModules.map((module) => {
              const certificate = module.certificate;
              const number = moduleNumbers[module.moduleSlug] ?? "—";

              return (
                <article
                  className={`${styles.row} ${
                    certificate ? styles.rowAvailable : ""
                  }`}
                  key={module.moduleSlug}
                >
                  <div className={styles.moduleCell}>
                    <div
                      className={`${styles.moduleBadge} ${
                        certificate ? styles.moduleBadgeAvailable : ""
                      }`}
                    >
                      {certificate ? "✓" : number}
                    </div>

                    <div>
                      <span>Module {number}</span>
                      <strong>{module.moduleTitle}</strong>

                      {module.retakeInProgress ? (
                        <small>
                          Retake in progress · current certificate remains valid
                        </small>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.dataCell}>
                    <span>Performance</span>
                    <strong>
                      {certificate
                        ? `${certificate.performanceScore} / ${certificate.maxScore}`
                        : "—"}
                    </strong>
                  </div>

                  <div className={styles.dataCell}>
                    <span>Knowledge</span>
                    <strong>
                      {certificate
                        ? `${certificate.knowledgeAccuracy}%`
                        : "—"}
                    </strong>
                  </div>

                  <div className={styles.dataCell}>
                    <span>Issued</span>
                    <strong>
                      {certificate
                        ? dateLabel(certificate.issuedAt)
                        : "—"}
                    </strong>
                  </div>

                  <div className={styles.statusCell}>
                    <span
                      className={`${styles.status} ${
                        module.status === "AVAILABLE"
                          ? styles.statusAvailable
                          : module.status === "IN_PROGRESS"
                            ? styles.statusProgress
                            : styles.statusLocked
                      }`}
                    >
                      {module.status === "AVAILABLE"
                        ? "Available"
                        : module.status === "IN_PROGRESS"
                          ? "In progress"
                          : "Not earned"}
                    </span>
                  </div>

                  <div className={styles.actionCell}>
                    {certificate ? (
                      <button
                        className={styles.primary}
                        type="button"
                        onClick={() => setPreview(certificate)}
                      >
                        View certificate
                      </button>
                    ) : (
                      <button
                        className={styles.secondary}
                        type="button"
                        onClick={() =>
                          setConfirmation({
                            type: "training",
                            module,
                          })
                        }
                      >
                        {module.status === "IN_PROGRESS"
                          ? "Resume training"
                          : "Open training"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className={styles.footer}>
          <span>
            Certificate files are generated from the current governed
            certificate revision.
          </span>
          <span>
            Updated{" "}
            {new Date(record.generatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </footer>
      </section>

      {preview ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreview(null);
            }
          }}
        >
          <section
            className={styles.previewDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-preview-title"
          >
            <header className={styles.previewHeader}>
              <div>
                <span>Certificate preview · A4 landscape</span>
                <strong id="certificate-preview-title">
                  {preview.moduleTitle}
                </strong>
              </div>

              <div className={styles.previewActions}>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={() =>
                    setConfirmation({
                      type: "verify",
                      certificate: preview,
                    })
                  }
                >
                  Validate authenticity
                </button>

                <button
                  className={styles.primary}
                  type="button"
                  onClick={() =>
                    setConfirmation({
                      type: "download",
                      certificate: preview,
                    })
                  }
                >
                  Download PDF
                </button>

                <button
                  className={styles.close}
                  type="button"
                  aria-label="Close certificate preview"
                  onClick={() => setPreview(null)}
                >
                  ×
                </button>
              </div>
            </header>

            <div className={styles.previewViewport}>
              <CertificateArtwork certificate={preview} />
            </div>

            <footer className={styles.previewFooter}>
              <span>
                Preview the certificate before downloading. The downloadable
                file uses the same governed certificate record.
              </span>
              <strong>{preview.certificateNumber}</strong>
            </footer>
          </section>
        </div>
      ) : null}

      {confirmation ? (
        <div
          className={`${styles.overlay} ${styles.confirmOverlay}`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmation(null);
            }
          }}
        >
          <section
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="certificate-confirm-title"
          >
            <div className={styles.confirmIcon}>?</div>

            <div className={styles.confirmCopy}>
              <span>Confirmation required</span>

              <h2 id="certificate-confirm-title">
                {confirmation.type === "download"
                  ? "Download the official certificate PDF?"
                  : confirmation.type === "verify"
                    ? "Open the public validation record?"
                    : confirmation.module.status === "IN_PROGRESS"
                      ? "Resume this training module?"
                      : "Open this training module?"}
              </h2>

              <p>
                {confirmation.type === "download"
                  ? "The A4 landscape PDF will be generated from the current governed certificate revision and saved through your browser."
                  : confirmation.type === "verify"
                    ? "The public validation record confirms whether this certificate is authentic and current. It exposes only the evidence required to validate the credential."
                    : "You will leave the Certificates workspace and continue in the selected training module."}
              </p>
            </div>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.primary}
                onClick={executeConfirmation}
              >
                {confirmation.type === "download"
                  ? "Download PDF"
                  : confirmation.type === "verify"
                    ? "Open validation"
                    : "Continue"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
