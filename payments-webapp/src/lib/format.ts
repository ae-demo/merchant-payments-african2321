// Small display helpers shared by every page. No business logic — just
// turning API values into the copy the wireframes draw ("NGN 8,500", "2h ago").

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function formatRelative(iso: string | undefined | null): string {
  if (!iso) return "-";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.round(diffDay / 30);
  return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
}

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  paid: "success",
  succeeded: "success",
  settled: "success",
  pending: "warning",
  failed: "error",
  expired: "default",
  refunded: "info",
};

export function statusColor(status: string): "success" | "warning" | "error" | "default" | "info" {
  return STATUS_COLOR[status.toLowerCase()] ?? "default";
}

export function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

const COUNTRY_NAMES: Record<string, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "South Africa",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}
