export type MinuteRange = { start: number; end: number };

export function mergeMinuteRanges(ranges: MinuteRange[]): MinuteRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: MinuteRange[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function subtractMinuteRanges(
  base: MinuteRange[],
  remove: MinuteRange[],
): MinuteRange[] {
  let result = mergeMinuteRanges(base);
  const blocks = mergeMinuteRanges(remove);
  for (const block of blocks) {
    const next: MinuteRange[] = [];
    for (const r of result) {
      if (block.end <= r.start || block.start >= r.end) {
        next.push(r);
        continue;
      }
      if (block.start > r.start) {
        next.push({ start: r.start, end: block.start });
      }
      if (block.end < r.end) {
        next.push({ start: block.end, end: r.end });
      }
    }
    result = next;
  }
  return mergeMinuteRanges(result);
}

export function minuteRangeContains(
  windows: MinuteRange[],
  start: number,
  end: number,
): boolean {
  if (start >= end) return false;
  for (const w of windows) {
    if (start >= w.start && end <= w.end) return true;
  }
  return false;
}

export function intersectMinuteRanges(
  a: MinuteRange[],
  b: MinuteRange[],
): MinuteRange[] {
  const result: MinuteRange[] = [];
  for (const x of mergeMinuteRanges(a)) {
    for (const y of mergeMinuteRanges(b)) {
      const start = Math.max(x.start, y.start);
      const end = Math.min(x.end, y.end);
      if (end > start) result.push({ start, end });
    }
  }
  return mergeMinuteRanges(result);
}
