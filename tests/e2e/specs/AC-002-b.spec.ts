// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-002-b: a created payment request starts in pending status", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  await createPaymentRequest(page, { amount: "500", description });
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
});
