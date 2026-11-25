export const DOC_TYPES = ["license", "coi", "bond", "ce"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const REQUIRED_DOC_TYPES: DocType[] = ["license", "coi"];

export const DOC_LABEL: Record<DocType, string> = {
  license: "License",
  coi: "Certificate of insurance",
  bond: "Bond",
  ce: "CE credit",
};

export type DocStatus = "valid" | "expiring" | "expired";
export type CoverageSlot = DocStatus | "missing";
export type Plan = "starter" | "pro";
export type MembershipRole = "owner" | "admin" | "member" | "viewer";
export type PlatformRole = "user" | "superadmin";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  platformRole: PlatformRole;
  createdAt: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: MembershipRole;
}

export interface Vendor {
  id: string;
  orgId: string;
  name: string;
  trade: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  publicId: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  orgId: string;
  vendorId: string;
  type: DocType;
  holder: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  fileId: string | null;
  fileName: string | null;
  source: "manual" | "extract" | "vendor-upload" | "seed";
  createdAt: string;
}

export interface StoredFile {
  id: string;
  orgId: string;
  fileName: string;
  mime: string;
  base64: string;
  createdAt: string;
}

export interface UploadRequest {
  id: string;
  orgId: string;
  vendorId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  fulfilledAt: string | null;
}

export interface AuditEvent {
  id: string;
  orgId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  at: string;
}

export interface ReminderDispatch {
  id: string;
  orgId: string;
  documentId: string;
  vendorId: string;
  daysBefore: 30 | 14 | 7;
  sentAt: string;
  to: string;
  subject: string;
  body: string;
}

export interface Database {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
  vendors: Vendor[];
  documents: DocumentRecord[];
  files: StoredFile[];
  requests: UploadRequest[];
  audit: AuditEvent[];
  dispatches: ReminderDispatch[];
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
}

export interface Actor {
  user: PublicUser;
  org: Organization | null;
  membership: Membership | null;
  readOnly: boolean;
}

export interface SessionClaims {
  userId: string;
  orgId: string | null;
  readOnly: boolean;
}
