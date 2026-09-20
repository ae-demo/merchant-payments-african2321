import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";

export function PayoutsHomePage(): JSX.Element {
  const navigate = useNavigate();

  const balance = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/balance");
    if (error) throw new Error("Could not load balance");
    return data;
  }, []);

  const payouts = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payouts", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load payouts");
    return data;
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /me/payouts">
            <Button variant="contained" onClick={() => navigate("/payouts/confirm")}>
              Trigger payout
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      <Card sx={{ mb: 4, maxWidth: 360 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Available balance
          </Typography>
          <Typography variant="h4">
            {balance.loading ? "…" : balance.data ? formatMoney(balance.data.available, balance.data.currency) : "—"}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Payout history
      </Typography>

      {payouts.loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : payouts.error ? (
        <Typography color="error">{payouts.error}</Typography>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Requested</ListingTable.Cell>
                <ListingTable.Cell>Settled</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {(payouts.data?.data ?? []).length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState
                      title="No payouts yet"
                      description="Trigger a payout once you have a settled balance."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                (payouts.data?.data ?? []).map((p) => (
                  <ListingTable.Row key={p.id}>
                    <ListingTable.Cell>{formatMoney(p.amount, p.currency)}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={capitalize(p.status)} color={statusColor(p.status)} size="small" />
                    </ListingTable.Cell>
                    <ListingTable.Cell>{formatRelative(p.requestedAt)}</ListingTable.Cell>
                    <ListingTable.Cell>{p.settledAt ? formatRelative(p.settledAt) : "-"}</ListingTable.Cell>
                  </ListingTable.Row>
                ))
              )}
            </ListingTable.Body>
          </ListingTable>
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
