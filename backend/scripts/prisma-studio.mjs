import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const rootDir = path.resolve(process.cwd(), '..');
const localAppData = path.join(rootDir, '.localappdata');

mkdirSync(path.join(localAppData, 'checkpoint-nodejs', 'Cache'), { recursive: true });

const env = {
  ...process.env,
  LOCALAPPDATA: localAppData,
  CHECKPOINT_DISABLE: '1',
  NO_UPDATE_NOTIFIER: '1',
};

const child = spawn('npx', ['prisma', 'studio', '--port', '5555'], {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
