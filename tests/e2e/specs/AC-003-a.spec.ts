// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-003-a: a created payment request has a shareable link", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });
  // The shareable link field is the page's only textbox.
  const link = await page.getByRole("textbox").first().inputValue();
  expect(link).toContain(linkToken);
  expect(linkToken.length).toBeGreaterThan(0);
});
