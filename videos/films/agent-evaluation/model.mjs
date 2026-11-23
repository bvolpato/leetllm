import { ECONOMIC_RUNS, TRIALS } from './fixtures.mjs';
import { phase } from './construction.mjs';
export function report() {
  const passes = TRIALS.flatMap((t) => t.pass).filter(Boolean).length,
    total = TRIALS.reduce((a, t) => a + t.cost.reduce((x, y) => x + y, 0), 0),
    times = TRIALS.flatMap((t) => t.seconds).sort((a, b) => a - b);
  return {
    passes,
    runs: 9,
    allThree: TRIALS.filter((t) => t.pass.every(Boolean)).length / 3,
    total,
    costPerSuccess: total / passes,
    p95: times[Math.ceil(0.95 * times.length) - 1],
  };
}
export function economicsFrame(beat, p) {
  const seconds = p * [16.054, 14.526, 13.174][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const spent = beat > 0 ? 9 : Math.min(9, Math.floor(ramp(2.5, 5.25) * 9 + 1e-9));
  const checked = beat > 0 ? 9 : Math.min(9, Math.floor(ramp(5.4, 6.0) * 9 + 1e-9));
  const total = ECONOMIC_RUNS.slice(0, spent).reduce((sum, row) => sum + row.cost, 0),
    successes = ECONOMIC_RUNS.slice(0, checked).filter((row) => row.pass).length;
  const ordered = [...ECONOMIC_RUNS].sort(
    (a, b) => a.seconds - b.seconds || a.id.localeCompare(b.id),
  );
  const durationCount =
    beat < 1 ? 0 : beat > 1 ? 9 : Math.min(9, Math.floor(ramp(2.1, 4.85) * 9 + 1e-9));
  return {
    spent,
    checked,
    total,
    successes,
    quotientReady: beat > 0 || seconds >= 12.55,
    ordered,
    durationCount,
    p95Ready: beat > 1 || (beat === 1 && seconds >= 9.0),
    p95: ordered[Math.ceil(0.95 * ordered.length) - 1],
  };
}
export function verifyHold(run, task = { reader: 'Lena', book: 'B7' }) {
  return (
    run.authorized === true &&
    run.attemptedForbidden === false &&
    run.write.book === task.book &&
    run.write.reader === task.reader &&
    run.read?.book === run.write.book &&
    run.read?.reader === run.write.reader &&
    run.read?.count === 1 &&
    (run.write.hold === undefined || run.read.ids?.includes(run.write.hold)) &&
    run.read?.version >= run.write.version &&
    run.read?.hold === true
  );
}
export function readHoldSnapshot(account, reader = 'Lena', book = 'B7') {
  const matches = account.holds.filter((hold) => hold.book === book && hold.reader === reader);
  return {
    book,
    reader,
    version: account.version,
    count: matches.length,
    ids: matches.map(hold => hold.id),
    hold: matches.length > 0,
  };
}
export function episodeSnapshot(scene, beat, p, accountOverride) {
  const dirty = scene === 'episode-contract' && (beat === 0 || (p < 0.14 && beat === 1));
  const written = scene === 'hard-gates' || (scene === 'action-trace' && beat === 2 && p >= 0.16);
  const readReady = scene === 'hard-gates' && (beat > 0 || p >= 0.32);
  const forbidden = scene === 'hard-gates' && beat === 2 && p >= 0.14;
  const write = {
    book: 'B7',
    reader: 'Lena',
    version: 3,
    operation: 'op-17',
  };
  const account = accountOverride ?? {
    version: dirty ? 12 : written ? 3 : 2,
    holds: dirty
      ? [
          {
            book: 'B8',
            reader: 'Lena',
            id: 'old-4',
          },
        ]
      : written
        ? [
            {
              book: 'B7',
              reader: 'Lena',
              id: 'hold-17',
            },
          ]
        : [],
  };
  const read = readReady ? readHoldSnapshot(account) : null;
  const checks = read
    ? [
        read.reader === write.reader,
        read.book === write.book,
        read.count === 1 && read.hold,
        read.version >= write.version,
      ]
    : [false, false, false, false];
  const checked =
    scene === 'hard-gates' && beat > 1
      ? 4
      : scene === 'hard-gates' && beat === 1
        ? Math.min(4, Math.floor(phase(p, 0.04, 0.6) * 5))
        : 0;
  const run = {
    authorized: true,
    attemptedForbidden: forbidden,
    write,
    read,
  };
  return {
    dirty,
    written,
    readReady,
    forbidden,
    version: account.version,
    holds: account.holds,
    write,
    read,
    checks,
    checked,
    passed: readReady && checked === 4 && verifyHold(run),
  };
}
export function recoverySnapshot(beat, p) {
  const stage =
    beat === 0
      ? p < 0.28
        ? 0
        : p < 0.58
          ? 1
          : 2
      : beat === 1
        ? p < 0.22
          ? 2
          : p < 0.5
            ? 3
            : p < 0.75
              ? 4
              : 5
        : 5;
  return {
    stage,
    readAttempts: stage >= 1 ? 2 : 1,
    writeAttempts: stage >= 4 ? 2 : 1,
    remoteHolds: 1,
    writeKnown: stage >= 5,
  };
}
export function candidateGate(r) {
  const int = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0,
    rate = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  if (
    !r ||
    !int(r.runs) ||
    r.runs === 0 ||
    !int(r.passes) ||
    r.passes > r.runs ||
    !int(r.critical) ||
    r.critical > r.runs ||
    !rate(r.allThree) ||
    typeof r.cpst !== 'number' ||
    !Number.isFinite(r.cpst) ||
    r.cpst < 0
  )
    return {
      valid: false,
      allowed: false,
      checks: [],
    };
  const checks = [r.passes === r.runs, r.critical === 0, r.allThree >= 0.95, r.cpst <= 0.08];
  return {
    valid: true,
    allowed: checks.every(Boolean),
    checks,
  };
}
