import type { JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Card, CardContent, CircularProgress, Grid, ListingTable, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { countryName } from "../lib/format";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

// payments-api has no GET /merchants/{id} — only the list operation, and the
// fast path takes the row AdminMerchantsList already fetched via router
// state. A direct URL falls back to re-fetching that same list.
//
// "Recent transactions" is drawn by the wireframe but Transaction (and
// PaymentRequest) carry no merchant identifier anywhere in the contract, so
// there is no way to filter transactions down to one merchant — reported as
// a design gap rather than built on an invented field.
export function AdminMerchantDetailPage(): JSX.Element {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateMerchant = (location.state as { merchant?: Merchant } | null)?.merchant;

  const { data, loading, error } = useAsync(async () => {
    if (stateMerchant && stateMerchant.id === id) return stateMerchant;
    const { data, error } = await paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } });
    if (error) throw new Error("Could not load merchants");
    const found = data.data.find((m) => m.id === id);
    if (!found) throw new Error("Merchant not found");
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
        <Typography color="error">{error ?? "Merchant not found."}</Typography>
      </PageContent>
    );
  }

  return (
    <PageContent maxWidth={720}>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/admin/merchants")}>Back</PageTitle.BackButton>
        <PageTitle.Header>{data.businessName}</PageTitle.Header>
      </PageTitle>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Country
              </Typography>
              <Typography variant="h4">{countryName(data.country)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Currency
              </Typography>
              <Typography variant="h4">{data.currency}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent transactions
      </Typography>
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
            <ListingTable.Row>
              <ListingTable.Cell colSpan={4}>
                <ListingTable.EmptyState
                  title="Not available"
                  description="payments-api's Transaction record carries no merchant identifier, so per-merchant transactions cannot be listed here without the contract adding one."
                />
              </ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
