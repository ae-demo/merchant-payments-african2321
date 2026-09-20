import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type PaymentLinkDetails = components["schemas"]["PaymentLinkDetails"];
type PaymentSubmission = components["schemas"]["PaymentSubmission"];
type Transaction = components["schemas"]["Transaction"];
type ApiError = components["schemas"]["Error"];

// Hold state in module scope so the app behaves like an app: paying a link
// moves it from pending to paid/failed, and that persists across in-app
// navigation. A full page load (reload, a typed URL, a link that leaves the
// SPA) re-runs this module and puts the seed data back — only in-app
// navigation carries a change forward.
interface SeedLink extends PaymentLinkDetails {
  linkToken: string;
}

let paymentLinks: Record<string, SeedLink> = {
  "demo-mugs-1042": {
    linkToken: "demo-mugs-1042",
    merchantName: "Acme Traders",
    amount: 8500,
    currency: "NGN",
    description: "Order #1042 — 2 ceramic mugs",
    status: "pending",
  },
  "demo-paid-already": {
    linkToken: "demo-paid-already",
    merchantName: "Acme Traders",
    amount: 8500,
    currency: "NGN",
    description: "Order #1039 — 1 ceramic mug",
    status: "paid",
  },
  "demo-expired-link": {
    linkToken: "demo-expired-link",
    merchantName: "Acme Traders",
    amount: 3200,
    currency: "NGN",
    description: "Order #1035 — 1 tote bag",
    status: "expired",
  },
};

let transactionSeq = 1;

function errorBody(code: number, message: string, description?: string): ApiError {
  return { code, message, description };
}

export const handlers = [
  // Public details of a payment request, by its link token. No `payment-requests:read`
  // check: this operation is `security: []` in payments-api's openapi.yaml, so the
  // mock gateway (mock/authz/gateway.ts) never intercepts it — it is public exactly
  // as the deployed gateway leaves it.
  http.get("/api/payment-links/:linkToken", ({ params }) => {
    const link = paymentLinks[String(params.linkToken)];
    if (!link) {
      return HttpResponse.json(errorBody(404, "No payment request for this link"), { status: 404 });
    }
    const { linkToken: _linkToken, ...details } = link;
    return HttpResponse.json(details satisfies PaymentLinkDetails);
  }),

  // Pay a payment request as a guest, by its link token. Also public — no account,
  // no session, nothing to check beyond the link's own state.
  http.post("/api/payment-links/:linkToken/pay", async ({ params, request }) => {
    const token = String(params.linkToken);
    const link = paymentLinks[token];
    if (!link) {
      return HttpResponse.json(errorBody(404, "No payment request for this link"), { status: 404 });
    }
    if (link.status !== "pending") {
      return HttpResponse.json(
        errorBody(400, "This payment link can no longer be paid", `Its status is "${link.status}".`),
        { status: 400 },
      );
    }

    const submission = (await request.json()) as PaymentSubmission;
    // Demo-only hook so every branch of the outcome screen is reachable without
    // a real mobile-money or card network behind this mock: typing "fail"
    // anywhere in the phone number or card field forces a declined charge.
    const probe = `${submission.phoneNumber ?? ""}${submission.cardToken ?? ""}`.toLowerCase();
    const declined = probe.includes("fail");

    if (declined) {
      paymentLinks = { ...paymentLinks, [token]: { ...link, status: "failed" } };
      return HttpResponse.json(
        errorBody(400, "The charge was declined", "The provider could not complete this payment. Please try again."),
        { status: 400 },
      );
    }

    paymentLinks = { ...paymentLinks, [token]: { ...link, status: "paid" } };
    const transaction: Transaction = {
      id: `txn-${String(transactionSeq++)}`,
      paymentRequestId: token,
      method: submission.method,
      amount: link.amount,
      currency: link.currency,
      status: "succeeded",
      providerReference: `demo-ref-${token}`,
      paidAt: new Date().toISOString(),
    };
    return HttpResponse.json(transaction);
  }),
];
