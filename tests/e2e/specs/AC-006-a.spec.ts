// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/auth";

test("AC-006-a: a merchant can enter and save bank account details for payouts", async ({ page }) => {
  await signIn(page, process.env.AEP_E2E_USERNAME ?? "", process.env.AEP_E2E_PASSWORD ?? "");
  await page.goto("/bank-account");

  const bankName = `E2E Bank ${String(Date.now())}`;
  await page.getByRole("textbox", { name: "Bank name" }).fill(bankName);
  await page.getByRole("textbox", { name: "Account number" }).fill("0123456789");
  await page.getByRole("textbox", { name: "Account name" }).fill("E2E Merchant Co");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Bank account saved.")).toBeVisible();

  // Reload to confirm it actually persisted server-side, not just in local state.
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Bank name" })).toHaveValue(bankName);
});
