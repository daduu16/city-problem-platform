import { Injectable } from '@nestjs/common';
import { DistrictStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const NARIMANOV_GEOZONE_ID = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class DistrictService {
  constructor(private prisma: PrismaService) {}

  async resolveDistrictStatus(
    lat: number,
    lng: number,
    geozoneId = NARIMANOV_GEOZONE_ID,
  ): Promise<DistrictStatus> {
    const within = await this.isPointWithinGeozone(lat, lng, geozoneId);
    return within ? DistrictStatus.WITHIN_DISTRICT : DistrictStatus.OUTSIDE_DISTRICT;
  }

  async isPointWithinGeozone(
    lat: number,
    lng: number,
    geozoneId = NARIMANOV_GEOZONE_ID,
  ): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ within: boolean }>>`
      SELECT ST_Within(
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON(geojson->'geometry'), 4326)
      ) AS within
      FROM geozones
      WHERE id = ${geozoneId} AND is_active = true
    `;
    return rows[0]?.within ?? false;
  }
}
