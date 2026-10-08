import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse } from 'yaml';

import { PROVENANCE } from '../src/generated/provenance.ts';
import { guideVersion } from '../scripts/generate-provenance.ts';
import { guideRoot } from '../../reference/tooling/guide-root.ts';

/**
 * The footer is a claim about what the reader is looking at. If it can be
 * wrong, it is worse than absent — a stale deployment would then look current.
 */

const SUSHI_CONFIG = join(guideRoot(), 'sushi-config.yaml');

test('guideVersion equals the version in the external guide sushi-config.yaml', () => {
  const config = parse(readFileSync(SUSHI_CONFIG, 'utf8')) as { version?: unknown };
  assert.equal(PROVENANCE.guideVersion, String(config.version));
  assert.notEqual(PROVENANCE.guideVersion, 'undefined', 'the version was actually read');
});

test('a missing or invalid guide version fails instead of generating unknown provenance', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'mapping-guide-version-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const body of ['', 'null\n', 'version:\n', 'version: 1\n', 'version: "  "\n']) {
    writeFileSync(join(root, 'sushi-config.yaml'), body);
    assert.throws(() => guideVersion(root), /must declare a non-empty string version/);
  }
  writeFileSync(join(root, 'sushi-config.yaml'), 'version: 0.1.0\n');
  assert.equal(guideVersion(root), '0.1.0');
});

test('commit is a real short commit, or the honest literal unknown', () => {
  assert.match(PROVENANCE.commit, /^[0-9a-f]{7,40}$|^unknown$/);
});

test('guideBaseUrl is absolute, http or https, and ends with a slash', () => {
  const url = new URL(PROVENANCE.guideBaseUrl);
  assert.ok(['http:', 'https:'].includes(url.protocol), `unexpected protocol ${url.protocol}`);
  assert.ok(PROVENANCE.guideBaseUrl.endsWith('/'), 'a base URL joins by concatenation');
  assert.equal(
    new URL('mapping-quantity.html#mapping-dv-quantity-to-quantity', PROVENANCE.guideBaseUrl).hash,
    '#mapping-dv-quantity-to-quantity',
    'a relative guide href resolves against it without losing its fragment',
  );
});
