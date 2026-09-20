// Shared sign-in and merchant-setup helpers for payments-webapp specs.
//
// The app has no cookie-based shortcut for a session: every spec that needs
// one signs in through the real Thunder IdP redirect, independently, so each
// spec still passes when run alone (per the authoring discipline).

import { type Page, expect } from "@playwright/test";

export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
}

/** PUT /me/merchant is an upsert, so this is safe to call on every run. */
export async function ensureMerchantProfile(page: Page, businessName: string): Promise<void> {
  await page.goto("/profile");
  await page.getByRole("textbox", { name: "Business name" }).fill(businessName);
  await page.getByRole("textbox", { name: "Email" }).fill(`${businessName.replace(/\s+/g, "-").toLowerCase()}@test-users.invalid`);
  await page.getByRole("textbox", { name: "Phone" }).fill("+2348012345678");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Business profile saved.")).toBeVisible();
}

export interface CreatedPaymentRequest {
  readonly detailUrl: string;
  readonly linkToken: string;
}

/** Creates a payment request from the dashboard and returns its shareable link's token. */
export async function createPaymentRequest(
  page: Page,
  opts: { amount: string; description: string },
): Promise<CreatedPaymentRequest> {
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(opts.amount);
  await page.getByRole("textbox", { name: "Description" }).fill(opts.description);
  await page.getByRole("button", { name: "Create request" }).click();
  await page.waitForURL(/\/payment-requests\/[^/]+$/);
  // waitForURL resolves on the history change, which fires before React
  // unmounts this form — wait for the detail page's own heading first, or
  // "textbox().first()" below can still catch the old Description field.
  await page.getByRole("heading", { name: "Shareable link" }).waitFor();
  const shareLink = await page.getByRole("textbox").first().inputValue();
  const linkToken = shareLink.split("/").pop() ?? "";
  return { detailUrl: page.url(), linkToken };
}
