import type { IncidentStatus } from '@/types';
import { getStatusStyle } from '@/lib/incidentStyles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const style = getStatusStyle(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        style.badgeClass,
        size === 'md' && 'px-2.5 py-1 text-sm',
      )}
    >
      <span
        className="shrink-0 rounded-full"
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          backgroundColor: style.color,
          boxShadow: `0 0 0 1px ${style.border}`,
        }}
        aria-hidden
      />
      {style.label}
    </Badge>
  );
}
