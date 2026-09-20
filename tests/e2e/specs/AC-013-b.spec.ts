// spec: tests/validation/test-plan.md § AC-013-b
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-013-b: a platform admin can view transaction activity across all merchants", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_ADMIN_USERNAME ?? "", process.env.AEP_E2E_ADMIN_PASSWORD ?? "");
  await page.goto("/admin/transactions");
  await expect(page.getByRole("heading", { name: "All transactions" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});
