export function actionLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export function tokenCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.replace(/^Error invoking remote method '[^']+':\s*/, "");
  return String(error);
}

