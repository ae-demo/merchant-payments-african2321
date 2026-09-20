import { useEffect, useState } from "react";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type PaymentLinkDetails = components["schemas"]["PaymentLinkDetails"];

export type PaymentLinkState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; link: PaymentLinkDetails };

/** GET /payment-links/{linkToken} — the one public lookup every screen in this app is built on. */
export function usePaymentLink(linkToken: string | undefined): PaymentLinkState {
  const [state, setState] = useState<PaymentLinkState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!linkToken) {
      setState({ status: "error", message: "This payment link is missing its code." });
      return;
    }
    setState({ status: "loading" });
    paymentsApi
      .GET("/payment-links/{linkToken}", { params: { path: { linkToken } } })
      .then(({ data, error, response }) => {
        if (cancelled) return;
        if (error) {
          setState({
            status: "error",
            message:
              response.status === 404
                ? "This payment link is invalid or has expired."
                : (error.message ?? "This payment link could not be loaded."),
          });
          return;
        }
        setState({ status: "ready", link: data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error", message: "This payment link could not be loaded. Check your connection and try again." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkToken]);

  return state;
}
