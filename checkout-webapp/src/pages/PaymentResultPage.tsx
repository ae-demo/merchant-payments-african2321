import type { JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Box, Button, Chip, CircularProgress, PageContent, Stack, Typography } from "@wso2/oxygen-ui";
import { usePaymentLink } from "../lib/usePaymentLink";
import { formatMoney } from "../lib/money";

interface ResultState {
  outcome: "success" | "failure";
  message?: string;
  merchantName: string;
  amount: number;
  currency: string;
}

function isResultState(value: unknown): value is ResultState {
  return (
    typeof value === "object" &&
    value !== null &&
    "outcome" in value &&
    "merchantName" in value &&
    "amount" in value &&
    "currency" in value
  );
}

/** screen PaymentResult — the outcome of the payment attempt. */
export default function PaymentResultPage(): JSX.Element {
  const { linkToken } = useParams<{ linkToken: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passed = isResultState(location.state) ? location.state : null;

  // The pay action always arrives here with router state carrying the outcome
  // it just got. A page load with none — a reload, a bookmarked or shared
  // result URL — re-derives it from the link's own status instead of showing
  // nothing.
  const fallback = usePaymentLink(passed ? undefined : linkToken);

  if (!passed) {
    if (fallback.status === "loading") {
      return (
        <PageContent centered maxWidth={480}>
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        </PageContent>
      );
    }
    if (fallback.status === "error") {
      return (
        <PageContent centered maxWidth={480}>
          <Typography color="error" sx={{ mt: 4 }}>
            {fallback.message}
          </Typography>
        </PageContent>
      );
    }
    const { link } = fallback;
    if (link.status === "pending") {
      return (
        <PageContent centered maxWidth={480}>
          <Typography variant="h6" sx={{ mt: 4 }}>
            This payment has not been completed yet.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button variant="contained" onClick={() => navigate(`/${encodeURIComponent(linkToken ?? "")}`)}>
              Back to payment details
            </Button>
          </Box>
        </PageContent>
      );
    }
    return (
      <Outcome
        outcome={link.status === "paid" ? "success" : "failure"}
        merchantName={link.merchantName}
        amount={link.amount}
        currency={link.currency}
        linkToken={linkToken}
      />
    );
  }

  return (
    <Outcome
      outcome={passed.outcome}
      merchantName={passed.merchantName}
      amount={passed.amount}
      currency={passed.currency}
      message={passed.message}
      linkToken={linkToken}
    />
  );
}

function Outcome({
  outcome,
  merchantName,
  amount,
  currency,
  message,
  linkToken,
}: {
  outcome: "success" | "failure";
  merchantName: string;
  amount: number;
  currency: string;
  message?: string;
  linkToken: string | undefined;
}): JSX.Element {
  const navigate = useNavigate();
  const money = formatMoney(amount, currency);

  return (
    <PageContent centered maxWidth={480}>
      <Box sx={{ mt: 4 }}>
        {outcome === "success" ? (
          <Chip label="Payment successful" color="success" />
        ) : (
          <Chip label="Payment failed" color="error" />
        )}
      </Box>

      <Typography variant="h6" sx={{ mt: 3 }}>
        {outcome === "success" ? `${money} paid to ${merchantName}` : `${money} to ${merchantName} failed`}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {outcome === "success"
          ? "A confirmation has been sent to you by SMS and email."
          : (message ?? "The charge could not be completed.")}
      </Typography>

      {outcome === "failure" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Button variant="contained" onClick={() => navigate(`/${encodeURIComponent(linkToken ?? "")}/pay`)}>
            Try again
          </Button>
        </Box>
      )}
    </PageContent>
  );
}
