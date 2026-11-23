import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import {
  rows,
  wrongRow,
  freshRows,
  freshWrong,
  lfsPayload,
  lfsPointer,
  lfsDigest,
  job,
  replacement,
  fixturePath,
} from '../../../films/git-shell-linux-reproducible-ai/fixtures.mjs';
import {
  score,
  jsonl,
  newlineCount,
  sameProcess,
  pipelineStatus,
  deviceEnumeration,
} from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';
import {
  bisectTrace,
  searchResult,
  recordContract,
} from '../../../films/git-shell-linux-reproducible-ai/model.mjs';
export {
  rows,
  wrongRow,
  freshRows,
  freshWrong,
  lfsPayload,
  lfsPointer,
  lfsDigest,
  job,
  replacement,
  fixturePath,
  score,
  jsonl,
  newlineCount,
  sameProcess,
  pipelineStatus,
  deviceEnumeration,
  bisectTrace,
  searchResult,
  recordContract,
};
export const runFile = readFileSync(
  new URL('./fixtures/access_requests.jsonl', import.meta.url),
  'utf8',
);
export const rowId = (r) => r.prompt.match(/\d+/)[0];
export const workingAfterEdit = rows.map((r, i) =>
  i === 1 ? { ...r, prediction: r.expected } : { ...r },
);
export const four = [...rows, wrongRow],
  eight = [...freshRows, freshWrong];
export const frozen = (file) => file.map((r) => ({ ...r }));
export const stagedFile = frozen(rows),
  cloneFile = frozen(stagedFile);
export const hookIndex = frozen(four);
export const termLog = 'TERM received. Exiting.';
export const termExit = 0;
export const loopSetup = [
  '#!/usr/bin/env bash',
  'on_term() {',
  "  echo '" + termLog + "'",
  '  exit ' + termExit,
  '}',
  'trap on_term TERM',
];
export const loopBody = [
  'n=0',
  'while :; do',
  '  ./repro.sh || exit "$?"',
  '  echo "check $((++n))"',
  '  sleep 5',
  'done',
];
export const callerCommands = [
  'source ./activate.sh && ./repro.sh',
  'source ./activate.sh; ./repro.sh',
];
export const lfsRule = '*.gguf filter=lfs diff=lfs merge=lfs -text';
export const lfsAdd = 'git add .gitignore .gitattributes model.gguf';
export const cloneCommands = [
  'set -e',
  'source ./activate.sh || exit 1',
  './repro.sh',
  'git status --short',
];
export function cloneTrial(setupStatus, file) {
  if (setupStatus !== 0) return { result: null, ranStatus: false, exit: 1 };
  const passed = score(file).passes;
  return { result: labelScore(file), ranStatus: passed, exit: passed ? 0 : 1 };
}
export const root = '/work/access-rag';
export const resolveInput = (dir) => posix.resolve(root, dir, fixturePath);
export const labelScore = (rs) => {
  const s = score(rs);
  return s.fraction.toFixed(3) + ' (' + s.correct + '/' + s.total + ')';
};
export const match = (r) => r.expected.trim().toLowerCase() === r.prediction.trim().toLowerCase();
export function strictLines(value) {
  const lines = value.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const records = [];
  for (const [i, line] of lines.entries()) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      return { line: i + 1, error: 'invalid JSON' };
    }
    if (!row || typeof row !== 'object' || Array.isArray(row))
      return { line: i + 1, error: 'object required' };
    if (
      !['prompt', 'expected', 'prediction'].every(
        (key) => typeof row[key] === 'string' && row[key].trim(),
      )
    )
      return { line: i + 1, error: 'missing or empty field' };
    records.push(row);
  }
  return records.length ? { records } : { error: 'empty dataset' };
}
export const names = ['access_requests.jsonl', 'two lines.jsonl', 'one\nline.jsonl'];
export const contents = [jsonl(rows), jsonl(rows.slice(0, 2)), jsonl(rows.slice(0, 1))];
export function countInputs(readable) {
  let total = 0;
  const counts = [];
  for (const [i, file] of contents.entries()) {
    if (!readable[i]) return { counts, total: null, failed: i };
    counts.push(newlineCount(file));
    total += counts.at(-1);
  }
  return { counts, total, failed: null };
}
export function checkRun() {
  assert.deepEqual(hookIndex, four);
  assert.notEqual(hookIndex[3], four[3]);
  assert.equal(score(hookIndex).passes, false);
  assert.deepEqual(cloneTrial(1, cloneFile), { result: null, ranStatus: false, exit: 1 });
  assert.deepEqual(cloneTrial(0, cloneFile), { result: '0.667 (2/3)', ranStatus: true, exit: 0 });
  assert.deepEqual(cloneTrial(0, four), { result: '0.500 (2/4)', ranStatus: false, exit: 1 });
  assert.deepEqual(strictLines(runFile).records, rows);
  assert.equal(newlineCount(runFile), 2);
  assert.deepEqual(strictLines(runFile + '\n').records, rows);
  assert.deepEqual(strictLines(runFile + '\n\n'), { error: 'invalid JSON', line: 4 });
  assert.equal(strictLines('[]').error, 'object required');
  assert.equal(strictLines('{}').error, 'missing or empty field');
  assert.equal(strictLines('').error, 'empty dataset');
  assert.equal(
    strictLines(JSON.stringify({ ...rows[0], prompt: 'Access\u2028request' })).records.length,
    1,
  );
  assert.equal(strictLines('{"cost":NaN}').error, 'invalid JSON');
  assert.deepEqual(cloneFile, rows);
  assert.notEqual(cloneFile[1], workingAfterEdit[1]);
  assert.equal(workingAfterEdit[1].prediction, 'blocked');
  assert.equal(cloneFile[1].prediction, 'escalated');
  for (const [file, correct, total, passes, printed] of [
    [workingAfterEdit, 3, 3, true, '1.000'],
    [cloneFile, 2, 3, true, '0.667'],
    [four, 2, 4, false, '0.500'],
    [freshRows, 5, 7, true, '0.714'],
    [eight, 5, 8, false, '0.625'],
  ]) {
    const result = score(file);
    assert.deepEqual(
      [result.correct, result.total, result.passes, result.fraction.toFixed(3)],
      [correct, total, passes, printed],
    );
  }
  assert.equal(resolveInput('scripts'), root + '/scripts/' + fixturePath);
  assert.deepEqual(
    bisectTrace().checks.map((t) => [t.mid, t.good]),
    [
      [3, true],
      [5, false],
      [4, true],
    ],
  );
  assert.deepEqual(searchResult(), { stdout: '0', stderr: '', status: 1, matchingLines: 0 });
  assert.deepEqual(searchResult({ exists: false }), {
    stdout: '',
    stderr: 'grep: eval/missing.jsonl: No such file or directory',
    status: 2,
    matchingLines: null,
  });
  assert.equal(pipelineStatus([2, 0]), 0);
  assert.equal(pipelineStatus([2, 0], true), 2);
  assert.equal(pipelineStatus([2, 7, 0], true), 7);
  assert.deepEqual(countInputs([true, true, true]), { counts: [3, 2, 1], total: 6, failed: null });
  assert.deepEqual(countInputs([true, false, true]), { counts: [3], total: null, failed: 1 });
  assert(!sameProcess(job, replacement));
  assert.equal(replacement.pid, job.pid);
  assert.deepEqual(
    deviceEnumeration([0, 1, 2], '2,0').map((x) => x.physical),
    [2, 0],
  );
  assert.equal(deviceEnumeration([0, 1, 2], '').length, 0);
  assert.equal(deviceEnumeration([0, 1, 2], null).length, 3);
  assert.equal(createHash('sha256').update(lfsPayload).digest('hex'), lfsDigest);
  assert(lfsPointer.includes(lfsDigest + '\nsize ' + lfsPayload.length));
  assert.equal(lfsPayload.length, 8);
  return true;
}
