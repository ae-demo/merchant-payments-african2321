// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";
import { openPaymentLink, payWith } from "../lib/checkout";

test("AC-004-b: a payment request's status updates once the customer completes or fails payment", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  const { detailUrl, linkToken } = await createPaymentRequest(page, { amount: "500", description });

  // 2. Pay it as a guest, on checkout-webapp's own domain (bypassing Defect A).
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await openPaymentLink(guestPage, linkToken);
  await payWith(guestPage, "Mobile Money", "+2348011112222");
  await guest.close();

  // 3. Reload the merchant's detail page: status must have left "Pending".
  await page.goto(detailUrl);
  await expect(page.getByText("Pending", { exact: true })).not.toBeVisible();
  await expect(page.getByText(/^(Paid|Failed)$/)).toBeVisible();
});
