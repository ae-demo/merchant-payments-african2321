// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-005-a: a merchant can view a list of all their payment requests", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  await createPaymentRequest(page, { amount: "500", description });

  await page.goto("/payment-requests");
  await expect(page.getByRole("row", { name: new RegExp(description) })).toBeVisible();
});
