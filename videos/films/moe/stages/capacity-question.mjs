import { spokenProgress } from '../construction.mjs';
import { circle, packet, rect, text, traced } from '../defaults.mjs';

const tokens = [
  { word: 'return', x: 842, width: 270, experts: [0, 2] },
  { word: 'total', x: 1100, width: 222, experts: [1, 7] },
];
const expertCount = 8;
const centerX = (expert) => 203 + expert * 216;

export function drawCapacityQuestion(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const next = beat >= 2;
  const token = tokens[Number(next)];
  const choices = token.experts;
  const color = next ? C.pink : C.cyan;
  const send = next ? spokenProgress(api, state, 'next-pair', 2) : 1;
  const back = next
    ? spokenProgress(api, state, 'next-return', 2, 0.78, 0.98)
    : spokenProgress(api, state, 'first-return', 0, 0.68, 0.94);
  const origin = { x: token.x, y: 330 };
  const destination = { x: token.x, y: 807 };
  const travel = next ? send : api.clamp((state.t + 0.4) / 2.4, 0, 1);

  api.focus.target('token-path', () => {
    for (const item of tokens) {
      const selected = item === token;
      rect(
        ctx,
        api,
        item.x - item.width / 2,
        211,
        item.width,
        117,
        selected ? color : C.panel,
        selected ? color : C.muted,
        12,
      );
      text(ctx, api, item.word, item.x, 290, 64, selected ? C.bg : C.muted, 'center', 'mono');
    }
    for (const expert of choices) {
      const x = centerX(expert);
      const outward = [origin, { x: origin.x, y: 364 }, { x, y: 364 }, { x, y: 448 }];
      const inward = [{ x, y: 649 }, { x, y: 750 }, { x: destination.x, y: 750 }, destination];
      traced(ctx, api, outward, send, color, 5);
      if (travel > 0 && travel < 1) packet(ctx, api, outward, travel, C.ink, 13);
      traced(ctx, api, inward, back, color, 5);
      if (back > 0 && back < 1) packet(ctx, api, inward, back, color, 13);
    }
    if (back === 1) {
      circle(ctx, api, destination.x, destination.y, 11, color);
      text(
        ctx,
        api,
        token.word + '  ·  weighted sum of ' + choices.length + ' returns',
        destination.x,
        871,
        36,
        color,
        'center',
      );
    }
  });

  api.focus.target('weight-rack', () => {
    for (let expert = 0; expert < expertCount; expert++) {
      const active = send === 1 && choices.includes(expert);
      const tone = active ? color : C.muted;
      const x = centerX(expert);
      rect(ctx, api, x - 86, 450, 172, 198, C.panel, tone, 13);
      text(ctx, api, 'E' + (expert + 1), x, 510, 40, tone, 'center', 'mono');
      // Eight persistent weight blocks, with an input lighting just the blocks it visits.
      for (let j = 0; j < 12; j++) {
        const column = j % 4;
        const row = Math.floor(j / 4);
        const bright = (expert + 1) & (1 << ((column + row) % 4));
        const fill = bright ? tone : active ? C.ink : '#626671';
        rect(ctx, api, x - 52 + column * 28, 543 + row * 25, 20, 17, fill, undefined, 2);
      }
    }
  });
  const prompt =
    beat === 1
      ? 'Can we discard the six gray sets of weights?'
      : next && back === 1
        ? expertCount +
          ' sets of weights available   ·   ' +
          choices.length +
          ' expert calls for this token'
        : '';
  if (prompt) text(ctx, api, prompt, 960, 986, 39, C.ink, 'center');
}

export default {
  id: 'capacity-question',
  draw: drawCapacityQuestion,
  cues: ['first-pair', 'first-return', 'keep-weights', 'next-pair', 'next-return'],
};
