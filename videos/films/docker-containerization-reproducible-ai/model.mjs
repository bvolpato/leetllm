import { clamp, key, normalized } from './arithmetic.mjs';
import {
  CHANGED_FIXTURE,
  FIXTURE,
  FRESH_FIXTURE,
  FRESH_EXPECTED_COUNTS,
  FRESH_MOUNTED,
  FRESH_REPAIRED,
  MISSING_FIXTURE_ERROR,
  OBSERVED_IMAGE_ID,
} from './fixtures.mjs';
import { cueProgress } from './construction.mjs';
import assert from 'node:assert/strict';
export function score(rows) {
  const matches = rows.filter(
    (row) => normalized(row.expected) === normalized(row.prediction),
  ).length;
  const total = rows.length;
  return {
    matches,
    total,
    fraction: total ? matches / total : 0,
    threshold: total > 0 && matches * 3 >= total * 2,
  };
}
export function reportLines(result, thresholdLine = REFERENCE_LINES[2]) {
  const lines = [
    `Eval rows: ${result.total}`,
    `Exact-match accuracy on tiny fixture: ${result.fraction.toFixed(3)} (${result.matches}/${result.total})`,
  ];
  if (result.threshold) lines.push(thresholdLine);
  return lines;
}
export const REFERENCE_LINES = Object.freeze([
  'Eval rows: 3',
  'Exact-match accuracy on tiny fixture: 0.667 (2/3)',
  'Gate passed. You may commit.',
]);
export function referenceReport(thresholdLine = REFERENCE_LINES[2]) {
  return [...REFERENCE_LINES.slice(0, -1), thresholdLine].join('\n') + '\n';
}
export function matchesReferenceReport(result, thresholdLine = REFERENCE_LINES[2]) {
  return reportLines(result, thresholdLine).join('\n') + '\n' === referenceReport(thresholdLine);
}
export function visibleFixture(imageRows = FIXTURE, mount = null) {
  const rows = mount === null ? imageRows : mount;
  return {
    source: mount === null ? 'image' : 'mount',
    rows,
    storedRows: imageRows,
    missing: rows.length === 0,
    exitCode: rows.length ? (score(rows).threshold ? 0 : 1) : 1,
    report: rows.length ? score(rows) : null,
    error: rows.length ? null : MISSING_FIXTURE_ERROR,
  };
}
export function checkReport(rows, imageId = OBSERVED_IMAGE_ID) {
  const result = score(rows);
  return {
    ...result,
    imageId,
    exact: imageId === OBSERVED_IMAGE_ID && matchesReferenceReport(result),
  };
}
export function teachingKeys({ source = 'script A', requirements = 'requirements A' } = {}) {
  const base = key(['Python 3.12', 'linux/amd64']);
  const install = key([base, 'install requirements in /opt/venv', requirements]);
  const application = key([install, 'copy scorer and fixture', source, FIXTURE]);
  return {
    base,
    install,
    application,
  };
}
export const BASE_KEYS = teachingKeys();
export const SOURCE_KEYS = teachingKeys({
  source: 'script B',
});
export const REQUIREMENT_KEYS = teachingKeys({
  requirements: 'requirements B',
});
export function cacheState(kind, progress = 1, lookupComplete = true) {
  const p = clamp(progress),
    changed = p >= 0.3,
    rebuilt = lookupComplete && p >= 0.72;
  const result =
    kind === 'source' ? SOURCE_KEYS : kind === 'requirements' ? REQUIREMENT_KEYS : BASE_KEYS;
  return {
    kind,
    progress: p,
    inputChanged: changed,
    rebuilt,
    source: kind === 'source' && changed ? 'script B' : 'script A',
    requirements: kind === 'requirements' && changed ? 'requirements B' : 'requirements A',
    install: kind === 'requirements' && rebuilt ? result.install : BASE_KEYS.install,
    application: rebuilt ? result.application : BASE_KEYS.application,
    installReused: kind !== 'requirements' || !changed,
    base: BASE_KEYS.base,
  };
}
export function evaluationState(state) {
  const ids = ['eval-first', 'eval-second', 'eval-third'];
  const read =
    state.beat > 0
      ? FIXTURE.length
      : ids.filter(
          (id, index) => cueProgress(state, id, 0, 0.05 + index * 0.25, 0.25 + index * 0.25) >= 1,
        ).length;
  return {
    read,
    result: score(FIXTURE.slice(0, read)),
    reportVisible: cueProgress(state, 'eval-score', 1) >= 1,
    gateVisible: cueProgress(state, 'eval-count-gate', 1) >= 1,
    exited: cueProgress(state, 'eval-exit', 2) >= 1,
    removed: cueProgress(state, 'eval-remove', 2) >= 1,
  };
}
export function mountState(state) {
  const mounted = cueProgress(state, 'mount-overlay', 1);
  const restored = cueProgress(state, 'mount-restore', 3);
  const detached = state.cues?.['mount-detach'] ? cueProgress(state, 'mount-detach', 3) : restored;
  const switchPosition = mounted * (1 - detached);
  const view = visibleFixture(FIXTURE, switchPosition === 1 ? [] : null);
  return {
    ...view,
    mounted,
    restored,
    switchPosition,
    errorVisible: state.cues?.['mount-failure']?.phase === 'after' && view.missing,
    resultVisible: restored >= 1 || state.beat === 0,
    predicted: state.beat === 0,
  };
}
export function secretState(state) {
  const mount = cueProgress(state, 'secret-mount', 1),
    unmount = cueProgress(state, 'secret-unmount', 1);
  return {
    buildMounted: mount > 0 && unmount < 1,
    layerHasCredential: false,
    outputReady: cueProgress(state, 'secret-output', 1) >= 0.7,
    runtimeMounted: cueProgress(state, 'secret-runtime', 2) > 0,
  };
}
export function validateOriginalModel() {
  assert.deepEqual(score(FIXTURE), {
    matches: 2,
    total: 3,
    fraction: 2 / 3,
    threshold: true,
  });
  assert.equal(score([]).threshold, false);
  assert.equal(
    score([
      {
        expected: ' BLOCKED ',
        prediction: 'blocked',
      },
    ]).matches,
    1,
  );
  assert.equal(visibleFixture(FIXTURE, []).error, MISSING_FIXTURE_ERROR);
  assert.equal(visibleFixture(FIXTURE, []).storedRows, FIXTURE);
  assert.equal(checkReport(CHANGED_FIXTURE).threshold, true);
  assert.equal(checkReport(CHANGED_FIXTURE).exact, false);
  assert.equal(checkReport(FIXTURE, 'another image').exact, false);
  assert.equal(BASE_KEYS.install, SOURCE_KEYS.install);
  assert.notEqual(BASE_KEYS.application, SOURCE_KEYS.application);
  assert.notEqual(BASE_KEYS.install, REQUIREMENT_KEYS.install);
  assert.notEqual(BASE_KEYS.application, REQUIREMENT_KEYS.application);
  return true;
}
export function stageContents(inheritsBuilder = false) {
  const builder = {
    env: {
      TOOL_MODE: 'review',
      PATH: '/opt/venv/bin',
    },
    files: ['/opt/venv', '/opt/helper.bin'],
  };
  return inheritsBuilder
    ? structuredClone(builder)
    : {
        env: {},
        files: ['/opt/venv'],
      };
}
export function permissionBits(mode, owner, uid) {
  const bits = (mode >> (owner === uid ? 6 : 0)) & 7;
  return {
    read: !!(bits & 4),
    write: !!(bits & 2),
    traverse: !!(bits & 1),
  };
}
export function validateModel() {
  validateOriginalModel();
  for (const rows of [FIXTURE, CHANGED_FIXTURE, FRESH_FIXTURE, FRESH_MOUNTED, FRESH_REPAIRED]) {
    for (const row of rows) {
      for (const field of ['prompt', 'expected', 'prediction']) {
        assert.ok(
          typeof row[field] === 'string' && row[field].trim(),
          `Request ${row.id}: ${field}`,
        );
      }
    }
  }
  assert.deepEqual(score(FRESH_FIXTURE), {
    matches: 5,
    total: 7,
    fraction: 5 / 7,
    threshold: true,
  });
  assert.equal(score(FRESH_MOUNTED).threshold, false);
  assert.equal(score(FRESH_MOUNTED).matches, 4);
  assert.equal(score(FRESH_REPAIRED).matches, 5);
  for (const rows of [FRESH_FIXTURE, FRESH_REPAIRED]) {
    const { matches, total } = score(rows);
    assert.deepEqual({ matches, total }, FRESH_EXPECTED_COUNTS);
  }
  assert.deepEqual(
    FRESH_MOUNTED.filter((row, i) => row.prediction !== FRESH_REPAIRED[i].prediction).map(
      (row) => row.id,
    ),
    [305],
  );
  assert.deepEqual(stageContents(false), {
    env: {},
    files: ['/opt/venv'],
  });
  assert.equal(stageContents(true).env.TOOL_MODE, 'review');
  assert.equal(permissionBits(0o700, 0, 10001).read, false);
  assert.equal(permissionBits(0o755, 0, 10001).read, true);
  assert.equal(permissionBits(0o755, 0, 10001).write, false);
  return true;
}
