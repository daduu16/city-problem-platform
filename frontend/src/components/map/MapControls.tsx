import { useMemo, useState } from 'react';
import { az } from '@/i18n/az';
import { countIncidentsByCategory } from '@/lib/mapIncidentCounts';
import {
  buildCategoryLabelMap,
  buildMapCategoryCheckboxKeys,
  resolveMapCategoryLabel,
} from '@/lib/mapIncidentCategory';
import { useAuthStore } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box, Layers, Map, Search } from 'lucide-react';

type Props = {
  /** Incidents after date filter only — used for stable per-category totals. */
  incidents: MapIncident[];
  showPlacesToggle?: boolean;
};

export function MapControls({ incidents, showPlacesToggle = true }: Props) {
  const hasMapLayer = useAuthStore((s) => s.hasMapLayer);
  const [categoryQuery, setCategoryQuery] = useState('');
  const {
    viewMode,
    setViewMode,
    showHeatmap,
    showClusters,
    showPlaces,
    visibleCategories,
    setShowHeatmap,
    setShowClusters,
    setShowPlaces,
    toggleCategory,
    setCategoriesVisibility,
    map3dFlatView,
    toggleMap3dFlatView,
  } = useMapStore();

  const categoryLabels = useMemo(
    () => buildCategoryLabelMap(incidents),
    [incidents],
  );

  const checkboxKeys = useMemo(
    () => buildMapCategoryCheckboxKeys(incidents, hasMapLayer),
    [incidents, hasMapLayer],
  );

  const categoryCounts = useMemo(
    () => countIncidentsByCategory(incidents, checkboxKeys),
    [incidents, checkboxKeys],
  );

  const filteredCategoryKeys = useMemo(() => {
    const q = categoryQuery.trim().toLocaleLowerCase('az');
    if (!q) return checkboxKeys;
    return checkboxKeys.filter((key) => {
      const label = resolveMapCategoryLabel(key, categoryLabels).toLocaleLowerCase(
        'az',
      );
      return label.includes(q) || key.toLocaleLowerCase('az').includes(q);
    });
  }, [checkboxKeys, categoryLabels, categoryQuery]);

  const allCategoriesChecked =
    checkboxKeys.length > 0 &&
    checkboxKeys.every((key) => visibleCategories[key] === true);
  const someCategoriesChecked = checkboxKeys.some(
    (key) => visibleCategories[key] === true,
  );

  return (
    <Card className="flex max-h-full w-full flex-col overflow-hidden border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="shrink-0 p-3 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.layersTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-3 pb-0 pt-0">
        <div className="shrink-0 space-y-3">
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
          {viewMode === '3d' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={toggleMap3dFlatView}
            >
              {map3dFlatView ? (
                <>
                  <Box className="h-3.5 w-3.5" />
                  {az.map.tilt3d}
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  {az.map.tiltFlat}
                </>
              )}
            </Button>
          )}
          <Separator />
          <div className="space-y-1">
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
            <p className="pl-6 text-[11px] leading-snug text-muted-foreground">
              {az.map.clusteringHint}
            </p>
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
        </div>

        <div className="flex flex-col gap-2">
          <div className="shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {az.map.categoriesTitle}
              </p>
              {checkboxKeys.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="categories-all"
                    checked={
                      allCategoriesChecked
                        ? true
                        : someCategoriesChecked
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={() =>
                      setCategoriesVisibility(checkboxKeys, !allCategoriesChecked)
                    }
                    aria-label={az.map.categoriesAllAria}
                  />
                  <Label
                    htmlFor="categories-all"
                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                  >
                    {az.map.categoriesAll}
                  </Label>
                </div>
              )}
            </div>
            <div className="px-0.5 py-0.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder={az.map.categorySearch}
                  className="h-8 w-full pl-8 text-sm"
                  aria-label={az.map.categorySearch}
                />
              </div>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto overflow-x-hidden px-0.5 pt-0.5 pr-1">
            <div className="space-y-2 pb-3">
          {filteredCategoryKeys.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {az.map.categorySearchEmpty}
            </p>
          ) : (
            filteredCategoryKeys.map((key) => {
              const checked = visibleCategories[key] === true;
              const count = categoryCounts[key] ?? 0;
              return (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`category-${key}`}
                    checked={checked}
                    onCheckedChange={() => toggleCategory(key)}
                  />
                  <Label
                    htmlFor={`category-${key}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal"
                  >
                    <span className="truncate">
                      {resolveMapCategoryLabel(key, categoryLabels)}
                    </span>
                    <span
                      className="shrink-0 tabular-nums text-muted-foreground"
                      title={az.map.categoryCountHint}
                    >
                      {count}
                    </span>
                  </Label>
                </div>
              );
            })
          )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
