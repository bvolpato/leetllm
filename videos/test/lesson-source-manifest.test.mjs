import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { lessonSourceManifest } from '../lib/lesson-source-manifest.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

async function fixture(t) {
  const parent = await mkdtemp(join(tmpdir(), 'leetllm-lesson-sources-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = join(parent, 'lesson');
  await mkdir(root);
  const put = async (name, content) => {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  };
  return { parent, root, put };
}

test('the source closure follows real imports and invalidates unchanged entries when a nested scene changes', async (t) => {
  const { parent, root, put } = await fixture(t);
  await put(
    'index.mjs',
    [
      "export { value } from './model.mjs';",
      "import('./scenes/row.mjs');",
      "import 'node:assert/strict';",
      "import 'vizmatic/stage';",
      "// import './not-a-dependency.mjs';",
      "export const prose = `import './also-not-a-dependency.mjs'`;",
    ].join('\n'),
  );
  await put('model.mjs', "export { value } from './fixtures/value.mjs';");
  await put('fixtures/value.mjs', 'export const value = 1;');
  await put('scenes/row.mjs', "import '../model.mjs'; export const scene = 'row';");
  await put('narration.yaml', 'id: example');
  await put('article.md', 'The actual source article.');
  const options = { root, entry: 'index.mjs', files: ['narration.yaml', 'article.md'] };
  const before = await lessonSourceManifest(options);
  assert.deepEqual(
    before.files.map((file) => file.path),
    [
      'article.md',
      'fixtures/value.mjs',
      'index.mjs',
      'model.mjs',
      'narration.yaml',
      'scenes/row.mjs',
    ],
  );
  assert.deepEqual(before.externalImports, [
    { from: 'index.mjs', specifier: 'node:assert/strict' },
    { from: 'index.mjs', specifier: 'vizmatic/stage' },
  ]);
  assert.deepEqual(
    await lessonSourceManifest({ ...options, files: [...options.files].reverse() }),
    before,
  );
  await put('fixtures/value.mjs', 'export const value = 2;');
  const after = await lessonSourceManifest(options);
  assert.equal(
    before.files.find((file) => file.path === 'index.mjs').sha256,
    after.files.find((file) => file.path === 'index.mjs').sha256,
  );
  assert.notEqual(before.fingerprint, after.fingerprint);
  const relocated = join(parent, 'relocated');
  await cp(root, relocated, { recursive: true });
  assert.deepEqual(await lessonSourceManifest({ ...options, root: relocated }), after);
});

test('assets bind image bytes, original paper bytes and their provenance metadata without fetching URLs', async (t) => {
  const { root, put } = await fixture(t);
  await put('index.mjs', 'export const lesson = true;');
  await put('figure.png', 'prepared image');
  await put('paper.pdf', 'retained PDF');
  const asset = {
    id: 'paper-figure',
    path: 'figure.png',
    sha256: hash('prepared image'),
    mediaType: 'image/png',
    width: 800,
    height: 600,
    source: {
      path: 'paper.pdf',
      sha256: hash('retained PDF'),
      title: 'A paper',
      url: 'https://unreachable.invalid/paper.pdf',
      locator: 'Figure 2',
    },
    derivation: { tool: 'pdftoppm', version: 'pinned', page: 3, crop: [0, 0, 800, 600] },
  };
  const before = await lessonSourceManifest({ root, entry: 'index.mjs', assets: [asset] });
  assert.deepEqual(
    before.files.map((file) => file.path),
    ['figure.png', 'index.mjs', 'paper.pdf'],
  );
  const editedCaption = { ...asset, source: { ...asset.source, locator: 'Figure 3' } };
  assert.notEqual(
    before.fingerprint,
    (await lessonSourceManifest({ root, entry: 'index.mjs', assets: [editedCaption] })).fingerprint,
  );
  await assert.rejects(
    lessonSourceManifest({
      root,
      entry: 'index.mjs',
      assets: [{ ...asset, derivation: new Date(0) }],
    }),
    /plain JSON objects/,
  );
  await put('paper.pdf', 'changed PDF');
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs', assets: [asset] }),
    /asset SHA-256 mismatch/,
  );
});

test('computed imports require a declared closure and unused declarations fail', async (t) => {
  const { root, put } = await fixture(t);
  await put('index.mjs', 'export const load = name => import(name);');
  await put('scenes/one.mjs', "export { value } from '../model.mjs';");
  await put('model.mjs', 'export const value = 7;');
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs' }),
    /computed dynamic import needs an explicit/,
  );
  const manifest = await lessonSourceManifest({
    root,
    entry: 'index.mjs',
    dynamicImports: { 'index.mjs': ['scenes/one.mjs'] },
  });
  assert.deepEqual(
    manifest.files.map((file) => file.path),
    ['index.mjs', 'model.mjs', 'scenes/one.mjs'],
  );
  assert.deepEqual(manifest.dynamicImports, [{ from: 'index.mjs', targets: ['scenes/one.mjs'] }]);
  await assert.rejects(
    lessonSourceManifest({
      root,
      entry: 'index.mjs',
      dynamicImports: { 'index.mjs': ['model.mjs'], './index.mjs': ['model.mjs'] },
    }),
    /Duplicate dynamic import closure/,
  );
  await put('index.mjs', 'export const load = true;');
  await assert.rejects(
    lessonSourceManifest({
      root,
      entry: 'index.mjs',
      dynamicImports: { 'index.mjs': ['model.mjs'] },
    }),
    /Unused dynamic import closure/,
  );
});

test('all dependency and asset paths stay inside the logical and real source root', async (t) => {
  const { parent, root, put } = await fixture(t);
  await writeFile(join(parent, 'outside.mjs'), 'export const secret = true;');
  await put('index.mjs', "import '../outside.mjs';");
  await assert.rejects(lessonSourceManifest({ root, entry: 'index.mjs' }), /escapes source root/);
  await put('index.mjs', "import './linked.mjs';");
  await symlink(join(parent, 'outside.mjs'), join(root, 'linked.mjs'));
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs' }),
    /symlink escapes source root/,
  );
  await put('index.mjs', 'export const lesson = true;');
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs', files: ['../outside.mjs'] }),
    /escapes source root/,
  );
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs', assets: [{ path: 'linked.mjs' }] }),
    /symlink escapes source root/,
  );
  await assert.rejects(
    lessonSourceManifest({
      root,
      entry: 'index.mjs',
      assets: [{ path: 'index.mjs', source: { path: '../outside.mjs' } }],
    }),
    /escapes source root/,
  );
  await put('index.mjs', "import 'https://unreachable.invalid/module.mjs';");
  await assert.rejects(
    lessonSourceManifest({ root, entry: 'index.mjs' }),
    /remote or embedded module import/,
  );
});

test('cycles terminate and file identities remain part of the fingerprint', async (t) => {
  const { root, put } = await fixture(t);
  await put('a.mjs', "import './b.mjs'; export const a = 1;");
  await put('b.mjs', "import './a.mjs'; export const b = 2;");
  const cyclic = await lessonSourceManifest({ root, entry: 'a.mjs' });
  assert.equal(cyclic.files.length, 2);
  await put('plain.mjs', 'export const value = 1;');
  await put('other.mjs', 'export const value = 1;');
  assert.notEqual(
    (await lessonSourceManifest({ root, entry: 'plain.mjs' })).fingerprint,
    (await lessonSourceManifest({ root, entry: 'other.mjs' })).fingerprint,
  );
});

test('an internal module symlink follows imports from the real module location', async (t) => {
  const { root, put } = await fixture(t);
  await put('scenes/actual.mjs', "export { value } from './model.mjs';");
  await put('scenes/model.mjs', 'export const value = 8;');
  await symlink(join(root, 'scenes/actual.mjs'), join(root, 'entry.mjs'));
  const manifest = await lessonSourceManifest({ root, entry: 'entry.mjs' });
  assert.deepEqual(
    manifest.files.map((file) => file.path),
    ['entry.mjs', 'scenes/model.mjs'],
  );
  assert.equal(manifest.files[0].resolvedPath, 'scenes/actual.mjs');
});

test('extensionless ESM and JSON imports remain in the transitive closure', async (t) => {
  const { root, put } = await fixture(t);
  await put('index.mjs', "import './helper';");
  await put(
    'helper',
    "import data from './fixture.json' with { type: 'json' }; export default data;",
  );
  await put('fixture.json', '{"value":3}');
  const before = await lessonSourceManifest({ root, entry: 'index.mjs' });
  assert.deepEqual(
    before.files.map((file) => file.path),
    ['fixture.json', 'helper', 'index.mjs'],
  );
  await put('fixture.json', '{"value":4}');
  assert.notEqual(
    before.fingerprint,
    (await lessonSourceManifest({ root, entry: 'index.mjs' })).fingerprint,
  );
});
