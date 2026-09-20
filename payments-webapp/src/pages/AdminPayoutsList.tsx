import type { JSX } from "react";
import { Box, Chip, CircularProgress, ListingTable, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";

// The wireframe draws a "Merchant" column, but payments-api's Payout schema
// carries no merchant identifier at all — so that column is omitted here.
// Reported as a design gap: no list operation in the contract can supply it.
export function AdminPayoutsListPage(): JSX.Element {
  const { data, loading, error } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/payouts", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load payouts");
    return data;
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>All payouts</PageTitle.Header>
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
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Requested</ListingTable.Cell>
                <ListingTable.Cell>Settled</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {(data?.data ?? []).length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState title="No payouts" description="No payout has been requested yet." />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                (data?.data ?? []).map((p) => (
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
