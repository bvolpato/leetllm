import {
  dashboardClamp,
  dashboardCue,
  dashboardRows,
  dashboardStarted,
  subsetAvailability,
} from '../arithmetic.mjs';
import { citationSlip } from '../citation-slip.mjs';
import { dashboardCell, dashboardLine, dashboardNote, dashboardText } from '../defaults.mjs';

const privateAnswer = dashboardRows('hybrid-v1').find((row) => row.id === 'private_note_injection');
const abstention = dashboardRows('hybrid-v2').find((row) => row.id === privateAnswer.id);
const both = subsetAvailability([privateAnswer.passed, abstention.passed], 2);
export function drawPasskSelector(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = dashboardClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  const { C: themeColors } = api;
  api.focus.target('passk-selector-mechanism', () => {
    if (beat === 0) {
      const values = [true, true, false, false, false],
        model = subsetAvailability(values, 2),
        shown = Math.floor(dashboardCue(state, 'oracle-subsets', q) * model.total);
      dashboardText(
        ctx,
        api,
        'Five candidates · two pass · choose two without replacement',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      values.forEach((v, i) =>
        dashboardCell(
          ctx,
          api,
          (v ? 'P' : 'F') + (i + 1),
          260 + i * 295,
          350,
          245,
          85,
          v ? themeColors.cyan : themeColors.pink,
          32,
        ),
      );
      model.subsets.slice(0, shown).forEach((s, i) => {
        const x = 220 + (i % 5) * 315,
          y = 535 + Math.floor(i / 5) * 155;
        dashboardCell(
          ctx,
          api,
          s.indices.map((j) => j + 1).join(' + '),
          x,
          y,
          260,
          100,
          s.passed ? themeColors.cyan : themeColors.pink,
          31,
        );
      });
      if (dashboardStarted(state, 'passk-selector-step-1', progress > 0.75))
        dashboardText(
          ctx,
          api,
          `${model.passed}/${model.total} subsets contain a pass = ${(model.rate * 100).toFixed(0)}%`,
          960,
          925,
          39,
          themeColors.yellow,
          'center',
        );
    } else if (beat === 1 || !dashboardStarted(state, 'tiny-pool', progress > 0.15)) {
      const { blue, ink, muted, cyan, pink } = themeColors;
      const travel =
        beat > 1 ? 1 : dashboardCue(state, 'serve-first', api.phase(progress, 0.3, 0.48));
      dashboardText(ctx, api, 'Two answers to one question', 120, 288, 40, blue);
      dashboardText(ctx, api, 'Citation in the delivered answer', 1120, 288, 40, blue);
      dashboardText(ctx, api, 'First', 120, 472, 38, muted);
      dashboardText(ctx, api, 'Second', 120, 705, 38, muted);
      dashboardLine(ctx, api, 1110, 593, 1770, 593, blue, 4);
      citationSlip(ctx, api, api.lerp(300, 1120, travel), 365, privateAnswer.citations[0]);
      dashboardCell(ctx, api, 'Abstains   ·   No citations', 300, 610, 640, 145, cyan, 40);
      if (beat === 2 && dashboardCue(state, 'single-pair', progress > 0.1 ? 1 : 0) >= 1) {
        const single = subsetAvailability([privateAnswer.passed, abstention.passed], 1);
        dashboardText(
          ctx,
          api,
          'Random pass@1   ' +
            single.passed +
            ' / ' +
            single.total +
            ' = ' +
            single.rate * 100 +
            '%',
          120,
          903,
          49,
          ink,
        );
      } else if (beat > 1 || dashboardCue(state, 'oracle-hundred', progress > 0.28 ? 1 : 0) >= 1)
        dashboardText(ctx, api, 'Oracle pass@2   ' + both.rate * 100 + '%', 120, 903, 49, ink);
      if (beat > 1 || dashboardCue(state, 'selector-fails', progress > 0.56 ? 1 : 0) >= 1)
        dashboardText(ctx, api, 'First answer fails', 1120, 703, 45, pink);
      if (beat > 1 || dashboardCue(state, 'passk-selector-step-2', progress > 0.65 ? 1 : 0) >= 1)
        dashboardText(ctx, api, 'Hold candidate', 1120, 903, 49, pink);
    } else {
      const n = 10n ** 17n,
        naive = 1 - Number(n - 1n) / Number(n),
        direct = 1 / Number(n);
      dashboardText(
        ctx,
        api,
        'One pass among 10¹⁷ candidates · k = 1',
        960,
        285,
        38,
        themeColors.blue,
        'center',
      );
      const x = 350,
        y = 620,
        width = 1200;
      dashboardLine(ctx, api, x, y, x + width, y, themeColors.muted, 4);
      [0, 1e-17, 1e-16].forEach((v) => {
        const xx = x + (width * v) / 1e-16;
        dashboardLine(ctx, api, xx, y - 20, xx, y + 20, themeColors.muted, 3);
        dashboardText(ctx, api, v.toExponential(0), xx, y + 90, 29, themeColors.muted, 'center');
      });
      api.circle(ctx, x + (width * naive) / 1e-16, y, 14, themeColors.pink);
      dashboardText(
        ctx,
        api,
        '1 − rounded failure fraction = ' + naive,
        960,
        420,
        34,
        themeColors.pink,
        'center',
      );
      if (dashboardStarted(state, 'oracle-tiny', progress > 0.35)) {
        api.circle(ctx, x + (width * direct) / 1e-16, y, 14, themeColors.cyan);
        dashboardText(
          ctx,
          api,
          'Direct c / n = ' + direct.toExponential(0),
          960,
          860,
          40,
          themeColors.cyan,
          'center',
        );
      }
      dashboardNote(ctx, api, 'For larger k, use log1p and expm1 to evaluate the complement.');
    }
  });
}
export default {
  id: 'passk-selector',
  draw: drawPasskSelector,
  cues: [
    'passk-selector-step-1',
    'oracle-subsets',
    'oracle-counts',
    'passk-selector-step-2',
    'oracle-chosen',
    'oracle-hundred',
    'serve-first',
    'selector-fails',
    'passk-selector-step-3',
    'single-pair',
    'tiny-pool',
    'oracle-tiny',
  ],
};
