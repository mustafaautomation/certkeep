import { daysUntil, isISODate, statusFor, todayISO } from "@/lib/dates";
import { HttpError } from "@/lib/http";
import { PLANS } from "@/lib/mode";
import { DEMO_PASSWORD_HASHES, hashPassword, verifyPassword } from "@/lib/passwords";
import { createSeed } from "@/lib/seed";
import { newId, newToken } from "@/lib/session";
import {
  DOC_LABEL,
  DOC_TYPES,
  REQUIRED_DOC_TYPES,
  type Actor,
  type AuditEvent,
  type CoverageSlot,
  type DocType,
  type DocumentRecord,
  type Plan,
  type PublicUser,
  type SessionClaims,
  type Vendor,
} from "@/lib/types";

const REMINDER_WINDOWS = [30, 14, 7] as const;

export interface DocumentInput {
  vendorId: string;
  type: DocType;
  holder: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  source: DocumentRecord["source"];
  fileName?: string | null;
  mime?: string | null;
  fileBase64?: string | null;
}

function publicUser(user: { id: string; email: string; name: string; platformRole: PublicUser["platformRole"] }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    platformRole: user.platformRole,
  };
}

function bestSlot(dates: string[], now: Date): CoverageSlot {
  if (dates.length === 0) return "missing";
  const statuses = dates.map((date) => statusFor(date, now));
  if (statuses.includes("valid")) return "valid";
  if (statuses.includes("expiring")) return "expiring";
  return "expired";
}

export class MemoryStore {
  private db = createSeed();

  reset(now = new Date()) {
    this.db = createSeed(now);
  }

  toActor(session: SessionClaims): Actor | null {
    const user = this.db.users.find((item) => item.id === session.userId);
    if (!user) return null;
    if (!session.orgId) {
      if (user.platformRole !== "superadmin") return null;
      return { user: publicUser(user), org: null, membership: null, readOnly: true };
    }
    const org = this.db.organizations.find((item) => item.id === session.orgId) ?? null;
    const membership = this.db.memberships.find(
      (item) => item.userId === session.userId && item.orgId === session.orgId,
    );
    if (!org || !membership) return null;
    return {
      user: publicUser(user),
      org,
      membership,
      readOnly: session.readOnly || membership.role === "viewer",
    };
  }

  login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.db.users.find((item) => item.email === normalized);
    const hash = user?.passwordHash ?? DEMO_PASSWORD_HASHES.dummy;
    const valid = verifyPassword(password, hash);
    if (!user || !valid || user.id === "user_demo") return null;
    const membership = this.db.memberships.find((item) => item.userId === user.id) ?? null;
    const org = membership
      ? this.db.organizations.find((item) => item.id === membership.orgId) ?? null
      : null;
    this.appendAudit({
      orgId: org?.id ?? null,
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      summary: `${user.name} signed in.`,
    });
    return { user: publicUser(user), org, membership };
  }

  signup(input: { name: string; email: string; password: string; orgName: string }) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const orgName = input.orgName.trim();
    if (name.length < 2) throw new HttpError(400, "Enter the account holder's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email.");
    if (input.password.length < 8) throw new HttpError(400, "Use at least 8 characters for the password.");
    if (orgName.length < 2) throw new HttpError(400, "Enter the organization name.");
    if (this.db.users.some((item) => item.email === email)) {
      throw new HttpError(409, "An account with that email already exists.");
    }
    const now = new Date().toISOString();
    const userId = newId("user");
    const orgId = newId("org");
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "org";
    let slug = slugBase;
    let suffix = 2;
    while (this.db.organizations.some((item) => item.slug === slug)) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }
    this.db.users.push({
      id: userId,
      email,
      name,
      passwordHash: hashPassword(input.password),
      platformRole: "user",
      createdAt: now,
    });
    this.db.organizations.push({
      id: orgId,
      name: orgName,
      slug,
      plan: "starter",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: now,
    });
    const membership = { id: newId("mem"), orgId, userId, role: "owner" as const };
    this.db.memberships.push(membership);
    this.appendAudit({
      orgId,
      actorId: userId,
      action: "org.create",
      entityType: "organization",
      entityId: orgId,
      summary: `${orgName} opened a Certkeep vault.`,
    });
    const user = this.db.users.find((item) => item.id === userId)!;
    const org = this.db.organizations.find((item) => item.id === orgId)!;
    return { user: publicUser(user), org, membership };
  }

  dashboard(orgId: string, now = new Date()) {
    const org = this.requireOrg(orgId);
    const vendors = this.db.vendors.filter((item) => item.orgId === orgId);
    const documents = this.db.documents.filter((item) => item.orgId === orgId);
    const upcoming = documents
      .map((item) => this.describeDocument(item, now))
      .filter((item) => item.status === "expiring")
      .sort((a, b) => a.daysLeft - b.daysLeft);
    const expired = documents
      .map((item) => this.describeDocument(item, now))
      .filter((item) => item.status === "expired")
      .sort((a, b) => a.daysLeft - b.daysLeft);
    const gaps = vendors
      .map((vendor) => ({
        vendorId: vendor.id,
        vendorName: vendor.name,
        trade: vendor.trade,
        publicId: vendor.publicId,
        reasons: this.gapReasons(vendor.id, now),
      }))
      .filter((item) => item.reasons.length > 0);
    const valid = documents.filter((item) => statusFor(item.expiryDate, now) === "valid").length;
    return {
      orgName: org.name,
      plan: org.plan,
      counts: {
        vendors: vendors.length,
        valid,
        expiring: upcoming.length,
        expired: expired.length,
        gaps: gaps.length,
      },
      upcoming,
      expired,
      gaps,
    };
  }

  listVendors(orgId: string, now = new Date()) {
    return this.db.vendors
      .filter((item) => item.orgId === orgId)
      .map((vendor) => this.vendorView(vendor, now))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getVendor(orgId: string, vendorId: string, now = new Date()) {
    const vendor = this.db.vendors.find((item) => item.id === vendorId && item.orgId === orgId);
    if (!vendor) return null;
    const documents = this.db.documents
      .filter((item) => item.vendorId === vendor.id)
      .map((item) => this.describeDocument(item, now))
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    const requests = this.db.requests
      .filter((item) => item.vendorId === vendor.id)
      .map((item) => this.requestView(item));
    return {
      ...this.vendorView(vendor, now),
      documents,
      requests,
      gaps: this.gapReasons(vendor.id, now),
    };
  }

  createVendor(
    orgId: string,
    actorId: string,
    input: { name: string; trade: string; contactName: string; email: string; phone: string; city: string },
  ) {
    const org = this.requireOrg(orgId);
    const limit = PLANS[org.plan].vendorLimit;
    const count = this.db.vendors.filter((item) => item.orgId === orgId).length;
    if (limit !== null && count >= limit) {
      throw new HttpError(402, `${PLANS[org.plan].name} includes ${limit} subcontractors. Move to Pro to add more.`);
    }
    const name = requiredText(input.name, "Enter the company name.");
    const trade = requiredText(input.trade, "Enter the trade.");
    const email = input.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid vendor email.");
    const vendor: Vendor = {
      id: newId("vendor"),
      orgId,
      name,
      trade,
      contactName: input.contactName.trim(),
      email,
      phone: input.phone.trim(),
      city: input.city.trim(),
      publicId: uniquePublicId(this.db.vendors, name),
      createdAt: new Date().toISOString(),
    };
    this.db.vendors.push(vendor);
    this.appendAudit({
      orgId,
      actorId,
      action: "vendor.create",
      entityType: "vendor",
      entityId: vendor.id,
      summary: `Registered ${vendor.name}.`,
    });
    return this.vendorView(vendor, new Date());
  }

  listDocuments(orgId: string, now = new Date()) {
    return this.db.documents
      .filter((item) => item.orgId === orgId)
      .map((item) => this.describeDocument(item, now))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }

  createDocument(orgId: string, actorId: string | null, input: DocumentInput, now = new Date()) {
    const vendor = this.db.vendors.find((item) => item.id === input.vendorId && item.orgId === orgId);
    if (!vendor) throw new HttpError(404, "That vendor is not in this vault.");
    if (!DOC_TYPES.includes(input.type)) throw new HttpError(400, "Choose a document type.");
    const issuer = requiredText(input.issuer, "Enter the issuer.");
    const number = requiredText(input.number, "Enter the document number.");
    if (!isISODate(input.issueDate) || !isISODate(input.expiryDate)) {
      throw new HttpError(400, "Use real issue and expiry dates.");
    }
    const org = this.requireOrg(orgId);
    let fileId: string | null = null;
    let fileName: string | null = null;
    if (input.fileBase64) {
      fileId = newId("file");
      fileName = (input.fileName || "certificate").slice(0, 180);
      this.db.files.push({
        id: fileId,
        orgId,
        fileName,
        mime: input.mime || "application/octet-stream",
        base64: input.fileBase64,
        createdAt: now.toISOString(),
      });
    }
    const record: DocumentRecord = {
      id: newId("doc"),
      orgId,
      vendorId: vendor.id,
      type: input.type,
      holder: input.holder.trim() || org.name,
      issuer,
      number,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      fileId,
      fileName,
      source: input.source,
      createdAt: now.toISOString(),
    };
    this.db.documents.push(record);
    this.appendAudit({
      orgId,
      actorId,
      action: input.source === "extract" ? "document.confirmed" : "document.create",
      entityType: "document",
      entityId: record.id,
      summary: `Saved ${DOC_LABEL[record.type]} ${record.number} for ${vendor.name}.`,
    });
    return this.describeDocument(record, now);
  }

  getFile(orgId: string, documentId: string) {
    const document = this.db.documents.find((item) => item.id === documentId && item.orgId === orgId);
    if (!document?.fileId) return null;
    const file = this.db.files.find((item) => item.id === document.fileId && item.orgId === orgId);
    if (!file) return null;
    return {
      fileName: file.fileName,
      mime: file.mime,
      bytes: Buffer.from(file.base64, "base64"),
    };
  }

  reminderBoard(orgId: string, now = new Date()) {
    const today = todayISO(now);
    const rows = this.db.documents
      .filter((item) => item.orgId === orgId)
      .flatMap((document) => {
        const vendor = this.db.vendors.find((item) => item.id === document.vendorId);
        return REMINDER_WINDOWS.map((daysBefore) => {
          const scheduledFor = shiftISO(document.expiryDate, -daysBefore);
          const sent = this.db.dispatches.find(
            (item) => item.documentId === document.id && item.daysBefore === daysBefore,
          );
          const state = sent ? "sent" : scheduledFor <= today ? "due" : "scheduled";
          return {
            id: `${document.id}-${daysBefore}`,
            documentId: document.id,
            vendorId: document.vendorId,
            vendorName: vendor?.name ?? "Vendor",
            type: document.type,
            typeLabel: DOC_LABEL[document.type],
            number: document.number,
            expiryDate: document.expiryDate,
            daysBefore,
            scheduledFor,
            state,
            subject: sent?.subject ?? null,
          };
        });
      })
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    const outbox = this.db.dispatches
      .filter((item) => item.orgId === orgId)
      .slice()
      .reverse();
    return { rows, outbox };
  }

  sweepReminders(orgId: string, actorId: string, now = new Date()) {
    const board = this.reminderBoard(orgId, now);
    const due = board.rows.filter((item) => item.state === "due");
    for (const row of due) {
      const vendor = this.db.vendors.find((item) => item.id === row.vendorId);
      const document = this.db.documents.find((item) => item.id === row.documentId);
      if (!vendor || !document) continue;
      const subject = `${DOC_LABEL[document.type]} for ${vendor.name} expires in ${row.daysBefore} days`;
      const body = [
        "This is a mocked Certkeep reminder. No email was delivered.",
        `To: ${vendor.email || "no address on file"}`,
        `Vendor: ${vendor.name}`,
        `Document: ${DOC_LABEL[document.type]} ${document.number}`,
        `Issuer: ${document.issuer}`,
        `Expiry: ${document.expiryDate}`,
        `Window: ${row.daysBefore} days`,
      ].join("\n");
      this.db.dispatches.push({
        id: newId("mail"),
        orgId,
        documentId: document.id,
        vendorId: vendor.id,
        daysBefore: row.daysBefore,
        sentAt: now.toISOString(),
        to: vendor.email,
        subject,
        body,
      });
      this.appendAudit({
        orgId,
        actorId,
        action: "reminder.mocked",
        entityType: "document",
        entityId: document.id,
        summary: `Queued a mocked ${row.daysBefore}-day reminder for ${vendor.name}.`,
      });
    }
    return { sent: due.length };
  }

  listRequests(orgId: string) {
    return this.db.requests
      .filter((item) => item.orgId === orgId)
      .map((item) => this.requestView(item))
      .reverse();
  }

  createRequest(orgId: string, actorId: string, vendorId: string, now = new Date()) {
    const vendor = this.db.vendors.find((item) => item.id === vendorId && item.orgId === orgId);
    if (!vendor) throw new HttpError(404, "That vendor is not in this vault.");
    const request = {
      id: newId("req"),
      orgId,
      vendorId,
      token: newToken(),
      createdAt: now.toISOString(),
      expiresAt: shiftISO(todayISO(now), 14),
      fulfilledAt: null,
    };
    this.db.requests.push(request);
    this.appendAudit({
      orgId,
      actorId,
      action: "request.create",
      entityType: "upload_request",
      entityId: request.id,
      summary: `Created an upload link for ${vendor.name}.`,
    });
    return this.requestView(request);
  }

  publicRequest(token: string, now = new Date()) {
    const request = this.db.requests.find((item) => item.token === token);
    if (!request) return null;
    const vendor = this.db.vendors.find((item) => item.id === request.vendorId);
    const org = this.db.organizations.find((item) => item.id === request.orgId);
    if (!vendor || !org) return null;
    const expired = request.expiresAt < todayISO(now);
    return {
      orgName: org.name,
      vendorName: vendor.name,
      trade: vendor.trade,
      expiresAt: request.expiresAt,
      fulfilled: Boolean(request.fulfilledAt),
      expired,
    };
  }

  fulfillRequest(token: string, input: Omit<DocumentInput, "vendorId" | "source">, now = new Date()) {
    const request = this.db.requests.find((item) => item.token === token);
    if (!request) throw new HttpError(404, "This upload link is not active.");
    if (request.fulfilledAt) throw new HttpError(409, "This upload link has already been used.");
    if (request.expiresAt < todayISO(now)) throw new HttpError(410, "This upload link has expired.");
    const saved = this.createDocument(
      request.orgId,
      null,
      { ...input, vendorId: request.vendorId, source: "vendor-upload" },
      now,
    );
    request.fulfilledAt = now.toISOString();
    const vendor = this.db.vendors.find((item) => item.id === request.vendorId);
    this.appendAudit({
      orgId: request.orgId,
      actorId: null,
      action: "request.fulfilled",
      entityType: "upload_request",
      entityId: request.id,
      summary: `${vendor?.name ?? "A vendor"} submitted ${DOC_LABEL[saved.type]} through an upload link.`,
    });
    return { id: saved.id, type: saved.type, status: saved.status };
  }

  listAudit(orgId: string) {
    return this.db.audit.filter((item) => item.orgId === orgId).slice().reverse();
  }

  billing(orgId: string) {
    const org = this.requireOrg(orgId);
    const vendors = this.db.vendors.filter((item) => item.orgId === orgId).length;
    return {
      plan: org.plan,
      vendorCount: vendors,
      vendorLimit: PLANS[org.plan].vendorLimit,
      stripeCustomerId: org.stripeCustomerId,
    };
  }

  setPlan(orgId: string, plan: Plan, actorId: string | null, via: "mock" | "stripe") {
    const org = this.requireOrg(orgId);
    if (plan !== "starter" && plan !== "pro") throw new HttpError(400, "Choose Starter or Pro.");
    const previous = org.plan;
    org.plan = plan;
    this.appendAudit({
      orgId,
      actorId,
      action: "billing.plan_changed",
      entityType: "organization",
      entityId: orgId,
      summary: `Plan changed from ${previous} to ${plan} via ${via}.`,
    });
    return this.billing(orgId);
  }

  updateOrg(orgId: string, actorId: string, name: string) {
    const org = this.requireOrg(orgId);
    const next = requiredText(name, "Enter the organization name.");
    org.name = next;
    this.appendAudit({
      orgId,
      actorId,
      action: "org.rename",
      entityType: "organization",
      entityId: orgId,
      summary: `Organization renamed to ${next}.`,
    });
    return { id: org.id, name: org.name, slug: org.slug, plan: org.plan };
  }

  publicProfile(publicId: string, now = new Date()) {
    const vendor = this.db.vendors.find((item) => item.publicId === publicId);
    if (!vendor) return null;
    const org = this.requireOrg(vendor.orgId);
    const documents = this.db.documents
      .filter((item) => item.vendorId === vendor.id)
      .map((item) => ({
        type: item.type,
        typeLabel: DOC_LABEL[item.type],
        issuer: item.issuer,
        expiryDate: item.expiryDate,
        status: statusFor(item.expiryDate, now),
      }))
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    return {
      orgName: org.name,
      vendorName: vendor.name,
      trade: vendor.trade,
      city: vendor.city,
      publicId: vendor.publicId,
      documents,
      checkedAt: now.toISOString(),
    };
  }

  demoBoard(now = new Date()) {
    const dashboard = this.dashboard("org_harbor", now);
    const vendors = this.db.vendors
      .filter((item) => item.orgId === "org_harbor")
      .map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        trade: vendor.trade,
        city: vendor.city,
        publicId: vendor.publicId,
        coverage: this.coverage(vendor.id, now),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { ...dashboard, vendors };
  }

  adminOverview(now = new Date()) {
    return {
      organizations: this.db.organizations.map((org) => {
        const vendors = this.db.vendors.filter((item) => item.orgId === org.id);
        const documents = this.db.documents.filter((item) => item.orgId === org.id);
        const gaps = vendors.filter((vendor) => this.gapReasons(vendor.id, now).length > 0).length;
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          vendors: vendors.length,
          documents: documents.length,
          expiring: documents.filter((item) => statusFor(item.expiryDate, now) === "expiring").length,
          gaps,
          createdAt: org.createdAt,
        };
      }),
    };
  }

  private vendorView(vendor: Vendor, now: Date) {
    return {
      id: vendor.id,
      name: vendor.name,
      trade: vendor.trade,
      contactName: vendor.contactName,
      email: vendor.email,
      phone: vendor.phone,
      city: vendor.city,
      publicId: vendor.publicId,
      coverage: this.coverage(vendor.id, now),
      gaps: this.gapReasons(vendor.id, now),
    };
  }

  private coverage(vendorId: string, now: Date) {
    const docs = this.db.documents.filter((item) => item.vendorId === vendorId);
    const coverage = {} as Record<DocType, CoverageSlot>;
    for (const type of DOC_TYPES) {
      coverage[type] = bestSlot(
        docs.filter((item) => item.type === type).map((item) => item.expiryDate),
        now,
      );
    }
    return coverage;
  }

  private gapReasons(vendorId: string, now: Date) {
    const coverage = this.coverage(vendorId, now);
    const reasons: string[] = [];
    for (const type of REQUIRED_DOC_TYPES) {
      if (coverage[type] === "missing") reasons.push(`Missing ${DOC_LABEL[type].toLowerCase()}`);
      if (coverage[type] === "expired") reasons.push(`${DOC_LABEL[type]} expired`);
    }
    for (const type of ["bond", "ce"] as const) {
      if (coverage[type] === "expired") reasons.push(`${DOC_LABEL[type]} expired`);
    }
    return reasons;
  }

  private describeDocument(document: DocumentRecord, now: Date) {
    const vendor = this.db.vendors.find((item) => item.id === document.vendorId);
    return {
      id: document.id,
      vendorId: document.vendorId,
      vendorName: vendor?.name ?? "Vendor",
      type: document.type,
      typeLabel: DOC_LABEL[document.type],
      holder: document.holder,
      issuer: document.issuer,
      number: document.number,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      daysLeft: daysUntil(document.expiryDate, now),
      status: statusFor(document.expiryDate, now),
      fileName: document.fileName,
      hasFile: Boolean(document.fileId),
      source: document.source,
    };
  }

  private requestView(request: { id: string; orgId: string; vendorId: string; token: string; createdAt: string; expiresAt: string; fulfilledAt: string | null }) {
    const vendor = this.db.vendors.find((item) => item.id === request.vendorId);
    return {
      id: request.id,
      vendorId: request.vendorId,
      vendorName: vendor?.name ?? "Vendor",
      token: request.token,
      path: `/request/${request.token}`,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
      fulfilledAt: request.fulfilledAt,
      status: request.fulfilledAt ? "fulfilled" : request.expiresAt < todayISO() ? "expired" : "open",
    };
  }

  private requireOrg(orgId: string) {
    const org = this.db.organizations.find((item) => item.id === orgId);
    if (!org) throw new HttpError(404, "Organization not found.");
    return org;
  }

  private appendAudit(event: Omit<AuditEvent, "id" | "at">) {
    const record: AuditEvent = { ...event, id: newId("audit"), at: new Date().toISOString() };
    this.db.audit.push(Object.freeze(record));
  }
}

function requiredText(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new HttpError(400, message);
  return trimmed;
}

function uniquePublicId(vendors: Vendor[], name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "vendor";
  let publicId = base;
  let suffix = 2;
  while (vendors.some((item) => item.publicId === publicId)) {
    publicId = `${base}-${suffix}`;
    suffix += 1;
  }
  return publicId;
}

function shiftISO(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const globalStore = globalThis as typeof globalThis & { __certkeep?: MemoryStore };

export function getStore() {
  if (!globalStore.__certkeep) globalStore.__certkeep = new MemoryStore();
  return globalStore.__certkeep;
}

export function assertWrite(actor: Actor): asserts actor is Actor & {
  org: NonNullable<Actor["org"]>;
  membership: NonNullable<Actor["membership"]>;
} {
  if (!actor.org || !actor.membership) {
    throw new HttpError(403, "This account has no organization vault.");
  }
  if (actor.readOnly || actor.membership.role === "viewer") {
    throw new HttpError(403, "Demo mode is read-only.");
  }
}
