import path from 'path';
import {
  defaultDistrictDataDir,
  extractNarimanovDistrict,
  resolveDistrictSourcePath,
} from '../src/districts/district-extract.util';

async function main() {
  const sourcePath = await resolveDistrictSourcePath(
    process.argv[2] || process.env.DISTRICT_SOURCE_PATH,
  );
  const outputDir =
    process.argv[3] ||
    process.env.DISTRICT_DATA_DIR ||
    defaultDistrictDataDir();

  console.log(`Source: ${path.resolve(sourcePath)}`);
  console.log(`Output: ${path.resolve(outputDir)}`);

  const data = await extractNarimanovDistrict(sourcePath, outputDir);

  console.log(
    `Done: ${data.manifest.areaKm2.toFixed(2)} km², ~${data.manifest.perimeterKmEstimate.toFixed(1)} km perimeter, ${data.manifest.vertexCount} vertices`,
  );
  console.log(`Updated: ${data.manifest.lastUpdated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
