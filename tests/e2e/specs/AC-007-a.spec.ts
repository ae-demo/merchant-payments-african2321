// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-007-a: a merchant can view their current available balance", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await page.goto("/payouts");
  await expect(page.getByText("Available balance")).toBeVisible();
  await expect(page.getByText(/^[A-Z]{3} [\d,.]+$/)).toBeVisible();
});
