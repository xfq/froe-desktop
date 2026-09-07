export function actionLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export function tokenCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

export function fileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rendered = unit === 0 || value >= 10 ? String(Math.round(value)) : value.toFixed(1);
  return `${rendered} ${units[unit]}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.replace(/^Error invoking remote method '[^']+':\s*/, "");
  return String(error);
}

