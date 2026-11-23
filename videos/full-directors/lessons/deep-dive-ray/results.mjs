import assert from 'node:assert/strict';
import { features } from '../../../films/deep-dive-ray/arithmetic.mjs';
import { parallel, serial } from '../../../films/deep-dive-ray/fixtures.mjs';
import { rayObjectLoss } from '../../../films/deep-dive-ray/model.mjs';
import { tiles, storm, tileRows, checkStorm } from './storm.mjs';
import {
  C,
  mono,
  serif,
  rect,
  outline,
  line,
  label,
  center,
  paper,
  header,
  foot,
  cue,
  arrow,
  mix,
  poly,
} from './drawing.mjs';

export const docs = ['cache', 'router', 'trace'];
export const values = docs.map(features);
const colors = [C.blue, C.aqua, C.orange];
const tuple = (v) => '(' + v.join(', ') + ')';

function plate(g, i, x, y, w, h, rows) {
  rect(g, x, y, w, h, C.faint);
  for (let j = 1; j < 12; j++) line(g, x, y + (h * j) / 12, x + w, y + (h * j) / 12, C.seam, 1);
  if (rows) g.drawImage(tiles[i], 0, 0, tiles[i].width, rows, x, y, w, (h * rows) / tileRows);
  if (rows < tileRows)
    line(g, x, y + (h * rows) / tileRows, x + w, y + (h * rows) / tileRows, C.paper, 3);
}
function decodeState(westRows, eastRows, submitted) {
  const waiting = ['west', 'east'].filter((_, i) => [westRows, eastRows][i] < tileRows);
  return {
    lines: [westRows, eastRows],
    waiting,
    submitted,
    runnable: submitted && !waiting.length,
  };
}
export function opening(g, c) {
  const scan = cue(c, 0, 'Watch the last rows', 2.3);
  const submit = cue(c, 1, 'The driver passes');
  const last = cue(c, 2, 'Watch the last west rows arrive', 2.0);
  const state = decodeState(
    Math.floor(54 + 20 * scan + 46 * last),
    Math.floor(70 + 50 * scan),
    !!submit,
  );
  const join = state.runnable ? cue(c, 2, 'It joins the tiles', 1.2) : 0;
  header(g, 'Storm mosaic   /   Two worker processes', 'Can the driver submit the stitch?');
  const w = 744,
    h = (w * 120) / 168,
    gap = 118 * (1 - join),
    left = (1920 - 2 * w - gap) / 2;
  for (let i = 0; i < 2; i++) {
    const x = left + i * (w + gap);
    if (!join) {
      label(g, ['west', 'east'][i], x, 321, 42, C.paper, mono);
      label(
        g,
        state.lines[i] === tileRows ? 'ready' : 'decoding',
        x + w,
        319,
        34,
        state.lines[i] === tileRows ? C.aqua : C.orange,
        undefined,
        'right',
      );
    }
    plate(g, i, x, 340, w, h, state.lines[i]);
  }
  if (join > 0)
    label(
      g,
      join === 1 ? 'Stitched mosaic' : 'Joining west and east',
      left,
      321,
      42,
      C.paper,
      serif,
    );
  if (join === 1) g.drawImage(storm, left, 340, w * 2, h);
  line(g, 82, 900, 1838, 900);
  label(
    g,
    state.submitted ? 'stitch.remote(west, east)' : 'Driver holds   west   +   east',
    85,
    978,
    44,
    C.white,
    mono,
  );
  const status = !state.submitted
    ? 'Submit now or wait?'
    : state.waiting.length
      ? 'Submitted · waiting for west'
      : join === 1
        ? 'Mosaic ready'
        : join > 0
          ? 'Joining the tiles'
          : 'Both arguments ready';
  label(g, status, 1835, 976, 42, state.runnable ? C.aqua : C.orange, undefined, 'right');
}

function scheduleStats(rows, t) {
  return {
    done: rows.filter((r) => t >= r.end).length,
    total: rows.reduce((s, r) => s + r.end - r.start, 0),
    finish: Math.max(...rows.map((r) => r.end)),
    lengths: rows.map((r) => Math.max(0, Math.min(t, r.end) - r.start)),
  };
}
export function schedule(g, c) {
  const pair = cue(c, 1, 'Now submit all three');
  const t = pair
    ? 2 * cue(c, 1, 'Cache and router start', 1.8) +
      2 * cue(c, 2, 'Watch the last two calls finish', 2.35) +
      cue(c, 2, 'The second lane')
    : 9 * cue(c, 0, 'In the first run', 4);
  const plan = pair ? parallel : serial,
    s = scheduleStats(plan, t);
  header(g, 'Document features   /   Supplied durations', 'When does the last result arrive?');
  for (let i = 0; i < 3; i++) {
    const x = 90 + i * 575;
    rect(g, x, 295, 12, 69, colors[i]);
    label(g, docs[i], x + 28, 346, 46, C.paper, serif);
    label(g, serial[i].end - serial[i].start + ' ticks', x + 235, 345, 40, colors[i], mono);
  }
  label(
    g,
    pair ? 'Submit all three before waiting' : 'Submit one, then get its result',
    86,
    448,
    41,
    C.muted,
  );
  const x0 = 328,
    unit = 161;
  for (let i = 0; i <= 9; i++) {
    line(g, x0 + i * unit, 494, x0 + i * unit, 771, C.seam, 1);
    center(g, i, x0 + i * unit, 827, 38, C.muted, mono);
  }
  for (let lane = 0; lane < 2; lane++) {
    const y = 510 + lane * 137;
    label(g, 'Worker ' + (lane + 1), 84, y + 60, 38, C.white);
    rect(g, x0, y, 9 * unit, 90, C.faint);
    for (const [i, r] of plan.entries())
      if (r.lane === lane && s.lengths[i] > 0) {
        const width = unit * s.lengths[i];
        rect(g, x0 + r.start * unit, y, width, 90, colors[i]);
        if (width > 152) label(g, docs[i], x0 + r.start * unit + 17, y + 60, 37, C.ink, serif);
      }
  }
  line(g, x0 + t * unit, 493, x0 + t * unit, 761, C.paper, 4);
  if (pair) {
    label(g, 'Serial run', 84, 877, 31, C.muted);
    for (const [i, r] of serial.entries())
      rect(g, x0 + r.start * unit, 858, (r.end - r.start) * unit - 3, 12, colors[i]);
  }
  const end = !!cue(c, 2, 'Nine ticks of worker time');
  foot(
    g,
    end
      ? s.total + ' worker-ticks    /    ' + s.finish + ' elapsed ticks'
      : s.done +
          ' of 3 finished    ·    ' +
          (pair ? 'two worker slots' : 'second worker idle'),
    end ? C.aqua : C.muted,
  );
}

function argumentsFor(refs, stored) {
  return refs.map((x) => (Array.isArray(x) ? x : stored[x]));
}
const refs = ['A', 'B', 'C'],
  stored = Object.fromEntries(refs.map((id, i) => [id, values[i]]));
export function argumentsScene(g, c) {
  const b = c.beat.beatIndex,
    isList = b >= 2,
    showArgs =
      (b === 1 && cue(c, 1, 'The ledger sees')) || (b >= 3 && cue(c, 3, 'The list itself'));
  header(
    g,
    'Document features   /   Actor arguments',
    b === 0 ? 'What does a feature task return?' : 'What reaches the ledger?',
  );
  const title = b === 0 ? 'Text' : 'Driver holds';
  label(g, title, 108, 354, 42, C.muted);
  label(g, 'Completed value', 584, 354, 42, C.muted);
  for (const [i, name] of docs.entries()) {
    const y = 407 + i * 137;
    paper(g, 92, y, 388, 102);
    label(g, b === 0 ? name : refs[i] + '   ' + name, 115, y + 68, 43, C.ink, mono);
    arrow(g, 486, y + 50, 550);
    label(g, tuple(values[i]), 586, y + 66, 49, colors[i], mono);
  }
  if (b === 0) {
    paper(g, 1005, 380, 793, 418);
    label(g, 'cache', 1060, 471, 61, C.ink, serif);
    label(g, '99 + 97 + 99 + 104 + 101', 1060, 569, 38, C.ink, mono);
    if (cue(c, 0, 'leaving a remainder'))
      label(g, '500 = 4 × 101 + 96', 1060, 688, 55, C.ink, mono);
    foot(g, '(letter count, character-code sum modulo 101)');
  } else {
    paper(g, 950, 389, 865, 419);
    label(
      g,
      isList ? 'inspect_nested.remote(refs)' : 'record.remote(*refs)',
      998,
      490,
      45,
      C.ink,
      mono,
    );
    line(g, 1000, 535, 1760, 535, C.seam);
    label(
      g,
      showArgs ? 'Inside the method' : isList ? 'One argument' : 'Three arguments',
      1000,
      600,
      39,
      C.ink,
    );
    const args = argumentsFor(isList ? [refs] : refs, stored);
    if (showArgs)
      label(
        g,
        isList ? '[' + args[0].join(', ') + ']   handles' : args.map(tuple).join('  '),
        998,
        707,
        isList ? 49 : 39,
        C.ink,
        mono,
      );
    else label(g, isList ? '[ A, B, C ]  →  ?' : 'A, B, C  →  ?', 998, 707, 54, C.ink, mono);
    foot(
      g,
      isList
        ? showArgs
          ? 'The actor can fetch each nested handle.'
          : 'All three results are ready. What does the list contain?'
        : cue(c, 1, 'The driver fetches')
          ? 'Driver fetches the count   3'
          : 'Top-level arguments carry dependencies.',
    );
  }
}

function phraseProgress(c, beat, startPhrase, endPhrase = startPhrase) {
  if (c.beat.beatIndex !== beat) return c.beat.beatIndex > beat ? 1 : 0;
  const { start } = c.wordCue(startPhrase);
  const { end } = c.wordCue(endPhrase);
  assert.ok(end > start, 'The end cue must follow the start cue.');
  return c.reveal(startPhrase, end - start, { captionStart: startPhrase });
}

function eastCopies({ copy, lost, fetch, allLost, put, retries }) {
  const stores = [(!lost || fetch === 1) && !allLost, copy === 1 && !allLost];
  return {
    stores,
    decodeRuns: 1,
    recovery: rayObjectLoss({
      ownerAlive: true,
      copies: stores.filter(Boolean).length,
      lineage: !put,
      retries,
    }),
  };
}

function transferTile(g, from, to, progress, route) {
  const direction = Math.sign(to - from);
  const y = 675;
  line(g, from, y, to - direction * 12, y, C.aqua, 4);
  poly(
    g,
    [[to, y], [to - direction * 22, y - 12], [to - direction * 22, y + 12]],
    C.aqua,
  );
  center(g, route, (from + to) / 2, 604, 40, C.aqua, mono);
  if (progress < 1) {
    const x = mix(from + direction * 78, to - direction * 78, progress);
    rect(g, x - 75, y - 55, 150, 110, C.aqua);
    g.drawImage(tiles[1], x - 72, y - 52, 144, 104);
  }
}

export function copies(g, c) {
  const copy = phraseProgress(c, 1, 'Copy the pixels to B', 'in both stores');
  const lost = phraseProgress(c, 2, 'Suppose A loses its copy') === 1;
  const showRetries = phraseProgress(c, 2, 'The decode has no retries left') === 1;
  const fetch = phraseProgress(c, 3, 'Fetch the copy from B', 'A receives the pixels again');
  const noReplay = phraseProgress(c, 3, 'No task ran a second time') === 1;
  const allLost = !!cue(c, 4, 'Remove both copies');
  const canReplay =
    phraseProgress(c, 4, 'Ray can replay the decode if its lineage and source scan are available') === 1;
  const put = !!cue(c, 4, 'every copy of that input is gone');
  const newRun = c.beat.beatIndex >= 4;
  const verdict = phraseProgress(c, 5, 'There is none') === 1;
  const retries = Number(phraseProgress(c, 4, 'Allow one retry and keep the owner alive') === 1);
  const { stores, decodeRuns, recovery } = eastCopies({ copy, lost, fetch, allLost, put, retries });
  header(
    g,
    'Object store   /   Completed east tile',
    allLost ? 'If every copy is lost, what can replay?' : 'Where are the east pixels?',
  );
  rect(g, 109, 293, 1702, 94, C.paper);
  label(g, 'Driver owns east metadata', 150, 354, 42, C.ink, mono);
  label(g, 'Decode runs: ' + decodeRuns, 1298, 354, 42, C.ink, mono, 'right');
  if (showRetries) {
    label(
      g,
      retries + (retries === 1 ? ' retry left' : ' retries left'),
      1768,
      354,
      42,
      C.ink,
      mono,
      'right',
    );
  }
  const xs = [213, 1183],
    w = 524,
    h = 354;
  for (let i = 0; i < 2; i++) {
    const x = xs[i];
    label(g, ['A   /   producer node', 'B   /   consumer node'][i], x, 463, 41, C.white);
    rect(g, x, 493, w, h, C.faint);
    outline(g, x, 493, w, h);
    if (stores[i]) g.drawImage(tiles[1], x, 493, w, h);
    else {
      const receiving = !allLost && (i === 0 ? fetch > 0 : copy > 0);
      center(
        g,
        receiving ? 'Receiving east' : allLost || i === 0 ? 'Copy lost' : 'Awaiting east',
        x + w / 2,
        694,
        43,
        receiving ? C.aqua : C.muted,
      );
    }
  }
  const left = xs[0] + w + 24;
  const right = xs[1] - 24;
  if (copy > 0 && !lost) transferTile(g, left, right, copy, 'Copy A to B');
  if (fetch > 0 && !newRun) transferTile(g, right, left, fetch, 'Fetch B to A');
  if (allLost) {
    center(g, 'Input', 960, 604, 39, C.muted);
    center(g, put ? 'lost put' : 'available', 960, 677, 39, put ? C.lost : C.aqua, mono);
  }
  const msg = allLost
    ? put
      ? verdict
        ? 'Lost ray.put input   /   ' + recovery.status
        : 'Lost ray.put input   /   which task could regenerate it?'
      : 'Source scan + lineage + ' +
        retries +
        ' retry' +
        (canReplay && recovery.usable ? '   /   decode can replay' : '')
    : newRun
      ? 'New loss experiment    /    start with both copies'
      : fetch === 1
        ? 'A has the tile again' +
          (noReplay ? '    /    the decode count stayed at ' + decodeRuns : '')
        : fetch > 0
          ? 'B keeps its copy while A receives the same pixels'
          : lost
            ? 'A lost its copy. B has the pixels. Must the task run again?'
            : copy === 1
              ? 'Two stored copies    ·    one owner'
              : copy > 0
                ? 'Transferring the tile to node B'
                : 'A worker computed the tile. The driver owns its handle.';
  foot(g, msg, put ? C.lost : C.muted);
}

export function checkResults() {
  checkStorm();
  const waiting = decodeState(74, 120, true);
  assert.deepEqual(waiting.waiting, ['west']);
  assert.equal(waiting.runnable, false);
  assert.equal(decodeState(120, 120, true).runnable, true);
  assert.equal(decodeState(74, 120, false).submitted, false);
  assert.equal(scheduleStats(serial, 9).finish, 9);
  assert.deepEqual(scheduleStats(parallel, 2).lengths, [2, 2, 0]);
  assert.deepEqual([scheduleStats(parallel, 5).total, scheduleStats(parallel, 5).finish], [9, 5]);
  assert.deepEqual(values, [
    [5, 96],
    [6, 67],
    [5, 22],
  ]);
  assert.deepEqual(argumentsFor(['A', ['B']], stored), [[5, 96], ['B']]);
  assert.deepEqual(argumentsFor(refs, stored), values);
  const loss = { copy: 1, lost: true, allLost: false, put: false, retries: 0 };
  for (const fetch of [0, 0.5, 1]) {
    const state = eastCopies({ ...loss, fetch });
    assert.deepEqual(state.stores, [fetch === 1, true]);
    assert.equal(state.decodeRuns, 1);
    assert.equal(state.recovery.status, 'fetch surviving copy');
  }
  const bothLost = { ...loss, fetch: 1, allLost: true, retries: 1 };
  assert.equal(eastCopies(bothLost).recovery.status, 'replay generating task');
  assert.equal(eastCopies({ ...bothLost, put: true }).recovery.status, 'payload unavailable');
  assert.equal(
    rayObjectLoss({ ownerAlive: true, copies: 1, lineage: false, retries: 0 }).usable,
    true,
  );
  assert.equal(rayObjectLoss({ ownerAlive: true, copies: 0, lineage: false }).usable, false);
}
