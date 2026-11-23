import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCORES, VALUES } from '../../../films/flash-attention/fixtures.mjs';

if (!process.argv[2]) throw new Error('Pass the directory of the built Vizmatic package.');
const checkout = resolve(process.argv[2]);
const manifest = JSON.parse(readFileSync(resolve(checkout, 'package.json'), 'utf8'));
const entry = resolve(checkout, manifest.exports['.'].import.default);
const { softmaxTileMass, combineSoftmaxMass, valueChangeState, stableSoftmax, dotProduct } =
  await import(pathToFileURL(entry).href);
const old = softmaxTileMass(SCORES.slice(0, 2), VALUES.slice(0, 2));
const incoming = softmaxTileMass(SCORES.slice(2), VALUES.slice(2));
const full = combineSoftmaxMass([old, incoming]);
const columns = SCORES.map((score, i) =>
  combineSoftmaxMass([softmaxTileMass([score], [VALUES[i]])], full.reference).mass);
const oldHeight = old.weightedSum / old.mass;
const steps = 90;
const squeeze = [], replacement = [];
for (let frame = 0; frame <= steps; frame++) {
  const t = frame / steps;
  const progress = t * t * (3 - 2 * t);
  const reference = valueChangeState({ from: old.reference, to: full.reference, progress }).value;
  const held = combineSoftmaxMass([old], reference);
  assert.ok(Math.abs(held.weightedSum - oldHeight * held.mass) < 1e-12);
  squeeze.push([reference, held.mass, held.weightedSum]);
  const value = valueChangeState({ from: VALUES[2], to: 4, progress }).value;
  const row = combineSoftmaxMass([old, softmaxTileMass([SCORES[2]], [value])]);
  const average = row.weightedSum / row.mass;
  assert.equal(row.mass, full.mass);
  assert.ok(Math.abs(average - dotProduct(stableSoftmax(SCORES), [...VALUES.slice(0, 2), value])) < 1e-12);
  replacement.push([value, row.weightedSum, average]);
}
// This Vizmatic version produced the reference frames. The digest also checks compatible builds.
const commit = '51807bd7b55277dac662d3bd1d571fa5f683e2ab';
const tree = '456f67fd338901659a3567695778c6cbf36c392e';
const json = JSON.stringify({ commit, tree, old, oldHeight, full, columns, squeeze, replacement }) + '\n';
assert.equal(createHash('sha256').update(json).digest('hex'), '789cde2326787df26069349319164e151cd0ae49a19b9c554df207cd129e5323');
const output = process.argv[3] ? resolve(process.argv[3]) : new URL('./weighted-area-states.json', import.meta.url);
writeFileSync(output, json);
