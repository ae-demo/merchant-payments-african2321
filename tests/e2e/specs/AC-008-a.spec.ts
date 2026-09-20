// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith } from "../lib/checkout";

test("AC-008-a: a merchant can trigger a payout of their available balance", async ({ page, browser }) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");

  // 1. Ensure a bank account is on file.
  await page.goto("/bank-account");
  await page.getByRole("textbox", { name: "Bank name" }).fill("E2E Bank");
  await page.getByRole("textbox", { name: "Account number" }).fill("0123456789");
  await page.getByRole("textbox", { name: "Account name" }).fill("E2E Merchant Co");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Bank account saved.")).toBeVisible();

  // 2. Create and pay a request, hoping for a settled balance.
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await openPaymentLink(guestPage, linkToken);
  await payWith(guestPage, "Mobile Money", "+2348011112222");
  await guest.close();

  // 3. Trigger a payout of the available balance.
  await page.goto("/payouts");
  await page.getByRole("button", { name: "Trigger payout" }).click();
  await page.getByRole("button", { name: "Confirm payout" }).click();

  await expect(page.getByRole("row").filter({ hasText: /Pending|Settled/ })).toBeVisible();
});
