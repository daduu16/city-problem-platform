import { Injectable } from '@nestjs/common';
import {
  DISTRICT_ZONE_ORDER,
  DistrictZone,
  DistrictZoneId,
  getDistrictZoneForPoint,
  getDistrictZonesCached,
  zoneCentroid,
} from './district-zones.util';
import { DistrictDataService } from './district-data.service';

@Injectable()
export class DistrictZonesService {
  private districtFeature: GeoJSON.Feature<GeoJSON.Polygon> | null = null;
  private zones: DistrictZone[] | null = null;

  constructor(private districtData: DistrictDataService) {}

  /** Returns A–D zone definitions, or null if district boundary is unavailable. */
  getZones(): DistrictZone[] | null {
    this.ensureLoaded();
    return this.zones;
  }

  classifyPoint(lat: number, lng: number): DistrictZoneId | null {
    if (!this.ensureLoaded() || !this.districtFeature) return null;
    return getDistrictZoneForPoint(lat, lng, this.districtFeature);
  }

  private ensureLoaded(): boolean {
    if (this.zones && this.districtFeature) return true;
    try {
      const data = this.districtData.getNarimanov();
      if (data.feature.geometry.type !== 'Polygon') return false;
      this.districtFeature = data.feature as GeoJSON.Feature<GeoJSON.Polygon>;
      this.zones = getDistrictZonesCached(this.districtFeature);
      return true;
    } catch {
      this.districtFeature = null;
      this.zones = null;
      return false;
    }
  }

  /** Zone metadata with map centroids — always returns all four zones when loaded. */
  getZoneMeta(): Array<{
    id: DistrictZoneId;
    label: string;
    color: string;
    lat: number;
    lng: number;
  }> {
    if (!this.ensureLoaded() || !this.zones) {
      return DISTRICT_ZONE_ORDER.map((id) => ({
        id,
        label: `Zona ${id}`,
        color: '#94a3b8',
        lat: 40.4093,
        lng: 49.8531,
      }));
    }

    return this.zones.map((zone) => {
      const center = zoneCentroid(zone);
      return {
        id: zone.id,
        label: zone.label,
        color: zone.color,
        lat: center.lat,
        lng: center.lng,
      };
    });
  }
}
