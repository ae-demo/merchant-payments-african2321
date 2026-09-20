// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-001-a: a new merchant can sign in and access the merchant portal", async ({ page }) => {
  // 1. Sign in as test-merchant. 2. Land on the merchant dashboard.
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await expect(page.getByRole("heading", { name: "Merchant Dashboard" })).toBeVisible();
});
