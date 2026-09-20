import { useEffect, useState, type JSX } from "react";
import { Alert, Box, Button, CircularProgress, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";

export function BankAccountSettingsPage(): JSX.Element {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  useEffect(() => {
    let live = true;
    paymentsApi.GET("/me/bank-account").then(({ data }) => {
      if (!live || !data) return;
      setBankName(data.bankName);
      setAccountNumber(data.accountNumber);
      setAccountName(data.accountName);
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setMessage(undefined);
    try {
      const { error } = await paymentsApi.PUT("/me/bank-account", {
        body: { bankName, accountNumber, accountName },
      });
      setMessage(
        error
          ? { kind: "error", text: "Could not save the bank account. Check the details and try again." }
          : { kind: "success", text: "Bank account saved." },
      );
    } finally {
      setSaving(false);
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

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>Payout bank account</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3}>
        {message && <Alert severity={message.kind}>{message.text}</Alert>}
        <TextField label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} fullWidth />
        <TextField
          label="Account number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          fullWidth
        />
        <TextField
          label="Account name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          fullWidth
        />
        <Stack direction="row" justifyContent="flex-end">
          <Can op="PUT /me/bank-account">
            <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
              Save
            </Button>
          </Can>
        </Stack>
      </Stack>
    </PageContent>
  );
}
