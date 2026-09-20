// Typed read of window._env_, mounted by the platform at /env-config.js before
// the bundle runs. This app has no auth dependency and no external-kind
// dependency, so it declares no browser-visible keys at all — the sibling
// payments-api is reached same-origin at /api (see src/api.ts), never through
// window._env_.
type Env = Record<string, never>;

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
