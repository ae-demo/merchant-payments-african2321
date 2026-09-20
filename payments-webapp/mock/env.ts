// The keys the platform actually emits for this component in mock mode:
// thunder-auth's OIDC config. No sibling API URL here — payments-api is
// same-origin /api, proxied by nginx in production and by MSW here.
export const mockEnv = {
  THUNDER_AUTH_CLIENT_ID: "mock-client",
  THUNDER_AUTH_ISSUER: "https://mock-idp.test",
  THUNDER_AUTH_SCOPES:
    "openid profile email group ou " +
    "bank-accounts:manage merchants:read merchants:read-all merchants:update " +
    "payment-requests:create payment-requests:read payment-requests:read-all " +
    "payouts:create payouts:read payouts:read-all refunds:create " +
    "transactions:read transactions:read-all",
  THUNDER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
