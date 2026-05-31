const fs = require('fs');
const path = require('path');
const { detectLanIPv4, isLoopbackUrl, buildApiUrl } = require('./network');

const ROOT = path.resolve(__dirname, '../..');
const ROOT_ENV = path.join(ROOT, '.env');
const ROOT_ENV_EXAMPLE = path.join(ROOT, '.env.example');
const BACKEND_ENV = path.join(ROOT, 'backend', '.env');
const BACKEND_ENV_EXAMPLE = path.join(ROOT, 'backend', '.env.example');
const MOBILE_ENV = path.join(ROOT, 'mobile', '.env');
const MOBILE_ENV_EXAMPLE = path.join(ROOT, 'mobile', '.env.example');

const DB_KEYS = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
  'PUBLIC_API_URL',
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'GROQ_VISION_MODEL',
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function serializeEnv(vars) {
  const lines = [];
  const keys = Object.keys(vars).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    const value = vars[key];
    if (value === undefined || value === '') continue;
    const needsQuotes = /[\s#]/.test(value);
    lines.push(`${key}=${needsQuotes ? JSON.stringify(value) : value}`);
  }
  return `${lines.join('\n')}\n`;
}

function buildDatabaseUrl(vars) {
  const user = vars.POSTGRES_USER || 'municipal';
  const password = vars.POSTGRES_PASSWORD || 'municipal_secret';
  const host = vars.POSTGRES_HOST || 'localhost';
  const port = vars.POSTGRES_PORT || '5434';
  const db = vars.POSTGRES_DB || 'municipal_incidents';
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${db}?schema=public`;
}

function normalizeDatabaseUrl(vars) {
  const merged = { ...vars };
  const expected = buildDatabaseUrl(merged);
  const current = merged.DATABASE_URL;

  if (!current) {
    merged.DATABASE_URL = expected;
    return merged;
  }

  try {
    const url = new URL(current);
    const port = merged.POSTGRES_PORT || '5434';
    const host = merged.POSTGRES_HOST || 'localhost';
    const user = merged.POSTGRES_USER || 'municipal';
    const db = merged.POSTGRES_DB || 'municipal_incidents';

    const hostMismatch = url.hostname !== host && url.hostname !== '127.0.0.1' && host !== 'localhost';
    const portMismatch = url.port !== String(port);
    const userMismatch = decodeURIComponent(url.username) !== user;
    const dbMismatch = url.pathname.replace(/^\//, '').split('?')[0] !== db;

    // Common mistake: default Postgres port while Docker maps 5434
    const wrongDefaultPort = url.port === '5432' && port === '5434';

    if (hostMismatch || portMismatch || userMismatch || dbMismatch || wrongDefaultPort) {
      merged.DATABASE_URL = expected;
    }
  } catch {
    merged.DATABASE_URL = expected;
  }

  return merged;
}

function mergeEnv(...layers) {
  return layers.reduce((acc, layer) => ({ ...acc, ...layer }), {});
}

function resolveMobileApiUrl(merged) {
  const port = merged.PORT || '3001';
  const explicit = merged.EXPO_PUBLIC_API_URL?.trim() || merged.MOBILE_API_URL?.trim();
  if (explicit && !isLoopbackUrl(explicit)) {
    return explicit.replace(/\/$/, '');
  }
  if (explicit && process.env.MOBILE_USE_LOCALHOST === '1') {
    return explicit.replace(/\/$/, '');
  }
  const lan = detectLanIPv4();
  if (lan) {
    return buildApiUrl(lan, port);
  }
  return explicit?.replace(/\/$/, '') || buildApiUrl('localhost', port);
}

/**
 * Writes mobile/.env with a LAN-reachable API URL (physical device / teammate Wi‑Fi).
 */
function ensureMobileEnv(merged) {
  const mobileExample = parseEnvFile(MOBILE_ENV_EXAMPLE);
  const mobileVars = parseEnvFile(MOBILE_ENV);
  const apiUrl = resolveMobileApiUrl(mergeEnv(merged, mobileVars));

  const nextMobile = {
    ...mobileExample,
    ...mobileVars,
    EXPO_PUBLIC_API_URL: apiUrl,
  };
  const body = serializeEnv(nextMobile);

  if (!fs.existsSync(MOBILE_ENV) || fs.readFileSync(MOBILE_ENV, 'utf8') !== body) {
    fs.writeFileSync(MOBILE_ENV, body, 'utf8');
    console.log(`[env] mobile/.env → EXPO_PUBLIC_API_URL=${apiUrl}`);
  }

  return apiUrl;
}

/**
 * Ensures root and backend .env exist and DATABASE_URL matches POSTGRES_* / docker port.
 * Returns merged env vars for child processes (backend, prisma, mobile).
 */
function ensureProjectEnv() {
  if (!fs.existsSync(ROOT_ENV) && fs.existsSync(ROOT_ENV_EXAMPLE)) {
    fs.copyFileSync(ROOT_ENV_EXAMPLE, ROOT_ENV);
    console.log('[env] created .env from .env.example');
  }

  const rootVars = parseEnvFile(ROOT_ENV);
  const backendExample = parseEnvFile(BACKEND_ENV_EXAMPLE);
  const backendVars = parseEnvFile(BACKEND_ENV);

  let merged = mergeEnv(backendExample, rootVars, backendVars);
  merged = normalizeDatabaseUrl(merged);

  if (!merged.REDIS_URL) {
    merged.REDIS_URL = 'redis://localhost:6380';
  }

  const backendDbVars = {};
  for (const key of DB_KEYS) {
    if (merged[key] !== undefined) backendDbVars[key] = merged[key];
  }

  if (!fs.existsSync(BACKEND_ENV)) {
    const backendOnly = mergeEnv(backendExample, backendDbVars);
    fs.writeFileSync(BACKEND_ENV, serializeEnv(backendOnly), 'utf8');
    console.log('[env] created backend/.env');
  }

  if (fs.existsSync(ROOT_ENV) && merged.DATABASE_URL && rootVars.DATABASE_URL !== merged.DATABASE_URL) {
    const rootLines = fs.readFileSync(ROOT_ENV, 'utf8').split(/\r?\n/);
    let replaced = false;
    const nextRoot = rootLines.map((line) => {
      if (line.startsWith('DATABASE_URL=')) {
        replaced = true;
        return `DATABASE_URL=${merged.DATABASE_URL}`;
      }
      return line;
    });
    if (!replaced) nextRoot.push(`DATABASE_URL=${merged.DATABASE_URL}`);
    fs.writeFileSync(ROOT_ENV, `${nextRoot.join('\n')}\n`, 'utf8');
    console.log('[env] fixed DATABASE_URL in .env to match POSTGRES_PORT');
  }

  const mobileVars = parseEnvFile(MOBILE_ENV);
  merged.EXPO_PUBLIC_API_URL =
    mobileVars.EXPO_PUBLIC_API_URL?.trim() ||
    merged.EXPO_PUBLIC_API_URL?.trim() ||
    buildApiUrl('localhost', merged.PORT || '3001');

  return merged;
}

module.exports = {
  ROOT,
  BACKEND_ENV,
  MOBILE_ENV,
  parseEnvFile,
  ensureProjectEnv,
  ensureMobileEnv,
  resolveMobileApiUrl,
  buildDatabaseUrl,
};

if (require.main === module) {
  const merged = ensureProjectEnv();
  const mobileUrl = ensureMobileEnv(merged);
  console.log('[env] project env ready');
  console.log(`[env] mobile LAN API: ${mobileUrl}`);
}
