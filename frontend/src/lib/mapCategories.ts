import { categoryKeyToLayer } from '@/lib/categoryLayers';
import { MAP_LAYER_TO_ACCESS } from '@/stores/authStore';

/** Backend map-layer permission for a leaf category (if any). */
export function getCategoryAccessKey(categoryKey: string): string | undefined {
  const layerKey = categoryKeyToLayer[categoryKey];
  if (!layerKey) return undefined;
  return MAP_LAYER_TO_ACCESS[layerKey];
}

export function canViewCategory(
  categoryKey: string,
  hasMapLayer: (accessKey: string) => boolean,
): boolean {
  const accessKey = getCategoryAccessKey(categoryKey);
  return !accessKey || hasMapLayer(accessKey);
}

export function canViewCategoryWithAllowed(
  categoryKey: string,
  allowedLayerKeys: string[],
): boolean {
  if (allowedLayerKeys.includes('*')) return true;
  const accessKey = getCategoryAccessKey(categoryKey);
  return !accessKey || allowedLayerKeys.includes(accessKey);
}
