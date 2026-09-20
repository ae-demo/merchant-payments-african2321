import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useAsync } from "../lib/useAsync";
import { capitalize, statusColor } from "../lib/format";

// payments-webapp has no dependency wiring for checkout-webapp's public URL —
// the design gives no env var or dependency for it — so the shareable link is
// built from this app's own origin and the linkToken path checkout-webapp's
// wireframes imply (/pay/:linkToken). Noted as a gap in the report: the
// contract does not tell a merchant-facing app where the guest checkout lives.
function shareableLink(linkToken: string): string {
  return `${window.location.origin}/pay/${linkToken}`;
}

export function PaymentRequestDetailPage(): JSX.Element {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await paymentsApi.GET("/me/payment-requests/{id}", {
      params: { path: { id } },
    });
    if (error) throw new Error("Could not load this payment request");
    return data;
  }, [id]);

  // Poll while pending — merchant-collects-a-payment.md: "poll payment
  // request status" until the guest's payment settles it.
  useEffect(() => {
    if (data?.status !== "pending") return;
    const timer = window.setInterval(reload, 5000);
    return () => window.clearInterval(timer);
  }, [data?.status, reload]);

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
        <Typography color="error">{error ?? "Payment request not found."}</Typography>
      </PageContent>
    );
  }

  const link = data.linkToken ? shareableLink(data.linkToken) : "";

  function copyLink(): void {
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  function sendViaSms(): void {
    window.location.href = `sms:?&body=${encodeURIComponent(
      `Pay ${data!.description}: ${link}`,
    )}`;
  }

  function sendViaEmail(): void {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      `Payment request: ${data!.description}`,
    )}&body=${encodeURIComponent(`Please pay via this link: ${link}`)}`;
  }

  return (
    <PageContent maxWidth={640}>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/payment-requests")}>Back</PageTitle.BackButton>
        <PageTitle.Header>{data.description}</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3}>
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

        <Typography variant="h6">Shareable link</Typography>
        <TextField value={link} fullWidth slotProps={{ input: { readOnly: true } }} />

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={copyLink}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button variant="outlined" onClick={sendViaSms}>
            Send via SMS
          </Button>
          <Button variant="outlined" onClick={sendViaEmail}>
            Send via Email
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </Stack>
      </Stack>
    </PageContent>
  );
}
