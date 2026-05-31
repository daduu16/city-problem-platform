import { renderMapIconSvg, type MapIconDef } from '@/lib/mapMarkerIcons';
import { cn } from '@/lib/utils';

type Props = {
  mapColor: string;
  mapBorder: string;
  icon?: MapIconDef | null;
  size?: number;
  className?: string;
  opacity?: number;
};

/** Legend / filter chip matching map pin appearance. */
export function MapMarkerChip({
  mapColor,
  mapBorder,
  icon = null,
  size = 22,
  className,
  opacity = 1,
}: Props) {
  const iconSize = Math.max(12, Math.round(size * 0.55));

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 shadow-sm',
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: mapColor,
        borderColor: mapBorder,
        opacity,
      }}
      aria-hidden
    >
      {icon ? (
        <span
          className="flex items-center justify-center"
          dangerouslySetInnerHTML={{
            __html: renderMapIconSvg(icon, iconSize, '#ffffff'),
          }}
        />
      ) : null}
    </span>
  );
}
