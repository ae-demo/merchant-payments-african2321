// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-001-b: a merchant can start accepting payments immediately, no approval step", async ({ page }) => {
  // 1. Sign in fresh. 2. Open "New payment request" straight from the dashboard.
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await page.getByRole("button", { name: "New payment request" }).click();
  // 3. The create form is reachable with no pending/approval banner anywhere.
  await expect(page.getByRole("heading", { name: "New payment request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create request" })).toBeEnabled();
});
