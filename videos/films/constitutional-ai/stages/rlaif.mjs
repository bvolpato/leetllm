import { orderedVerdict } from '../arithmetic.mjs';
import { voice } from '../construction.mjs';

export function drawRlaif(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  t('Case 17    /    no incident grant', 140, 294, 37, C.blue);
  t('“Can I see the incident timeline?”', 140, 370, 48);
  const swap = voice(state, 'rlaif-b2-1', 1);
  const lift = 108 * Math.sin(Math.PI * swap);
  const answers = [
    ['answer-a', 'A   “Try the access portal.”', 195 + 885 * swap, 524 - lift, C.green],
    ['answer-b', 'B   “Timeline: [restricted excerpt]”', 1080 - 885 * swap, 524 + lift, C.pink],
  ];
  for (const [id, label, x, y, color] of answers) {
    api.focus.target(id, () =>
      api.components.card({
        label,
        x,
        y,
        width: 665,
        height: 105,
        fontSize: 32,
        padding: 12,
        fill: C.panel,
        stroke: color,
        textColor: color,
      }),
    );
  }

  const first = voice(state, 'rlaif-first', 0) > 0;
  api.focus.target('order-verdict', () => {
    t('Judge', 140, 769, 31, C.muted);
    t('First ballot', 706, 769, 31, C.muted);
    t('After the swap', 1260, 769, 31, C.muted);
    for (const [i, rule] of ['content', 'position'].entries()) {
      const y = 858 + i * 97;
      t(rule === 'content' ? 'Access rule' : 'Left slot', 140, y, 38);
      const second =
        voice(state, rule === 'content' ? 'rlaif-b2-2' : 'rlaif-position-probe', 2) > 0;
      for (const [order, ready, x] of [
        [0, first, 706],
        [1, second, 1260],
      ]) {
        const ballot = orderedVerdict(order, rule);
        t(
          ready ? ballot.position + '  →  ' + ballot.responseId : '…',
          x,
          y,
          42,
          ready ? (ballot.responseId === 'A' ? C.green : C.pink) : C.muted,
        );
      }
    }
    if (voice(state, 'rlaif-predict', 1) > 0 && state.beat === 1)
      t('Which response does the left-slot judge choose now?', 140, 1035, 30, C.yellow);
  });
}
export default {
  id: 'rlaif',
  draw: drawRlaif,
  cues: [
    'rlaif-b1-1',
    'rlaif-b1-2',
    'rlaif-first',
    'rlaif-b2-1',
    'rlaif-predict',
    'rlaif-position-probe',
    'rlaif-b2-2',
  ],
};
