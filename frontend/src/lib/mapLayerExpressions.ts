import type { ExpressionSpecification } from 'maplibre-gl';
import { ALL_STATUSES, STATUS_STYLES } from '@/lib/incidentStyles';
import type { IncidentPriority } from '@/types';

/** Circle color by incident status for MapLibre layers */
export const statusColorExpression = [
  'match',
  ['get', 'status'],
  ...ALL_STATUSES.flatMap((s) => [s, STATUS_STYLES[s].color] as const),
  STATUS_STYLES.ARCHIVED.color,
] as unknown as ExpressionSpecification;

const PRIORITY_WEIGHT: Record<IncidentPriority, number> = {
  CRITICAL: 1,
  HIGH: 0.7,
  MEDIUM: 0.4,
  LOW: 0.25,
};

/** Heatmap weight by incident priority */
export const priorityWeightExpression = [
  'match',
  ['get', 'priority'],
  ...(
    Object.entries(PRIORITY_WEIGHT) as [IncidentPriority, number][]
  ).flatMap(([p, w]) => [p, w] as const),
  0.4,
] as unknown as ExpressionSpecification;
