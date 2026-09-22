# Validation report

- **Issue:** #8
- **Commit:** aa8ecc909c528da8e5bd702a869a4009271a6904
- **Generated:** 2026-09-22T11:08:04.521Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 22 | 16 | 6 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A new merchant can sign in and access the merchant portal | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | A merchant can start accepting payments immediately after signing up, with no approval step | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | A merchant can submit an amount, currency and description to create a payment request | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A created payment request starts in pending status | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | A created payment request has a shareable link | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | A merchant can trigger sending the link to a customer via SMS or email | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | A payment request shows one of pending, paid, failed or expired | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | A payment request's status updates once a customer completes or fails payment | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | A merchant can view a list of all their payment requests | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-005-b | A merchant can view a list of all their transactions | ✅ pass | `tests/e2e/specs/AC-005-b.spec.ts` | — |
| AC-006-a | A merchant can enter and save bank account details for payouts | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | A merchant can view their current available balance | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A merchant can view a history of past payouts | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A merchant can trigger a payout of their available balance | ❌ fail | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-009-a | A merchant can issue a refund for a completed transaction | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-010-a | Opening a payment link shows the amount, currency and merchant name without requiring sign-in | ❌ fail | `tests/e2e/specs/AC-010-a.spec.ts` | — |
| AC-011-a | A customer can complete payment via mobile money | ❌ fail | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-011-b | A customer can complete payment via card | ❌ fail | `tests/e2e/specs/AC-011-b.spec.ts` | — |
| AC-011-c | A customer pays without creating an account | ✅ pass | `tests/e2e/specs/AC-011-c.spec.ts` | — |
| AC-012-a | A successful payment triggers a confirmation sent to the customer by SMS or email | ❌ fail | `tests/e2e/specs/AC-012-a.spec.ts` | — |
| AC-013-a | A platform admin can view a list of every merchant on the platform | ✅ pass | `tests/e2e/specs/AC-013-a.spec.ts` | — |
| AC-013-b | A platform admin can view transaction activity across all merchants | ✅ pass | `tests/e2e/specs/AC-013-b.spec.ts` | — |

## Failures

### AC-008-a — A merchant can trigger a payout of their available balance

Spec: `tests/e2e/specs/AC-008-a.spec.ts`
Location: `AC-008-a.spec.ts:6`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('row').filter({ hasText: /Pending|Settled/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('row').filter({ hasText: /Pending|Settled/ })

```

### AC-009-a — A merchant can issue a refund for a completed transaction

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:6`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Refund' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: 'Refund' })

```

### AC-010-a — Opening a payment link shows the amount, currency and merchant name without requiring sign-in

Spec: `tests/e2e/specs/AC-010-a.spec.ts`
Location: `AC-010-a.spec.ts:5`

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('NGN 500')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('NGN 500')
    - waiting for" https://default-idp.94.72.97.95.sslip.io/oauth2/authorize?client_id=aep-dp-default-merchant-paym-development-68f6e818-r-merchant-payments-c236744c-development-9527afee&redirect_uri=https%3A%2F%2Fhttp…" navigation to finish...
    - navigated to "https://default-idp.94.72.97.95.sslip.io/gate/signin?applicationId=01a0be19-87e6-7aaa-9096-2b9523d0bbb6&authId=01a0c8cb-b964-79ff-b231-aa7adaadce18&executionId=01a0c8cb-b96a-7aa4-b608-7ddbeb685c77"

```

### AC-011-a — A customer can complete payment via mobile money

Spec: `tests/e2e/specs/AC-011-a.spec.ts`
Location: `AC-011-a.spec.ts:6`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "paid"
Received: "failed"
```

### AC-011-b — A customer can complete payment via card

Spec: `tests/e2e/specs/AC-011-b.spec.ts`
Location: `AC-011-b.spec.ts:6`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "paid"
Received: "failed"
```

### AC-012-a — A successful payment triggers a confirmation sent to the customer by SMS or email

Spec: `tests/e2e/specs/AC-012-a.spec.ts`
Location: `AC-012-a.spec.ts:6`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "paid"
Received: "failed"
```

## Manual checklist

- [ ] **AC-008-b** — Payouts are never scheduled automatically without the merchant triggering them

