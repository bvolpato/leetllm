import { mix, prefix } from '../arithmetic.mjs';
import { bracket, clauseEnded } from '../cache-picture.mjs';
import { flashCue } from '../construction.mjs';
import { requests } from '../fixtures.mjs';

const offsets = prefix(requests.map(({ q }) => q));
const groupSize = Math.max(...requests.map(({ q }) => q));
const paddedX = (i) => 118 + i * 142;
const packedX = (i) => 182 + i * 198;
const upperY = 323;
const lowerY = 656;

function queryTile(api, label, x, y, width, fill, stroke, ink) {
  api.components.card({
    label,
    x,
    y,
    width,
    height: 95,
    fill,
    stroke,
    textColor: ink,
    fontSize: 38,
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const t = state.t ?? 0;
  const lead = flashCue(state, 'intro-first-four', 0, [0, 0.2]);
  const flight = t < 0.4 && state.beat === 0 ? mix(0.18, 0.32, t / 0.4) : mix(0.32, 1, lead);
  const identified = clauseEnded(state, 'intro-owner', 1, 0.12);
  const pack = identified ? flashCue(state, 'intro-pack', 1, [0.14, 0.45]) : 0;
  const history = state.beat >= 2;
  const colors = [C.blue, C.yellow, C.cyan];
  const next = offsets[2];
  const progress = [1, flight, pack];

  api.focus.target('intro-batch', () => {
    if (!history) {
      requests.forEach((request, r) => {
        const first = r * groupSize;
        const x = paddedX(first);
        api.text(ctx, request.id, x, upperY - 57, 52, colors[r]);
        for (let i = 0; i < groupSize; i++) {
          const pad = i >= request.q;
          const lifting = !pad && progress[r] > 0 && progress[r] * (lowerY - upperY) < 100;
          if (lifting) {
            api.rect(ctx, paddedX(first + i), upperY, 126, 95, C.panel, colors[r], 8);
            continue;
          }
          queryTile(
            api,
            pad ? 'pad' : 'q' + i,
            paddedX(first + i),
            upperY,
            126,
            C.panel,
            pad ? C.muted : colors[r],
            pad ? C.muted : colors[r],
          );
        }
      });
    } else {
      const request = requests[2];
      const keys = (request.pages.length - 1) * 4 + request.tail;
      api.text(ctx, request.id + ' key history', 182, upperY - 58, 48, C.cyan);
      for (let i = 0; i < keys; i++) {
        const color = i < keys - request.q ? C.blue : C.cyan;
        queryTile(api, 'k' + i, 182 + i * 172, upperY, 151, C.panel, color, color);
      }
      for (const [start, count, label, color] of [
        [0, keys - request.q, 'Earlier keys', C.blue],
        [keys - request.q, request.q, 'Just appended', C.cyan],
      ]) {
        const x = 182 + start * 172,
          end = x + count * 172 - 21;
        bracket(ctx, api, x, end, 460, color);
        api.text(ctx, label, (x + end) / 2, 518, 34, color, 'center');
      }
    }

    api.text(ctx, 'Packed query rows', 182, lowerY + 236, 44, C.ink);
    for (let i = 0; i < offsets.at(-1); i++) {
      const x = packedX(i);
      const highlight = identified ? C.cyan : C.ink;
      api.rect(ctx, x, lowerY, 176, 95, C.panel, i === next ? highlight : C.muted, 8);
      api.text(ctx, String(i), x + 88, lowerY + 155, 40, i === next ? highlight : C.ink, 'center');
      if (i === next && pack === 0)
        api.text(ctx, identified ? 'R2' : '?', x + 88, lowerY + 64, 52, highlight, 'center');
    }
    requests.forEach((request, r) => {
      for (let i = 0; i < request.q; i++) {
        const row = offsets[r] + i;
        const p = progress[r];
        if (p <= 0) continue;
        const x = mix(paddedX(r * groupSize + i), packedX(row), p);
        const y = mix(upperY, lowerY, p);
        queryTile(api, request.id + '·' + i, x, y, mix(126, 176, p), colors[r], colors[r], C.bg);
      }
    });
    if (history) {
      const x = packedX(next);
      bracket(ctx, api, x, x + 176, lowerY + 180, C.cyan);
    } else if (pack === 1) {
      api.text(
        ctx,
        '12 slots with padding  →  8 packed rows',
        1735,
        lowerY + 236,
        44,
        C.cyan,
        'right',
      );
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-first-four', 'intro-ask', 'intro-pack', 'intro-owner', 'intro-history'],
};
