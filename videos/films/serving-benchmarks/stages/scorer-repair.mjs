import { SERVING_COHORT } from '../fixtures.mjs';
import { cueStarted, limit } from '../construction.mjs';
import { servingReceipt } from '../model.mjs';
import { box, constructionText, footer, requestCohort, title } from '../defaults.mjs';
export function drawScorerRepair(ctx, scene, state, api) {
  api.focus.target('scorer-repair-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => cueStarted(state.cues, name, fallback);
    {
      const missing =
          currentBeat === 0 &&
          beg('scorer-delete', progress > 0.05) &&
          !beg('scorer-restore', progress > 0.3),
        quality = currentBeat === 0 && beg('scorer-quality-change', progress > 0.55),
        delayed = currentBeat === 1 && beg('scorer-delay', progress > 0.2),
        rows = SERVING_COHORT.map((r) => ({
          ...r,
          tokens: [...r.tokens],
        }));
      if (quality) rows[4].quality = true;
      if (delayed) rows[3].sent = 800;
      title(ctx, api, 'One edit to the same six requests');
      const shown = missing ? rows.filter((r) => r.id !== 'r06') : rows;
      requestCohort(ctx, api, shown, {
        height: 60,
      });
      let text, col;
      if (missing) {
        text = 'missing r06 → malformed / exit 1';
        col = themeColors.red;
      } else {
        const r = servingReceipt(rows);
        text = `${r.qualified}/6 qualify · ${r.scheduleValid ? 'valid schedule / exit 0' : '40 ms lag / exit 2'}`;
        col = r.scheduleValid ? themeColors.green : themeColors.red;
      }
      box(ctx, api, text, 340, 900, 1240, 78, col, 31);
      if (quality)
        constructionText(
          ctx,
          api,
          'Only supplied r05 judgment changed',
          960,
          865,
          29,
          themeColors.yellow,
          'center',
        );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Attempt evidence and logical outcomes need explicit separate identities'
          : 'CLI classification here assumes both input-file arguments are supplied',
      );
    }
    return true;
  });
}
export default {
  id: 'scorer-repair',
  draw: drawScorerRepair,
  cues: [
    'scorer-repair-beat-0',
    'scorer-delete',
    'scorer-restore',
    'scorer-quality-change',
    'scorer-repair-beat-1',
    'scorer-delay',
    'scorer-repair-beat-2',
  ],
};
