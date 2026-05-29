import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  defaultPlacesDataDir,
  defaultPlacesSourcePath,
  extractNarimanovPlacesByType,
  type PlacesManifest,
} from './places-extract.util';

@Injectable()
export class PlacesService implements OnModuleInit {
  private readonly logger = new Logger(PlacesService.name);
  private manifest: PlacesManifest | null = null;
  private allCollection: GeoJSON.FeatureCollection | null = null;
  private readonly dataDir: string;
  private readonly sourcePath: string;
  private readonly sourceDownloadUrl: string | undefined;

  constructor(private config: ConfigService) {
    this.dataDir =
      this.config.get<string>('PLACES_DATA_DIR') ?? defaultPlacesDataDir();
    this.sourcePath =
      this.config.get<string>('PLACES_SOURCE_PATH') ?? defaultPlacesSourcePath();
    this.sourceDownloadUrl = this.config.get<string>('PLACES_SOURCE_URL');
  }

  async onModuleInit() {
    await this.loadFromDisk();
    if (!this.manifest) {
      this.logger.warn(
        'Narimanov places data missing; run npm run places:extract or wait for annual refresh',
      );
    }
  }

  getManifest(): PlacesManifest {
    if (!this.manifest) {
      throw new NotFoundException('Narimanov places manifest not available');
    }
    return this.manifest;
  }

  getAll(): GeoJSON.FeatureCollection {
    if (!this.allCollection) {
      throw new NotFoundException('Narimanov places collection not available');
    }
    return this.allCollection;
  }

  async getByType(type: string): Promise<GeoJSON.FeatureCollection> {
    const manifest = this.getManifest();
    const entry = manifest.types.find((t) => t.type === type);
    if (!entry) {
      throw new NotFoundException(`Place type not found: ${type}`);
    }
    const filePath = path.join(this.dataDir, entry.file);
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as GeoJSON.FeatureCollection;
  }

  async refreshFromSource(): Promise<PlacesManifest> {
    if (this.sourceDownloadUrl) {
      await this.downloadSource(this.sourceDownloadUrl, this.sourcePath);
    }
    const manifest = await extractNarimanovPlacesByType(
      this.sourcePath,
      this.dataDir,
    );
    await this.loadFromDisk();
    this.logger.log(
      `Refreshed Narimanov places: ${manifest.featureCount} features, ${manifest.typeCount} types`,
    );
    return manifest;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const manifestPath = path.join(this.dataDir, 'manifest.json');
      const allPath = path.join(this.dataDir, 'all.geojson');
      const [manifestRaw, allRaw] = await Promise.all([
        readFile(manifestPath, 'utf8'),
        readFile(allPath, 'utf8'),
      ]);
      this.manifest = JSON.parse(manifestRaw) as PlacesManifest;
      this.allCollection = JSON.parse(allRaw) as GeoJSON.FeatureCollection;
    } catch {
      this.manifest = null;
      this.allCollection = null;
    }
  }

  private async downloadSource(url: string, targetPath: string): Promise<void> {
    this.logger.log(`Downloading places source from ${url}`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Places download failed: HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const { mkdir, writeFile } = await import('fs/promises');
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
    this.logger.log(`Saved places source (${buffer.length} bytes)`);
  }
}
