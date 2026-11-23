import { phase, sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawRecordTypes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('record-types', state);
  {
    const rows = [
      ['Demonstration', 'prompt + approved target'],
      ['Pointwise', 'one completion + score'],
      ['Preference', 'A / B + rubric + choice'],
      ['Evaluation', 'frozen input + assertions'],
      ['Incident', 'failure + investigation'],
    ];
    const count =
      beat === 0 ? Math.min(3, 1 + Math.floor(q * 3)) : Math.min(5, 3 + Math.floor(q * 3));
    rows.forEach(([title, detail], i) =>
      api.focus.target('record-jobs', () =>
        card(
          ctx,
          api,
          `${title} · ${detail}`,
          460,
          280 + i * 130,
          1030,
          i < count ? themeColors.cyan : themeColors.muted,
          90,
          29,
        ),
      ),
    );
    text(
      ctx,
      api,
      'Keep the record suited to its intended job.',
      960,
      970,
      30,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'record-types',
  draw: drawRecordTypes,
  cues: ['training-signals', 'record-purpose'],
};
