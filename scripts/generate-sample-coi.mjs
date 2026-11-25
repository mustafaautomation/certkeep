import { mkdirSync, writeFileSync } from "node:fs";

const lines = [
  "CERTIFICATE OF LIABILITY INSURANCE",
  "Certificate holder: Harbor General Contractors",
  "Insured: Northline Electrical LLC",
  "Issuer: Pinnacle Mutual Insurance",
  "Policy number: PM-COI-204418",
  "Issue date: 2026-02-01",
  "Expiration date: 2027-06-30",
  "Coverage: Commercial general liability",
  "This document is a fictional Certkeep sample. It is not an insurance policy.",
];

function esc(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

let y = 740;
const commands = ["BT", "/F1 16 Tf"];
lines.forEach((line, index) => {
  if (index === 1) commands.push("/F1 12 Tf");
  commands.push(`1 0 0 1 54 ${y} Tm (${esc(line)}) Tj`);
  y -= index === 0 ? 36 : 22;
});
commands.push("ET");
const stream = commands.join("\n");
const length = Buffer.byteLength(stream, "utf8");

const objects = [
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
  "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
  "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
  `4 0 obj << /Length ${length} >> stream\n${stream}\nendstream endobj\n`,
  "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
];

let pdf = "%PDF-1.4\n";
const offsets = [0];
for (const object of objects) {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += object;
}
const xref = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let index = 1; index <= objects.length; index += 1) {
  pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

mkdirSync("public/samples", { recursive: true });
writeFileSync("public/samples/sample-coi.pdf", pdf);
console.log(`Wrote public/samples/sample-coi.pdf (${Buffer.byteLength(pdf, "utf8")} bytes)`);
