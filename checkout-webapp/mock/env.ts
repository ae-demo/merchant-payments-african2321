// The keys the platform actually emits for this app: none. checkout-webapp has
// no auth dependency and no external-kind dependency, so window._env_ carries
// nothing (see src/env.ts) — the payments-api sibling is same-origin /api.
export const mockEnv = {};
