import { Plus, X } from 'lucide-react';
import { az } from '@/i18n/az';
import { useAuthStore } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import { MapDateRangePicker } from '@/components/map/MapDateRangePicker';
import { Button } from '@/components/ui/button';

type Props = {
	showCreate: boolean;
};

export function MapPageHeaderActions({ showCreate }: Props) {
	const canCreate = useAuthStore((s) => s.can('create_incident'));
	const mode = useMapStore((s) => s.incidentCreateMode);
	const startCreate = useMapStore((s) => s.startIncidentCreate);
	const cancelCreate = useMapStore((s) => s.cancelIncidentCreate);

	const creating = mode !== false;

	return (
		<div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
			<MapDateRangePicker />
			{showCreate && canCreate && (
				<Button
					type="button"
					size="sm"
					className="h-9 gap-1.5"
					variant={creating ? 'secondary' : 'default'}
					onClick={() => (creating ? cancelCreate() : startCreate())}
				>
					{creating ? (
						<X className="h-4 w-4" aria-hidden />
					) : (
						<Plus className="h-4 w-4" aria-hidden />
					)}
					{creating ? az.map.createCancel : az.map.createButton}
				</Button>
			)}
		</div>
	);
}
