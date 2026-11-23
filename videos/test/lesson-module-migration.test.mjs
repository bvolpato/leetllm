import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertSameProgram,
  formatSource,
  inspectFile,
  inspectSource,
  semanticHash,
} from '../tools/migrate-lesson-modules.mjs';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

test('formatting preserves directives, regular expressions, bigints and tagged template bytes', async () => {
  const source = String.raw`'use strict';export const n=123n;const re=/a\\b/giu;export function draw(ctx,scene,state,api){return tag\`raw\\n\${n}\`;}`;
  const formatted = await formatSource(source.replaceAll('\\`', '`').replaceAll('\\${', '${'));
  assertSameProgram(source.replaceAll('\\`', '`').replaceAll('\\${', '${'), formatted);
  assert.equal(await formatSource(formatted), formatted);
});

test('the semantic guard rejects changed outcomes, flags and template raw bytes', () => {
  for (const [before, after] of [
    ['export const result = 3;', 'export const result = 4;'],
    ['export const result = 123n;', 'export const result = 124n;'],
    ['export const result = 123n;', 'export const result = "123";'],
    ['export const re = /x/g;', 'export const re = /x/i;'],
    ['export const text = tag`a\\nb`;', 'export const text = tag`a\\tb`;'],
    ['export function draw() { return true; }', 'export function draw() { return false; }'],
  ])
    assert.throws(() => assertSameProgram(before, after), /changed the JavaScript AST/);
});

test('only empty statement-list entries are ignored, with directive barriers preserved', async () => {
  assertSameProgram('const match=/x/ig;', 'const match=/x/gi;');
  assertSameProgram('export const x=1;;', 'export const x=1;');
  assertSameProgram('function f(){if(true){;return 1;;}}', 'function f(){if(true){return 1;}}');
  assert.throws(() => assertSameProgram('while (x);', 'while (x) {}'), /changed/);
  assert.throws(
    () => assertSameProgram(';"use strict";function f(){}', '"use strict";function f(){}'),
    /changed/,
  );
  const source = 'export const data={"answer":42};';
  const formatted = await formatSource(source);
  assert.match(formatted, /'answer': 42/);
});

test('switch analysis keeps shared scenes explicit and exposes lexical dependencies', () => {
  const source = `
    const supplied = [1, 2];
    export function draw(ctx, scene, state, api) {
      const color = api.C.blue;
      switch (scene.id) {
        case 'aps-inversion':
        case 'aps-crossing': { api.text(ctx, supplied[state.beat], color); break; }
        case 'tail': api.text(ctx, 'pending');
        default: throw Error('unknown');
      }
    }`;
  const report = inspectSource(source);
  assert.deepEqual(report.exports, ['draw']);
  const [shared, tail] = report.dispatchers[0].branches;
  assert.deepEqual(shared.ids, ['aps-inversion', 'aps-crossing']);
  assert.deepEqual(
    shared.freeBindings.map((binding) => binding.name),
    ['api', 'color', 'ctx', 'state', 'supplied'],
  );
  assert.equal(shared.terminal, true);
  assert.equal(tail.terminal, false);
  assert(report.decomposition.unresolved.some((reason) => reason.includes('Shared scene')));
  assert(report.decomposition.unresolved.some((reason) => reason.includes('fallthrough')));
});

test('alias and extension guards are inspected without pretending they are independent scenes', () => {
  const source = `
    const extended = ['controller', 'formats'];
    function extension(ctx, scene, state, api) {
      const id = scene.id;
      if (!extended.includes(scene.id)) return false;
      if (id === 'controller' && state.beat >= 3) api.text(ctx, 'extension');
    }
    export function draw(ctx, scene, state, api) { return extension(ctx, scene, state, api); }`;
  const report = inspectSource(source);
  assert(
    report.dispatchers.some(
      (dispatcher) => dispatcher.branches[0].ids.join(',') === 'controller,formats',
    ),
  );
  assert(report.dispatchers.some((dispatcher) => dispatcher.condition.includes('state.beat >= 3')));
  assert.equal(report.decomposition.status, 'manual-review-required');
});

test('mutable fixture construction and computed imports remain unresolved', () => {
  const report = inspectSource(
    `const rows=[];for(const n of [1,2]) rows.push(n);export const load = name => import(name);`,
  );
  assert.equal(report.imports[0].source, null);
  assert(report.decomposition.unresolved.some((reason) => reason.includes('fixture builder')));
  assert(report.decomposition.unresolved.some((reason) => reason.includes('dynamic import')));
});

async function temporarySource(run) {
  const directory = await fs.mkdtemp(path.join(testDirectory, '.migration-test-'));
  try {
    await run(path.join(directory, 'fixture.mjs'));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

test('inspection and check never write; explicit formatting preserves the semantic hash', async () => {
  await temporarySource(async (filename) => {
    const source = 'export function draw(){return 3}';
    await fs.writeFile(filename, source);
    assert.equal((await inspectFile(filename, { check: true })).checkPassed, false);
    assert.equal(await fs.readFile(filename, 'utf8'), source);
    assert.equal((await inspectFile(filename, { write: true })).formatting, 'written');
    assert.equal(semanticHash(await fs.readFile(filename, 'utf8')), semanticHash(source));
    assert.equal((await inspectFile(filename, { check: true })).checkPassed, true);
  });
});

test('an interrupted temporary file is preserved instead of deleted or overwritten', async () => {
  await temporarySource(async (filename) => {
    const source = 'export const x=1';
    const interrupted = `${filename}.migrate-${process.pid}.tmp`;
    await fs.writeFile(filename, source);
    await fs.writeFile(interrupted, 'interrupted work');
    await assert.rejects(inspectFile(filename, { write: true }), { code: 'EEXIST' });
    assert.equal(await fs.readFile(filename, 'utf8'), source);
    assert.equal(await fs.readFile(interrupted, 'utf8'), 'interrupted work');
  });
});

test('symbolic-link inputs and parent paths are rejected', async () => {
  await temporarySource(async (filename) => {
    await fs.writeFile(filename, 'export const x=1');
    const link = filename + '.link.mjs';
    await fs.symlink(filename, link);
    await assert.rejects(inspectFile(link, { write: true }), /symbolic-link/);
    const parent = path.join(path.dirname(filename), 'linked');
    await fs.symlink(path.dirname(filename), parent);
    await assert.rejects(
      inspectFile(path.join(parent, 'fixture.mjs'), { write: true }),
      /symbolic-link parent/,
    );
  });
});

test('Set dispatch and opaque context calls stay explicit manual requirements', () => {
  const report = inspectSource(
    `export function draw(ctx,scene,state,api){if(extended.has(scene.id))return drawGeometry({ctx,scene,state,api});}`,
  );
  assert(report.decomposition.unresolved.some((reason) => reason.includes('Set.has')));
  assert(report.decomposition.unresolved.some((reason) => reason.includes('context bag')));
});

test('chain formatting reaches a stable result before returning writable source', async () => {
  const source =
    'export const rows = tails\n.slice(0,count)\n.map((tail,i)=>({id:`R${i+1}`,tail,output:generated[i],reused:i===0?0:6000,fresh:tail+(i===0?6000:0)}));';
  const formatted = await formatSource(source);
  assert.equal(await formatSource(formatted), formatted);
  assertSameProgram(source, formatted);
});
