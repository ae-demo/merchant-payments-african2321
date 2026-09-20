// spec: tests/validation/test-plan.md § AC-010-a
import { test, expect } from "@playwright/test";
import { signIn, ensureMerchantProfile, createPaymentRequest } from "../lib/auth";

test("AC-010-a: opening a payment link shows amount, currency and merchant name without sign-in", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000); // two full actor round-trips: merchant setup + guest checkout
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await ensureMerchantProfile(page, "E2E Merchant Co");
  const description = `e2e-order-${String(Date.now())}`;
  await createPaymentRequest(page, { amount: "500", description });
  // The literal shareable-link text shown to the merchant — not a
  // hand-corrected URL. This is what a real customer would actually receive.
  const shareLink = await page.getByRole("textbox").first().inputValue();

  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(shareLink);

  await expect(guestPage.getByText("NGN 500")).toBeVisible();
  await expect(guestPage.getByText("E2E Merchant Co")).toBeVisible();
  await expect(guestPage.getByRole("textbox", { name: "Username" })).not.toBeVisible();
  await guest.close();
});
