import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'yaml';
import { checkLessonCoverage } from '../check-coverage.mjs';
import { scriptHash, validateCoverage } from '../lib/coverage.mjs';

const videos = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, videos), 'utf8');
const command = fileURLToPath(new URL('check-coverage.mjs', videos));

test('coverage checks the script and ledger of the requested A/B Testing edition', async () => {
  const canvas = parse(await read('lessons/ab-testing.lesson.yaml'));
  const stage = parse(await read('stage-lessons/ab-testing/lesson.yaml'));
  const article = await read('../web/src/content/' + canvas.source);
  const canvasLedger = parse(await read('coverage/ab-testing.yaml'));

  assert.equal(
    execFileSync(process.execPath, [command, '--hash', 'ab-testing', '--mode', 'canvas'], {
      encoding: 'utf8',
    }).trim(),
    scriptHash(canvas),
  );
  assert.deepEqual(await checkLessonCoverage('ab-testing', { mode: 'canvas' }), {
    id: 'ab-testing',
    ...validateCoverage({ coverage: canvasLedger, lesson: canvas, article }),
  });
  assert.equal((await checkLessonCoverage('ab-testing')).summary.script, scriptHash(stage));
});
