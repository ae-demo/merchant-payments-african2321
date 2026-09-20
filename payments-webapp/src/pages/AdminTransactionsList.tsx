import type { JSX } from "react";
import { Box, Chip, CircularProgress, ListingTable, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";

// The wireframe draws a "Merchant" column, but payments-api's Transaction
// schema carries no merchant identifier (only paymentRequestId, and there is
// no admin payment-requests listing to join it through either) — so that
// column is omitted here. Reported as a design gap: no list operation in the
// contract can supply it.
export function AdminTransactionsListPage(): JSX.Element {
  const { data, loading, error } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/transactions", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load transactions");
    return data;
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>All transactions</PageTitle.Header>
      </PageTitle>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Order</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Paid at</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {(data?.data ?? []).length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState title="No transactions" description="No transaction has settled yet." />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                (data?.data ?? []).map((t) => (
                  <ListingTable.Row key={t.id}>
                    <ListingTable.Cell>{t.paymentRequestId}</ListingTable.Cell>
                    <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={capitalize(t.status)} color={statusColor(t.status)} size="small" />
                    </ListingTable.Cell>
                    <ListingTable.Cell>{formatRelative(t.paidAt)}</ListingTable.Cell>
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
