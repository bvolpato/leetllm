import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompletePacket,
  drawCompleteText,
  moveCompleteRecord,
} from '../defaults.mjs';
export function drawSkillsDisclosure(ctx, scene, state, api) {
  if (paintSkillsDisclosure(ctx, scene, state, api)) return;
}
function paintSkillsDisclosure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  const number = (value) => value.toLocaleString('en-US');
  drawCompleteFocus(ctx, api, 'ce-skills-disclosure-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      'One installed procedure can expose several different context layers',
    );
    if (currentBeat === 0) {
      drawCompleteText(ctx, api, 'incident-skill/', 170, 365, 35, themeColors.cyan);
      const entries = [
        ['SKILL.md', 'name + trigger description; procedure body'],
        ['references/', 'optional detailed contracts'],
        ['scripts/', 'optional executable resources'],
        ['assets/', 'optional non-executable resources'],
      ];
      entries.forEach(([name, detail], i) => {
        const y = 450 + i * 125;
        drawCompleteLine(ctx, api, 195, y - 30, 235, y - 30, themeColors.muted, 2);
        drawCompleteText(
          ctx,
          api,
          name,
          270,
          y - 15,
          31,
          i === 0 ? themeColors.cyan : themeColors.blue,
        );
        drawCompleteText(ctx, api, detail, 800, y - 15, 27, themeColors.muted);
      });
      drawCompleteText(
        ctx,
        api,
        'Specification token guidance ≠ this runtime’s measured count',
        170,
        1000,
        30,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawCompletePacket(ctx, api, 1080, 370, 650, 610, 'MODEL WORKING SET');
      const body = cueProgress('ce-skill-body', 1),
        reference = cueProgress('ce-skill-reference', 1),
        output = cueProgress('ce-skill-script-output', 1);
      moveCompleteRecord(
        ctx,
        api,
        'selected body',
        'procedure text',
        [150, 390],
        [1110, 390],
        body,
        570,
        themeColors.blue,
      );
      moveCompleteRecord(
        ctx,
        api,
        'needed reference',
        'read only when needed',
        [150, 555],
        [1110, 555],
        reference,
        570,
        themeColors.cyan,
      );
      moveCompleteRecord(
        ctx,
        api,
        'script output',
        'returned result enters context',
        [150, 720],
        [1110, 720],
        output,
        570,
        themeColors.green,
      );
      drawCompleteText(
        ctx,
        api,
        'Script source stays with the executor in the documented runtime',
        150,
        930,
        27,
        themeColors.yellow,
      );
    } else {
      const metadata = cueProgress('ce-skill-metadata', 2),
        total = cueProgress('ce-skill-total', 2),
        parts = [
          ['metadata6×80', 480, themeColors.yellow],
          ['active body', 2200, themeColors.blue],
          ['reference', 400, themeColors.cyan],
          ['returned output', 120, themeColors.green],
        ];
      let x = 180;
      parts.forEach(([label, units, color], i) => {
        const q = i === 0 ? metadata : total,
          ww = ((1500 * units) / 3200) * q;
        if (q > 0) api.rect(ctx, x, 450, ww, 135, color);
        x += (1500 * units) / 3200;
        drawCompleteText(ctx, api, label, 180 + i * 395, 710, 26, color);
        drawCompleteText(ctx, api, number(units), 180 + i * 395, 765, 35, color);
      });
      if (resultComplete('ce-skill-metadata', 2))
        drawCompleteText(ctx, api, 'metadata480', 180, 875, 34, themeColors.yellow);
      if (resultComplete('ce-skill-total', 2))
        drawCompleteText(ctx, api, '480 +2,200 +400 +120 =3,200', 180, 965, 40, themeColors.green);
    }
    drawCompleteFooter(
      ctx,
      api,
      'Assigned accounting units; six installed skill bodies do not all enter this model call.',
    );
  });
  return true;
}
export default {
  id: 'skills-disclosure',
  draw: drawSkillsDisclosure,
  cues: [
    'ce-skills-disclosure-1',
    'ce-skills-disclosure-2',
    'ce-skill-script-output',
    'ce-skill-body',
    'ce-skill-reference',
    'ce-skills-disclosure-3',
    'ce-skill-metadata',
    'ce-skill-total',
  ],
};
