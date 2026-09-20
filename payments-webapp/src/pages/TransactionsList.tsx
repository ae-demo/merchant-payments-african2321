import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";
import type { components } from "../generated/payments-api";

export type Transaction = components["schemas"]["Transaction"];

/** The order label a transaction's paymentRequestId joins to — one extra list
 * request (GET /me/payment-requests), never a per-row fetch (wireframes'
 * implementing.md). A transaction whose payment request fell off that page
 * falls back to its raw id. */
export async function joinOrderLabels(transactions: Transaction[]): Promise<Record<string, string>> {
  const { data } = await paymentsApi.GET("/me/payment-requests", { params: { query: { limit: 100 } } });
  const byId: Record<string, string> = {};
  for (const pr of data?.data ?? []) byId[pr.id] = pr.description;
  const labels: Record<string, string> = {};
  for (const t of transactions) labels[t.id] = byId[t.paymentRequestId] ?? t.paymentRequestId;
  return labels;
}

export function TransactionsListPage(): JSX.Element {
  const navigate = useNavigate();

  const { data, loading, error } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load transactions");
    const orderLabels = await joinOrderLabels(data.data);
    return { transactions: data.data, orderLabels };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
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
                <ListingTable.Cell>Method</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Paid at</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {(data?.transactions ?? []).length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={5}>
                    <ListingTable.EmptyState
                      title="No transactions yet"
                      description="Transactions appear here once a customer pays a request."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                (data?.transactions ?? []).map((t) => (
                  <ListingTable.Row
                    key={t.id}
                    clickable
                    onClick={() => navigate(`/transactions/${t.id}`, { state: { transaction: t } })}
                  >
                    <ListingTable.Cell>{data?.orderLabels[t.id] ?? t.paymentRequestId}</ListingTable.Cell>
                    <ListingTable.Cell>{t.method === "mobile-money" ? "Mobile Money" : "Card"}</ListingTable.Cell>
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
