import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

/**
 * The one registered redirect URI, serving both the redirect leg and the
 * silent-renew iframe leg. `handleCallback()` (`signinCallback()`) dispatches
 * on `request_type`; only the redirect leg ever lands here to be seen by a
 * human, so once it settles we send them home.
 */
export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void handleCallback().finally(() => {
      if (live) navigate("/", { replace: true });
    });
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Signing you in…</p>
    </main>
  );
}
