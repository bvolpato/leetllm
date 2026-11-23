import { cueProgress } from '../arithmetic.mjs';
import { pagingContext } from '../packing.mjs';

const [deadline, instruction] = pagingContext(10).ranked;
const triggerEnd = instruction.text.indexOf(':') + 1;
const seam = [
  [0, 0], [-14, 64], [12, 118], [-7, 172], [15, 232], [-12, 292], [8, 352], [0, 424],
];

function tornPaper(ctx, api, x, y, side, color) {
  const edge = seam.map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
  const outerX = x + (side === 'left' ? -682 : 776);
  const points = [{ x: outerX, y }, ...edge, { x: outerX, y: y + 424 }];
  api.path(ctx, points, { closed: true, fill: color, width: 0 });
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, text, line, focus } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const at = (id, start, end) => cueProgress(state, id, api.phase(p, start, end));
  const join = beat === 0 ? 0 : beat === 1 ? at('open-page', 0.03, 0.25) : 1;
  const readTrigger = beat > 1 || (beat === 1 && at('read-trigger', 0.27, 0.55) > 0);
  const widen = beat === 2 ? at('widen-hit', 0.35, 0.75) : 0;
  const split = (1 - join) * api.ease(api.clamp(0.23 + (state.t ?? 0) / 1.4));
  const left = 865 - 62 * split;
  const right = 865 + 160 * split;
  const top = 316;
  const hitTop = top + 59 * split;

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  focus.target('runbook-page', () => {
    tornPaper(ctx, api, left, top, 'left', readTrigger ? C.ink : C.blue);
    const x = left - 626;
    text(ctx, 'Incident runbook', x, top + 81, 43, C.bg, 'left', 'serif');
    line(ctx, x, top + 112, left - 46, top + 112, C.bg, 2);
    if (readTrigger) {
      text(ctx, instruction.text.slice(0, triggerEnd), x, top + 220, 66, C.bg, 'left', 'serif');
      text(ctx, instruction.text.slice(triggerEnd).trim(), x, top + 295, 51, C.bg);
    } else {
      text(ctx, 'Outside the search hit', x, top + 219, 42, C.bg);
      for (const [dy, length] of [[258, 423], [291, 322]]) {
        line(ctx, x, top + dy, x + length, top + dy, C.panel, 7);
      }
    }
    text(ctx, 'Version 3   /   Page 7', x, top + 375, 29, C.bg);
  });
  focus.target('search-hit', () => {
    tornPaper(ctx, api, right, hitTop, 'right', C.ink);
    const x = right + 55;
    text(ctx, widen === 1 ? 'Deadline and ID' : 'Retrieved text', x, hitTop + 81, 43, C.bg, 'left', 'serif');
    line(ctx, x, hitTop + 112, right + 720, hitTop + 112, C.bg, 2);
    const [amount, unit, ...qualifier] = deadline.text.split(' ');
    api.rect(ctx, x - 6, hitTop + 143, 477, 102, C.yellow, undefined, 3);
    text(ctx, amount + ' ' + unit, x + 7, hitTop + 221, 86, C.bg, 'left', 'serif');
    text(ctx, qualifier.join(' '), x, hitTop + 295, 51, C.bg);
  });
  focus.target('chunk-bracket', () => {
    const start = api.lerp(right + 4, left - 682, widen);
    const end = right + 776;
    const y = hitTop + 465;
    line(ctx, start, y - 18, start, y, C.cyan, 5);
    line(ctx, start, y, end, y, C.cyan, 5);
    line(ctx, end, y, end, y - 18, C.cyan, 5);
    const label = widen === 1 ? 'One chunk  /  whole instruction' : 'One chunk';
    text(ctx, label, (start + end) / 2, y + 63, 37, C.cyan, 'center');
  });
  ctx.restore();
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['read-hit', 'open-page', 'read-trigger', 'widen-hit'],
};
