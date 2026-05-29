import { Badge } from '@/components/ui/badge';
import { tDistrictStatus } from '@/i18n/az';
import type { DistrictStatus } from '@/types';

export function DistrictStatusBadge({
  status,
}: {
  status?: DistrictStatus;
}) {
  if (!status || status === 'WITHIN_DISTRICT') return null;

  return (
    <Badge
      variant="outline"
      className="border-amber-500/70 bg-amber-500/15 text-amber-200"
    >
      {tDistrictStatus(status)}
    </Badge>
  );
}
