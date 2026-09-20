// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-004-a: a payment request shows one of pending, paid, failed or expired", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  await createPaymentRequest(page, { amount: "500", description });
  const status = page.getByText(/^(Pending|Paid|Failed|Expired)$/);
  await expect(status).toBeVisible();
});
