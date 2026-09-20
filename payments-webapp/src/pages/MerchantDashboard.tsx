import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  ListingTable,
  PageContent,
  PageTitle,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";

export function MerchantDashboardPage(): JSX.Element {
  const navigate = useNavigate();

  const balance = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/balance");
    if (error) throw new Error("Could not load balance");
    return data;
  }, []);

  const pending = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payment-requests", {
      params: { query: { status: "pending", limit: 1 } },
    });
    if (error) throw new Error("Could not load pending requests");
    return data;
  }, []);

  const paid = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payment-requests", {
      params: { query: { status: "paid", limit: 1 } },
    });
    if (error) throw new Error("Could not load paid requests");
    return data;
  }, []);

  const recent = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payment-requests", {
      params: { query: { limit: 10 } },
    });
    if (error) throw new Error("Could not load payment requests");
    return data;
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Merchant Dashboard</PageTitle.Header>
        <PageTitle.SubHeader>Recent payment requests and balance</PageTitle.SubHeader>
      </PageTitle>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Available balance
              </Typography>
              <Typography variant="h4">
                {balance.loading
                  ? "…"
                  : balance.data
                    ? formatMoney(balance.data.available, balance.data.currency)
                    : "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                across all currencies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pending requests
              </Typography>
              <Typography variant="h4">{pending.loading ? "…" : (pending.data?.count ?? 0)}</Typography>
              <Typography variant="caption" color="text.secondary">
                awaiting payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Paid today
              </Typography>
              <Typography variant="h4">{paid.loading ? "…" : (paid.data?.count ?? 0)}</Typography>
              <Typography variant="caption" color="text.secondary">
                transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <PageTitle>
        <PageTitle.Header>Recent payment requests</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payment-requests/new")}>
            New payment request
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      {recent.loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : recent.error ? (
        <Typography color="error">{recent.error}</Typography>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Description</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Created</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {(recent.data?.data ?? []).length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState
                      title="No payment requests yet"
                      description="Create your first payment request to get started."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                (recent.data?.data ?? []).map((pr) => (
                  <ListingTable.Row key={pr.id}>
                    <ListingTable.Cell>{pr.description}</ListingTable.Cell>
                    <ListingTable.Cell>{formatMoney(pr.amount, pr.currency)}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={capitalize(pr.status)} color={statusColor(pr.status)} size="small" />
                    </ListingTable.Cell>
                    <ListingTable.Cell>{formatRelative(pr.createdAt)}</ListingTable.Cell>
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
