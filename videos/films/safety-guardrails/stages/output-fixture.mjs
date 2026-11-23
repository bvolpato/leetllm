import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismLines,
  drawGuardMechanismNote,
  drawGuardMechanismStatus,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintOutputFixture(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  if (currentBeat === 0) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'output-redaction',
      'Local output fixture',
      ['Email alice@example.com when done.'],
      150,
      300,
      1620,
      160,
      themeColors.blue,
      34,
    );
    const redact = cueProgress('output-fixture-redact', 0);
    if (redact > 0) {
      drawGuardMechanismArrow(ctx, api, themeColors, 520, 480, 520, 535, themeColors.green);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        redact === 1 ? 'Email [EMAIL] when done.' : 'Replacing the detected email…',
        190,
        600,
        36,
        themeColors.green,
      );
    }
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'output-literal',
      'toxicity stub = 0.02 · no approval-store lookup',
      190,
      705,
      30,
      themeColors.muted,
    );
    const literal = cueDone('output-fixture-literal', 0);
    drawGuardMechanismStatus(
      ctx,
      api,
      themeColors,
      'output-literal',
      literal
        ? '“deploy payment-service” → approval_required'
        : 'Proposed action: deploy payment-service to prod.',
      190,
      775,
      1540,
      literal ? themeColors.pink : themeColors.yellow,
    );
  } else {
    withGuardMechanismFocus(ctx, api, 'output-counterexamples', () => {
      const q = cueProgress('output-fixture-paraphrase', 1);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Two samples for the text reviewer',
        170,
        310,
        32,
        themeColors.cyan,
      );
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        [
          '“Planned release of payment-service to prod.”',
          'Literal phrase found? ' + (q === 1 ? 'NO' : '?'),
          '“The glossary entry is ‘deploy payment-service’.”',
          'Literal phrase found? ' + (q === 1 ? 'YES' : '?'),
        ],
        170,
        400,
        35,
        (i) => (i === 1 ? themeColors.pink : i === 3 ? themeColors.yellow : themeColors.ink),
        90,
      );
    });
    withGuardMechanismFocus(ctx, api, 'output-channels', () => {
      drawGuardMechanismLine(ctx, api, themeColors, 1200, 340, 1200, 830, themeColors.yellow, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'TEXT CHANNEL',
        1390,
        365,
        26,
        themeColors.blue,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'phrase review',
        1390,
        430,
        31,
        themeColors.blue,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'TOOL CHANNEL',
        1390,
        655,
        26,
        themeColors.pink,
      );
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        ['deploy(service, prod)', 'trusted authorization'],
        1250,
        720,
        29,
        themeColors.pink,
        65,
      );
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'A release proposal passes. A glossary entry is held. Neither calls a tool.',
    );
  }
}
export function drawOutputFixture(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintOutputFixture(ctx, scene, state, api, themeColors, currentBeat, cueProgress, cueDone);
}
export default {
  id: 'output-fixture',
  draw: drawOutputFixture,
  cues: [
    'output-fixture-redact',
    'output-fixture-literal',
    'output-fixture-paraphrase',
    'output-fixture-separate',
  ],
};
