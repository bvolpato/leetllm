import { decodeRepetition, decodeSoftmax, decodeSupport } from '../arithmetic.mjs';
import { coreText } from '../defaults.mjs';
import { probabilityStrip, stripMarker, stripWidth, stripX } from '../probability-strip.mjs';
import { heard, movement } from '../spoken.mjs';

const names = ['degraded', 'in', 'on', 'broken'];
const raw = [2.4, 2.1, 1.2, 0.3];
const logits = decodeRepetition(raw, [0], 1.2);
const probabilities = decodeSoftmax(logits);
const rank = names.map((_, i) => i).sort((a, b) => logits[b] - logits[a]);
const support = decodeSupport(probabilities, 'p', 0.9);
const u = 0.8444218515250481; // First random.Random(0).random() in the article's fixture.
let cumulative = 0;
const drawn = support.ids.find((i) => (cumulative += support.values[i]) > u);

export function drawActualSampler(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  const label = (s, x, y, size = 36, color = C.ink, align = 'left') =>
    coreText(ctx, api, s, x, y, size, color, align);
  api.focus.target('sampler-trace', () => {
    if (b === 0) {
      const penalty = heard(state, 'dec-sampler-penalty', 0, 0.55);
      const greedy = heard(state, 'dec-sampler-zero', 0, 0.94);
      label('History includes degraded', 160, 288, 46);
      label('T = 0', 1710, 288, 44, C.yellow, 'right');
      names.forEach((name, i) => {
        const y = 412 + 119 * i;
        const score = penalty ? logits[i] : raw[i];
        label(name, 160, y, 39);
        api.rect(
          ctx,
          500,
          y - 32,
          score * 310,
          40,
          greedy && i === rank[0] ? C.green : C.blue,
          undefined,
          3,
        );
        label(
          i === 0 && penalty ? '2.4 / 1.2 = ' + score.toFixed(1) : score.toFixed(1),
          1450,
          y,
          35,
        );
      });
      label(
        greedy ? 'Greedy returns “' + names[rank[0]] + '”.' : 'Compare the eligible logits.',
        960,
        962,
        44,
        greedy ? C.green : C.ink,
        'center',
      );
    } else if (b === 1) {
      const scaled = heard(state, 'dec-sampler-probabilities', 1, 0.4);
      const kept = heard(state, 'dec-sampler-support', 1, 0.75);
      label('Same penalized logits', stripX, 287, 45);
      label('T = 1', 1710, 287, 44, C.yellow, 'right');
      if (scaled) {
        stripMarker(ctx, api, 0.9, 502, 'Top-p  0.90');
        probabilityStrip(ctx, api, {
          values: rank.map((i) => probabilities[i]),
          names: rank.map((i) => names[i]),
          y: 502,
        });
        if (kept)
          rank.forEach((id, i) =>
            label(
              support.ids.includes(id) ? 'retain' : 'exclude',
              stripX + (stripWidth * (i + 0.5)) / 4,
              797,
              30,
              support.ids.includes(id) ? C.green : C.muted,
              'center',
            ),
          );
      } else {
        rank.forEach((id, i) =>
          label(
            names[id] + '   ' + logits[id].toFixed(1),
            stripX + ((i + 0.5) * stripWidth) / 4,
            562,
            40,
            C.blue,
            'center',
          ),
        );
      }
      label(
        kept
          ? 'Retained mass   ' + support.mass.toFixed(3)
          : 'Find the smallest prefix that covers 90%.',
        960,
        956,
        39,
        C.ink,
        'center',
      );
    } else {
      const marked = movement(state, 'dec-sampler-mark', 2, 0.27, 0.7) > 0;
      const chosen = heard(state, 'dec-sampler-seed', 3, 0.39);
      const boundary = support.ids.slice(0, -1).reduce((s, i) => s + support.values[i], 0);
      label('After dividing by the retained mass', stripX, 285, 43);
      probabilityStrip(ctx, api, {
        values: support.ids.map((i) => support.values[i]),
        names: support.ids.map((i) => names[i]),
        y: 490,
      });
      if (marked) stripMarker(ctx, api, u, 490, 'Draw  ' + u.toFixed(3));
      label(
        chosen ? 'Python returns “' + names[drawn] + '”.' : 'Which word owns the draw?',
        960,
        857,
        47,
        chosen ? C.green : C.ink,
        'center',
      );
      label('Upper edge of degraded   ' + boundary.toFixed(3), 960, 957, 33, C.muted, 'center');
    }
  });
}
export default {
  id: 'actual-sampler',
  draw: drawActualSampler,
  cues: [
    'dec-sampler-penalty',
    'dec-sampler-zero',
    'dec-sampler-probabilities',
    'dec-sampler-support',
    'dec-sampler-mark',
    'dec-sampler-seed',
  ],
};
