#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const PACKAGES = [
  { name: 'root', dir: ROOT },
  { name: 'backend', dir: path.join(ROOT, 'backend') },
  { name: 'frontend', dir: path.join(ROOT, 'frontend') },
  { name: 'mobile', dir: path.join(ROOT, 'mobile') },
];

function needsInstall(dir) {
  return !fs.existsSync(path.join(dir, 'node_modules'));
}

function runInstall(dir) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCmd, ['install', '--legacy-peer-deps'], {
      cwd: dir,
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install in ${dir} exited with code ${code}`));
    });
  });
}

async function main({ force = false } = {}) {
  for (const pkg of PACKAGES) {
    if (force || needsInstall(pkg.dir)) {
      console.log(`[install] ${pkg.name}`);
      await runInstall(pkg.dir);
    }
  }
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  main({ force }).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { main, needsInstall };
