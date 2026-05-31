import { Transform } from 'class-transformer';

export function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null) return undefined;
  return value;
}

export function emptyToNull({ value }: { value: unknown }) {
  if (value === '' || value === undefined) return null;
  return value;
}

export const OptionalTrimmedString = () =>
  Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    return value;
  });
