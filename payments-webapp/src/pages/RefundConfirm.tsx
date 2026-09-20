import { useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney } from "../lib/format";
import type { Transaction } from "./TransactionsList";

export function RefundConfirmPage(): JSX.Element {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateTransaction = (location.state as { transaction?: Transaction } | null)?.transaction;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const { data: transaction, loading } = useAsync(async () => {
    if (stateTransaction && stateTransaction.id === id) return stateTransaction;
    const { data, error } = await paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load this transaction");
    const found = data.data.find((t) => t.id === id);
    if (!found) throw new Error("Transaction not found");
    return found;
  }, [id]);

  async function confirmRefund(): Promise<void> {
    setSubmitting(true);
    setError(undefined);
    try {
      const { error: apiError } = await paymentsApi.POST("/me/transactions/{id}/refund", {
        params: { path: { id } },
      });
      if (apiError) {
        setError("This transaction cannot be refunded.");
        return;
      }
      navigate("/transactions");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </PageContent>
    );
  }

  return (
    <PageContent maxWidth={520}>
      <PageTitle>
        <PageTitle.Header>Refund this transaction?</PageTitle.Header>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography sx={{ mb: 4 }}>
        {transaction ? formatMoney(transaction.amount, transaction.currency) : "This amount"} will be
        refunded to the customer. This cannot be undone.
      </Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button variant="outlined" onClick={() => navigate(`/transactions/${id}`, { state: { transaction } })}>
          Cancel
        </Button>
        <Can op="POST /me/transactions/{id}/refund">
          <Button variant="contained" color="error" onClick={() => void confirmRefund()} disabled={submitting}>
            Confirm refund
          </Button>
        </Can>
      </Stack>
    </PageContent>
  );
}
