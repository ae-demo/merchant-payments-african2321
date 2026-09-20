// Guest checkout helpers against checkout-webapp's own contract
// (`/:linkToken`, `/:linkToken/pay`) — independent of payments-webapp's
// shareable-link defect (see test-plan.md, Defect A).

import { type Page, type APIRequestContext } from "@playwright/test";
import { target } from "./targets";

export type PayMethod = "Mobile Money" | "Card";

export async function openPaymentLink(page: Page, linkToken: string): Promise<void> {
  await page.goto(`${target("checkout-webapp")}/${linkToken}`);
}

/** Drives the pay form and lands on the result screen. */
export async function payWith(page: Page, method: PayMethod, fieldValue: string): Promise<void> {
  await page.getByRole("button", { name: "Pay now" }).click();
  if (method === "Card") {
    await page.getByRole("tab", { name: "Card" }).click();
  }
  const label = method === "Card" ? "Card number" : "Phone number";
  await page.getByRole("textbox", { name: label }).fill(fieldValue);
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/\/result$/);
}

/**
 * The real, server-side status of a payment link — public, unauthenticated,
 * proxied by checkout-webapp's own nginx to payments-api. Used to check what
 * actually happened, independent of checkout-webapp's result-screen claim
 * (see test-plan.md, Defect B).
 */
export async function linkStatus(request: APIRequestContext, linkToken: string): Promise<string> {
  const res = await request.get(`${target("checkout-webapp")}/api/payment-links/${linkToken}`);
  const body = (await res.json()) as { status: string };
  return body.status;
}
