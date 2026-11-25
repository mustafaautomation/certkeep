export function pdfToText(bytes: Uint8Array) {
  const raw = Buffer.from(bytes).toString("latin1");
  const matches = raw.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g);
  const lines: string[] = [];
  for (const match of matches) {
    const inner = match[0].replace(/\)\s*Tj$/, "").slice(1);
    lines.push(inner.replace(/\\n/g, "\n").replace(/\\(.)/g, "$1"));
  }
  return lines.join("\n");
}

export interface ExtractedFields {
  holder: string;
  insured: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  source: "parser" | "groq" | "gemini" | "mock";
  note: string;
}

function field(text: string, label: string) {
  const match = text.match(new RegExp(`${label}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

export function parseCertificateText(text: string): ExtractedFields | null {
  const holder = field(text, "Certificate holder");
  const insured = field(text, "Insured");
  const issuer = field(text, "Issuer");
  const number = field(text, "Policy number");
  const issueDate = field(text, "Issue date");
  const expiryDate = field(text, "Expiration date");
  if (!holder || !issuer || !expiryDate) return null;
  return {
    holder,
    insured,
    issuer,
    number,
    issueDate,
    expiryDate,
    source: "parser",
    note: "Fields were read from the document text. Confirm them before they are saved.",
  };
}

export async function extractCertificate(input: {
  bytes: Buffer;
  fileName: string;
  now?: Date;
}): Promise<ExtractedFields> {
  const text = pdfToText(input.bytes);
  const parsed = parseCertificateText(text);
  if (parsed) return parsed;

  if (process.env.GROQ_API_KEY) {
    const fromGroq = await extractWithGroq(text);
    if (fromGroq) return fromGroq;
  }
  if (process.env.GEMINI_API_KEY) {
    const fromGemini = await extractWithGemini(text);
    if (fromGemini) return fromGemini;
  }

  const now = input.now ?? new Date();
  const issue = now.toISOString().slice(0, 10);
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 180);
  const expiryDate = expiry.toISOString().slice(0, 10);
  return {
    holder: "Harbor General Contractors",
    insured: "Uploaded vendor",
    issuer: "Sample Mutual Insurance",
    number: "MOCK-POLICY",
    issueDate: issue,
    expiryDate,
    source: "mock",
    note: "No model key is configured and the file had no labeled fields. These placeholders were not read from the file. Edit them, then confirm.",
  };
}

async function extractWithGroq(text: string): Promise<ExtractedFields | null> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract certificate fields. Reply with JSON only: holder, insured, issuer, number, issueDate, expiryDate. Dates must be YYYY-MM-DD. Use empty strings when unknown.",
          },
          { role: "user", content: text.slice(0, 12_000) },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return jsonFields(payload.choices?.[0]?.message?.content ?? "", "groq");
  } catch {
    return null;
  }
}

async function extractWithGemini(text: string): Promise<ExtractedFields | null> {
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract certificate fields as JSON with keys holder, insured, issuer, number, issueDate, expiryDate. Dates must be YYYY-MM-DD.\n\n${text.slice(0, 12_000)}`,
                },
              ],
            },
          ],
        }),
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return jsonFields(payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "", "gemini");
  } catch {
    return null;
  }
}

function jsonFields(raw: string, source: "groq" | "gemini"): ExtractedFields | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<ExtractedFields>;
    if (!parsed.issuer && !parsed.expiryDate && !parsed.holder) return null;
    return {
      holder: String(parsed.holder ?? ""),
      insured: String(parsed.insured ?? ""),
      issuer: String(parsed.issuer ?? ""),
      number: String(parsed.number ?? ""),
      issueDate: String(parsed.issueDate ?? ""),
      expiryDate: String(parsed.expiryDate ?? ""),
      source,
      note: `Fields came from ${source}. Confirm them before they are saved.`,
    };
  } catch {
    return null;
  }
}
