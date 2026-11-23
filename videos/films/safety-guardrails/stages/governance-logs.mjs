import { guardCue } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
import { createHash } from 'node:crypto';
export function paintGovernanceLogs(ctx, scene, state, api, themeColors, currentBeat) {
  if (currentBeat === 0) {
    const { C, text, line } = api;
    api.focus.target('governance-event', () => {
      text(ctx, 'Incident note sent for review', 125, 298, 42, C.ink);
      const fields = [
        ['Host trace', 'evt_12345'],
        ['Outcome', 'allowed_with_redaction'],
        ['Policy', 'incident-assistant-v3'],
      ];
      fields.forEach(([name, value], i) => {
        const y = 400 + 104 * i;
        text(ctx, name, 125, y, 30, C.muted);
        text(ctx, value, 445, y, 36, C.cyan, 'left', 'mono');
      });
      text(ctx, 'Operational receipt', 125, 740, 31, C.muted);
      text(ctx, 'Raw contact fields omitted', 125, 815, 37, C.ink);
    });
    line(ctx, 970, 270, 970, 854, C.muted, 2);
    api.focus.target('governance-hash', () => {
      text(ctx, 'If we also stored a prompt hash', 1050, 298, 38, C.ink);
      const hash =
        createHash('sha256').update('Did the tests pass?').digest('hex').slice(0, 12) + '…';
      const matched = guardCue(state, 'governance-logs-hash', 0) === 1;
      ['R51', 'R52'].forEach((trace, i) => {
        const y = 465 + 134 * i;
        text(ctx, trace, 1050, y, 39, C.blue);
        text(ctx, matched ? hash : 'Same question', 1260, y, 37, C.ink, 'left', 'mono');
      });
      if (matched) text(ctx, 'One digest links both records.', 1050, 809, 36, C.yellow);
    });
  } else {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'governance-scope',
      'EU AI Act · applicable high-risk duties',
      [
        'provider / deployer logs under their control',
        'purpose-appropriate retention',
        'applicable law can provide otherwise',
      ],
      155,
      285,
      1610,
      250,
      themeColors.yellow,
      33,
    );
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'governance-retention',
      'At least 6 months under those provisions · no blanket raw-prompt rule',
      960,
      620,
      33,
      themeColors.yellow,
      'center',
    );
    withGuardMechanismFocus(ctx, api, 'governance-timeline', () => {
      drawGuardMechanismLine(ctx, api, themeColors, 190, 760, 1720, 760, themeColors.muted, 4);
      [600, 1400].forEach((x) =>
        drawGuardMechanismLine(ctx, api, themeColors, x, 740, x, 785, themeColors.cyan, 4),
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Dec 2027',
        600,
        835,
        33,
        themeColors.cyan,
        'center',
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'specified Annex III high-risk rules',
        600,
        900,
        27,
        themeColors.muted,
        'center',
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Aug 2028',
        1400,
        835,
        33,
        themeColors.cyan,
        'center',
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Annex I product rules',
        1400,
        900,
        27,
        themeColors.muted,
        'center',
      );
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Article source check: October 10, 2026    ·    NIST framework: voluntary',
    );
  }
}
export function drawGovernanceLogs(ctx, scene, state, api) {
  return paintGovernanceLogs(ctx, scene, state, api, api.C, state.beat ?? 0);
}
export default {
  id: 'governance-logs',
  draw: drawGovernanceLogs,
  cues: [
    'governance-logs-record',
    'governance-logs-hash',
    'governance-logs-scope',
    'governance-logs-retention',
    'governance-logs-dates',
  ],
};
