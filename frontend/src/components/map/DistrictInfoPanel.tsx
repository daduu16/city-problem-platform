import { Card } from '@/components/ui/card';
import { az } from '@/i18n/az';
import {
  formatRayonAreaKm2,
  formatRayonPerimeterKm,
  type NarimanovRayonData,
} from '@/lib/narimanovRayon';

interface Props {
  rayon: NarimanovRayonData;
  incidentCount: number;
}

export function DistrictInfoPanel({ rayon, incidentCount }: Props) {
  const p = rayon.properties;
  const vertexCount = rayon.feature.geometry.coordinates[0]?.length ?? 0;

  return (
    <Card className="pointer-events-auto absolute bottom-4 left-4 z-[1000] max-w-xs border bg-background/95 p-4 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold leading-tight">{p.Name_AZ}</p>
      <p className="text-xs text-muted-foreground">
        {p.Name} · {p.Name_RU}
      </p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{az.map.district.area}</dt>
          <dd className="font-medium tabular-nums">{formatRayonAreaKm2(p.Area)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{az.map.district.perimeter}</dt>
          <dd className="font-medium tabular-nums">
            {formatRayonPerimeterKm(p.Shape_Length)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{az.map.district.boundaryPoints}</dt>
          <dd className="font-medium tabular-nums">{vertexCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{az.map.district.incidents}</dt>
          <dd className="font-medium tabular-nums">{incidentCount}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] leading-snug text-muted-foreground">
        {az.map.district.source}
      </p>
    </Card>
  );
}
