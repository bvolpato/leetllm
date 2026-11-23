// From this directory, run node generate-scans.mjs /path/to/built/vizmatic.
// Build the pinned revision with pnpm install --frozen-lockfile and pnpm build.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { IMAGE, KERNEL } from '../../../films/convolution/fixtures.mjs';

const revision = 'c1949a3fee2dca9420c090ce3a8acc04ea9960d0';
if (!process.argv[2]) throw new Error('Pass the path to the built Vizmatic checkout.');
const checkout = resolve(process.argv[2]);
const head = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, revision, 'Build the pinned Vizmatic revision before generating the scans.');
const pkg = JSON.parse(readFileSync(resolve(checkout, 'package.json'), 'utf8'));
assert.equal(pkg.name, 'vizmatic');
const entry = pathToFileURL(resolve(checkout, pkg.exports['.'].import.default));
const { crossCorrelate2d, traceCrossCorrelation2d } = await import(entry);

const grids = [];
for (const [name, options] of [
  ['valid1', { stride: 1 }],
  ['valid2', { stride: 2 }],
  ['same1', { padding: 'same' }],
]) {
  const grid = crossCorrelate2d(IMAGE, KERNEL, options);
  const rows = grid.map((row, r) => {
    const cells = row.map((value, c) => {
      const trace = traceCrossCorrelation2d(IMAGE, KERNEL, r, c, options);
      assert.equal(trace.sum, value);
      return JSON.stringify(trace);
    });
    return '    [\n      ' + cells.join(',\n      ') + '\n    ]';
  });
  grids.push('  "' + name + '": [\n' + rows.join(',\n') + '\n  ]');
}
const json = '{\n  "vizmaticRevision": "' + revision + '",\n' + grids.join(',\n') + '\n}\n';
writeFileSync(new URL('./scans.json', import.meta.url), json);
