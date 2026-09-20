import { useEffect, useState, type JSX } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  TextField,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";

// The wireframe draws only Country, not Currency — but Merchant.currency is
// required by the contract. The two enums line up 1:1 in this business
// (NG/NGN, KE/KES, ZA/ZAR), so currency is derived from country rather than
// asking the merchant to pick a field the screen does not draw.
const COUNTRIES: { code: "NG" | "KE" | "ZA"; label: string; currency: "NGN" | "KES" | "ZAR" }[] = [
  { code: "NG", label: "Nigeria", currency: "NGN" },
  { code: "KE", label: "Kenya", currency: "KES" },
  { code: "ZA", label: "South Africa", currency: "ZAR" },
];

export function MerchantProfileSettingsPage(): JSX.Element {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<"NG" | "KE" | "ZA">("NG");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  useEffect(() => {
    let live = true;
    paymentsApi
      .GET("/me/merchant")
      .then(({ data }) => {
        if (!live || !data) return;
        setBusinessName(data.businessName);
        setEmail(data.email);
        setPhone(data.phone ?? "");
        if (data.country === "NG" || data.country === "KE" || data.country === "ZA") {
          setCountry(data.country);
        }
      })
      .finally(() => {
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
      const currency = COUNTRIES.find((c) => c.code === country)!.currency;
      const { error } = await paymentsApi.PUT("/me/merchant", {
        body: { id: "", businessName, email, phone, country, currency },
      });
      setMessage(
        error
          ? { kind: "error", text: "Could not save the business profile." }
          : { kind: "success", text: "Business profile saved." },
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
        <PageTitle.Header>Business profile</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3}>
        {message && <Alert severity={message.kind}>{message.text}</Alert>}
        <TextField
          label="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          fullWidth
        />
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
        <TextField
          select
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value as "NG" | "KE" | "ZA")}
          fullWidth
        >
          {COUNTRIES.map((c) => (
            <MenuItem key={c.code} value={c.code}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" justifyContent="flex-end">
          <Can op="PUT /me/merchant">
            <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
              Save
            </Button>
          </Can>
        </Stack>
      </Stack>
    </PageContent>
  );
}
