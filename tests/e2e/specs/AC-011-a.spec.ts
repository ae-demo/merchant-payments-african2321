// spec: tests/validation/test-plan.md § AC-011-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith, linkStatus } from "../lib/checkout";

test("AC-011-a: a customer can complete payment via mobile money", async ({ page, browser, request }) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });

  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await openPaymentLink(guestPage, linkToken);
  await payWith(guestPage, "Mobile Money", "+2348011112222");
  await guest.close();

  // The real, server-side status — not just checkout-webapp's result-screen
  // claim (see test-plan.md, Defect B).
  expect(await linkStatus(request, linkToken)).toBe("paid");
});
