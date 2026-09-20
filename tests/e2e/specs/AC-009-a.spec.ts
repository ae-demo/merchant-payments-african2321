// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith } from "../lib/checkout";

test("AC-009-a: a merchant can issue a refund for a completed transaction", async ({ page, browser }) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");

  // 1. Create and pay a request, hoping for a succeeded transaction.
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await openPaymentLink(guestPage, linkToken);
  await payWith(guestPage, "Card", "4242424242424242");
  await guest.close();

  // 2. Open its transaction and refund it. The Refund button only renders for
  // a "succeeded" transaction (TransactionDetail.tsx), which is the completed
  // state the criterion requires.
  await page.goto("/transactions");
  await page.getByRole("row", { name: new RegExp(description) }).click();
  await expect(page.getByRole("button", { name: "Refund" })).toBeVisible();
  await page.getByRole("button", { name: "Refund" }).click();
  await page.getByRole("button", { name: "Confirm refund" }).click();

  await page.goto("/transactions");
  await expect(page.getByRole("row", { name: new RegExp(description) }).getByText("Refunded")).toBeVisible();
});
