export function formatINR(value, compact = false) {
  const n = Number(value || 0);
  if (compact) {
    if (Math.abs(n) >= 10000000)
      return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export const RISK_COLORS = {
  Conservative: "#10B981",
  "Moderately Conservative": "#22C55E",
  Moderate: "#F59E0B",
  "Moderately Aggressive": "#F97316",
  Aggressive: "#EF4444",
};

export const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

export function scoreColor(score) {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}
