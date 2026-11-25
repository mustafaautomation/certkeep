import { expect, test, type Page } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../lib/demo-accounts";

const harbor = DEMO_ACCOUNTS[0];
const lakeside = DEMO_ACCOUNTS[1];

test.beforeEach(async ({ request }) => {
  const response = await request.post("/api/test/reset");
  expect(response.ok()).toBeTruthy();
});

async function login(page: Page, email: string, password: string) {
  const response = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}

function localISO(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

test("seeded expiring certificates show on the dashboard", async ({ page }) => {
  await login(page, harbor.email, harbor.password);
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Compliance overview" })).toBeVisible();
  await expect(page.getByTestId("expiring-list")).toContainText("Atlas Plumbing");
  await expect(page.getByTestId("gap-list")).toContainText("Ironvale Steel");
});

test("saving a document that expires soon lists it on the dashboard", async ({ page }) => {
  await login(page, harbor.email, harbor.password);
  await page.goto("/app/documents/new");
  await expect(page.getByRole("option", { name: "Brightspan Painting" })).toBeAttached();
  await page.getByLabel("Vendor").selectOption({ label: "Brightspan Painting" });
  await page.getByLabel("Document type").selectOption("ce");
  await page.getByLabel("Holder").fill("Harbor General Contractors");
  await page.getByLabel("Issuer").fill("North Training Desk");
  await page.getByLabel("Number").fill("CE-DEMO-10");
  await page.getByLabel("Issue date").fill("2026-01-15");
  await page.getByLabel("Expiry date").fill(localISO(10));
  await page.getByLabel("Certificate file").setInputFiles("public/samples/sample-coi.pdf");
  await page.getByRole("button", { name: "Save document" }).click();
  await expect(page.getByText("Document saved")).toBeVisible();
  await page.goto("/app");
  await expect(page.getByTestId("expiring-list")).toContainText("Brightspan Painting");
  await expect(page.getByTestId("expiring-list")).toContainText("CE credit");
});

test("extraction confirm path saves the sample certificate", async ({ page }) => {
  await login(page, harbor.email, harbor.password);
  await page.goto("/app/documents/new");
  await expect(page.getByRole("option", { name: "Northline Electrical" })).toBeAttached();
  await page.getByLabel("Vendor").selectOption({ label: "Northline Electrical" });
  await page.getByLabel("Certificate file").setInputFiles("public/samples/sample-coi.pdf");
  await page.getByRole("button", { name: "Extract fields" }).click();
  await expect(page.getByLabel("Issuer")).toHaveValue("Pinnacle Mutual Insurance");
  await expect(page.getByLabel("Holder")).toHaveValue("Harbor General Contractors");
  await expect(page.getByLabel("Expiry date")).toHaveValue("2027-06-30");
  await page.getByRole("button", { name: "Confirm and save" }).click();
  await expect(page.getByText("Document saved")).toBeVisible();
  await expect(page.getByText("PM-COI-204418")).toBeVisible();
});

test("verification page is public and hides contact data", async ({ page }) => {
  await page.goto("/verify/northline-electrical");
  await expect(page.getByRole("heading", { name: "Northline Electrical" })).toBeVisible();
  await expect(page.getByTestId("status-license")).toHaveText("Valid");
  await expect(page.getByTestId("status-coi")).toHaveText("Valid");
  await expect(page.getByTestId("status-bond")).toHaveText("Expiring");
  await expect(page.getByRole("button", { name: /save|upload|delete|edit/i })).toHaveCount(0);
  const html = await page.content();
  expect(html.toLowerCase()).not.toContain("example");
  expect(html).not.toContain("555");
  expect(html).not.toContain("sample-coi");
  expect(html).not.toContain("PM-COI");
  expect(html.toLowerCase()).not.toContain("samir");
  expect(html.toLowerCase()).not.toContain("download");
});

test("a second tenant cannot see Harbor vendors", async ({ page }) => {
  await login(page, lakeside.email, lakeside.password);
  await page.goto("/app/vendors");
  await expect(page.getByText("Pier & Lantern Electric")).toBeVisible();
  await expect(page.getByText("Northline Electrical")).toHaveCount(0);
  await expect(page.getByText("Atlas Plumbing")).toHaveCount(0);
  const cross = await page.request.get("/api/vendors/vendor_northline");
  expect(cross.status()).toBe(404);
  const list = await page.request.get("/api/vendors");
  const body = JSON.stringify(await list.json());
  expect(body).not.toContain("Northline");
  expect(body).not.toContain("org_harbor");
});

test("the public demo cannot write", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByText("Read-only demo").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Add vendor" })).toHaveCount(0);
  await expect(page.getByTestId("expiring-list")).toContainText("Atlas Plumbing");
  const anonymous = await page.request.post("/api/vendors", {
    data: {
      name: "Nope",
      trade: "Demo",
      contactName: "No One",
      email: "no@demo.example",
      phone: "(555) 010-0199",
      city: "Nowhere",
    },
  });
  expect(anonymous.status()).toBe(401);
  await page.getByRole("button", { name: "Continue with a read-only session" }).click();
  await expect(page.getByText("Read-only demo").first()).toBeVisible();
  const demo = await page.request.post("/api/vendors", {
    data: {
      name: "Nope",
      trade: "Demo",
      contactName: "No One",
      email: "no@demo.example",
      phone: "(555) 010-0199",
      city: "Nowhere",
    },
  });
  expect(demo.status()).toBe(403);
});

test("audit entries cannot be changed", async ({ page }) => {
  await login(page, harbor.email, harbor.password);
  await page.goto("/app/audit");
  await expect(page.getByText("Append-only")).toBeVisible();
  const deleted = await page.request.delete("/api/audit/audit_seed_harbor");
  expect(deleted.status()).toBe(405);
  const patched = await page.request.patch("/api/audit/audit_seed_harbor", {
    data: { summary: "tamper" },
  });
  expect(patched.status()).toBe(405);
});

test("dashboard fits a phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, harbor.email, harbor.password);
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Compliance overview" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Vendors" }).click();
  await expect(page.getByRole("heading", { name: "Vendors" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBeFalsy();
});

test("capture product screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/landing.png" });
  await login(page, harbor.email, harbor.password);
  await page.goto("/app");
  await expect(page.getByTestId("expiring-list")).toContainText("Atlas Plumbing");
  await page.screenshot({ path: "docs/screenshots/dashboard.png" });
  await page.goto("/verify/northline-electrical");
  await page.screenshot({ path: "docs/screenshots/verify.png" });
  await page.goto("/app/documents/new");
  await expect(page.getByRole("option", { name: "Northline Electrical" })).toBeAttached();
  await page.getByLabel("Certificate file").setInputFiles("public/samples/sample-coi.pdf");
  await page.getByRole("button", { name: "Extract fields" }).click();
  await expect(page.getByLabel("Issuer")).toHaveValue("Pinnacle Mutual Insurance");
  await page.screenshot({ path: "docs/screenshots/extract.png" });
});
