import { useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, ListingTable, PageContent, PageTitle, SearchBar, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatRelative } from "../lib/format";

export function AdminMerchantsListPage(): JSX.Element {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data, loading, error } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load merchants");
    return data;
  }, []);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((m) => m.businessName.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Merchants</PageTitle.Header>
        <PageTitle.Actions>
          <SearchBar
            placeholder="Search by business name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </PageTitle.Actions>
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
                <ListingTable.Cell>Business</ListingTable.Cell>
                <ListingTable.Cell>Country</ListingTable.Cell>
                <ListingTable.Cell>Currency</ListingTable.Cell>
                <ListingTable.Cell>Joined</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {rows.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState title="No merchants" description="No merchant matches this search." />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                rows.map((m) => (
                  <ListingTable.Row key={m.id} clickable onClick={() => navigate(`/admin/merchants/${m.id}`, { state: { merchant: m } })}>
                    <ListingTable.Cell>{m.businessName}</ListingTable.Cell>
                    <ListingTable.Cell>{m.country}</ListingTable.Cell>
                    <ListingTable.Cell>{m.currency}</ListingTable.Cell>
                    <ListingTable.Cell>{formatRelative(m.createdAt)}</ListingTable.Cell>
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
