import type { IncidentPriority } from '@/types';
import { getPriorityStyle } from '@/lib/incidentStyles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  priority: IncidentPriority;
}

export function PriorityBadge({ priority }: Props) {
  const style = getPriorityStyle(priority);
  return (
    <Badge variant="outline" className={cn('font-medium', style.badgeClass)}>
      {style.label}
    </Badge>
  );
}
