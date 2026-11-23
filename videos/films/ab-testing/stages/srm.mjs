import { abClamp } from '../arithmetic.mjs';
import { srm } from '../fixtures.mjs';
import { abExtendedScenes, abJoinProbe } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionNote,
  withExpansionFocus,
  withFocus,
  writeEquation,
  writeExpansionText,
  writeText,
} from '../defaults.mjs';
export function drawSrm(ctx, scene, state, api) {
  if (drawABExpansion(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const R = (id, fallback, draw) =>
    state.cues?.[id] && api.focus ? api.focus.reveal(id, draw) : fallback ? draw() : undefined;
  {
    writeText(
      ctx,
      api,
      'Separate assignment-failure diagnostic fixture',
      960,
      285,
      30,
      themeColors.pink,
      'center',
    );
    withFocus(ctx, api, 'assignment-counts', () =>
      api.teaching.bars({
        x: 200,
        y: 370,
        width: 820,
        height: 415,
        values: [srm.control, srm.treatment],
        labels: ['control', 'treatment'],
        colors: [themeColors.blue, themeColors.pink],
        max: 2700,
        showValues: true,
        format: (v) => v.toLocaleString('en-US'),
        fontSize: 32,
        progress: phaseForBeat(0),
      }),
    );
    R('srm-diagnostic', currentBeat >= 1, () =>
      withFocus(ctx, api, 'assignment-diagnostic', () =>
        writeEquation(
          ctx,
          api,
          String.raw`\chi^2=\sum\frac{(O-E)^2}{E}=122.5`,
          1410,
          600,
          42,
          themeColors.yellow,
          'center',
        ),
      ),
    );
    withFocus(ctx, api, 'expected-allocation', () =>
      writeText(ctx, api, 'Expected 2,000 per arm', 1410, 700, 30, themeColors.cyan, 'center'),
    );
  }
}
function drawABExpansion(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('srm') && !(beat === 2)) return false;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'assignment-counts', () => {
    writeExpansionText(
      ctx,
      api,
      'Separate join probe · one enrolled ID disappears from analysis',
      960,
      280,
      35,
      themeColors.blue,
      'center',
    );
    const probe = abJoinProbe(q),
      rows = probe.rows.map((r) => [r.id, r.arm.toUpperCase()]),
      drop = probe.control === 1;
    writeExpansionText(ctx, api, 'ENROLLED', 510, 365, 28, themeColors.cyan, 'center');
    writeExpansionText(ctx, api, 'ANALYSIS JOIN', 1390, 365, 28, themeColors.blue, 'center');
    rows.forEach(([id, arm], i) => {
      const y = 420 + i * 120,
        color = arm === 'CONTROL' ? themeColors.blue : themeColors.pink;
      drawExpansionCell(ctx, api, id + ' · ' + arm, 200, y, 620, 85, color, 30);
      if (i !== 1 || !drop)
        drawExpansionCell(ctx, api, id + ' · ' + arm, 1070, y, 620, 85, color, 30);
      else drawExpansionCell(ctx, api, 'C2 missing', 1070, y, 620, 85, themeColors.yellow, 30);
    });
    writeExpansionText(
      ctx,
      api,
      'Enrolled 2 C / 2 T → joined ' + probe.control + ' C / ' + probe.treatment + ' T',
      960,
      960,
      34,
      themeColors.yellow,
      'center',
    );
    drawExpansionNote(
      ctx,
      api,
      'This supplied join defect illustrates one diagnostic path; it does not identify the cause of the separate 1650/2350 fixture.',
    );
  });
  return true;
}
export default {
  id: 'srm',
  draw: drawSrm,
  cues: ['srm-beat-1-focus-1', 'srm-beat-2-focus-1', 'srm-diagnostic', 'srm-beat-3-focus-1'],
};
