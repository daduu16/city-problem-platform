import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DistrictDataService } from '../districts/district-data.service';
import { PlacesService } from '../places/places.service';

/** Open data datasets are updated about once per year. */
@Injectable()
export class OpenDataRefreshScheduler {
  private readonly logger = new Logger(OpenDataRefreshScheduler.name);

  constructor(
    private placesService: PlacesService,
    private districtDataService: DistrictDataService,
  ) {}

  /** 1 January, 03:00 UTC — annual refresh */
  @Cron('0 3 1 1 *')
  async refreshOpenDataAnnually() {
    this.logger.log('Starting annual open-data refresh (district + places)');

    try {
      const districtManifest = await this.districtDataService.refreshFromSource();
      this.logger.log(
        `District refresh: ${districtManifest.areaKm2.toFixed(2)} km²`,
      );
    } catch (err) {
      this.logger.error(
        'Annual district refresh failed',
        err instanceof Error ? err.stack : String(err),
      );
    }

    try {
      const placesManifest = await this.placesService.refreshFromSource();
      this.logger.log(
        `Places refresh: ${placesManifest.featureCount} features, ${placesManifest.typeCount} types`,
      );
    } catch (err) {
      this.logger.error(
        'Annual places refresh failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
