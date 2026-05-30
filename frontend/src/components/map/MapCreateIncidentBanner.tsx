import { MapPin, X } from 'lucide-react';
import { az } from '@/i18n/az';
import { MAP_UI_Z_INDEX } from '@/lib/mapZIndex';
import { useMapStore } from '@/stores/mapStore';
import { MAP_GLASS_PANEL_CLASS } from '@/lib/mapGlass';
import { Button } from '@/components/ui/button';

export function MapCreateIncidentBanner() {
	const mode = useMapStore((s) => s.incidentCreateMode);
	const cancel = useMapStore((s) => s.cancelIncidentCreate);

	if (mode !== 'pick') return null;

	return (
		<div
			className={`pointer-events-auto absolute left-1/2 top-4 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 ${MAP_GLASS_PANEL_CLASS}`}
			style={{ zIndex: MAP_UI_Z_INDEX + 5 }}
		>
			<MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden />
			<p className="flex-1 text-sm text-foreground">{az.map.createPickHint}</p>
			<Button type="button" variant="ghost" size="sm" onClick={cancel}>
				<X className="h-4 w-4" />
				{az.map.createCancel}
			</Button>
		</div>
	);
}
