// Typed read of window._env_, which the platform mounts at /env-config.js at
// request time. Declares only the keys this app actually has: the
// thunder-auth OIDC config (CLIENT_ID, ISSUER, SCOPES, RESOURCE — not
// JWKS_URL, which the browser never reads since it never validates a token).
// There is no sibling API URL here: payments-api is reached same-origin at
// /api, proxied by nginx (react-webapp).

export type Env = {
  THUNDER_AUTH_CLIENT_ID: string;
  THUNDER_AUTH_ISSUER: string;
  THUNDER_AUTH_SCOPES: string;
  THUNDER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
