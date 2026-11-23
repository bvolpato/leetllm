import assert from 'node:assert/strict';
import { schedule, useful, serialCompletion } from '../../../films/continuous-batching/model.mjs';
import {
  color as c,
  text,
  center,
  box,
  line,
  label,
  base,
  plate,
  flap,
  cell,
  cue,
  heading,
  note,
} from './art.mjs';

const names = { A: 'RIO', B: 'PARIS', C: 'CHICAGO', D: 'LONDON', E: 'SEOUL' };
const fixed = schedule(false),
  refill = schedule(true);
const seats = 3;
const cityInk = { A: c.white, B: c.white, C: c.white, D: c.amber, E: c.mint };

function after(trace, n) {
  const prefixes = Object.fromEntries(Object.keys(names).map((id) => [id, names[id][0]]));
  for (const pass of trace.slice(0, n))
    for (const token of pass.slots.filter(Boolean)) {
      prefixes[token.id] += names[token.id][token.generated];
    }
  return prefixes;
}

export function departures(g, k) {
  const passes = 1 + cue(k, 0, 'Rio finishes here') + cue(k, 2, 'Pass three writes');
  const written = after(refill, passes);
  base(g, 'Live departures  /  three decode seats', 'When can London write its next letter?', true);
  heading(g, 'REQUEST', 'COMPLETED PASS  ' + passes, 281, true);
  plate(g, 77, 329, 1766, 527);
  for (const [i, id] of ['A', 'B', 'C', 'D'].entries()) {
    const y = 355 + i * 120;
    label(g, 'REQUEST ' + id, 123, y + 46, c.mint);
    const status =
      id === 'A' && passes >= 2 ? 'complete' : id === 'D' && passes < 3 ? 'ready' : 'writing';
    text(g, status, 430, y + 45, 34, status === 'ready' ? c.amber : c.white);
    const letters = written[id];
    for (let j = 0; j < names[id].length; j++)
      flap(g, letters[j], 690 + j * 110, y, 100, 88, j === 0 ? '#b0c2b6' : cityInk[id]);
    if (status === 'writing' && letters.length < names[id].length)
      box(g, 704 + letters.length * 110, y + 69, 69, 6, c.mint, 3);
  }
  note(
    g,
    passes === 1
      ? 'One letter per token in this replay.'
      : passes === 2
        ? 'Three writes landed. London has L from prefill.'
        : 'The new O shares pass 3 with I and C.',
    c.amber,
    true,
  );
}

export function tokenHistory(g, k) {
  const prefilled = cue(k, 0, 'creates attention key and value state');
  const sampled = cue(k, 0, 'sample C');
  const consumed = cue(k, 1, 'consumes C');
  const predicted = cue(k, 1, 'predict H');
  base(g, 'Request C  /  decode close-up', 'What goes into the cache?');
  label(g, 'PROMPT', 94, 319);
  text(g, 'Windy City?', 94, 405, 72, c.ink, { font: 'Lesson Serif' });
  label(g, 'PROCESSED POSITIONS  /  KV CACHE', 766, 319);
  const prefix = ['Windy', 'City', '?'];
  [...prefix, 'C'].forEach((s, i) =>
    cell(
      g,
      (i < 3 ? prefilled : consumed) ? s : null,
      767 + i * 239,
      361,
      215,
      97,
      (i < 3 ? prefilled : consumed) ? c.board : '#d9dbcf',
    ),
  );
  line(g, 95, 533, 1820, 533);
  label(g, 'ACCEPTED REPLY', 96, 606);
  if (sampled) flap(g, 'C', 766, 568, 118, 118, c.amber);
  if (predicted) flap(g, 'H', 900, 568, 118, 118, c.mint);
  if (sampled)
    text(
      g,
      predicted
        ? 'H waits for the next decode pass'
        : consumed
          ? 'C is cached. The model can now sample a successor.'
          : 'C is ready as the next input',
      766,
      750,
      40,
    );
  note(
    g,
    k.beat.beatIndex === 2
      ? 'One active request can take one ordinary decode turn per pass.'
      : 'Prefill can supply the first output token.',
  );
}

function marks(
  g,
  trace,
  n,
  cols,
  { x = 395, y = 384, dx = 205, dy = 113, w = 180, h = 88, numbers = true } = {},
) {
  const seen = trace.slice(0, n);
  for (let j = 0; j < cols; j++) {
    if (numbers)
      center(g, j + 1, x + j * dx + w / 2, y - 42, 31, c.muted, { font: 'Lesson Mono' });
    for (let i = 0; i < seats; i++) {
      const token = seen[j]?.slots[i];
      if (token)
        flap(g, names[token.id][token.generated], x + j * dx, y + i * dy, w, h, cityInk[token.id]);
      else {
        box(g, x + j * dx, y + i * dy, w, h, j < n ? '#e4d7c6' : '#ebe4d8', 6);
        if (j < n)
          line(
            g,
            x + j * dx + w * 0.31,
            y + i * dy + h / 2,
            x + j * dx + w * 0.69,
            y + i * dy + h / 2,
            '#a69379',
            4,
          );
      }
    }
  }
}
function grid(g, trace, n, title, footer) {
  base(g, 'Dispatch record  /  completed decode iterations', title);
  heading(g, 'SEAT  /  FIRST TOKEN FROM PREFILL', 'DECODE PASS →');
  ['1     R', '2     P', '3     C'].forEach((s, i) =>
    text(g, s, 104, 432 + i * 113, 47, c.ink, { font: 'Lesson Mono' }),
  );
  marks(g, trace, n, 6, { dx: 234, w: 208 });
  label(g, 'GENERATED LETTERS', 104, 793);
  text(
    g,
    `${useful(trace.slice(0, n))}   /   ${seats * n} seat-steps elapsed`,
    501,
    790,
    49,
    c.ink,
    { font: 'Lesson Serif' },
  );
  note(g, footer);
}
export function fixedBoard(g, k) {
  const n =
    2 +
    cue(k, 1, 'Only Paris') +
    cue(k, 1, 'finishes on four') +
    cue(k, 1, 'on five') +
    cue(k, 1, 'and six');
  grid(
    g,
    fixed,
    n,
    'Who writes under a fixed batch?',
    cue(k, 2, 'Six places went unused')
      ? '6 idle places   ·   12 / 18 occupied   ·   66.7% seat occupancy'
      : n === 2
        ? 'Rio has finished. London is ready with L.'
        : 'A dash marks a reserved turn that produced no letter.',
  );
}
const comparisonPasses = 6;
const refilledSeats = refill.slice(0, comparisonPasses).flatMap(({ slots }, pass) =>
  slots.flatMap((token, seat) =>
    token && !fixed[pass].slots[seat] ? [{ pass, seat, id: token.id }] : [],
  ),
);
const replacementCount = (id) => refilledSeats.filter((mark) => mark.id === id).length;

function spokenProgress(k, beat, phrase, captionStart = phrase) {
  if (k.beat.beatIndex < beat) return 0;
  if (k.beat.beatIndex > beat) return 1;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart });
}

export function refillBoard(g, k) {
  const settled = (beat, phrase, captionStart) => spokenProgress(k, beat, phrase, captionStart) === 1;
  const sharedPasses =
    2 +
    Number(settled(1, 'The O goes on three')) +
    Number(settled(1, 'Paris finishes on four')) +
    Number(settled(1, 'E on five', 'Seoul gets its')) +
    Number(settled(1, 'Count through six with both replacements'));
  const london = settled(2, 'London contributed four letters');
  const seoul = settled(2, 'and Seoul two');
  const total = settled(2, 'That’s eighteen useful letters in the same six passes');
  const extend = cue(k, 2, 'Carry the trace to the end');
  const refillPasses =
    sharedPasses +
    Number(settled(2, 'London finishes on seven')) +
    Number(settled(2, 'and Seoul on eight'));
  const fixedRun = spokenProgress(k, 2, 'London’s five steps take that group through eleven');
  const fixedPasses = settled(2, 'both wait until seven to start')
    ? comparisonPasses + 1 + Math.floor((fixed.length - comparisonPasses - 1) * fixedRun)
    : sharedPasses;
  const saved = settled(2, 'Refill saved three iterations for these five replies');

  base(
    g,
    extend ? 'Same five replies  /  full trace' : 'Same requests  /  first six passes',
    'What changes when a seat reopens?',
  );
  heading(g, 'DECODE SEATS', 'DECODE PASS →', 269);
  const layout = { x: 310, dx: 138, dy: 74, w: 118, h: 64, numbers: false };
  const column = (i) => layout.x + i * layout.dx + layout.w / 2;
  const columns = Math.max(comparisonPasses, fixedPasses, refillPasses);
  for (let i = 0; i < columns; i++) {
    center(g, i + 1, column(i), 316, 32, c.muted, { font: 'Lesson Mono' });
    line(g, column(i), 340, column(i), 847, c.rule, 2);
  }

  for (const [trace, count, tag, y] of [
    [fixed, fixedPasses, 'Fixed', 353],
    [refill, refillPasses, 'Refill', 635],
  ]) {
    text(g, tag, 91, y + 95, 49, c.ink, { font: 'Lesson Serif' });
    for (let i = 0; i < seats; i++)
      center(g, i + 1, 251, y + layout.h / 2 + i * layout.dy, 32, c.muted, { font: 'Lesson Mono' });
    for (const mark of refilledSeats) {
      if ((mark.id === 'D' && london) || (mark.id === 'E' && seoul)) {
        const x = layout.x + mark.pass * layout.dx;
        const top = y + mark.seat * layout.dy;
        box(g, x - 4, top - 4, layout.w + 8, layout.h + 8, mark.id === 'D' ? c.gold : c.teal, 10);
      }
    }
    marks(g, trace, count, columns, { ...layout, y });
    if (trace === refill && sharedPasses === 2) {
      const { pass, seat } = refilledSeats[0];
      box(g, layout.x + pass * layout.dx, y + seat * layout.dy, layout.w, layout.h, '#ebe4d8', 6, c.muted);
    }
    if (total) {
      const tokens = useful(trace.slice(0, comparisonPasses));
      text(
        g,
        `First ${comparisonPasses} passes: ${tokens} of ${seats * comparisonPasses} seat-steps used`,
        layout.x,
        y + 244,
        41,
      );
    }
    if (count === trace.length)
      center(g, `Ends at ${count}`, column(count - 1), y + 244, 35, c.ink);
  }

  let footer = 'Both schedules start with the same two passes. London is ready with L.';
  if (sharedPasses >= 3) footer = 'London takes seat 1. Paris and Chicago keep their seats.';
  if (settled(1, 'Seoul arrives after three passes'))
    footer = 'Seoul is ready with S. Refill has no open seat for pass 4.';
  if (sharedPasses === 4) footer = 'Paris has finished. Refill can use seat 2 on pass 5.';
  if (sharedPasses >= 5) footer = 'Seoul takes seat 2 after Paris finishes.';
  if (sharedPasses === comparisonPasses) footer = 'Which gaps did the replacements fill?';
  if (london) footer = `London fills ${replacementCount('D')} idle seats with letters.`;
  if (seoul) footer = `London fills ${replacementCount('D')} gaps. Seoul fills ${replacementCount('E')}.`;
  if (extend) footer = 'Follow the same seats until each schedule finishes.';
  if (saved) footer = `${fixed.length} − ${refill.length} = ${fixed.length - refill.length} passes saved. Time saved depends on pass durations.`;
  note(g, footer);
}

function canceledState(released, dereferenced, reserved) {
  return {
    privateOwners: reserved ? ['X', 'X'] : released ? [null, null] : ['U', 'V'],
    prefixOwners: dereferenced ? ['W'] : ['V', 'W'],
    deliveredV: false,
  };
}
export function safeBoundary(g, k) {
  const safe = cue(k, 1, 'At the safe boundary');
  const released = cue(k, 1, 'Release their private pages');
  const deref = cue(k, 1, 'Remove V');
  const reserved = cue(k, 2, 'Reserve the two freed pages');
  const state = canceledState(released, deref, reserved);
  base(g, 'Page ownership  /  cancellation', 'Which pages can X reuse?');
  heading(
    g,
    'PHYSICAL PAGE',
    state.prefixOwners.length === 1 ? 'W RETAINS THE PREFIX' : 'W SHARES THE PREFIX WITH V',
  );
  const owners = [...state.privateOwners, state.prefixOwners.join(' + ')];
  owners.forEach((owner, i) => {
    const x = 96 + 585 * i;
    plate(g, x, 348, 548, 285);
    label(g, 'PAGE ' + i, x + 36, 397, c.mint);
    center(g, owner ?? 'Free', x + 274, 485, 77, owner === null ? c.amber : c.white, {
      font: 'Lesson Serif',
    });
    center(g, i === 2 ? 'prefix references' : 'private page', x + 274, 570, 35, c.mint);
  });
  label(g, 'NEXT REQUEST', 99, 730);
  text(
    g,
    reserved
      ? 'X has two reserved pages'
      : released
        ? 'X needs 2 pages   ·   2 free'
        : 'X needs 2 pages   ·   0 free',
    466,
    728,
    49,
  );
  note(
    g,
    reserved
      ? 'X may launch after the seat, work and projected-state checks pass.'
      : safe
        ? 'Last accesses finished. V’s late result is suppressed.'
        : 'Pass in flight. V canceled. Ownership stays fixed until the boundary.',
  );
}

const jobs = [
  { id: 'Long', steps: 50 },
  { id: 'Quick', steps: 5 },
  { id: 'Medium', steps: 20 },
];
export function queue(g, k) {
  const arrivals = serialCompletion(jobs);
  const shortest = serialCompletion(jobs, true);
  const ready = spokenProgress(k, 0, 'In arrival order, the jobs finish at fifty, fifty-five and seventy-five') === 1;
  const moved = spokenProgress(k, 1, 'Shortest first moves the five-turn job to the front');
  const average = spokenProgress(k, 1, 'The mean completion time falls from sixty to thirty-five turns') === 1;
  const waited = spokenProgress(k, 1, 'The fifty-turn job now waits twenty-five turns just to start') === 1;
  const waiting = shortest.rows.find((job) => job.id === 'Long').start;
  const x = (t) => 260 + t * 20.55;

  base(g, 'Waiting time  /  one seat', 'Who waits longer under shortest-job-first?');
  const colors = { Long: c.board, Quick: c.gold, Medium: c.teal };
  const lengths = ['Long', 'Quick', 'Medium'];
  label(g, 'ALL ARRIVE AT TURN 0', 95, 282);
  lengths.forEach((id, i) => {
    const job = jobs.find((j) => j.id === id);
    const left = 541 + i * 389;
    box(g, left, 262, 24, 26, colors[id], 4);
    text(g, id + ' · ' + job.steps + ' turns', left + 36, 276, 33, c.ink);
  });

  function lane(name, plan, y, populated, showEnds) {
    text(g, name, 95, y - 40, 41, c.ink, { font: 'Lesson Serif' });
    box(g, x(0), y, x(75) - x(0), 92, '#e4ddcf', 6);
    if (average)
      text(g, 'Mean finish   ' + plan.mean + ' turns', 1802, y - 40, 37, c.teal, { align: 'right' });
    if (populated) for (const job of plan.rows) {
      box(g, x(job.start), y, x(job.finish) - x(job.start) - 2, 92, colors[job.id], 5);
      center(g, job.id, x((job.start + job.finish) / 2), y + 46, job.id === 'Quick' ? 28 : 40, c.white);
      if (showEnds) center(g, job.finish, x(job.finish), y + 125, 32, c.muted, { font: 'Lesson Mono' });
    }
    center(g, '0', x(0), y + 125, 32, c.muted, { font: 'Lesson Mono' });
  }
  lane('Arrival order', arrivals, 378, ready, true);
  lane('Shortest first', shortest, 592, moved === 1, waited);

  if (moved > 0 && moved < 1) {
    const from = arrivals.rows.find((job) => job.id === 'Quick');
    const to = shortest.rows[0];
    const fromX = x((from.start + from.finish) / 2);
    const toX = x((to.start + to.finish) / 2);
    const points = [[fromX, 470], [fromX, 531], [toX + 230, 531], [toX + 230, 568], [toX, 592]];
    const leg = Math.min(3, Math.floor(moved * 4));
    const p = moved * 4 - leg;
    const [a, b] = points[leg], [u, v] = points[leg + 1];
    for (let i = 0; i < points.length - 1; i++)
      line(g, ...points[i], ...points[i + 1], c.gold, 3);
    box(g, a + (u - a) * p - 10, b + (v - b) * p - 10, 20, 20, c.gold, 3);
  }

  if (waited) {
    const y = 772;
    line(g, x(0), y, x(waiting), y, c.rust, 4);
    for (const mark of [0, waiting]) line(g, x(mark), y - 10, x(mark), y + 10, c.rust, 4);
    center(g, 'Long waits ' + waiting + ' turns', x(waiting / 2), y + 41, 36, c.rust);
  }
  const takeaway = waited
    ? 'Same 75 turns of work. A better average can still increase one person’s wait.'
    : moved
      ? 'The same jobs run in a different order.'
      : 'Predict when Long, the first arrival, starts under shortest first.';
  text(g, takeaway, 95, 862, 35, c.ink);
}

export function checkDepartures() {
  assert.deepEqual(after(refill, 2), { A: 'RIO', B: 'PAR', C: 'CHI', D: 'L', E: 'S' });
  assert.deepEqual(after(refill, 3), { A: 'RIO', B: 'PARI', C: 'CHIC', D: 'LO', E: 'S' });
  assert.deepEqual(after(refill, 6), { A: 'RIO', B: 'PARIS', C: 'CHICAGO', D: 'LONDO', E: 'SEO' });
  for (const trace of [fixed, refill]) {
    assert.deepEqual(after(trace, trace.length), names);
    for (const { slots } of trace)
      assert.equal(
        new Set(slots.filter(Boolean).map((t) => t.id)).size,
        slots.filter(Boolean).length,
      );
  }
  assert.deepEqual(
    [fixed.length, refill.length, useful(fixed.slice(0, 6)), useful(refill.slice(0, 6))],
    [11, 8, 12, 18],
  );
  assert.deepEqual(
    refilledSeats.map(({ pass, seat, id }) => [pass + 1, seat + 1, id]),
    [[3, 1, 'D'], [4, 1, 'D'], [5, 1, 'D'], [5, 2, 'E'], [6, 1, 'D'], [6, 2, 'E']],
  );
  for (const [pass, { slots }] of fixed.slice(0, comparisonPasses).entries())
    for (const [seat, token] of slots.entries())
      if (token) assert.deepEqual(refill[pass].slots[seat], token);
  assert.deepEqual(canceledState(true, false, false), {
    privateOwners: [null, null],
    prefixOwners: ['V', 'W'],
    deliveredV: false,
  });
  assert.deepEqual(canceledState(true, true, false), {
    privateOwners: [null, null],
    prefixOwners: ['W'],
    deliveredV: false,
  });
  assert.deepEqual(canceledState(true, true, true), {
    privateOwners: ['X', 'X'],
    prefixOwners: ['W'],
    deliveredV: false,
  });
  assert.deepEqual([serialCompletion(jobs).mean, serialCompletion(jobs, true).mean], [60, 35]);
}
