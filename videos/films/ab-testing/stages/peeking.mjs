import { abClamp } from '../arithmetic.mjs';
import { AB_VISUAL_FIXTURES } from '../fixtures.mjs';
import { abCue } from '../construction.mjs';
import { abExtendedScenes } from '../model.mjs';
import {
  drawExpansionBox,
  drawExpansionCell,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawPeeking(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress2 = abClamp(state.beatP ?? 0),
    q = progress2 * progress2 * (3 - 2 * progress2);
  if (!abExtendedScenes.has('peeking')) return;
  const { C: themeColors, components: components } = api;
  withExpansionFocus(ctx, api, 'peeking-mechanism', () => {
    const data = AB_VISUAL_FIXTURES.peeking.path;
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Trial 11 of the actual seeded A/A simulation · both true rates 40%',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const chart = drawExpansionPlot(
        ctx,
        api,
        240,
        400,
        1430,
        390,
        [1, 20],
        [-3, 3],
        [1, 5, 10, 15, 20],
        [-1.96, 0, 1.96],
        'cumulative look · 100 new / arm',
        'estimated z',
      );
      for (const z of [-1.96, 1.96])
        drawExpansionPath(
          ctx,
          api,
          [chart.point(1, z), chart.point(20, z)],
          themeColors.pink,
          3,
          chart.bounds,
        );
      const shown = Math.max(1, Math.min(20, Math.floor(q * 21)));
      drawExpansionPath(
        ctx,
        api,
        data.slice(0, shown).map((row) => chart.point(row.look, row.z)),
        themeColors.cyan,
        5,
        chart.bounds,
      );
      const last = data[shown - 1],
        dot = chart.point(last.look, last.z);
      api.circle(ctx, dot.x, dot.y, 11, themeColors.cyan);
      if (shown >= 4) {
        const cross = chart.point(4, data[3].z);
        api.circle(ctx, cross.x, cross.y, 14, themeColors.pink);
        writeExpansionText(
          ctx,
          api,
          'First crossing: look 4',
          620,
          930,
          33,
          themeColors.pink,
          'center',
        );
      }
      if (shown === 20)
        writeExpansionText(
          ctx,
          api,
          'Final z = ' + data.at(-1).z.toFixed(3) + ' · inside',
          1330,
          930,
          33,
          themeColors.cyan,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'The early crossing and final non-crossing occur on the same retained outcome path.',
      );
    } else if (beat === 1) {
      writeExpansionText(
        ctx,
        api,
        'Actual 5,000 null experiments · two-sided false alarms',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const rows = [
        ['One final look', 231, 'peek-final'],
        ['Five looks', 708, 'peek-five'],
        ['Ten looks', 961, 'peek-ten'],
        ['Twenty looks', 1244, 'peek-twenty'],
      ];
      rows.forEach(([name, count, cue], i) => {
        const y = 390 + i * 135,
          progress = abCue(state, cue, q);
        writeExpansionText(ctx, api, name, 200, y + 45, 30, themeColors.ink);
        drawExpansionBox(ctx, api, 650, y, 700, 70, themeColors.muted);
        if (progress > 0)
          components.panel({
            x: 650,
            y,
            width: Math.max(2, ((700 * (count / 5000)) / 0.3) * progress),
            height: 70,
            fill: i ? themeColors.pink : themeColors.blue,
            stroke: i ? themeColors.pink : themeColors.blue,
            radius: 0,
          });
        if (progress >= 0.9)
          writeExpansionText(
            ctx,
            api,
            count + ' / 5000 = ' + (count / 50).toFixed(1) + '%',
            1720,
            y + 45,
            29,
            i ? themeColors.pink : themeColors.blue,
            'right',
          );
      });
      drawExpansionNote(
        ctx,
        api,
        'These are the executed article simulation counts, not an independence calculation across correlated looks.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'The analysis schedule and claim family belong in the receipt',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const claims = [
        'Variant1 / main',
        'Variant2 / main',
        'Variant1 / subgroup',
        'Variant2 / subgroup',
      ];
      claims.forEach((v, i) =>
        drawExpansionCell(
          ctx,
          api,
          v,
          230 + (i % 2) * 850,
          390 + Math.floor(i / 2) * 170,
          710,
          110,
          i === 3 ? themeColors.pink : themeColors.blue,
          31,
        ),
      );
      drawExpansionCell(
        ctx,
        api,
        'One planned final analysis\nor a justified sequential design',
        230,
        780,
        710,
        150,
        themeColors.cyan,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Predeclared family control\nor exploratory → fresh confirmation',
        1080,
        780,
        710,
        150,
        themeColors.yellow,
        30,
      );
      drawExpansionNote(
        ctx,
        api,
        'Operationally updating a dashboard does not make its ordinary intervals valid for outcome-triggered stopping.',
      );
    }
  });
  return;
}
export default {
  id: 'peeking',
  draw: drawPeeking,
  cues: [
    'peeking-step-1',
    'peeking-step-2',
    'peek-final',
    'peek-five',
    'peek-ten',
    'peek-twenty',
    'peeking-step-3',
  ],
};
