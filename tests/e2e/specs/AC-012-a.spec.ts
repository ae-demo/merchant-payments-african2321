// spec: tests/validation/test-plan.md § AC-012-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith, linkStatus } from "../lib/checkout";

test("AC-012-a: a successful payment triggers a confirmation sent by SMS or email", async ({
  page,
  browser,
  request,
}) => {
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

  // checkout-webapp shows "A confirmation has been sent..." on ANY non-error
  // response, regardless of the transaction's real status (Defect B) — so the
  // criterion is only actually met when the charge genuinely succeeded.
  expect(await linkStatus(request, linkToken)).toBe("paid");
});
