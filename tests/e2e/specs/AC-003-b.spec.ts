// spec: tests/validation/test-plan.md § AC-003-b
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-003-b: a merchant can trigger sending the link via SMS or email", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  const { linkToken } = await createPaymentRequest(page, { amount: "500", description });

  // 4. Clicking "Send via SMS" attempts navigation to an sms: URI carrying the link.
  const smsRequest = page.waitForRequest((r) => r.url().startsWith("sms:"), { timeout: 5_000 });
  await page.getByRole("button", { name: "Send via SMS" }).click();
  const sms = await smsRequest;
  expect(decodeURIComponent(sms.url())).toContain(linkToken);

  // 5. Clicking "Send via Email" attempts navigation to a mailto: URI carrying the link.
  const mailRequest = page.waitForRequest((r) => r.url().startsWith("mailto:"), { timeout: 5_000 });
  await page.getByRole("button", { name: "Send via Email" }).click();
  const mail = await mailRequest;
  expect(decodeURIComponent(mail.url())).toContain(linkToken);
});
