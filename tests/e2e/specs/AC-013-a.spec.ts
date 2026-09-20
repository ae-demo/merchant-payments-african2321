// spec: tests/validation/test-plan.md § AC-013-a
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-013-a: a platform admin can view a list of every merchant on the platform", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_ADMIN_USERNAME ?? "", process.env.AEP_E2E_ADMIN_PASSWORD ?? "");
  await expect(page).toHaveURL(/\/admin\/merchants$/);
  await expect(page.getByRole("heading", { name: "Merchants" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Business" })).toBeVisible();
});
