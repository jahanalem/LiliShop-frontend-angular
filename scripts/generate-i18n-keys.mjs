#!/usr/bin/env node
/**
 * Generates src/app/core/i18n/translation-keys.ts from the backend's translation
 * catalog, so components reference TranslationKeys.Auth.SignIn instead of typing
 * "Auth.SignIn" — typos become compile errors and backend/frontend keys stay in sync.
 *
 * Sources, in order:
 *   1. I18N_KEYS_SOURCE env var (a file path or an http(s) URL to /api/localization/en)
 *   2. The sibling backend repo's seed file (works without a running backend)
 *   3. http://localhost:6001/api/localization/en (running backend)
 *
 * Usage: npm run generate:i18n-keys
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, '../src/app/core/i18n/translation-keys.ts');
const seedFileFallback = resolve(
  scriptDir,
  '../../LiliShop-backend-dotnet/Main/LiliShop.Infrastructure/Data/SeedData/localization-entries.json');
const apiFallback = 'http://localhost:6001/api/localization/en';

async function loadKeys() {
  const source = process.env.I18N_KEYS_SOURCE;

  if (source && /^https?:/i.test(source)) return keysFromApi(source);
  if (source) return keysFromSeedFile(source);
  if (existsSync(seedFileFallback)) return keysFromSeedFile(seedFileFallback);
  return keysFromApi(apiFallback);
}

function keysFromSeedFile(path) {
  console.log(`Reading keys from seed file: ${path}`);
  const entries = JSON.parse(readFileSync(path, 'utf8'));
  return [...new Set(entries.map(entry => entry.Key))];
}

async function keysFromApi(url) {
  console.log(`Reading keys from API: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API responded ${response.status}`);
  const dictionary = await response.json();
  return Object.keys(dictionary.entries ?? {});
}

function buildTree(keys) {
  const tree = {};
  for (const key of keys.sort()) {
    const segments = key.split('.');
    let node = tree;
    for (let i = 0; i < segments.length - 1; i++) {
      node = node[segments[i]] ??= {};
      if (typeof node === 'string') throw new Error(`Key conflict at '${key}'`);
    }
    node[segments[segments.length - 1]] = key;
  }
  return tree;
}

function render(node, indent) {
  const pad = '  '.repeat(indent);
  const lines = [];
  for (const [name, value] of Object.entries(node)) {
    lines.push(typeof value === 'string'
      ? `${pad}${name}: '${value}',`
      : `${pad}${name}: {\n${render(value, indent + 1)}\n${pad}},`);
  }
  return lines.join('\n');
}

const keys = await loadKeys();
const tree = buildTree(keys);

const content = `// GENERATED FILE — do not edit by hand.
// Regenerate with: npm run generate:i18n-keys  (source: backend translation catalog)

export const TranslationKeys = {
${render(tree, 1)}
} as const;
`;

writeFileSync(outputPath, content);
console.log(`Wrote ${keys.length} keys to ${outputPath}`);
