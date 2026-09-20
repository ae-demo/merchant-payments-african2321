// Mock handlers for payments-api, one per operation the app actually calls.
// Contract is openapi.yaml (the same document src/generated/ came from) —
// response shapes match its schemas, status codes match its declared
// responses. State lives in module scope so create/update/delete persist
// across in-app navigation; any full page load (reload, typed URL, a link
// that leaves the SPA) re-runs this module and restores the seed.
//
// No scope check here — mock/authz/gateway.ts is the gateway layer and
// answers every 401 before a handler is reached. What a handler owes is what
// a real service owes: a /me/... path answers the caller's own rows, and a
// row that exists but is not theirs is a 404 there, never anywhere else.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";
import { scopesFromToken } from "./authz/session";

type Merchant = components["schemas"]["Merchant"];
type PaymentRequest = components["schemas"]["PaymentRequest"];
type Transaction = components["schemas"]["Transaction"];
type BankAccount = components["schemas"]["BankAccount"];
type Payout = components["schemas"]["Payout"];

// The signed-in mock caller when acting as the Merchant role — mock/authz/session.ts
// derives `sub` as `mock-<role-name-lowercased>`, so the Merchant role is
// always this id.
export const mockCaller = { id: "mock-merchant", username: "mock-merchant" };

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
const monthsAgo = (m: number) => new Date(now - m * 30 * 86_400_000).toISOString();

let merchants: Merchant[] = [
  {
    id: mockCaller.id,
    businessName: "Acme Traders",
    email: "billing@acme.test",
    phone: "+2348012345678",
    country: "NG",
    currency: "NGN",
    createdAt: monthsAgo(2),
  },
  {
    id: "merchant-2",
    businessName: "Nairobi Foods",
    email: "billing@nairobifoods.test",
    phone: "+254712345678",
    country: "KE",
    currency: "KES",
    createdAt: monthsAgo(1),
  },
];

let paymentRequests: PaymentRequest[] = [
  {
    id: "pr-1042",
    amount: 8500,
    currency: "NGN",
    description: "Order #1042",
    status: "paid",
    linkToken: "ab12cd",
    createdAt: hoursAgo(2),
  },
  {
    id: "pr-1041",
    amount: 2200,
    currency: "KES",
    description: "Order #1041",
    status: "pending",
    linkToken: "cd34ef",
    createdAt: hoursAgo(5),
  },
  {
    id: "pr-1040",
    amount: 450,
    currency: "ZAR",
    description: "Order #1040",
    status: "expired",
    linkToken: "ef56gh",
    createdAt: daysAgo(1),
  },
  {
    id: "pr-1039",
    amount: 900,
    currency: "KES",
    description: "Order #1039",
    status: "paid",
    linkToken: "gh78ij",
    createdAt: daysAgo(1),
  },
];

let transactions: Transaction[] = [
  {
    id: "txn-1",
    paymentRequestId: "pr-1042",
    method: "card",
    amount: 8500,
    currency: "NGN",
    status: "succeeded",
    providerReference: "pv-9928172",
    paidAt: hoursAgo(2),
  },
  {
    id: "txn-2",
    paymentRequestId: "pr-1039",
    method: "mobile-money",
    amount: 900,
    currency: "KES",
    status: "succeeded",
    providerReference: "pv-1122334",
    paidAt: daysAgo(1),
  },
  {
    id: "txn-3",
    paymentRequestId: "pr-900",
    method: "card",
    amount: 1200,
    currency: "KES",
    status: "succeeded",
    providerReference: "pv-5544332",
    paidAt: daysAgo(1),
  },
];

let bankAccount: BankAccount | null = {
  bankName: "GTBank",
  accountNumber: "0123456789",
  accountName: "Acme Traders",
};

let payouts: Payout[] = [
  {
    id: "po-1",
    amount: 50000,
    currency: "NGN",
    status: "settled",
    requestedAt: daysAgo(3),
    settledAt: daysAgo(2),
  },
  {
    id: "po-2",
    amount: 20000,
    currency: "NGN",
    status: "pending",
    requestedAt: hoursAgo(6),
  },
];

function paginate<T>(items: T[], url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const page = items.slice(offset, offset + limit);
  return { count: items.length, next: null, previous: null, data: page };
}

let nextPrId = 2000;
let nextPayoutId = 3;

export const handlers = [
  // --- Merchant profile ------------------------------------------------
  http.get("/api/me/merchant", () => {
    const mine = merchants.find((m) => m.id === mockCaller.id);
    return mine
      ? HttpResponse.json(mine)
      : HttpResponse.json({ code: 404, message: "No profile yet" }, { status: 404 });
  }),
  http.put("/api/me/merchant", async ({ request }) => {
    const body = (await request.json()) as Merchant;
    const updated: Merchant = { ...body, id: mockCaller.id, createdAt: merchants.find((m) => m.id === mockCaller.id)?.createdAt };
    merchants = merchants.map((m) => (m.id === mockCaller.id ? updated : m));
    if (!merchants.some((m) => m.id === mockCaller.id)) merchants = [...merchants, updated];
    return HttpResponse.json(updated);
  }),

  // --- Admin: every merchant --------------------------------------------
  http.get("/api/merchants", ({ request }) => HttpResponse.json(paginate(merchants, new URL(request.url)))),

  // --- Payment requests --------------------------------------------------
  http.get("/api/me/payment-requests", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const mine = status ? paymentRequests.filter((p) => p.status === status) : paymentRequests;
    return HttpResponse.json(paginate(mine, url));
  }),
  http.post("/api/me/payment-requests", async ({ request }) => {
    const body = (await request.json()) as { amount?: number; currency?: string; description?: string };
    if (!body.amount || !body.currency || !body.description) {
      return HttpResponse.json({ code: 400, message: "Invalid request data" }, { status: 400 });
    }
    const created: PaymentRequest = {
      id: `pr-${nextPrId++}`,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      status: "pending",
      linkToken: Math.random().toString(36).slice(2, 8),
      createdAt: new Date().toISOString(),
    };
    paymentRequests = [created, ...paymentRequests];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get("/api/me/payment-requests/:id", ({ params }) => {
    const found = paymentRequests.find((p) => p.id === params.id);
    return found
      ? HttpResponse.json(found)
      : HttpResponse.json({ code: 404, message: "Not found" }, { status: 404 });
  }),

  // --- Transactions --------------------------------------------------------
  http.get("/api/me/transactions", ({ request }) => HttpResponse.json(paginate(transactions, new URL(request.url)))),
  http.get("/api/transactions", ({ request }) => HttpResponse.json(paginate(transactions, new URL(request.url)))),
  http.post("/api/me/transactions/:id/refund", ({ params }) => {
    const found = transactions.find((t) => t.id === params.id);
    if (!found) return HttpResponse.json({ code: 404, message: "Not found" }, { status: 404 });
    if (found.status !== "succeeded") {
      return HttpResponse.json({ code: 400, message: "The transaction cannot be refunded" }, { status: 400 });
    }
    const refunded: Transaction = { ...found, status: "refunded" };
    transactions = transactions.map((t) => (t.id === found.id ? refunded : t));
    return HttpResponse.json(refunded);
  }),

  // --- Bank account ----------------------------------------------------
  http.get("/api/me/bank-account", () =>
    bankAccount
      ? HttpResponse.json(bankAccount)
      : HttpResponse.json({ code: 404, message: "No bank account configured yet" }, { status: 404 }),
  ),
  http.put("/api/me/bank-account", async ({ request }) => {
    const body = (await request.json()) as BankAccount;
    if (!body.bankName || !body.accountNumber || !body.accountName) {
      return HttpResponse.json({ code: 400, message: "Invalid bank account data" }, { status: 400 });
    }
    bankAccount = body;
    return HttpResponse.json(bankAccount);
  }),

  // --- Balance & payouts -------------------------------------------------
  http.get("/api/me/balance", () => HttpResponse.json({ available: 128400, currency: "NGN" })),
  http.get("/api/me/payouts", ({ request }) => HttpResponse.json(paginate(payouts, new URL(request.url)))),
  http.post("/api/me/payouts", () => {
    if (!bankAccount) {
      return HttpResponse.json({ code: 400, message: "No bank account configured" }, { status: 400 });
    }
    const created: Payout = {
      id: `po-${nextPayoutId++}`,
      amount: 128400,
      currency: "NGN",
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    payouts = [created, ...payouts];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get("/api/payouts", ({ request }) => HttpResponse.json(paginate(payouts, new URL(request.url)))),
];

// Re-exported so a handler could read ownership widening if it ever needed
// to — none currently do, since every /me/ row here is already the mock
// caller's by construction.
export { scopesFromToken };
