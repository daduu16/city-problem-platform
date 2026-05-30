import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { countIncidentsByCategory } from '@/lib/mapIncidentCounts';
import { buildMapCategoryCheckboxKeys } from '@/lib/mapIncidentCategory';
import { canViewCategory } from '@/lib/mapCategories';
import { INCIDENT_CATEGORY_TREE, pruneCategoryTree } from '@/lib/categoryTree';
import {
  MAP_PANEL_HINT_CLASS,
  MAP_PANEL_SECTION_TITLE_CLASS,
  MAP_PANEL_TITLE_CLASS,
} from '@/lib/mapPanelStyles';
import { useAuthStore } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import {
  CategoryTreeDropdown,
  getCheckboxCategoryTriggerLabel,
} from '@/components/shared/CategoryTreeDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MAP_GLASS_PANEL_CLASS } from '@/lib/mapGlass';
import { Box, Layers, Map } from 'lucide-react';

type Props = {
  /** Incidents after date filter only — used for stable per-category totals. */
  incidents: MapIncident[];
  showPlacesToggle?: boolean;
};

export function MapControls({ incidents, showPlacesToggle = true }: Props) {
  const hasMapLayer = useAuthStore((s) => s.hasMapLayer);
  const {
    viewMode,
    baseMap,
    setViewMode,
    setBaseMap,
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

  const checkboxKeys = useMemo(
    () => buildMapCategoryCheckboxKeys(incidents, hasMapLayer),
    [incidents, hasMapLayer],
  );

  const categoryTree = useMemo(
    () =>
      pruneCategoryTree(INCIDENT_CATEGORY_TREE, (key) =>
        canViewCategory(key, hasMapLayer),
      ),
    [hasMapLayer],
  );

  const categoryCounts = useMemo(
    () => countIncidentsByCategory(incidents, checkboxKeys),
    [incidents, checkboxKeys],
  );

  const categoryTriggerLabel = useMemo(
    () =>
      getCheckboxCategoryTriggerLabel(
        checkboxKeys,
        visibleCategories,
        az.map.categoriesAll,
        az.map.categoriesSelectedCount,
      ),
    [checkboxKeys, visibleCategories],
  );

  return (
    <Card className={`flex max-h-full w-full flex-col overflow-hidden ${MAP_GLASS_PANEL_CLASS}`}>
      <CardHeader className="shrink-0 p-3 pb-2">
        <CardTitle className={MAP_PANEL_TITLE_CLASS}>
          {az.map.layersTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-3 pb-3 pt-0">
        <div className="shrink-0 space-y-3">
          <div className="space-y-1.5">
            <p className={MAP_PANEL_SECTION_TITLE_CLASS}>{az.map.viewMode}</p>
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
          <div className="space-y-1.5">
            <p className={MAP_PANEL_SECTION_TITLE_CLASS}>{az.map.basemapTitle}</p>
            <div className="grid grid-cols-1 gap-1">
              <Button
                type="button"
                variant={baseMap === 'osm' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 text-[11px]"
                onClick={() => setBaseMap('osm')}
              >
                {az.map.basemapOsm}
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
              <Label htmlFor="clusters" className="cursor-pointer text-sm font-normal text-foreground">
                {az.map.clustering}
              </Label>
            </div>
            <p className={`pl-6 ${MAP_PANEL_HINT_CLASS}`}>
              {az.map.clusteringHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="heatmap"
              checked={showHeatmap}
              onCheckedChange={(v) => setShowHeatmap(v === true)}
            />
            <Label htmlFor="heatmap" className="cursor-pointer text-sm font-normal text-foreground">
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
              <Label htmlFor="places" className="cursor-pointer text-sm font-normal text-foreground">
                {az.map.showPlaces}
              </Label>
            </div>
          )}
          <Separator />
          <div className="space-y-1.5">
            <p className={MAP_PANEL_SECTION_TITLE_CLASS}>
              {az.map.categoriesTitle}
            </p>
            <CategoryTreeDropdown
              mode="checkbox"
              tree={categoryTree}
              triggerLabel={categoryTriggerLabel}
              searchPlaceholder={az.map.categorySearch}
              emptyMessage={az.map.categorySearchEmpty}
              checkedKeys={visibleCategories}
              onToggleKey={toggleCategory}
              onToggleKeys={setCategoriesVisibility}
              checkboxKeys={checkboxKeys}
              counts={categoryCounts}
              countHint={az.map.categoryCountHint}
              allLabel={az.map.categoriesAll}
              allAriaLabel={az.map.categoriesAllAria}
              className="h-8 bg-background/80 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
