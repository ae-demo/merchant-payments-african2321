# Merchant Payments Africa — PRD

## Problem Statement

Merchants across African markets need a simple way to collect money from
customers who mostly pay via mobile money or card, not cash or bank transfer.
Today, accepting both payment types usually means juggling several disconnected
mobile-money and card tools, reconciling them by hand, and having no single
place to see what has been collected or when it will reach the merchant's bank
account.

## Solution

A merchant payments platform where a merchant creates a payment request for a
given amount, shares it with a customer as a link, and the customer pays with
either mobile money or a card — no account required on the customer's side.
The merchant gets a single dashboard of every request and its status, and can
have collected funds settled to a bank account.

## Actors

- **Merchant** — signs up self-service, creates payment requests, sends them to
customers, tracks their status, views transaction history, configures a
payout bank account, and manages payouts and refunds.
- **Customer** — opens a payment link a merchant sent them and pays with mobile
money or a card, as a guest with no account or sign-in.
- **Platform Admin** — signs in to see every merchant and their transaction
activity across the platform, for monitoring and support.

## User Stories

1. As a Merchant, I want to sign up for a merchant account, so that I can start
accepting payments.
2. As a Merchant, I want to create a payment request with an amount, currency
and description, so that I can bill a customer for a specific sale.
3. As a Merchant, I want the payment request to come with a shareable link, so
that I can send it to a customer over SMS or email.
4. As a Merchant, I want to see the status of each payment request (pending,
paid, failed, expired), so that I know when I have been paid.
5. As a Merchant, I want a dashboard/history of all my payment requests and
transactions, so that I can track my sales over time.
6. As a Merchant, I want to configure the bank account collected funds should
settle to, so that I can receive my money.
7. As a Merchant, I want to see my current balance and payout history, so that
I know how much has settled and how much is still pending.
8. As a Merchant, I want to trigger a payout of my available balance to my bank
account, so that I receive my funds when I choose to.
9. As a Merchant, I want to refund a completed payment, so that I can handle a
customer return or dispute.
10. As a Customer, I want to open a payment link and see the amount, currency
and merchant name before paying, so that I know exactly what I am paying
for.
11. As a Customer, I want to pay a merchant's request using mobile money or a
card, so that I can use whichever method I have available.
12. As a Customer, I want to receive a confirmation by SMS or email once my
payment succeeds, so that I have proof of payment.
13. As a Platform Admin, I want to see every merchant and their transaction
activity, so that I can monitor the platform and support merchants when
something goes wrong.

## Product Decisions

- Sign-in: Merchants and Platform Admins sign in via SSO through Thunder, the
platform IDP (org default). Customers never sign in — they pay as guests
from a link.
- Payment processing: mobile money and card charges, refunds and status checks
are handled by the internal payments API, an existing registered resource of
the organization (org default) — the platform does not talk to mobile-money
or card networks directly.
- Notifications: payment-link delivery and payment confirmations go out over
the shared SMS service and the shared email service, both registered
resources of the organization (org default).
- Merchant onboarding is self-service: a merchant signs up and can create
payment requests immediately, with no admin approval or KYC gate before
their first transaction.
- Payout/settlement of collected funds to a merchant's bank account is in
scope for this product.
- Payouts are merchant-triggered rather than scheduled automatically — a
merchant chooses when to pay out their available balance.
- Launch markets: Nigeria (NGN), Kenya (KES) and South Africa (ZAR) — the
three largest and most active African payments markets, picked at the user's
request to launch with the most popular three.

## Out of Scope

- In-person / point-of-sale checkout (QR codes, card terminals): this product
only supports merchant-initiated payment links sent to a customer.
- Customer accounts, sign-in, or a cross-merchant payment history for
customers — every payment is a guest checkout.
- Automatic/scheduled payouts — payouts are merchant-triggered only (see
Product Decisions).
- Currency conversion or cross-border settlement logic beyond paying out in
the currency the merchant collected in.
- A formal dispute-resolution workflow beyond a merchant issuing a direct
refund.

## Open Questions

None.

## Further Notes

None.

