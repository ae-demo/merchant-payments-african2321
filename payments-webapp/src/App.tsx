// Adapted from thunder-authentication's App.example.tsx pattern. The routing
// STRUCTURE below is prescribed by that skill:
//
//   NoAccess sits ABOVE the shell route and REPLACES it — a caller who
//   unlocks nothing gets no navbar and no empty sidebar.
//   Forbidden sits INSIDE the shell, at /forbidden — the caller holds other
//   scopes and has somewhere to go, so the rail stays.
//   /forbidden is wired into src/authz/client.ts once, from ForbiddenWiring.
//   Every gated route is wrapped in <RequireOperation>, with the operation
//   taken from SCREEN_ROUTES — never typed here.
//   /callback is routed OUTSIDE the provider: there is no session to read
//   until the redirect has been processed.
//
// This app has no public screen — every flow in wireframes.dsl carries a
// `role` line — so there is nothing routed above the sign-in guard besides
// /callback.
//
// BrowserRouter itself lives in main.tsx (Oxygen's app-structure convention);
// this file supplies only the route table.

import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { MerchantDashboardPage } from "./pages/MerchantDashboard";
import { CreatePaymentRequestPage } from "./pages/CreatePaymentRequest";
import { PaymentRequestDetailPage } from "./pages/PaymentRequestDetail";
import { PaymentRequestsListPage } from "./pages/PaymentRequestsList";
import { TransactionsListPage } from "./pages/TransactionsList";
import { TransactionDetailPage } from "./pages/TransactionDetail";
import { RefundConfirmPage } from "./pages/RefundConfirm";
import { BankAccountSettingsPage } from "./pages/BankAccountSettings";
import { MerchantProfileSettingsPage } from "./pages/MerchantProfileSettings";
import { PayoutsHomePage } from "./pages/PayoutsHome";
import { PayoutConfirmPage } from "./pages/PayoutConfirm";
import { AdminMerchantsListPage } from "./pages/AdminMerchantsList";
import { AdminMerchantDetailPage } from "./pages/AdminMerchantDetail";
import { AdminTransactionsListPage } from "./pages/AdminTransactionsList";
import { AdminPayoutsListPage } from "./pages/AdminPayoutsList";

const PAGE_BY_KEY: Record<string, ReactElement> = {
  dashboard: <MerchantDashboardPage />,
  "payment-requests": <PaymentRequestsListPage />,
  transactions: <TransactionsListPage />,
  payouts: <PayoutsHomePage />,
  "bank-account": <BankAccountSettingsPage />,
  profile: <MerchantProfileSettingsPage />,
  "create-payment-request": <CreatePaymentRequestPage />,
  "payment-request-detail": <PaymentRequestDetailPage />,
  "transaction-detail": <TransactionDetailPage />,
  "refund-confirm": <RefundConfirmPage />,
  "payout-confirm": <PayoutConfirmPage />,
  "admin-merchants": <AdminMerchantsListPage />,
  "admin-transactions": <AdminTransactionsListPage />,
  "admin-payouts": <AdminPayoutsListPage />,
  "admin-merchant-detail": <AdminMerchantDetailPage />,
};

export function App(): ReactElement {
  return (
    <>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </>
  );
}

function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
