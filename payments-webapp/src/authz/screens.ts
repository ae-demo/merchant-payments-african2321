// Adapted from thunder-authentication's screens.example.ts pattern for
// payments-webapp's own screens (specs/design/components/payments-webapp/wireframes.dsl).
//
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Each row names the one
// operation the screen LOADS (or, for a form that only writes, the operation
// its submit makes) — never a scope or a handle typed elsewhere. Order is
// rail order; the first reachable row is the landing screen for a role.
//
// Two screens have no per-id GET in payments-api's contract (PaymentRequest,
// Transaction and Merchant detail views all differ: only PaymentRequest has
// a `/me/payment-requests/{id}`). TransactionDetail and AdminMerchantDetail
// are gated on the LIST operation that supplies their row (GET /me/transactions,
// GET /merchants) since that is the real reach being exercised — the page
// itself resolves the single record from router state or, failing that, by
// re-fetching that same list and finding the id (see the page components).

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
  /** Shown as a nav item in the sidebar, in this table's order. */
  readonly inRail?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  // --- Merchant rail -------------------------------------------------------
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /me/payment-requests", inRail: true },
  { key: "payment-requests", label: "Payment Requests", path: "/payment-requests", loads: "GET /me/payment-requests", inRail: true },
  { key: "transactions", label: "Transactions", path: "/transactions", loads: "GET /me/transactions", inRail: true },
  { key: "payouts", label: "Payouts", path: "/payouts", loads: "GET /me/payouts", inRail: true },
  { key: "bank-account", label: "Bank Account", path: "/bank-account", loads: "GET /me/bank-account", inRail: true },
  { key: "profile", label: "Business Profile", path: "/profile", loads: "GET /me/merchant", inRail: true },

  // --- Merchant non-rail screens (reached by button / table row) ----------
  { key: "create-payment-request", label: "New Payment Request", path: "/payment-requests/new", loads: "POST /me/payment-requests" },
  { key: "payment-request-detail", label: "Payment Request Detail", path: "/payment-requests/:id", loads: "GET /me/payment-requests/{id}" },
  { key: "transaction-detail", label: "Transaction Detail", path: "/transactions/:id", loads: "GET /me/transactions" },
  { key: "refund-confirm", label: "Refund Confirm", path: "/transactions/:id/refund", loads: "POST /me/transactions/{id}/refund" },
  { key: "payout-confirm", label: "Payout Confirm", path: "/payouts/confirm", loads: "POST /me/payouts" },

  // --- Platform Admin rail --------------------------------------------------
  { key: "admin-merchants", label: "Merchants", path: "/admin/merchants", loads: "GET /merchants", inRail: true },
  { key: "admin-transactions", label: "All Transactions", path: "/admin/transactions", loads: "GET /transactions", inRail: true },
  { key: "admin-payouts", label: "All Payouts", path: "/admin/payouts", loads: "GET /payouts", inRail: true },

  // --- Platform Admin non-rail screens --------------------------------------
  { key: "admin-merchant-detail", label: "Merchant Detail", path: "/admin/merchants/:id", loads: "GET /merchants" },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
