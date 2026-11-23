import { P, box, line, dot, txt, mono, cap, stage, caption, cue, travel, stamp } from './paint.mjs';
import { releases, syncBranch, finalProbe, assessProbe, mix } from './mechanics.mjs';

function machine(c, x, y, id, loaded, ready) {
  box(c, x, y, 449, 141, P.dark);
  cap(c, id, x + 26, y + 45, P.ice);
  mono(c, loaded ? 'Loaded ' + loaded : 'Empty slot', x + 26, y + 105, 37, P.white);
  for (let i = 0; i < 3; i++) dot(c, x + 337 + i * 29, y + 43, 7, ready ? P.ice : '#69838a');
  if (ready) txt(c, 'ready', x + 340, y + 104, 25, P.ice);
}
function workers(c, k) {
  if (k.beat.beatIndex === 0 && cue(k, 0, 'Consider a separate registry change')) {
    const settings = cue(k, 0, 'point seven'),
      alias = cue(k, 0, 'alias moves from twelve to thirteen');
    stage(
      c,
      'REGISTRY EXAMPLE',
      'Is the worker serving the new configuration?',
      'Separate registry example   /   prompt template v6 remains immutable',
    );
    cap(c, 'Release manifest', 113, 432, P.blue);
    mono(c, 'Temperature    ' + (settings ? '0.7' : '0.2'), 111, 525, 50);
    mono(c, 'Model alias    v' + (alias ? '13' : '12'), 111, 627, 50);
    machine(c, 1113, 486, 'Worker W', 'v12', true);
    caption(
      c,
      alias
        ? 'Snapshot the new settings. Prepare v13 and verify service on a new request.'
        : 'The registry and worker resolve their versions at different times.',
    );
    return;
  }
  const load = cue(k, 1, 'Load the complete baseline'),
    ready = cue(k, 1, 'check health and capacity');
  const moved = cue(k, 1, 'Shift the live route'),
    probe = cue(k, 1, 'Follow the first new request', 0.9);
  const trace = cue(k, 1, 'It reaches B');
  stage(
    c,
    'EMERGENCY RESTORE',
    'What is loaded on the worker that answers?',
    'Registry alias → baseline B    /    worker memory and the live route have separate owners',
  );
  machine(c, 715, 397, 'Worker 1', 'C', true);
  machine(c, 715, 656, 'Worker 2', load ? 'B' : null, ready);
  cap(c, 'us-west traffic', 117, 522);
  stamp(c, 193, 601, '→', P.blue);
  const y = moved ? 728 : 468;
  travel(
    c,
    [
      [231, 601],
      [427, 601],
      [579, y],
      [686, y],
    ],
    1,
    P.blue,
  );
  if (!moved) {
    mono(c, 'C in service', 1294, 490, 42, P.amber);
  } else {
    travel(
      c,
      [
        [1171, y],
        [1309, y],
      ],
      probe,
      P.aqua,
    );
    if (trace) {
      cap(c, 'Request 01', 1339, 669, P.aqua);
      mono(c, 'Served B', 1339, 746, 54, P.aqua);
      txt(c, 'corpus B   /   L2', 1341, 799, 31);
    }
  }
  caption(
    c,
    trace
      ? 'Request 01 actually used last-known-good. Git still declares release-a91.'
      : moved
        ? 'Send a new request through the switched route.'
        : ready
          ? 'Worker 2 has verified bytes, health and capacity.'
          : 'An alias change leaves the loaded object in place.',
  );
}
function branches(c, k) {
  const lower = cue(k, 2, 'commit B');
  const u = cue(k, 3, 'Follow the upper sync', 0.8),
    d = cue(k, 4, 'Follow the lower sync', 0.8);
  const hitC = cue(k, 3, 'A fresh request now records'),
    hitB = cue(k, 4, 'A fresh request records');
  stage(
    c,
    'DESIRED STATE AND LIVE SERVICE',
    'Who answers after the next reconciliation?',
    'Same initial B trace and healthy capacity on both takes   /   automatic drift correction enabled',
  );
  const headings = ['Before sync', 'Manifest in Git', 'After sync', 'Fresh response'];
  headings.forEach((s, i) => cap(c, s, [106, 521, 1085, 1420][i], 405));
  for (let i = 0; i < 2; i++) {
    const desired = i && lower ? 'B' : 'C',
      sync = i ? d : u;
    const s = syncBranch(desired, sync === 1, !!(i ? hitB : hitC));
    const y = 514 + 207 * i,
      col = desired === 'B' ? P.aqua : P.amber;
    if (i === 1 && !lower) continue;
    stamp(c, 141, y, 'B', P.aqua);
    txt(c, 'Request 01', 195, y + 14, 38);
    line(c, 120, y + 66, 1748, y + 66, P.line);
    mono(c, 'Declare ' + desired, 520, y + 5, 42, col);
    const manifest = releases[desired];
    txt(c, manifest.corpus + '   /   ' + manifest.transform, 521, y + 50, 30, P.muted);
    travel(
      c,
      [
        [828, y],
        [1044, y],
      ],
      sync,
      col,
    );
    mono(c, sync === 1 ? 'Route ' + s.route : '—', 1084, y + 14, 41, sync === 1 ? col : P.muted);
    if (s.trace) {
      mono(c, 'Served ' + s.route, 1418, y + 7, 44, col);
      txt(c, s.trace.view + '   /   ' + s.trace.transform, 1419, y + 51, 31);
    } else mono(c, '?', 1420, y + 14, 48, P.muted);
  }
  caption(
    c,
    hitB
      ? 'The post-sync trace confirms the complete baseline, including its corpus and transform.'
      : hitC
        ? 'The upper request used release-a91. Its earlier B trace is still part of the history.'
        : 'Predict each new trace from the manifest that the operator will pull.',
  );
}
function afterPhrase(k, beat, phrase, motion = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(phrase);
  const progress = k.reveal(phrase, end - start + motion, { captionStart: phrase });
  if (progress === 1 || motion === 0) return Number(progress === 1);
  return Math.max(0, (k.elapsed - end) / motion);
}

function measure(c, from, to, y, progress, color) {
  if (progress <= 0) return;
  const tip = mix(from, to, progress);
  line(c, from, y, tip, y, color, 4);
  line(c, from, y - 8, from, y + 8, color, 3);
  line(c, tip, y - 8, tip, y + 8, color, 3);
}

function probeTime(minute) {
  const hour = 9 + Math.floor(minute / 60);
  return String(hour).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');
}

function featureTiming(c, k, p, result) {
  const cutoff = p.request - p.maxAge;
  const x = (m) => 250 + ((m - cutoff) / p.maxAge) * 1410;
  const axis = 438;
  const request = cue(k, 5, 'request was at ten');
  const event = cue(k, 5, 'nine forty');
  const available = cue(k, 5, 'nine fifty-five');
  const limit = cue(k, 5, 'The age allowance');
  const age = afterPhrase(k, 6, 'The event is twenty minutes old', 0.5);
  const lead = afterPhrase(k, 6, 'and arrived five minutes before use', 0.45);

  cap(c, 'Feature timing', 107, 355);
  if (limit) {
    mono(c, p.maxAge + ' min lookback', 1810, 355, 31, P.muted, 'right');
    box(c, x(cutoff), axis - 14, x(p.request) - x(cutoff), 28, P.grid);
  }
  line(c, x(cutoff), axis, x(p.request), axis, P.line, 4);
  for (const [minute, label, visible, labelY, color, align] of [
    [cutoff, 'cutoff', limit, 485, P.muted, 'center'],
    [p.event, 'event', event, 405, P.blue, 'center'],
    [p.available, 'available', available, 485, P.amber, 'right'],
    [p.request, 'request', request, 405, P.ink, 'center'],
  ]) {
    if (visible) {
      dot(c, x(minute), axis, 11, color);
      mono(c, probeTime(minute) + ' ' + label, x(minute), labelY, 32, color, align);
    }
  }
  if (age > 0) {
    line(c, x(p.request), axis + 15, x(p.request), lead > 0 ? 568 : 526, P.line, 2, [5, 5]);
  }
  measure(c, x(p.request), x(p.event), 526, age, P.blue);
  measure(c, x(p.request), x(p.available), 568, lead, P.amber);
  if (age === 1) mono(c, result.age + ' min old', x(p.event) - 24, 537, 33, P.blue, 'right');
  if (lead === 1)
    mono(c, result.lead + ' min before use', x(p.available) - 24, 579, 33, P.amber, 'right');
}

function forecastError(c, k, p, result) {
  const estimate = cue(k, 5, 'thirteen hours');
  const actual = cue(k, 5, 'took twelve');
  const limit = cue(k, 5, 'With two hours of error allowed');
  const error = afterPhrase(k, 6, 'The estimate missed by one hour', 0.5);
  const low = p.actual - p.tolerance;
  const high = p.actual + p.tolerance;
  const first = Math.min(low - 1, p.estimate);
  const last = Math.max(high + 1, p.estimate);
  const x = (hour) => 250 + ((hour - first) / (last - first)) * 1410;
  const axis = 746;

  cap(c, 'Forecast error', 107, 646);
  if (limit) {
    mono(c, 'Allowed error ±' + p.tolerance + ' h', 1810, 646, 31, P.muted, 'right');
    box(c, x(low), axis - 17, x(high) - x(low), 34, P.grid);
  }
  line(c, x(first), axis, x(last), axis, P.line, 4);
  for (let hour = first; hour <= last; hour++) {
    line(c, x(hour), axis + 4, x(hour), axis + 14, P.muted);
    mono(c, hour + ' h', x(hour), 797, 31, P.muted, 'center');
  }
  if (actual) {
    mono(c, 'Actual', x(p.actual), 709, 35, P.blue, 'center');
    dot(c, x(p.actual), axis, 11, P.blue);
  }
  if (estimate) {
    mono(c, 'Estimate', x(p.estimate), 709, 35, P.amber, 'center');
    dot(c, x(p.estimate), axis, 11, P.amber);
  }
  measure(c, x(p.actual), x(p.estimate), 821, error, P.aqua);
  if (error === 1)
    mono(c, result.error + ' h error', mix(x(p.actual), x(p.estimate), 0.5), 863, 34, P.aqua, 'center');
}

function practice(c, k) {
  const p = finalProbe;
  const result = assessProbe(p);
  const check = afterPhrase(k, 6, 'Both pass on this request');
  stage(
    c,
    'POST-SYNC PROBE',
    'Does this restored request pass both checks?',
    'us-west   /   served B   /   last-known-good   /   releases@4   /   corpus B   /   L2',
  );
  featureTiming(c, k, p, result);
  line(c, 105, 601, 1810, 601, P.line);
  forecastError(c, k, p, result);
  caption(
    c,
    check && result.ok
      ? 'The restored release passed both checks on this request.'
      : 'Check the feature’s timing and the forecast’s error.',
  );
}
export function recoveryScene(c, k) {
  if (k.beat.beatIndex < 2) return workers(c, k);
  if (k.beat.beatIndex < 5) return branches(c, k);
  return practice(c, k);
}
