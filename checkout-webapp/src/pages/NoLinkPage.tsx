import type { JSX } from "react";
import { PageContent, Typography } from "@wso2/oxygen-ui";

/**
 * Not one of the wireframe's screens: this app has no landing page of its
 * own, only payment links a merchant shares. Reached at `/` or any path with
 * no matching link token.
 */
export default function NoLinkPage(): JSX.Element {
  return (
    <PageContent centered maxWidth={480}>
      <Typography variant="h6" sx={{ mt: 4 }}>
        Open your payment link
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        Use the payment link a merchant sent you by SMS or email to view and pay what you owe.
      </Typography>
    </PageContent>
  );
}
