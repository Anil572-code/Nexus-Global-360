export type CertificatePdfData = {
  certificateNumber: string;
  verificationToken: string;
  revision: number;
  employeeName: string;
  employeeId: string;
  department: string;
  moduleTitle: string;
  moduleSlug: string;
  performanceScore: number;
  maxScore: number;
  knowledgeAccuracy: number;
  inspectionScore: number;
  controlScore: number;
  knowledgeScore: number;
  completionBonus: number;
  completedAt: string;
  issuedAt: string;
};

const PAGE_W = 841.89;
const PAGE_H = 595.28;

function escapePdf(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function estimatedWidth(value: string, size: number, factor = 0.49) {
  return value.length * size * factor;
}

function centered(
  value: string,
  y: number,
  size: number,
  font: "F1" | "F2" = "F1",
  factor = 0.49,
) {
  const x = Math.max(45, (PAGE_W - estimatedWidth(value, size, factor)) / 2);
  return `BT /${font} ${size} Tf ${x.toFixed(1)} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function right(
  value: string,
  rightX: number,
  y: number,
  size: number,
  font: "F1" | "F2" = "F1",
) {
  const x = Math.max(45, rightX - estimatedWidth(value, size));
  return `BT /${font} ${size} Tf ${x.toFixed(1)} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function createCertificatePdfBytesForValidation(
  data: CertificatePdfData,
  verificationUrl: string,
) {
  const commands = [
    "q", "1 1 1 rg", `0 0 ${PAGE_W} ${PAGE_H} re f`, "Q",
    "q", "0.071 0.239 0.337 RG", "6 w", "18 18 805.89 559.28 re S", "Q",
    "q", "0.812 0.416 0.153 RG", "1.3 w", "31 31 779.89 533.28 re S", "Q",

    "0.055 0.208 0.294 rg",
    "BT /F2 14 Tf 56 532 Td (NEXUS GLOBAL LOGISTICS) Tj ET",
    "0.33 0.43 0.48 rg",
    "BT /F1 7.2 Tf 56 516 Td (SAFETY 360 EMPLOYEE TRAINING) Tj ET",

    "0.40 0.49 0.54 rg",
    right("CERTIFICATE NUMBER", 786, 532, 6.6, "F2"),
    "0.13 0.29 0.36 rg",
    right(data.certificateNumber, 786, 516, 7.4, "F2"),

    "0.72 0.31 0.08 rg",
    centered("Certificate of Competency", 452, 22, "F2", 0.46),
    "q", "0.82 0.40 0.14 RG", "3 w", "390 438 62 0 re S", "Q",

    "0.29 0.39 0.44 rg",
    centered("This certificate is proudly presented to", 409, 10.5, "F1"),

    "0.04 0.18 0.26 rg",
    centered(data.employeeName, 367, 30, "F2", 0.47),

    "0.22 0.35 0.42 rg",
    centered(`Employee ID ${data.employeeId}  |  ${data.department}`, 344, 8.5, "F1"),

    "0.25 0.36 0.41 rg",
    centered("for successfully fulfilling all course and assessment requirements for", 307, 10.2, "F1", 0.47),

    "0.05 0.20 0.29 rg",
    centered(data.moduleTitle, 274, 21, "F2", 0.47),

    "0.36 0.45 0.50 rg",
    centered("This competency record is issued from the Nexus Safety 360 training record", 248, 7.6, "F1"),
    centered("maintained by Nexus Global Logistics.", 236, 7.6, "F1"),

    "q", "0.86 0.90 0.92 RG", "1 w", "151 199 540 0 re S", "Q",
    "q", "0.86 0.90 0.92 RG", "1 w", "151 152 540 0 re S", "Q",
    "q", "0.86 0.90 0.92 RG", "1 w", "330 160 0 31 re S", "Q",
    "q", "0.86 0.90 0.92 RG", "1 w", "510 160 0 31 re S", "Q",

    "0.42 0.50 0.55 rg",
    "BT /F2 6.8 Tf 209 184 Td (DATE OF ISSUE) Tj ET",
    "BT /F2 6.8 Tf 386 184 Td (DATE COMPLETED) Tj ET",
    "BT /F2 6.8 Tf 560 184 Td (ISSUING AUTHORITY) Tj ET",

    "0.08 0.23 0.31 rg",
    `BT /F2 10.5 Tf 203 165 Td (${escapePdf(dateLabel(data.issuedAt))}) Tj ET`,
    `BT /F2 10.5 Tf 384 165 Td (${escapePdf(dateLabel(data.completedAt))}) Tj ET`,
    "BT /F2 10.5 Tf 561 165 Td (Nexus Safety 360) Tj ET",

    "0.72 0.31 0.08 rg",
    centered("RECORDED PERFORMANCE", 126, 7.2, "F2"),

    "0.42 0.50 0.55 rg",
    "BT /F2 6.3 Tf 225 106 Td (OVERALL SCORE) Tj ET",
    "BT /F2 6.3 Tf 394 106 Td (KNOWLEDGE ACCURACY) Tj ET",
    "BT /F2 6.3 Tf 581 106 Td (REVISION) Tj ET",

    "0.06 0.22 0.30 rg",
    `BT /F2 13 Tf 216 87 Td (${escapePdf(`${data.performanceScore} / ${data.maxScore}`)}) Tj ET`,
    `BT /F2 13 Tf 416 87 Td (${escapePdf(`${data.knowledgeAccuracy}%`)}) Tj ET`,
    `BT /F2 13 Tf 600 87 Td (${escapePdf(String(data.revision))}) Tj ET`,

    "q", "0.88 0.91 0.93 RG", "1 w", "55 65 730 0 re S", "Q",
    "0.39 0.48 0.53 rg",
    "BT /F2 6.3 Tf 57 48 Td (CREDENTIAL VALIDATION) Tj ET",
    "BT /F1 6.2 Tf 57 36 Td (Authenticity and current status can be checked at:) Tj ET",
    `BT /F1 5.8 Tf 57 25 Td (${escapePdf(verificationUrl)}) Tj ET`,

    "0.82 0.40 0.14 RG", "1.6 w", "735 24 47 47 re S",
    "0.05 0.20 0.29 rg",
    "BT /F2 9 Tf 749 48 Td (NGL) Tj ET",
    "BT /F2 5 Tf 742 38 Td (SAFETY 360) Tj ET",
  ];

  const stream = commands.join("\n");
  const encoder = new TextEncoder();
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export function downloadCertificatePdf(data: CertificatePdfData) {
  const verificationUrl = `${window.location.origin}/certificates/verify?token=${encodeURIComponent(
    data.verificationToken,
  )}`;

  const bytes = createCertificatePdfBytesForValidation(data, verificationUrl);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${data.certificateNumber}-${data.moduleSlug}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
