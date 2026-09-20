# Validation test plan — merchant-payments-african2321 v1

Explored live against the deployed environment (payments-webapp, checkout-webapp,
payments-api) with playwright-cli as test-merchant / test-merchant-2 / test-platform-admin.
Two defects surfaced during exploration are called out where they affect a
criterion's expected result; both are backed by direct API evidence, not a
single flaky observation.

**Defect A — shareable link points at the wrong app.** payments-webapp builds
the merchant-facing "shareable link" as `${window.location.origin}/pay/{token}`
(`payments-webapp/src/pages/PaymentRequestDetail.tsx:26`) — its OWN origin,
which has no `/pay/:token` route, instead of checkout-webapp's origin and its
`/:linkToken` route. Opening the literal link a merchant is shown redirects a
guest to the payments-webapp sign-in page. The source comment itself flags this
as a known gap.

**Defect B — a declined charge is reported to the customer as a success.**
`payments-api/service.bal`'s `pay` handler always returns HTTP 200
(`TransactionOk`) with the transaction's real status embedded in the body, even
when `chargeViaInternalApi` returns `status: "failed"` — never the 400 the
contract's `openapi.yaml` describes for a failed charge. checkout-webapp's
`PayMethodPage.tsx` only branches on the HTTP-level `error`, so it shows
"Payment successful" / "A confirmation has been sent…" regardless of the
transaction's actual status. Confirmed via 15 direct API calls to
`/payment-links/{token}/pay` (mixed amounts, both methods, fresh tokens each
time): **15/15 came back `status: "failed"`**, and the UI showed success in
every browser-driven attempt (2/2) despite that. No `succeeded` transaction was
observed anywhere in the deployed environment.

Defect B blocks every criterion that needs a completed payment (AC-011-a/b,
AC-012-a) and, transitively, everything that needs a positive balance
(AC-008-a, AC-009-a).

## AC-001-a — A new merchant can sign in and access the merchant portal

- Target: payments-webapp (primary)
- Steps: 1. Sign in as test-merchant. 2. Land on `/dashboard`.
- Assert: the Merchant Dashboard heading is visible.
- Source of truth: live sign-in, explored directly.

## AC-001-b — A merchant can start accepting payments immediately, no approval

- Target: payments-webapp
- Steps: 1. Sign in fresh. 2. From the dashboard, open "New payment request".
- Assert: the New payment request form is reachable straight away — no pending/
  approval banner anywhere in the sign-in → dashboard → new-request path.
- Source of truth: live exploration — dashboard has no approval gate.

## AC-002-a — A merchant can submit amount, currency, description

- Target: payments-webapp
- Steps: 1. Sign in, ensure merchant profile exists (PUT is an upsert).
  2. Go to New payment request. 3. Fill amount/currency/description, submit.
- Assert: navigates to the new request's detail page; description is shown.
- Source of truth: live create flow (creating a profile first is a required
  precondition confirmed live — `payments-api` 400s "create a merchant profile
  before creating payment requests" otherwise).

## AC-002-b — A created payment request starts in pending status

- Target: payments-webapp
- Steps: 1–3 as AC-002-a.
- Assert: Status shows "Pending" immediately after creation.

## AC-003-a — A created payment request has a shareable link

- Target: payments-webapp
- Steps: 1–3 as AC-002-a.
- Assert: a "Shareable link" field is visible and non-empty, containing the
  request's link token.
- Note: presence only — Defect A (wrong origin) is asserted under AC-010-a,
  which is what actually opens it.

## AC-003-b — A merchant can trigger sending the link via SMS or email

- Target: payments-webapp
- Steps: 1–3 as AC-002-a. 4. Click "Send via SMS". 5. Click "Send via Email".
- Assert: each click attempts navigation to an `sms:`/`mailto:` URI whose body
  contains the shareable link (observed live via the browser's request log;
  Chromium reports `net::ERR_ABORTED`, which is a headless sandbox rejecting an
  unregistered custom scheme, not the app failing — the attempt itself is what
  the criterion asks for).

## AC-004-a — A payment request shows one of pending/paid/failed/expired

- Target: payments-webapp
- Steps: 1–3 as AC-002-a.
- Assert: Status is exactly one of the four enum values (Pending, observed).

## AC-004-b — Status updates once the customer completes or fails payment

- Target: payments-webapp + checkout-webapp
- Steps: 1. Create a request. 2. Pay it as a guest via checkout-webapp
  (own domain/token, bypassing Defect A). 3. Reload the merchant's detail page.
- Assert: Status is no longer "Pending" (Paid or Failed — both are a real
  update; Defect B means only Failed has ever been observed live).

## AC-005-a — A merchant can view a list of all their payment requests

- Target: payments-webapp
- Assert: `/payment-requests` renders a table containing a just-created request.

## AC-005-b — A merchant can view a list of all their transactions

- Target: payments-webapp
- Assert: `/transactions` renders a table containing the resulting transaction.

## AC-006-a — A merchant can enter and save bank account details

- Target: payments-webapp
- Steps: 1. Sign in. 2. Go to `/bank-account`. 3. Fill bank name/account
  number/account name. 4. Save. 5. Reload.
- Assert: fields still show the saved values after reload (PUT persisted).

## AC-007-a — A merchant can view their current available balance

- Target: payments-webapp
- Assert: `/payouts` shows an "Available balance" figure.

## AC-007-b — A merchant can view a history of past payouts

- Target: payments-webapp
- Assert: `/payouts` shows a payout-history table (empty state counts — the
  table and its columns are the observable surface the criterion asks for).

## AC-008-a — A merchant can trigger a payout of their available balance

- Target: payments-webapp
- Steps: 1. Ensure a bank account. 2. Create+pay a request, hoping for a
  settled balance. 3. Trigger a payout.
- Assert: a payout is created for the available balance.
- Expected live result: **fails** — Defect B means balance never leaves 0, so
  every attempt hits the (correctly-implemented) "no available balance" refusal
  instead of a real payout. Documented as genuine, not healed.

## AC-009-a — A merchant can issue a refund for a completed transaction

- Target: payments-webapp
- Steps: 1. Create+pay a request, hoping for a succeeded transaction.
  2. Open it and refund it.
- Assert: the transaction's status becomes "Refunded".
- Expected live result: **fails** — Defect B means no transaction ever reaches
  "succeeded", so there is never a completed transaction to refund. Genuine.

## AC-010-a — Opening a payment link shows amount/currency/merchant, no sign-in

- Target: checkout-webapp (via the literal link payments-webapp shows)
- Steps: 1. Create a request as a merchant. 2. As a guest, open the EXACT
  shareable-link text shown on the detail page (not a hand-corrected URL).
- Assert: amount, currency and merchant name are visible with no sign-in.
- Expected live result: **fails** — Defect A: the literal link redirects to
  payments-webapp's sign-in page instead.

## AC-011-a — A customer can complete payment via mobile money

- Target: checkout-webapp
- Steps: 1. Create a request. 2. As guest, open checkout-webapp's own
  `/{linkToken}` route (checkout-webapp's own contract, independent of Defect
  A). 3. Pay via Mobile Money.
- Assert: the resulting transaction's real status (read back via the merchant
  API) is "succeeded" — not just the UI's claim.
- Expected live result: **fails** — Defect B: the internal-payments-api mock
  declined 100% of attempts observed (5/5 direct, 1/1 browser-driven).

## AC-011-b — A customer can complete payment via card

- Target: checkout-webapp
- Same shape as AC-011-a with the Card tab.
- Expected live result: **fails** — same root cause (5/5 direct, 1/1
  browser-driven declined).

## AC-011-c — A customer pays without creating an account

- Target: checkout-webapp
- Steps: 1–3 as AC-011-a, without ever presenting a sign-in/sign-up screen.
- Assert: no sign-in form appears anywhere between opening the link and the
  result screen.
- This holds regardless of Defect B (the decline itself needs no account
  either) — passes on live evidence.

## AC-012-a — A successful payment triggers an SMS/email confirmation

- Target: checkout-webapp + payments-api
- Steps: 1–3 as AC-011-a. 4. Check the real transaction status.
- Assert: confirmation is only claimed when the transaction actually
  succeeded — i.e. the spec fails loudly rather than trusting checkout-webapp's
  UI text, which (Defect B) shows the same "confirmation sent" copy even on a
  decline.
- Expected live result: **fails** — no genuinely succeeded transaction was
  observed to check a confirmation against.

## AC-013-a — A platform admin can view every merchant

- Target: payments-webapp
- Steps: sign in as test-platform-admin.
- Assert: `/admin/merchants` lists merchants across the platform.

## AC-013-b — A platform admin can view transaction activity across merchants

- Target: payments-webapp
- Assert: `/admin/transactions` lists transactions across merchants.

## AC-008-b — manual

Payouts are never scheduled automatically without the merchant triggering
them. No `POST /payouts` or scheduler exists anywhere in payments-api's
contract or source (`payments_api/service.bal`, `payouts_repo.bal`) — only
`POST /me/payouts`, caller-initiated. Rendered as a human checklist item in
the report; not automated.
