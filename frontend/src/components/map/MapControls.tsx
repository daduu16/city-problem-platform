import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { countIncidentsByLayer } from '@/lib/mapIncidentCounts';
import { useAuthStore, MAP_LAYER_TO_ACCESS } from '@/stores/authStore';
import { useMapStore, type MapLayerKey } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Box, Map } from 'lucide-react';

const layerKeys = Object.keys(az.map.layers) as MapLayerKey[];

type Props = {
  incidents: MapIncident[];
  showPlacesToggle?: boolean;
};

export function MapControls({ incidents, showPlacesToggle = true }: Props) {
  const hasMapLayer = useAuthStore((s) => s.hasMapLayer);
  const {
    viewMode,
    setViewMode,
    showHeatmap,
    showClusters,
    showPlaces,
    layers,
    setShowHeatmap,
    setShowClusters,
    setShowPlaces,
    toggleLayer,
  } = useMapStore();

  const visibleLayers = layerKeys.filter((key) => {
    const accessKey = MAP_LAYER_TO_ACCESS[key];
    return !accessKey || hasMapLayer(accessKey);
  });

  const layerCounts = useMemo(
    () => countIncidentsByLayer(incidents, layerKeys),
    [incidents],
  );

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.layersTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{az.map.viewMode}</p>
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              variant={viewMode === '2d' ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('2d')}
            >
              <Map className="h-3.5 w-3.5" />
              {az.map.view2d}
            </Button>
            <Button
              type="button"
              variant={viewMode === '3d' ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('3d')}
            >
              <Box className="h-3.5 w-3.5" />
              {az.map.view3d}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <Checkbox
            id="clusters"
            checked={showClusters}
            onCheckedChange={(v) => setShowClusters(v === true)}
          />
          <Label htmlFor="clusters" className="cursor-pointer text-sm font-normal">
            {az.map.clustering}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="heatmap"
            checked={showHeatmap}
            onCheckedChange={(v) => setShowHeatmap(v === true)}
          />
          <Label htmlFor="heatmap" className="cursor-pointer text-sm font-normal">
            {az.map.heatmap}
          </Label>
        </div>
        {showPlacesToggle && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="places"
              checked={showPlaces}
              onCheckedChange={(v) => setShowPlaces(v === true)}
            />
            <Label htmlFor="places" className="cursor-pointer text-sm font-normal">
              {az.map.showPlaces}
            </Label>
          </div>
        )}
        <Separator />
        <div className="space-y-2">
          {visibleLayers.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`layer-${key}`}
                checked={layers[key]}
                onCheckedChange={() => toggleLayer(key)}
              />
              <Label
                htmlFor={`layer-${key}`}
                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal"
              >
                <span className="truncate">{az.map.layers[key]}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {layerCounts[key]}
                </span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
