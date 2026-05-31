const os = require('os');

/**
 * Best-effort LAN IPv4 for Expo physical devices on the same Wi‑Fi.
 */
function detectLanIPv4() {
  let nets;
  try {
    nets = os.networkInterfaces();
  } catch {
    return null;
  }

  const candidates = [];

  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      candidates.push(entry.address);
    }
  }

  return (
    candidates.find((a) => a.startsWith('192.168.')) ||
    candidates.find((a) => a.startsWith('10.')) ||
    candidates.find((a) => a.startsWith('172.')) ||
    candidates[0] ||
    null
  );
}

function isLoopbackUrl(urlString) {
  try {
    const host = new URL(urlString).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function buildApiUrl(host, port = 3001) {
  return `http://${host}:${port}`;
}

module.exports = {
  detectLanIPv4,
  isLoopbackUrl,
  buildApiUrl,
};
