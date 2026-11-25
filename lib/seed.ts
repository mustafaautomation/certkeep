import { readFileSync } from "node:fs";
import path from "node:path";
import { addDaysISO } from "@/lib/dates";
import { DEMO_PASSWORD_HASHES } from "@/lib/passwords";
import type { Database, DocumentRecord, Vendor } from "@/lib/types";

function sampleCoiBase64() {
  try {
    const filePath = path.join(process.cwd(), "public/samples/sample-coi.pdf");
    return readFileSync(filePath).toString("base64");
  } catch {
    return null;
  }
}

export function createSeed(now = new Date()): Database {
  const at = now.toISOString();
  const day = (offset: number) => addDaysISO(offset, now);
  const sample = sampleCoiBase64();

  const organizations: Database["organizations"] = [
    {
      id: "org_harbor",
      name: "Harbor General Contractors",
      slug: "harbor",
      plan: "starter",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: at,
    },
    {
      id: "org_lakeside",
      name: "Lakeside Facilities Group",
      slug: "lakeside",
      plan: "starter",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: at,
    },
  ];

  const users: Database["users"] = [
    {
      id: "user_avery",
      email: "avery.quin@harbor.example",
      name: "Avery Quin",
      passwordHash: DEMO_PASSWORD_HASHES.harbor,
      platformRole: "user",
      createdAt: at,
    },
    {
      id: "user_jordan",
      email: "jordan.hale@lakeside.example",
      name: "Jordan Hale",
      passwordHash: DEMO_PASSWORD_HASHES.lakeside,
      platformRole: "user",
      createdAt: at,
    },
    {
      id: "user_rowan",
      email: "rowan.admin@certkeep.example",
      name: "Rowan Blake",
      passwordHash: DEMO_PASSWORD_HASHES.super,
      platformRole: "superadmin",
      createdAt: at,
    },
    {
      id: "user_demo",
      email: "demo.reader@harbor.example",
      name: "Demo Reader",
      passwordHash: DEMO_PASSWORD_HASHES.demo,
      platformRole: "user",
      createdAt: at,
    },
  ];

  const memberships: Database["memberships"] = [
    { id: "mem_avery", orgId: "org_harbor", userId: "user_avery", role: "owner" },
    { id: "mem_jordan", orgId: "org_lakeside", userId: "user_jordan", role: "owner" },
    { id: "mem_demo", orgId: "org_harbor", userId: "user_demo", role: "viewer" },
  ];

  const vendors: Vendor[] = [
    vendor("vendor_northline", "org_harbor", "Northline Electrical", "Electrical", "Samir Cole", "desk@northline.example", "(555) 010-0142", "Port Meridian", "northline-electrical", at),
    vendor("vendor_cedar", "org_harbor", "Cedar & Pine Carpentry", "Carpentry", "Lila Moss", "office@cedarpine.example", "(555) 010-0166", "Cedar Reach", "cedar-pine-carpentry", at),
    vendor("vendor_atlas", "org_harbor", "Atlas Plumbing", "Plumbing", "Theo Marsh", "jobs@atlasplumbing.example", "(555) 010-0188", "Glass Harbor", "atlas-plumbing", at),
    vendor("vendor_brightspan", "org_harbor", "Brightspan Painting", "Painting", "Noor Ellison", "hello@brightspan.example", "(555) 010-0114", "Millford", "brightspan-painting", at),
    vendor("vendor_ironvale", "org_harbor", "Ironvale Steel", "Structural steel", "Chris Adel", "fab@ironvale.example", "(555) 010-0190", "Iron Flats", "ironvale-steel", at),
    vendor("vendor_hvac", "org_harbor", "Harborview HVAC", "Mechanical", "Priya Sen", "service@harborviewhvac.example", "(555) 010-0127", "Lantern Bay", "harborview-hvac", at),
    vendor("vendor_moss", "org_harbor", "Moss & Co. Roofing", "Roofing", "Ellis Ward", "crew@mossroofing.example", "(555) 010-0133", "Moss Hollow", "moss-roofing", at),
    vendor("vendor_keystone", "org_harbor", "Keystone Concrete", "Concrete", "Mina Ortiz", "plant@keystoneconcrete.example", "(555) 010-0155", "Keystone Bend", "keystone-concrete", at),
    vendor("vendor_pier", "org_lakeside", "Pier & Lantern Electric", "Electrical", "Remy Cho", "office@pierlantern.example", "(555) 010-0177", "Pier Point", "pier-lantern-electric", at),
  ];

  const documents: DocumentRecord[] = [
    doc("doc_nl_license", "org_harbor", "vendor_northline", "license", "State Licensing Desk", "L-10021", day(-200), day(240), null, null, at),
    doc("doc_nl_coi", "org_harbor", "vendor_northline", "coi", "Pinnacle Mutual Insurance", "PM-100", day(-30), day(400), sample ? "file_sample_coi" : null, sample ? "sample-coi.pdf" : null, at),
    doc("doc_nl_bond", "org_harbor", "vendor_northline", "bond", "Western Surety Company", "B-18820", day(-180), day(18), null, null, at),
    doc("doc_cedar_license", "org_harbor", "vendor_cedar", "license", "State Licensing Desk", "L-22910", day(-400), day(-24), null, null, at),
    doc("doc_cedar_coi", "org_harbor", "vendor_cedar", "coi", "Cedar Mutual", "CM-4401", day(-40), day(120), null, null, at),
    doc("doc_atlas_license", "org_harbor", "vendor_atlas", "license", "State Licensing Desk", "L-33002", day(-80), day(300), null, null, at),
    doc("doc_atlas_coi", "org_harbor", "vendor_atlas", "coi", "River City Indemnity", "RC-7781", day(-20), day(11), null, null, at),
    doc("doc_bright_license", "org_harbor", "vendor_brightspan", "license", "State Licensing Desk", "L-55110", day(-30), day(180), null, null, at),
    doc("doc_bright_coi", "org_harbor", "vendor_brightspan", "coi", "Harborline Mutual", "HM-220", day(-15), day(200), null, null, at),
    doc("doc_bright_bond", "org_harbor", "vendor_brightspan", "bond", "Western Surety Company", "B-22018", day(-15), day(160), null, null, at),
    doc("doc_iron_license", "org_harbor", "vendor_ironvale", "license", "State Licensing Desk", "L-44190", day(-60), day(90), null, null, at),
    doc("doc_iron_bond", "org_harbor", "vendor_ironvale", "bond", "Pioneer Bonding", "PB-19", day(-200), day(-15), null, null, at),
    doc("doc_hvac_license", "org_harbor", "vendor_hvac", "license", "State Licensing Desk", "L-77801", day(-40), day(220), null, null, at),
    doc("doc_hvac_coi", "org_harbor", "vendor_hvac", "coi", "Lantern Bay Mutual", "LB-90", day(-20), day(140), null, null, at),
    doc("doc_hvac_ce", "org_harbor", "vendor_hvac", "ce", "Northwest Training Guild", "CE-441", day(-20), day(9), null, null, at),
    doc("doc_moss_license", "org_harbor", "vendor_moss", "license", "State Licensing Desk", "L-66021", day(-50), day(70), null, null, at),
    doc("doc_moss_coi", "org_harbor", "vendor_moss", "coi", "Summit Specialty", "SS-902", day(-300), day(-6), null, null, at),
    doc("doc_key_license", "org_harbor", "vendor_keystone", "license", "State Licensing Desk", "L-88014", day(-20), day(40), null, null, at),
    doc("doc_key_ce", "org_harbor", "vendor_keystone", "ce", "Northwest Training Guild", "CE-220", day(-10), day(22), null, null, at),
    doc("doc_pier_license", "org_lakeside", "vendor_pier", "license", "State Licensing Desk", "L-91002", day(-30), day(100), null, null, at),
    doc("doc_pier_coi", "org_lakeside", "vendor_pier", "coi", "Pier Point Mutual", "PP-14", day(-10), day(80), null, null, at),
  ];

  const files: Database["files"] = [];
  if (sample) {
    files.push({
      id: "file_sample_coi",
      orgId: "org_harbor",
      fileName: "sample-coi.pdf",
      mime: "application/pdf",
      base64: sample,
      createdAt: at,
    });
  }

  const audit: Database["audit"] = [
    {
      id: "audit_seed_harbor",
      orgId: "org_harbor",
      actorId: null,
      action: "vault.seeded",
      entityType: "organization",
      entityId: "org_harbor",
      summary: "Seeded Harbor General Contractors with eight subcontractors and mixed certificate dates.",
      at,
    },
    {
      id: "audit_seed_lakeside",
      orgId: "org_lakeside",
      actorId: null,
      action: "vault.seeded",
      entityType: "organization",
      entityId: "org_lakeside",
      summary: "Seeded Lakeside Facilities Group as a separate tenant.",
      at,
    },
  ];

  return {
    organizations,
    users,
    memberships,
    vendors,
    documents,
    files,
    requests: [],
    audit,
    dispatches: [],
  };
}

function vendor(
  id: string,
  orgId: string,
  name: string,
  trade: string,
  contactName: string,
  email: string,
  phone: string,
  city: string,
  publicId: string,
  createdAt: string,
): Vendor {
  return { id, orgId, name, trade, contactName, email, phone, city, publicId, createdAt };
}

function doc(
  id: string,
  orgId: string,
  vendorId: string,
  type: DocumentRecord["type"],
  issuer: string,
  number: string,
  issueDate: string,
  expiryDate: string,
  fileId: string | null,
  fileName: string | null,
  createdAt: string,
): DocumentRecord {
  return {
    id,
    orgId,
    vendorId,
    type,
    holder: orgId === "org_lakeside" ? "Lakeside Facilities Group" : "Harbor General Contractors",
    issuer,
    number,
    issueDate,
    expiryDate,
    fileId,
    fileName,
    source: "seed",
    createdAt,
  };
}
