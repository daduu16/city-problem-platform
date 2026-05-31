import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  DEMO_REPORT_PUBLIC_FILES,
  DEMO_REPORT_TMP_FILES,
} from '../seed-data/demo-report-assets';

/** Ensures demo report JPEGs exist under backend/public/uploads/demo. */
export function copyDemoReportAssets(): void {
  const backendRoot = join(__dirname, '..', '..');
  const tmpDir = join(backendRoot, 'tmp');
  const outDir = join(backendRoot, 'public', 'uploads', 'demo');
  mkdirSync(outDir, { recursive: true });

  for (const key of Object.keys(DEMO_REPORT_PUBLIC_FILES) as Array<
    keyof typeof DEMO_REPORT_PUBLIC_FILES
  >) {
    const dest = join(outDir, DEMO_REPORT_PUBLIC_FILES[key]);
    if (existsSync(dest)) continue;

    const src = join(tmpDir, DEMO_REPORT_TMP_FILES[key]);
    if (!existsSync(src)) {
      console.warn(
        `[seed] Demo photo missing: ${dest} (no tmp file ${DEMO_REPORT_TMP_FILES[key]})`,
      );
      continue;
    }
    copyFileSync(src, dest);
    console.log(`[seed] Copied demo report photo → ${DEMO_REPORT_PUBLIC_FILES[key]}`);
  }
}
