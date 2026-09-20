import type { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Box, Button, Card, CardContent, CircularProgress, PageContent, Stack, Typography } from "@wso2/oxygen-ui";
import { usePaymentLink } from "../lib/usePaymentLink";
import { formatMoney } from "../lib/money";

const STATUS_MESSAGE: Record<string, string> = {
  paid: "This payment link has already been paid.",
  failed: "The last attempt on this payment link failed. It can no longer be paid.",
  expired: "This payment link has expired.",
};

/** screen PaymentDetails — a customer opens a merchant's payment link and sees what they owe. */
export default function PaymentDetailsPage(): JSX.Element {
  const { linkToken } = useParams<{ linkToken: string }>();
  const navigate = useNavigate();
  const state = usePaymentLink(linkToken);

  if (state.status === "loading") {
    return (
      <PageContent centered maxWidth={480}>
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </PageContent>
    );
  }

  if (state.status === "error") {
    return (
      <PageContent centered maxWidth={480}>
        <Alert severity="error" sx={{ mt: 4 }}>
          {state.message}
        </Alert>
      </PageContent>
    );
  }

  const { link } = state;
  const alreadySettled = link.status !== "pending";

  return (
    <PageContent centered maxWidth={480}>
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Merchant
          </Typography>
          <Typography variant="h6">{link.merchantName}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mt: 3 }}>
        {formatMoney(link.amount, link.currency)}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {link.description}
      </Typography>

      {alreadySettled && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {STATUS_MESSAGE[link.status] ?? "This payment link can no longer be paid."}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="contained"
          disabled={alreadySettled}
          onClick={() => navigate(`/${encodeURIComponent(linkToken ?? "")}/pay`)}
        >
          Pay now
        </Button>
      </Box>
    </PageContent>
  );
}
