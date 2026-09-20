import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney } from "../lib/format";

export function PayoutConfirmPage(): JSX.Element {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const { data: balance, loading } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/balance");
    if (error) throw new Error("Could not load balance");
    return data;
  }, []);

  async function confirmPayout(): Promise<void> {
    setSubmitting(true);
    setError(undefined);
    try {
      const { error: apiError } = await paymentsApi.POST("/me/payouts");
      if (apiError) {
        setError("No bank account configured, or no available balance.");
        return;
      }
      navigate("/payouts");
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

  const amount = balance ? formatMoney(balance.available, balance.currency) : "your balance";

  return (
    <PageContent maxWidth={520}>
      <PageTitle>
        <PageTitle.Header>Pay out {amount}?</PageTitle.Header>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography sx={{ mb: 4 }}>This will be transferred to your configured bank account.</Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button variant="outlined" onClick={() => navigate("/payouts")}>
          Cancel
        </Button>
        <Can op="POST /me/payouts">
          <Button variant="contained" onClick={() => void confirmPayout()} disabled={submitting}>
            Confirm payout
          </Button>
        </Can>
      </Stack>
    </PageContent>
  );
}
