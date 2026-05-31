const net = require('net');
const { ensureProjectEnv } = require('./lib/env');

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_INTERVAL_MS = 1_000;

function parseHostPort(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    port: Number(url.port || 5432),
  };
}

function tryConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2_000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function waitForPostgres(databaseUrl, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const { host, port } = parseHostPort(databaseUrl);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await tryConnect(host, port)) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Postgres is not reachable at ${host}:${port} after ${timeoutMs / 1000}s. ` +
      'Run: docker compose up -d postgres redis. Check POSTGRES_PORT in .env (default 5434).',
  );
}

async function main() {
  const env = ensureProjectEnv();
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Copy .env.example to .env and retry.');
  }
  await waitForPostgres(env.DATABASE_URL);
  console.log('[db] Postgres is accepting connections');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { waitForPostgres, parseHostPort };
