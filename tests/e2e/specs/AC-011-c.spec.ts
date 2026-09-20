// spec: tests/validation/test-plan.md § AC-011-c
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith } from "../lib/checkout";

test("AC-011-c: a customer pays without creating an account", async ({ page, browser }) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });

  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await openPaymentLink(guestPage, linkToken);
  // No sign-in/sign-up form at any point in the flow.
  await expect(guestPage.getByRole("textbox", { name: "Username" })).not.toBeVisible();
  await payWith(guestPage, "Mobile Money", "+2348011112222");
  await expect(guestPage.getByRole("textbox", { name: "Username" })).not.toBeVisible();
  await expect(guestPage.getByText(/Payment (successful|failed)/)).toBeVisible();
  await guest.close();
});
