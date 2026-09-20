import { useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  ListingTable,
  MenuItem,
  PageContent,
  PageTitle,
  SearchBar,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatMoney, formatRelative, statusColor, capitalize } from "../lib/format";

const STATUSES = ["All", "pending", "paid", "failed", "expired"] as const;

export function PaymentRequestsListPage(): JSX.Element {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const { data, loading, error } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payment-requests", {
      params: { query: { limit: 100, ...(status !== "All" ? { status } : {}) } },
    });
    if (error) throw new Error("Could not load payment requests");
    return data;
  }, [status]);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((pr) => pr.description.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payment requests</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /me/payment-requests">
            <Button variant="contained" onClick={() => navigate("/payment-requests/new")}>
              New payment request
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <SearchBar
          placeholder="Search by description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          sx={{ minWidth: 160 }}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s === "All" ? "All" : capitalize(s)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

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
                <ListingTable.Cell>Description</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Created</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {rows.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState
                      title="No payment requests"
                      description="No payment request matches this search or filter."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                rows.map((pr) => (
                  <ListingTable.Row
                    key={pr.id}
                    clickable
                    onClick={() => navigate(`/payment-requests/${pr.id}`)}
                  >
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
