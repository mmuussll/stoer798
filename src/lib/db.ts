export type RawRow = Record<string, unknown>;

export function toNumber(value: unknown, fallback = 0): number {
  return Number(value || fallback);
}
