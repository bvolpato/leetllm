import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLines,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintSensitiveFormats(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
) {
  if (currentBeat === 0) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'sensitive-spans',
      'Original local text',
      ['INC-2048 · alice@example.com', 'Call +1-555-123-4567'],
      160,
      300,
      1600,
      230,
      themeColors.blue,
      37,
    );
    const q = cueProgress('sensitive-formats-incident', 0);
    withGuardMechanismFocus(ctx, api, 'sensitive-spans', () => {
      if (q > 0) {
        drawGuardMechanismArrow(ctx, api, themeColors, 960, 555, 960, 620, themeColors.green);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          q === 1
            ? 'INC-2048 · [EMAIL] · [PHONE]'
            : 'Replace contact fields; retain the incident ID',
          960,
          690,
          40,
          themeColors.green,
          'center',
        );
      }
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'sensitive-types',
      'email / phone pattern · contextual names · SSN ranges · card Luhn',
      960,
      865,
      30,
      themeColors.yellow,
      'center',
    );
  } else if (currentBeat === 1) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'sensitive-token',
      'Credential formats covered by these recognizers',
      ['Slack demo token  ·  invented example format', 'classic GitHub token pattern → one format'],
      155,
      300,
      1610,
      260,
      themeColors.yellow,
      33,
    );
    withGuardMechanismFocus(ctx, api, 'sensitive-miss', () => {
      const checked = cueProgress('sensitive-formats-miss', 1) === 1;
      api.text(ctx, 'Before sending text to an outside service', 185, 656, 37, themeColors.ink);
      api.text(ctx, 'New format: build token', 185, 772, 34, themeColors.blue);
      api.text(ctx, 'Recognizer coverage: untested', 866, 772, 34, themeColors.cyan);
      if (checked)
        api.text(ctx, 'Keep the build token on the host.', 185, 883, 36, themeColors.yellow);
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Test each credential format before sending data to an outside service.',
    );
  } else {
    const q = cueProgress('sensitive-formats-reverse', 2),
      original = 'AA alice@example.com BB +1-555-123-4567 CC';
    withGuardMechanismFocus(ctx, api, 'sensitive-offsets', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Original offsets stay fixed',
        170,
        300,
        34,
        themeColors.cyan,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        original,
        170,
        410,
        33,
        themeColors.ink,
        'left',
        true,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'email [3,20)                    phone [24,39)',
        170,
        485,
        28,
        themeColors.yellow,
        'left',
        true,
      );
      const step = q < 0.5 ? 0 : q < 1 ? 1 : 2;
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        [
          step >= 1
            ? '1. AA alice@example.com BB [PHONE] CC'
            : '1. Replace the rightmost original span first',
          step >= 2 ? '2. AA [EMAIL] BB [PHONE] CC' : '2. Then replace the earlier original span',
        ],
        170,
        625,
        34,
        themeColors.green,
        110,
        true,
      );
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'sensitive-path',
      'Configured recognizer + actual NLP path → exercised detector → reviewed errors',
      960,
      900,
      30,
      themeColors.yellow,
      'center',
    );
  }
}
export function drawSensitiveFormats(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintSensitiveFormats(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
}
export default {
  id: 'sensitive-formats',
  draw: drawSensitiveFormats,
  cues: [
    'sensitive-formats-incident',
    'sensitive-formats-types',
    'sensitive-formats-token',
    'sensitive-formats-miss',
    'sensitive-formats-reverse',
    'sensitive-formats-path',
  ],
};
