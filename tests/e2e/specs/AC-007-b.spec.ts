// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-007-b: a merchant can view a history of past payouts", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await page.goto("/payouts");
  await expect(page.getByRole("heading", { name: "Payout history" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Settled" })).toBeVisible();
});
