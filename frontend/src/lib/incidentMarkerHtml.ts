import { incidentMapMarkerHtmlForPin } from '@/lib/categoryStyles';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';

/** Category icon + status-colored pin (single map marker style). */
export function incidentMarkerHtml(pin: MapIncidentPin): { html: string; size: number } {
  return incidentMapMarkerHtmlForPin(pin);
}
