import { useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, capitalize, statusColor } from "../lib/format";
import { joinOrderLabels, type Transaction } from "./TransactionsList";

// payments-api has no GET /me/transactions/{id} — only the list operation.
// The fast path takes the row the list already fetched via router state; a
// direct URL / refresh falls back to re-fetching that same list and finding
// the id in it, exactly the reach GET /me/transactions already grants.
export function TransactionDetailPage(): JSX.Element {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateTransaction = (location.state as { transaction?: Transaction } | null)?.transaction;
  const [orderLabel, setOrderLabel] = useState<string>();

  const { data, loading, error } = useAsync(async () => {
    if (stateTransaction && stateTransaction.id === id) {
      const labels = await joinOrderLabels([stateTransaction]);
      setOrderLabel(labels[stateTransaction.id]);
      return stateTransaction;
    }
    const { data, error } = await paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load transactions");
    const found = data.data.find((t) => t.id === id);
    if (!found) throw new Error("Transaction not found");
    const labels = await joinOrderLabels([found]);
    setOrderLabel(labels[found.id]);
    return found;
  }, [id]);

  if (loading) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </PageContent>
    );
  }
  if (error || !data) {
    return (
      <PageContent>
        <Typography color="error">{error ?? "Transaction not found."}</Typography>
      </PageContent>
    );
  }

  const canRefund = data.status === "succeeded";

  return (
    <PageContent maxWidth={640}>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/transactions")}>Back</PageTitle.BackButton>
        <PageTitle.Header>Transaction for {orderLabel ?? data.paymentRequestId}</PageTitle.Header>
      </PageTitle>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h4">{formatMoney(data.amount, data.currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={capitalize(data.status)} color={statusColor(data.status)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Provider reference: {data.providerReference ?? "—"}
      </Typography>

      {canRefund && (
        <Can op="POST /me/transactions/{id}/refund">
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="error"
              onClick={() => navigate(`/transactions/${id}/refund`, { state: { transaction: data, orderLabel } })}
            >
              Refund
            </Button>
          </Stack>
        </Can>
      )}
    </PageContent>
  );
}
