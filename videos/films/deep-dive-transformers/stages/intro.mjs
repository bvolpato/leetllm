import { serialize } from '../model.mjs';
import { completed, firstDifference, movement } from '../replay.mjs';
import { bracket, slot } from '../strips.mjs';

const approved = serialize(0);
const stopped = serialize(1);
const firstMissing = firstDifference(approved.ids, stopped.ids);
const firstShown = 5;
const start = 780;
const step = 264;

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const reference = movement(state, 0, 'intro-reference');
  const candidate = movement(state, 0, 'intro-candidate');
  const repair = movement(state, 1, 'intro-restore');
  const found = completed(state, 1, 'intro-position');
  const travel = api.clamp(0.12 + (state.t ?? 0) / 1.55);
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('intro-inputs', () => {
    const closeup = 1 - api.phase(state.t ?? 4, 1.6, 3.4);
    ctx.save();
    ctx.translate(205 * closeup, -184 * closeup);
    ctx.scale(1 + 0.55 * closeup, 1 + 0.55 * closeup);
    api.path(
      ctx,
      [
        { x: 512, y: 481 },
        { x: 562, y: 514 },
        { x: 512, y: 540 },
      ],
      {
        fill: C.panel,
        color: C.ink,
        width: 3,
        closed: true,
      },
    );
    api.rect(ctx, 100, 418, 412, 186, C.panel, C.ink, 30);
    api.text(ctx, 'Why do birds', 138, 489, 60, C.ink, 'left', 'serif');
    api.text(ctx, approved.words[firstShown], 138, 565, 69, C.ink, 'left', 'serif');
    if (closeup === 0 && reference > 0) {
      api.text(ctx, 'Position', start - 40, 254, 30, C.muted, 'right');
      for (let n = 0; n < 4; n++)
        api.text(
          ctx,
          String(firstShown + n),
          start + (n + 0.5) * step - 3,
          254,
          30,
          C.muted,
          'center',
        );
    }
    for (const [i, [label, y, dealt]] of [
      ['Approved client', 307, reference],
      ['Candidate client', 639, candidate],
    ].entries()) {
      const color = i === 0 ? C.blue : C.cyan;
      api.text(ctx, label, 100, y + 46, 44, color);
      api.text(ctx, 'Weights W7', 102, y + 89, 30, C.muted);
      for (let n = 0; n < 4; n++) {
        if (n > 0 && closeup > 0) break;
        const pos = firstShown + n;
        const missing = i === 1 && pos >= firstMissing;
        const length = (i === 0 ? approved : stopped).ids.length - firstShown;
        const available = missing
          ? repair > (pos - firstMissing) / 2
          : n <= Math.ceil((length - 1) * dealt);
        const x = n === 0 ? api.lerp(553, start, travel) : start + n * step;
        const top = n === 0 ? api.lerp(i === 0 ? 381 : 526, y, travel) : y;
        if (n === 0) api.line(ctx, 562, 514, x, top + 63, color, 3);
        if (!available && dealt === 0) continue;
        slot(ctx, api, {
          x,
          y: top,
          width: step,
          height: 126,
          word: available ? approved.words[pos] : undefined,
          detail: 'ID ' + approved.ids[pos],
          size: 45,
          color: missing && repair < 1 ? C.yellow : color,
        });
      }
    }
    if (found && repair === 0) {
      const boundaryX = start + (firstMissing - firstShown) * step - 5;
      api.line(ctx, boundaryX, 634, boundaryX, 777, C.yellow, 5);
      api.text(ctx, 'Input ends here', boundaryX - 16, 830, 31, C.yellow, 'right');
    }
    if (state.beat === 1 && found)
      bracket(
        ctx,
        api,
        start + 2 * step + 8,
        start + 4 * step - 14,
        895,
        repair === 1 ? 'Assistant turn restored' : 'Start of assistant turn',
        repair === 1 ? C.green : C.yellow,
      );
    ctx.restore();
  });
  if (state.beat === 2) {
    api.focus.target('intro-forward', () => {
      const items = ['Input IDs', 'Model class', 'Next-token scores', 'Selection'];
      const amounts = [
        1,
        movement(state, 2, 'intro-class'),
        movement(state, 2, 'intro-logits'),
        movement(state, 2, 'intro-selection'),
      ];
      const loaded = completed(state, 2, 'intro-weights');
      items.forEach((item, i) => {
        const x = 110 + i * 450;
        if (amounts[i] <= 0) return;
        if (i > 0) api.arrow(ctx, x - 92, 924, x - 12, 924, C.cyan, 4);
        slot(ctx, api, {
          x,
          y: 858,
          width: 350,
          height: 128,
          word: item,
          size: 33,
          color: C.cyan,
          detail: i === 1 && loaded ? 'W7 loaded' : undefined,
        });
      });
    });
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-reference',
    'intro-candidate',
    'intro-question',
    'intro-position',
    'intro-restore',
    'intro-check',
    'intro-class',
    'intro-weights',
    'intro-logits',
    'intro-selection',
  ],
};
