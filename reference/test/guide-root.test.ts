import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { guideRoot } from '../tooling/guide-root.ts';

function temporaryRoot(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), 'mapping-ig-root-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('guide access requires an explicit non-blank MAPPING_IG_ROOT', () => {
  for (const value of [undefined, '', '   ']) {
    assert.throws(() => guideRoot({ MAPPING_IG_ROOT: value }), /Set MAPPING_IG_ROOT/);
  }
});

test('guide access rejects paths relative to an npm workspace', () => {
  assert.throws(
    () => guideRoot({ MAPPING_IG_ROOT: '..' }),
    /MAPPING_IG_ROOT must be an absolute path/,
  );
});

test('guide access rejects a missing checkout or a file in its place', (t) => {
  const root = temporaryRoot(t);
  const missing = join(root, 'missing');
  assert.throws(() => guideRoot({ MAPPING_IG_ROOT: missing }), /is not a directory/);
  const file = join(root, 'file');
  writeFileSync(file, '');
  assert.throws(() => guideRoot({ MAPPING_IG_ROOT: file }), /is not a directory/);
});

test('guide access requires both the configuration and the narrative directory', (t) => {
  const root = temporaryRoot(t);
  assert.throws(() => guideRoot({ MAPPING_IG_ROOT: root }), /sushi-config\.yaml file/);
  writeFileSync(join(root, 'sushi-config.yaml'), 'version: 0.1.0\n');
  assert.throws(() => guideRoot({ MAPPING_IG_ROOT: root }), /input\/pagecontent directory/);
  mkdirSync(join(root, 'input'));
  writeFileSync(join(root, 'input', 'pagecontent'), '');
  assert.throws(() => guideRoot({ MAPPING_IG_ROOT: root }), /input\/pagecontent directory/);
});

test('guide access resolves the explicit checkout', (t) => {
  const root = temporaryRoot(t);
  writeFileSync(join(root, 'sushi-config.yaml'), 'version: 0.1.0\n');
  mkdirSync(join(root, 'input', 'pagecontent'), { recursive: true });
  assert.equal(guideRoot({ MAPPING_IG_ROOT: root }), root);
});

test('render:check fails explicitly when the external guide is not configured', () => {
  const environment = { ...process.env };
  delete environment['MAPPING_IG_ROOT'];
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../render/render-pages.ts', import.meta.url)), '--check'],
    { env: environment, encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Set MAPPING_IG_ROOT/);
  assert.equal(result.stdout, '');
});
