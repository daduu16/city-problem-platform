import path from 'path';
import {
  defaultPlacesDataDir,
  defaultPlacesSourcePath,
  extractNarimanovPlacesByType,
} from '../src/places/places-extract.util';

async function main() {
  const sourcePath =
    process.argv[2] ||
    process.env.PLACES_SOURCE_PATH ||
    defaultPlacesSourcePath();
  const outputDir =
    process.argv[3] || process.env.PLACES_DATA_DIR || defaultPlacesDataDir();

  console.log(`Source: ${path.resolve(sourcePath)}`);
  console.log(`Output: ${path.resolve(outputDir)}`);

  const manifest = await extractNarimanovPlacesByType(sourcePath, outputDir);

  console.log(
    `Done: ${manifest.featureCount} features, ${manifest.typeCount} types`,
  );
  console.log(`Updated: ${manifest.lastUpdated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
