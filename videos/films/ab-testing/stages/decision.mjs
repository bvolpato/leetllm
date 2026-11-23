import { report } from '../fixtures.mjs';
import { groundingUpper, lift, liftInterval } from '../model.mjs';
import { withFocus, writeText } from '../defaults.mjs';
export function drawDecision(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const R = (id, fallback, draw) =>
    state.cues?.[id] && api.focus ? api.focus.reveal(id, draw) : fallback ? draw() : undefined;
  {
    writeText(
      ctx,
      api,
      'Main balanced experiment · 2,000 incidents per arm',
      960,
      275,
      30,
      themeColors.cyan,
      'center',
    );
    const rows = [
      ['Enrollment count screen: 2,000 / 2,000', report.control.n === report.treatment.n],
      ['Lift +4.0 pp; lower bound +1.0 pp', liftInterval[0] > 0],
      ['Observed lift reaches +2.0 pp', lift >= 0.02],
      [
        `Grounding upper bound +${(groundingUpper * 100).toFixed(2)} pp; budget +0.50 pp`,
        groundingUpper < 0.005,
      ],
    ];
    const spoken = (id) => state.cues?.[id]?.phase && state.cues[id].phase !== 'before';
    const primaryKnown =
      currentBeat > 1 ||
      (currentBeat === 1 && (state.cues ? spoken('decision-beat-2-focus-1') : true));
    const groundingKnown =
      currentBeat > 1 ||
      (currentBeat === 1 && (state.cues ? spoken('decision-beat-2-focus-2') : true));
    const planned = [
      'Trustworthy assignment',
      'Lift interval above zero',
      'Observed lift at least +2.0 pp',
      'Grounding uncertainty within budget',
    ];
    const arrivals = [
      'decision-beat-1-focus-3',
      'decision-beat-1-focus-1',
      'decision-beat-1-focus-1',
      'decision-beat-1-focus-2',
    ];
    rows.forEach((v, i) =>
      R(arrivals[i], true, () =>
        withFocus(ctx, api, 'launch-condition-' + i, () => {
          const y = 335 + i * 132,
            known = i === 3 ? groundingKnown : primaryKnown;
          const color = known ? (v[1] ? themeColors.green : themeColors.red) : themeColors.muted;
          api.components.card({
            label: known ? v[0] : planned[i],
            x: 190,
            y,
            width: 1030,
            height: 94,
            fill: themeColors.panel,
            stroke: color,
            textColor: color,
            fontSize: 31,
            padding: 14,
          });
          writeText(
            ctx,
            api,
            known ? (v[1] ? 'PASS' : 'FAIL') : 'REQUIRED',
            1510,
            y + 59,
            32,
            color,
            'center',
          );
        }),
      ),
    );
    R('decision-hold', currentBeat >= 1, () =>
      withFocus(ctx, api, 'launch-decision', () =>
        writeText(ctx, api, 'HOLD AND INVESTIGATE', 960, 885, 52, themeColors.yellow, 'center'),
      ),
    );
  }
}
export default {
  id: 'decision',
  draw: drawDecision,
  cues: [
    'decision-beat-1-focus-1',
    'decision-beat-1-focus-2',
    'decision-beat-1-focus-3',
    'decision-beat-2-focus-1',
    'decision-beat-2-focus-2',
    'decision-hold',
    'decision-beat-3-focus-1',
    'decision-beat-3-focus-2',
  ],
};
