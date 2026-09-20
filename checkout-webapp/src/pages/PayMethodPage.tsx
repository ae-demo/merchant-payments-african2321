import { useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  PageContent,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { usePaymentLink } from "../lib/usePaymentLink";
import { formatMoney } from "../lib/money";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Method = components["schemas"]["PaymentSubmission"]["method"];

/**
 * screen PayMethod — the customer chooses mobile money or card and pays.
 *
 * The wireframe draws one tab control (Mobile Money | Card) and one input
 * below it. Nothing in the wireframe or the design distinguishes a per-tab
 * field, and payments-api's PaymentSubmission needs a phone number for
 * mobile money but an opaque `cardToken` for card — this app has no card
 * tokenizer dependency declared in design.json, so there is no real PCI card
 * capture to build. The one drawn input is reused for both methods, with its
 * label following the active tab; for Card, what it collects is wrapped into
 * a placeholder token client-side rather than sent as a raw card number.
 */
export default function PayMethodPage(): JSX.Element {
  const { linkToken } = useParams<{ linkToken: string }>();
  const navigate = useNavigate();
  const state = usePaymentLink(linkToken);
  const [method, setMethod] = useState<Method>("mobile-money");
  const [fieldValue, setFieldValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const token = linkToken ?? "";
  const fieldLabel = method === "mobile-money" ? "Phone number" : "Card number";
  const canPay = link.status === "pending" && fieldValue.trim().length > 0 && !submitting;

  async function submit(): Promise<void> {
    setSubmitting(true);
    setSubmitError(null);
    const body =
      method === "mobile-money"
        ? { method, phoneNumber: fieldValue.trim() }
        : { method, cardToken: `tok_${fieldValue.replace(/\s+/g, "").slice(-4)}_${String(Date.now())}` };

    try {
      const { data, error } = await paymentsApi.POST("/payment-links/{linkToken}/pay", {
        params: { path: { linkToken: token } },
        body,
      });

      // A 200 is not itself "success" -- the charge may still be settling
      // (transaction status "pending") and only a "succeeded" transaction is
      // a real payment. Trusting the HTTP status alone repeats Defect B.
      if (error || data.status !== "succeeded") {
        navigate(`/${encodeURIComponent(token)}/result`, {
          state: {
            outcome: "failure",
            message: error?.description ?? error?.message,
            merchantName: link.merchantName,
            amount: link.amount,
            currency: link.currency,
          },
        });
        return;
      }

      navigate(`/${encodeURIComponent(token)}/result`, {
        state: {
          outcome: "success",
          transaction: data,
          merchantName: link.merchantName,
          amount: link.amount,
          currency: link.currency,
        },
      });
    } catch {
      setSubmitError("Could not reach the payment service. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <PageContent centered maxWidth={480}>
      <Typography variant="h6" sx={{ mt: 4 }}>
        {formatMoney(link.amount, link.currency)} to {link.merchantName}
      </Typography>

      {link.status !== "pending" ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          This payment link can no longer be paid.
        </Alert>
      ) : (
        <>
          <Tabs
            value={method === "mobile-money" ? 0 : 1}
            onChange={(_event, value: number) => {
              setMethod(value === 0 ? "mobile-money" : "card");
              setFieldValue("");
              setSubmitError(null);
            }}
            sx={{ mt: 3 }}
          >
            <Tab label="Mobile Money" />
            <Tab label="Card" />
          </Tabs>

          <TextField
            label={fieldLabel}
            value={fieldValue}
            onChange={(event) => {
              setFieldValue(event.target.value);
            }}
            fullWidth
            sx={{ mt: 3 }}
            disabled={submitting}
          />

          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button variant="outlined" disabled={submitting} onClick={() => navigate(`/${encodeURIComponent(token)}`)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!canPay}
              onClick={() => {
                void submit();
              }}
            >
              {submitting ? "Paying…" : `Pay ${formatMoney(link.amount, link.currency)}`}
            </Button>
          </Box>
        </>
      )}
    </PageContent>
  );
}
