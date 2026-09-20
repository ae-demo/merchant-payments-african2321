// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-002-a: a merchant can submit amount, currency and description to create a payment request", async ({
  page,
}) => {
  // 1. Sign in and ensure a merchant profile exists (a required precondition,
  // confirmed live: payments-api 400s creation otherwise).
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  // 2-3. Submit amount, currency (default NGN) and description.
  const description = `e2e-order-${String(Date.now())}`;
  await createPaymentRequest(page, { amount: "500", description });
  await expect(page.getByRole("heading", { name: description })).toBeVisible();
});
