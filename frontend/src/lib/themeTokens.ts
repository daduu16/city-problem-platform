/** Resolves a CSS custom property to an `hsl(...)` color string for charts and inline styles */
export function hslVar(token: string): string {
  return `hsl(var(${token}))`;
}

export const CHART_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
] as const;
