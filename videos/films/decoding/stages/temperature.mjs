import { BASE, WORDS } from '../fixtures.mjs';
import { decodeSoftmax } from '../arithmetic.mjs';
import { coreText } from '../defaults.mjs';
import { probabilityStrip, stripMarker } from '../probability-strip.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawTemperature(ctx, scene, state, api) {
  const cold = movement(state, 'temperature-cool', 1, 0.22, 0.55);
  const warm = movement(state, 'temperature-warm', 2, 0.18, 0.53);
  const T = Math.round((1 - 0.5 * cold + 1.5 * warm) * 100) / 100;
  const row = decodeSoftmax(BASE.map(Math.log), T);
  const u = 0.4;
  let sum = 0;
  const token = WORDS[row.findIndex((p) => (sum += p) > u)];
  const marked = movement(state, 'temperature-marker', 0, 0.35, 0.68) > 0;
  const answer = heard(state, 'temperature-first', 1, 0.12);
  const hotAnswer = heard(state, 'temperature-second', 3, 0.22);
  const result = state.beat >= 2 ? hotAnswer : answer;
  api.focus.target('temperature-strip', () => {
    coreText(ctx, api, result ? 'The dog ' + token : 'The dog …', 200, 300, 54, api.C.ink, 'left');
    coreText(ctx, api, 'Temperature  ' + T.toFixed(2), 1715, 300, 43, api.C.cyan, 'right');
    probabilityStrip(ctx, api, { values: row, names: WORDS, y: 520 });
    if (marked) stripMarker(ctx, api, u, 520, 'Draw  0.40');
    const question =
      state.beat === 2 && warm < 1 ? 'Keep the draw fixed.' : 'Which word contains the draw?';
    const ranEdge = row[0].toFixed(3);
    const bounds = hotAnswer
      ? ranEdge + ' ≤ 0.40 < ' + (row[0] + row[1]).toFixed(3)
      : '0 ≤ 0.40 < ' + ranEdge;
    coreText(
      ctx,
      api,
      result ? bounds : marked ? question : 'One unit of probability',
      960,
      877,
      45,
      api.C.ink,
    );
    if (state.beat >= 1)
      coreText(
        ctx,
        api,
        'Weight of each word = its original probability raised to 1/T. Divide by total weight.',
        960,
        981,
        31,
        api.C.muted,
      );
  });
}
export default {
  id: 'temperature',
  draw: drawTemperature,
  cues: [
    'temperature-marker',
    'temperature-first',
    'temperature-cool',
    'temperature-warm',
    'temperature-second',
  ],
};
