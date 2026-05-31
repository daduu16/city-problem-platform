const { spawn } = require('child_process');
const net = require('net');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dockerCmd = process.platform === 'win32' ? 'docker.exe' : 'docker';
const BACKEND_PORT = Number(process.env.PORT || 3001);

const apps = [
  {
    name: 'backend',
    command: npmCmd,
    args: ['run', 'dev', '--prefix', 'backend'],
  },
  {
    name: 'frontend',
    command: npmCmd,
    args: ['run', 'dev', '--prefix', 'frontend'],
  },
  {
    name: 'mobile',
    command: npmCmd,
    args: ['start', '--prefix', 'mobile'],
  },
];

const children = new Set();

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.stdio ?? 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function pipeWithPrefix(stream, prefix, target) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.length > 0) target.write(`[${prefix}] ${line}\n`);
      else target.write('\n');
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) target.write(`[${prefix}] ${buffer}\n`);
  });
}

function startApp(app) {
  const child = spawn(app.command, app.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  children.add(child);
  pipeWithPrefix(child.stdout, app.name, process.stdout);
  pipeWithPrefix(child.stderr, app.name, process.stderr);

  child.on('exit', (code, signal) => {
    children.delete(child);
    if (signal) {
      console.log(`[${app.name}] stopped by ${signal}`);
      return;
    }
    console.log(`[${app.name}] exited with code ${code}`);
    if (code !== 0) shutdown(1);
  });
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill(process.platform === 'win32' ? undefined : 'SIGTERM');
  }
  setTimeout(() => process.exit(code), 300);
}

function assertPortFree(port, label) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `${label}: port ${port} is already in use. Stop the other process (e.g. an old backend) and run again.`,
          ),
        );
        return;
      }
      reject(err);
    });
    probe.once('listening', () => {
      probe.close(() => resolve());
    });
    probe.listen(port);
  });
}

async function main() {
  console.log('[infra] starting postgres and redis (waiting until healthy)');
  await run(dockerCmd, ['compose', 'up', '-d', '--wait', 'postgres', 'redis']);

  await assertPortFree(BACKEND_PORT, 'backend');

  console.log('[apps] starting backend, frontend, and mobile');
  console.log(
    `[info] backend http://localhost:${BACKEND_PORT} · frontend http://localhost:5173 · mobile Expo http://localhost:8081`,
  );
  console.log('[info] first-time setup: cd backend && npx prisma migrate dev && npm run prisma:seed');
  for (const app of apps) startApp(app);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});
