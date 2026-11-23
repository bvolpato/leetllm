import { CAPACITY_ROUTES, MOE_FRESH_ROUTES } from '../../../films/moe/fixtures.mjs';
import { queueExample, overflowReroute } from '../../../films/moe/construction.mjs';
import {
  C,
  fmt,
  vec,
  expert,
  cue,
  ease,
  mix,
  type,
  mono,
  rule,
  box,
  dot,
  arrow,
  path,
  board,
  foot,
  tag,
  gridPlot,
} from './bench.mjs';

export const fixed = queueExample(CAPACITY_ROUTES, 4, [0.6, 0.4]);
export const full = queueExample(CAPACITY_ROUTES, 4, [0.6, 0.4], 1, true);
export const redirected = queueExample(overflowReroute(1).routes, 4, [0.6, 0.4]);
export const fresh = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75]);
export const wide = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], 1.5);
const xRow = 108,
  pitch = 49,
  yRow = 199,
  step = 53;
function channels(
  c,
  m,
  { arrivals = m.tokens, slots = m.slots, edge = slots, marked = false, limit = true, entry = 1 } = {},
) {
  board(c, 39, 105, 536, 307);
  type(c, 'Expert input queues', 62, 141, 21, C.chalk);
  type(c, 'Arrival order →', 550, 141, 16, C.faint, 'right');
  const edgeX = xRow + edge * pitch - 4;
  if (limit) rule(c, edgeX, 168, edgeX, 380, C.brass, 2);
  m.groups.forEach((group, e) => {
    const y = yRow + e * step;
    mono(c, expert(e), 59, y, 19, C.chalk);
    const seats = limit ? Math.floor(edge) : group.length;
    for (let i = 0; i < seats; i++) box(c, xRow + i * pitch, y - 17, 42, 34, '#1a2b29', C.seam, 4);
    group.forEach((t, i) => {
      if (t >= arrivals) return;
      const skip = limit && marked && i >= seats,
        follow = t === m.token;
      const fill = follow ? C.brass : skip ? '#533b34' : '#c3cfc0';
      const target = xRow + i * pitch;
      const x = follow ? target + (505 - target) * (1 - ease(entry)) : target;
      box(c, x, y - 13, 42, 26, fill, skip && !follow ? '#d49b83' : null, 3);
      mono(c, 't' + t, x + 21, y, 16, skip && !follow ? '#ffe1bb' : C.ink, 'center');
      if (skip) rule(c, x + 4, y + 10, x + 36, y + 10, follow ? C.red : '#f6aa82', 2);
    });
  });
  if (limit && edge === slots) mono(c, slots + ' slots', edgeX, 394, 15, C.brass, 'center');
  if (!limit) {
    type(c, 'Rows follow actual demand', 64, 394, 16, C.ice);
  }
}
function traceOutput(c, m, showMask, result, afterResidual = false) {
  const token = 't' + m.token;
  type(c, 'Return to ' + token, 607, 127, 22, C.ink);
  m.terms.forEach((term, i) => {
    const y = 187 + i * 53,
      enabled = term.runs;
    const resolved = Array.isArray(showMask) ? showMask[i] : showMask;
    const color = resolved ? (enabled ? C.teal : C.red) : C.mid;
    mono(c, expert(term.expert), 608, y, 19, color);
    mono(c, fmt(term.gate) + ' × ' + vec(term.vector), 663, y, 17, C.ink);
    if (resolved) mono(c, enabled ? 'run' : 'skip', 913, y, 16, color, 'right');
  });
  rule(c, 605, 275, 919, 275);
  mono(c, 'Δ = ' + (result ? vec(m.output) : '?'), 608, 306, 23, result ? C.teal : C.ink);
  if (afterResidual) {
    const residualY = 377,
      x = 815;
    tag(c, 'h(' + token + ')', 607, residualY - 16, 82);
    arrow(c, 690, residualY, x - 15, residualY, C.mid, 2);
    path(
      c,
      [
        [780, 317],
        [x, 317],
        [x, residualY - 15],
      ],
      C.teal,
      2,
    );
    dot(c, x, residualY, 15, C.board);
    mono(c, '+', x, residualY, 20, C.chalk, 'center');
    arrow(c, x + 16, residualY, 914, residualY, C.mid, 2);
    type(c, 'next layer', 875, 402, 15, C.mid, 'center');
  }
}
export function capacity(c, k) {
  const entered = cue(k, 1, 'Follow t four', 0.95),
    fifth = cue(k, 2, 'Stop the fifth arrival', 0.2);
  const result = cue(k, 2, 'Add this update', 0),
    residual = cue(k, 2, 'The whole token continues', 0);
  const rest = cue(k, 3, 'Finish counting', 1.0);
  const arrivals = rest ? 5 + Math.floor(3 * rest) : entered ? 5 : 4;
  channels(c, fixed, { arrivals, marked: fifth > 0, entry: entered });
  const second = cue(k, 2, 'Expert three accepts', 0);
  traceOutput(c, fixed, [fifth, second], result, residual);
  foot(
    c,
    rest === 1
      ? '16 assignments  ·  loads 8, 3, 3, 2  ·  4 skipped contributions, all at E1'
      : second
        ? 'The E1 route stops at its fifth arrival. The second arrival at E3 fits.'
        : fifth
          ? 'The E1 route stops at its fifth arrival. Follow the other copy of t4.'
          : 'Capacity = ceil(8 tokens × 2 routes ÷ 4 experts × factor 1) = 4 per expert.',
  );
}
export function replay(c, k) {
  const all = cue(k, 1, 'Run every assignment', 0),
    restore = cue(k, 1, 'restores the', 1);
  const reset = cue(k, 2, 'Return to the four-slot buffers', 0);
  const reroute = cue(k, 2, 'Try rerouting', 0),
    known = cue(k, 3, 'The horizontal step', 0.9);
  const m = reroute ? redirected : reset ? fixed : all ? full : fixed;
  channels(c, m, { marked: true, limit: m !== full });
  type(c, 'Routed update for t4', 598, 126, 21);
  const ox = 642,
    oy = 340,
    scale = 70;
  gridPlot(c, ox, oy, scale, 3.4, 2.1);
  const h = m.output[1],
    v = oy - scale * h;
  arrow(c, ox, oy, ox, v, C.rust, 4, 9);
  const horizontal = reroute
    ? redirected.output[0] * ease(known)
    : m === full
      ? full.output[0] * ease(restore)
      : 0;
  if (horizontal) arrow(c, ox, v, ox + horizontal * scale, v, C.teal, 4, 10);
  dot(c, ox + horizontal * scale, v, 4, C.ink);
  const readout =
    reroute && !known
      ? 'E4 step = ?'
      : m === full && !restore
        ? 'E3 first: ' + vec([0, h])
        : vec([horizontal, h]);
  mono(c, readout, 641, 389, 21, C.ink);
  foot(
    c,
    m === fixed
      ? 'Fixed buffers  ·  retained gates  ·  E3 alone returned [0, 1.2].'
      : reroute
        ? 'Fixed buffers  ·  only t4 reroutes from E1 to E4  ·  E4 returns [5, 0], gate 0.6.'
        : 'Dropless execution  ·  identical selections and gates  ·  E1 now runs eight rows.',
  );
}
export function practice(c, k) {
  const resolved = cue(k, 1, 'Only the vertical update', 0);
  const rise = ease(cue(k, 1, 'That gives', 0.65));
  const firstAnswer = cue(k, 1, 'Across the batch', 0);
  const ask = cue(k, 2, 'Raise only', 0);
  const expansion = ease(cue(k, 3, 'Five slots fit', 0.85));
  const edge = mix(fresh.slots, wide.slots, expansion);
  const fits = (term) => term.slot <= edge;
  const restore = ease(cue(k, 3, 'Restore one quarter', 0.7));
  const extend = fits(fresh.terms[0]) ? Math.min(expansion, restore) : 0;
  const finalAnswer = cue(k, 3, 'before the residual addition', 0) && extend === 1;
  channels(c, fresh, { slots: expansion ? wide.slots : fresh.slots, edge, marked: !!resolved });

  type(c, 'Routed update for t' + fresh.token, 606, 123, 22);
  fresh.terms.forEach((term, i) => {
    const y = 154 + i * 26;
    const runs = fits(term);
    const color = resolved ? (runs ? (i ? C.rust : C.teal) : C.red) : C.ink;
    mono(c, expert(term.expert) + '  ' + fmt(term.gate) + ' × ' + vec(term.vector), 606, y, 19, color);
    if (resolved) mono(c, runs ? 'fits' : 'skip', 914, y, 17, color, 'right');
  });

  const x = 668,
    y = 393,
    unit = 72;
  gridPlot(c, x, y, unit, 3.15, 2.55);
  const top = y - unit * fresh.output[1] * rise;
  const right = x + unit * (wide.output[0] - fresh.output[0]) * extend;
  if (rise) arrow(c, x, y, x, top, C.rust, 4, 10);
  if (extend) arrow(c, x, top, right, top, C.teal, 4, 10);
  if (rise === 1) dot(c, x, top, 4, C.rust);
  dot(c, right, top, 4, C.ink);
  if (finalAnswer) {
    mono(c, wide.slots + ' slots  ·  Δ = ' + vec(wide.output), 606, 429, 21, C.teal);
  } else if (firstAnswer && rise === 1) {
    mono(c, fresh.slots + ' slots  ·  Δ = ' + vec(fresh.output), 606, 429, 21, C.rust);
  } else {
    mono(c, 'Δ = ?', 606, 429, 21, C.ink);
  }

  const { assignments, experts, factor } = ask ? wide : fresh;
  const calculation = 'ceil(' + assignments + ' ÷ ' + experts + ' × ' + factor + ')';
  foot(
    c,
    expansion === 1
      ? 'Capacity = ' +
        calculation +
        ' = ' +
        wide.slots +
        ' slots. All ' +
        assignments +
        ' assignments fit.'
      : ask
        ? 'Proposed capacity = ' + calculation + '. The queue order and gates stay fixed.'
        : 'Capacity = ' + calculation + '. Surviving routes keep their selected gates.',
  );
}
