import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  defaultDistrictDataDir,
  defaultDistrictSourcePath,
  extractNarimanovDistrict,
  resolveDistrictSourcePath,
  type DistrictManifest,
  type NarimanovDistrictData,
} from './district-extract.util';

export interface NarimanovDistrictResponse {
  feature: GeoJSON.Feature;
  positions: [number, number][];
  properties: NarimanovDistrictData['properties'];
  vertexCount: number;
  areaKm2: number;
  perimeterKmEstimate: number;
  lastUpdated: string;
}

@Injectable()
export class DistrictDataService implements OnModuleInit {
  private readonly logger = new Logger(DistrictDataService.name);
  private cached: NarimanovDistrictResponse | null = null;
  private manifest: DistrictManifest | null = null;
  private readonly dataDir: string;
  private readonly sourcePath: string;
  private readonly sourceDownloadUrl: string | undefined;

  constructor(private config: ConfigService) {
    this.dataDir =
      this.config.get<string>('DISTRICT_DATA_DIR') ?? defaultDistrictDataDir();
    this.sourcePath =
      this.config.get<string>('DISTRICT_SOURCE_PATH') ??
      defaultDistrictSourcePath();
    this.sourceDownloadUrl = this.config.get<string>('DISTRICT_SOURCE_URL');
  }

  async onModuleInit() {
    await this.loadFromDisk();
    if (!this.cached) {
      this.logger.warn(
        'Narimanov district boundary missing; run npm run district:extract',
      );
    }
  }

  getNarimanov(): NarimanovDistrictResponse {
    if (!this.cached) {
      throw new NotFoundException('Narimanov district data not available');
    }
    return this.cached;
  }

  getManifest(): DistrictManifest {
    if (!this.manifest) {
      throw new NotFoundException('Narimanov district manifest not available');
    }
    return this.manifest;
  }

  async refreshFromSource(): Promise<DistrictManifest> {
    if (this.sourceDownloadUrl) {
      await this.downloadSource(this.sourceDownloadUrl, this.sourcePath);
    }
    const sourcePath = await resolveDistrictSourcePath(this.sourcePath);
    const data = await extractNarimanovDistrict(sourcePath, this.dataDir);
    await this.loadFromDisk();
    this.logger.log(
      `Refreshed Narimanov district: ${data.manifest.areaKm2.toFixed(2)} km², ${data.manifest.vertexCount} vertices`,
    );
    return data.manifest;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const manifestPath = path.join(this.dataDir, 'manifest.json');
      const boundaryPath = path.join(this.dataDir, 'boundary.geojson');
      const [manifestRaw, boundaryRaw] = await Promise.all([
        readFile(manifestPath, 'utf8'),
        readFile(boundaryPath, 'utf8'),
      ]);
      const manifest = JSON.parse(manifestRaw) as DistrictManifest;
      const collection = JSON.parse(boundaryRaw) as GeoJSON.FeatureCollection;
      const feature = collection.features[0];
      if (!feature) {
        throw new Error('Empty boundary.geojson');
      }

      if (feature.geometry.type !== 'Polygon') {
        throw new Error('District boundary must be a Polygon');
      }
      const ring = feature.geometry.coordinates as [number, number][][];
      const outer = ring[0] ?? [];
      const positions = outer.map(([lng, lat]) => [lat, lng] as [number, number]);

      this.manifest = manifest;
      this.cached = {
        feature,
        positions,
        properties: manifest.properties,
        vertexCount: manifest.vertexCount,
        areaKm2: manifest.areaKm2,
        perimeterKmEstimate: manifest.perimeterKmEstimate,
        lastUpdated: manifest.lastUpdated,
      };
    } catch {
      this.manifest = null;
      this.cached = null;
    }
  }

  private async downloadSource(url: string, targetPath: string): Promise<void> {
    this.logger.log(`Downloading district source from ${url}`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`District download failed: HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const { mkdir, writeFile } = await import('fs/promises');
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
    this.logger.log(`Saved district source (${buffer.length} bytes)`);
  }
}
