import createClient from "openapi-fetch";
import type { paths } from "./generated/payments-api";

// Same-origin — nginx proxies /api to the payments-api sibling (see
// nginx/default.conf and nginx/15-aep-api-proxy.sh). This app calls only the
// public, unauthenticated payment-link operations of that contract:
//   GET  /payment-links/{linkToken}
//   POST /payment-links/{linkToken}/pay
export const paymentsApi = createClient<paths>({ baseUrl: "/api" });
