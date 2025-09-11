import fs from 'fs';
import path from 'path';

let cachedSpecVersion: string | null | undefined;

function findOpenApiPath(): string | null {
  const candidates = [
    // When running tests from backend/ cwd
    path.resolve(process.cwd(), '../docs/openapi.yaml'),
    // Monorepo root cwd (if started from root)
    path.resolve(process.cwd(), 'docs/openapi.yaml'),
    // When running compiled code from backend/dist
    path.resolve(__dirname, '../../docs/openapi.yaml'),
    path.resolve(__dirname, '../../../docs/openapi.yaml'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

function parseInfoVersionFromYaml(yamlContent: string): string | null {
  try {
    // Try to use 'yaml' parser if available without adding a dep
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const YAML = require('yaml');
    const doc = YAML.parse(yamlContent);
    if (doc && doc.info && typeof doc.info.version === 'string') {
      return doc.info.version;
    }
  } catch {
    // Fallback to a minimal parse: look for version under info: block
    const lines = yamlContent.split(/\r?\n/);
    let inInfo = false;
    let infoIndent: number | null = null;
    for (const line of lines) {
      const indent = line.search(/\S/);
      if (/^\s*info\s*:/.test(line)) {
        inInfo = true;
        infoIndent = indent === -1 ? 0 : indent;
        continue;
      }
      if (inInfo) {
        const currentIndent = indent === -1 ? 0 : indent;
        if (infoIndent !== null && currentIndent <= infoIndent) {
          // left the info block
          break;
        }
        const m = line.match(/^\s*version\s*:\s*"?([0-9A-Za-z_.-]+)"?/);
        if (m) return m[1];
      }
    }
  }
  return null;
}

export function getSpecVersion(): string | null {
  if (cachedSpecVersion !== undefined) return cachedSpecVersion;

  // 1) Prefer explicit env (set during build/deploy)
  const envVersion = process.env.SPEC_VERSION;
  if (envVersion && typeof envVersion === 'string' && envVersion.trim()) {
    cachedSpecVersion = envVersion.trim();
    return cachedSpecVersion;
  }

  // 2) Attempt to read once from docs/openapi.yaml (dev/test)
  const openapiPath = findOpenApiPath();
  if (openapiPath) {
    try {
      const content = fs.readFileSync(openapiPath, 'utf8');
      const parsed = parseInfoVersionFromYaml(content);
      cachedSpecVersion = parsed || null;
      return cachedSpecVersion;
    } catch {
      // ignore and fall through
    }
  }

  cachedSpecVersion = null;
  return cachedSpecVersion;
}

