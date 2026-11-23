import { CHAIN } from '../../../films/speculative-decoding/fixtures.mjs';
import {
  decomposition,
  deliverUntilStop,
  prefixStates,
  sampleProposal,
} from '../../../films/speculative-decoding/arithmetic.mjs';
import { verifyChain } from '../../../films/speculative-decoding/model.mjs';
import { C, arrow, bracket, cue, fade, fmt, line, note, page, rect, slug, text } from './press.mjs';

export const proposed = CHAIN.map((row) => row.words[row.candidate]);
export const rejected = verifyChain();
export const allPass = verifyChain([0.2, 0.2, 0.1]);
const row = CHAIN[1];
export const fresh = {
  words: ['softly', 'nearby', 'today'],
  p: [0.25, 0.15, 0.6],
  q: [0.35, 0.45, 0.2],
  candidate: 0,
  uniform: 0.8,
};
const maxPracticeShare = Math.max(...row.p, ...row.q, ...fresh.p, ...fresh.q);
export function outcome(r) {
  const d = decomposition(r.p, r.q);
  const alpha = d.acceptance[r.candidate];
  return { d, alpha, keep: r.uniform < alpha, replacement: r.words[sampleProposal(d.residual, 0.5)] };
}
const originalCut = outcome(row),
  newCut = outcome(fresh);
export const history = { stale: prefixStates([2, 3], 8), corrected: prefixStates([3], 8) };
const words = ['The', 'bird', ...proposed];
const centers = [220, 529, 838, 1180, 1530];
function word(g, w, i, y, kind = 'ink', opacity = 1) {
  fade(g, opacity, () =>
    text(g, w, centers[i], y, 90, kind === 'draft' ? C.pencil : C.ink, 'Serif', 'center'),
  );
}
function paperLine(g, y) {
  rect(g, 94, y - 133, 1730, 189, '#dcd4c3');
  rect(g, 88, y - 140, 1730, 189, C.white);
  line(g, 114, y + 12, 1792, y + 12, '#d7d1c4', 2);
}
function sentence(g, printed, draft = [], y = 430) {
  paperLine(g, y);
  printed.forEach((w, i) => word(g, w, i, y));
  draft.forEach((w, i) => word(g, w, i + printed.length, y, 'draft'));
}
export function opening(g, c) {
  const partial = cue(c, 2, 'Ink sang');
  const lifted = cue(c, 2, 'Lift the other two', 0.42);
  page(g, 'THE READER’S LINE', 'How far can the ink go?');
  const y = 438;
  paperLine(g, y);
  words.slice(0, 2).forEach((w, i) => word(g, w, i, y));
  const reveals = ['Sang', 'softly', 'today'].map((word) => cue(c, 0, word, 0.28));
  proposed.forEach((w, i) => {
    const appeared = reveals[i];
    const erased = i > 0 ? lifted : 0;
    word(g, w, i + 2, y + erased * 19, partial && i === 0 ? 'ink' : 'draft', appeared * (1 - erased));
  });
  const end = partial ? 2 : 1;
  bracket(g, centers[0] - 97, centers[end] + 98, 542, 'Committed', C.keep);
  if (lifted < 1)
    fade(g, (1 - lifted) * cue(c, 0, 'Sang', 0.25), () => {
      const last = 2 + reveals.filter((v) => v > 0).length - 1;
      bracket(g, centers[end + 1] - 104, centers[last] + 108, 542, 'Proposed', C.draft);
    });
  if (cue(c, 1, 'Suppose sang passes') && !partial) {
    text(g, 'Suppose sang passes and softly fails.', 960, 733, 57, C.ink, 'Serif', 'center');
  } else if (lifted === 1) {
    line(g, centers[3] - 94, 463, centers[3] + 100, 463, C.repair, 5, [12, 7]);
    text(g, 'Draw for the prefix “The bird sang”.', 960, 733, 57, C.repair, 'Serif', 'center');
  }
}
export function chain(g, c) {
  const b = c.beat.beatIndex,
    accepted = cue(c, 1, 'every proposed sang survives');
  const focus = cue(c, 2, 'Read after sang'),
    failed = cue(c, 2, 'rejects softly'),
    skipped = cue(c, 2, 'Skip the row');
  page(g, 'VERIFICATION  /  one causal target pass', 'Which input produced this score?');
  const xs = [320, 732, 1145, 1558],
    inputs = ['bird', ...proposed],
    outputs = [...proposed, 'bonus row'];
  text(g, 'Inputs', 66, 370, 31, C.quiet);
  text(g, 'Scores', 66, 591, 31, C.quiet);
  xs.forEach((x, i) => {
    slug(g, x - 130, 302, 260, 90, i ? C.violet : C.green);
    text(g, inputs[i], x, 370, 61, C.ink, 'Serif', 'center');
    if (!cue(c, 0, 'Every output row')) return;
    const active = (i === 0 && !focus) || (i === 1 && focus);
    arrow(g, x, 422, x, 495, active ? C.keep : C.rule);
    const color = i > 1 && skipped ? C.quiet : active ? C.keep : C.ink;
    text(g, outputs[i], x, 595, 56, color, 'Serif', 'center');
    if (i >= 2 && skipped) {
      const half = g.measureText(outputs[i]).width / 2 + 7;
      line(g, x - half, 573, x + half, 573, C.red, 4);
    }
  });
  if (b > 0 && !focus)
    text(
      g,
      'sang   p ' +
        fmt(CHAIN[0].p[0]) +
        '   /   q ' +
        fmt(CHAIN[0].q[0]) +
        (accepted ? '     •     keep' : ''),
      320,
      758,
      48,
      C.keep,
    );
  if (focus)
    text(
      g,
      'softly   p ' +
        fmt(row.p[0]) +
        '   /   q ' +
        fmt(row.q[0]) +
        (cue(c, 2, 'Half survive') ? '     •     α ' + fmt(originalCut.alpha) : '') +
        (failed ? '     •     draw ' + fmt(row.uniform) : ''),
      320,
      758,
      46,
      failed ? C.red : C.ink,
    );
  note(
    g,
    skipped
      ? 'The row after softly belongs to a discarded prefix.'
      : failed
        ? 'Reject softly. Later rows depend on that choice.'
        : accepted
          ? focus
            ? 'This row scores softly given “The bird sang”.'
            : 'Which input supplies the next test?'
          : 'Cached prefix  “The”     •     first verification input  “bird”',
  );
}
const plateWidths = [0.65, 0.82, 0.44, 0.73, 0.58, 0.92, 0.68, 0.51];
function plates(g, i, w, tentative = false) {
  const x = centers[i] - 107;
  [614, 729].forEach((y, j) => {
    const face = tentative ? C.violet : j ? '#a8c7b5' : '#a6cace';
    slug(g, x, y, 210, 55, face, tentative ? '#ac95b4' : '#84a69a');
    const offset = w.length + w.charCodeAt(0) + j * 3;
    for (let k = 0; k < 8; k++) {
      const h = plateWidths[(offset + k) % 8] * 35;
      rect(g, x + 12 + 24 * k, y + 43 - h, 12, h, tentative ? C.draft : C.keep);
    }
  });
}
function wells(g, i) {
  for (const y of [613, 728]) {
    rect(g, centers[i] - 107, y, 210, 55, '#ebe4d7');
    line(g, centers[i] - 106, y + 55, centers[i] + 103, y + 55, C.rule, 2, [8, 7]);
  }
}
export function cacheState(c) {
  const trim = cue(c, 0, 'Clear the rejected suffix');
  const committed = cue(c, 1, 'Commit nearby');
  const ready = cue(c, 2, 'Its key and value now exist');
  const kept = ['The', 'bird', ...rejected.accepted];
  return {
    printed: committed ? [...kept, rejected.correction] : kept,
    state: ready ? [...kept, rejected.correction] : trim ? kept : words,
    provisional: trim ? [] : rejected.discarded,
    pending: committed && !ready,
    ready,
  };
}
export function cache(g, c) {
  const s = cacheState(c);
  page(g, 'TARGET STATE  /  the rejected path', 'Where does the cache end?');
  sentence(g, s.printed, [], 402);
  text(g, 'Keys', 96, 583, 32, C.quiet);
  text(g, 'Values', 96, 702, 32, C.quiet);
  centers.forEach((x, i) => {
    wells(g, i);
    if (i < s.state.length) plates(g, i, s.state[i], s.provisional.includes(s.state[i]));
    if (i >= 3 && i < s.state.length)
      text(g, s.state[i], x, 550, 33, s.ready ? C.keep : C.draft, 'Serif', 'center');
  });
  if (s.pending) {
    arrow(g, centers[3], 461, centers[3], 587, C.repair);
    text(g, 'Pending key and value', centers[3] + 48, 553, 32, C.repair);
    const i = row.words.indexOf(rejected.correction);
    if (cue(c, 1, 'target share exceeds'))
      text(g, 'p ' + fmt(row.p[i]) + '     q ' + fmt(row.q[i]), centers[3] + 48, 503, 32, C.ink, 'Mono');
  }
  note(
    g,
    s.ready
      ? 'The next word can use state through nearby.'
      : s.pending
        ? 'Visible text and computed state have different right edges.'
        : s.provisional.length
          ? 'Violet entries were computed on the proposed path.'
          : 'Retained keys and values end at sang.',
  );
}
export const stopBlock = ['sang', 'EOS', 'today'];
export const stopped = deliverUntilStop(stopBlock);
export function stopping(g, c) {
  const b = c.beat.beatIndex;
  if (b === 0) {
    page(g, 'ALTERNATE ROUND  /  acceptance draw for softly = 0.20', 'Where does a bonus come from?');
    const pass = cue(c, 0, 'All three guesses now pass');
    sentence(g, pass ? words : words.slice(0, 3), pass ? [] : proposed.slice(1), 411);
    const bonus = cue(c, 0, 'it is an end token');
    if (pass) {
      arrow(g, centers[4], 479, centers[4], 564, C.keep);
      text(g, 'Target row after today', centers[4], 636, 39, C.keep, 'Sans', 'center');
    }
    if (bonus) text(g, 'Sampled  ' + allPass.bonus, centers[4], 742, 52, C.repair, 'Serif', 'center');
    note(
      g,
      bonus
        ? 'The end token is pending. Its row was produced by today.'
        : 'An accepted proposal advances the prefix by one word.',
    );
    return;
  }
  const ends = cue(c, 2, 'Stop at the end token');
  const output = cue(c, 2, 'Deliver sang') ? stopped.delivered : [];
  page(g, 'DELIVERY  /  hide the end token', 'What reaches the reader?');
  stopBlock.forEach((w, i) => {
    const x = 372 + 510 * i;
    slug(g, x - 160, 325, 320, 112, ends && i > 0 ? C.bed : C.violet);
    text(g, w, x, 410, 70, C.ink, 'Serif', 'center');
    if (ends && i === 1) line(g, x + 190, 296, x + 190, 676, C.red, 6);
  });
  text(g, 'Reader', 113, 629, 37, C.quiet);
  output.forEach((w, i) => text(g, w, 372 + i * 510, 643, 74, C.keep, 'Serif', 'center'));
  note(
    g,
    ends
      ? 'The first stopping event closes delivery for this sequence.'
      : 'Inspect the verified tokens in order.',
  );
}
function miniTable(g, r, withGap) {
  const d = decomposition(r.p, r.q);
  text(g, 'After sang', 106, 380, 42, C.quiet, 'Serif');
  const xs = [680, 1110, 1550];
  const barWidth = 150;
  ['Target   p', 'Draft   q', ...(withGap ? ['Gap   (p − q)₊'] : [])].forEach((s, j) =>
    text(g, s, 116, 485 + j * 99, 40, C.quiet),
  );
  r.words.forEach((w, i) => {
    text(g, w, xs[i], 385, 55, C.ink, 'Serif', 'center');
    [r.p[i], r.q[i], ...(withGap ? [d.deficit[i]] : [])].forEach((v, j) => {
      const y = 485 + j * 99,
        col = j === 0 ? C.keep : j === 1 ? C.draft : C.repair;
      const fill = [C.green, C.violet, C.gold][j];
      rect(g, xs[i] - 134, y - 37, (barWidth * v) / maxPracticeShare, 36, fill);
      text(g, fmt(v), xs[i] + 138, y, 42, col, 'Mono', 'right');
    });
  });
}
export function practice(g, c) {
  const b = c.beat.beatIndex;
  if (b < 4) {
    const changed = b >= 2,
      r = changed ? fresh : row,
      a = changed ? newCut : originalCut;
    const answered = changed ? cue(c, 3, 'Reject softly') : cue(c, 1, 'Reject softly');
    const ratio = changed ? cue(c, 3, 'five sevenths') : cue(c, 1, 'one half');
    const gaps = changed ? cue(c, 3, 'Only today has a shortfall') : cue(c, 1, 'Nearby is short');
    const corrected = changed ? cue(c, 3, 'commit today') : cue(c, 1, 'Commit nearby');
    page(
      g,
      changed ? 'FRESH ROUND  /  new probabilities' : 'REPLAY  /  original probabilities',
      'Which word follows sang?',
    );
    miniTable(g, r, gaps);
    const y = 780;
    text(g, 'The bird sang', 114, y, 67, C.ink, 'Serif');
    if (corrected) text(g, a.replacement, 601, y, 67, C.repair, 'Serif');
    else if (!answered) text(g, 'softly    today', 601, y, 67, C.pencil, 'Serif');
    else line(g, 605, y + 5, 822, y + 5, C.repair, 4, [9, 7]);
    text(
      g,
      'u = ' + fmt(r.uniform) + (ratio ? '     α = ' + (changed ? '5/7' : fmt(a.alpha)) : ''),
      1300,
      y,
      39,
      C.draft,
      'Mono',
    );
    note(
      g,
      corrected
        ? changed
          ? 'The discarded today was computed after softly. Roll back to sang.'
          : 'Keep the cache through sang while nearby is pending.'
        : 'Use the acceptance draw, then find any positive target shortfall.',
    );
    return;
  }
  page(g, 'TOY CACHE  /  append one digit per token', 'Can the old today serve this prefix?');
  const { stale, corrected } = history;
  const showOld = cue(c, 4, 'gave eight hundred twenty three');
  const next = cue(c, 4, 'That makes eighty three');
  const rootX = 370,
    midX = 870,
    endX = 1430;
  text(g, 'sang', rootX, 551, 68, C.ink, 'Serif', 'center');
  text(g, stale[0], rootX, 632, 67, C.keep, 'Mono', 'center');
  line(g, rootX + 127, 545, midX - 136, 369, C.draft, 4);
  line(g, midX + 125, 369, endX - 157, 369, C.draft, 4);
  text(g, 'softly', midX, 365, 65, C.draft, 'Serif', 'center');
  text(g, 'today', endX, 365, 65, C.draft, 'Serif', 'center');
  if (showOld) {
    text(g, stale[1], midX, 444, 58, C.draft, 'Mono', 'center');
    text(g, stale[2], endX, 444, 58, C.draft, 'Mono', 'center');
  }
  line(g, rootX + 123, 610, endX - 150, 698, C.keep, 5);
  text(g, 'today', endX, 704, 70, C.ink, 'Serif', 'center');
  if (next) text(g, corrected.at(-1), endX, 785, 62, C.keep, 'Mono', 'center');
  note(
    g,
    next
      ? 'Next word uses ' + corrected.at(-1) + '     •     “The bird sang today”'
      : 'The word is the same. Trace its preceding history.',
  );
}
