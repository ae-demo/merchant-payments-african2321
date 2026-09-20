import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  TextField,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";

const CURRENCIES = ["NGN", "KES", "ZAR"] as const;

export function CreatePaymentRequestPage(): JSX.Element {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("NGN");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleCreate(): Promise<void> {
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount and a description.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const { data, error: apiError } = await paymentsApi.POST("/me/payment-requests", {
        body: { amount: parsedAmount, currency, description: description.trim() },
      });
      if (apiError || !data) {
        setError("Could not create the payment request. Check the details and try again.");
        return;
      }
      navigate(`/payment-requests/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>New payment request</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />
        <TextField
          select
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
          fullWidth
        >
          {CURRENCIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Can op="POST /me/payment-requests">
            <Button variant="contained" onClick={() => void handleCreate()} disabled={submitting}>
              Create request
            </Button>
          </Can>
        </Stack>
      </Stack>
    </PageContent>
  );
}
