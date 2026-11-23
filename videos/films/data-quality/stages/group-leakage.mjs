import { referenceSplit } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionLine,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawGroupLeakage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const v = drawConstructionP(ctx, api, `${'group-leakage'}-voice-${currentBeat + 1}`);
  api.focus.target('group-leakage-construction', () => {
    if (currentBeat < 2) {
      const op = currentBeat === 0 ? v : drawConstructionP(ctx, api, 'group-ticket-override'),
        wrong = currentBeat === 1 && op > 0;
      drawConstructionText(
        ctx,
        api,
        wrong
          ? 'Change only the hash input: conversation → ticket ID'
          : 'Reference rule: hash the conversation key, without the film seed',
        160,
        300,
        32,
        wrong ? themeColors.yellow : themeColors.cyan,
      );
      [
        ['ticket', 190],
        ['conversation', 400],
        ['hash input', 840],
        ['prefix', 1140],
        ['bucket', 1450],
        ['split', 1640],
      ].forEach(([label, x]) =>
        drawConstructionText(ctx, api, label, x, 365, 24, themeColors.muted),
      );
      const rows = [
        {
          id: 301,
          key: 'build-001',
        },
        {
          id: 315,
          key: 'build-001',
        },
        {
          id: 303,
          key: 'build-005',
        },
        {
          id: 304,
          key: 'build-006',
        },
      ];
      rows.forEach((r, i) => {
        const y = 435 + i * 115,
          key = wrong ? String(r.id) : r.key,
          tr = referenceSplit(key),
          q =
            currentBeat === 0
              ? api.phase(op, 0.15 + i * 0.08, 0.42 + i * 0.08)
              : wrong
                ? api.phase(op, i * 0.12, 0.6 + i * 0.12)
                : 1;
        drawConstructionText(ctx, api, r.id, 190, y, 35, themeColors.cyan);
        drawConstructionText(ctx, api, r.key, 400, y, 32, themeColors.blue, 'left', true);
        drawConstructionText(ctx, api, key, 840, y, 32, themeColors.yellow, 'left', true);
        drawConstructionArrow(ctx, api, 720, y - 10, 800, y - 10, themeColors.muted);
        drawConstructionText(
          ctx,
          api,
          q > 0.15 ? tr.prefix : '?',
          1140,
          y,
          30,
          q > 0.15 ? themeColors.muted : themeColors.yellow,
          'left',
          true,
        );
        drawConstructionText(ctx, api, q > 0.55 ? tr.bucket : '?', 1450, y, 32, themeColors.ink);
        drawConstructionText(
          ctx,
          api,
          q === 1 ? tr.split : '?',
          1640,
          y,
          31,
          q === 1
            ? tr.split === 'train'
              ? themeColors.green
              : tr.split === 'test'
                ? themeColors.pink
                : themeColors.yellow
            : themeColors.muted,
        );
        if (q > 0 && q < 1) api.circle(ctx, 1100 + q * 450, y + 30, 6, themeColors.yellow);
      });
      drawConstructionNote(
        ctx,
        api,
        wrong
          ? 'The same conversation can now cross the held-out boundary.'
          : 'Stable group assignment does not guarantee exact row or label proportions.',
      );
    } else {
      drawConstructionText(
        ctx,
        api,
        'One prediction clock · information must be available',
        160,
        300,
        34,
        themeColors.cyan,
      );
      const x = (t) => 350 + t * 600;
      drawConstructionLine(ctx, api, x(0), 620, x(2), 620, themeColors.muted, 4);
      [0, 1, 2].forEach((d) =>
        drawConstructionText(
          ctx,
          api,
          ['today', 'tomorrow', 'later evaluation'][d],
          x(d),
          700,
          29,
          themeColors.muted,
          'center',
        ),
      );
      drawConstructionLine(ctx, api, x(0), 520, x(0), 650, themeColors.yellow, 3);
      drawConstructionSheet(ctx, api, 'prediction', 'Ticket arrives', 150, 385, 390);
      drawConstructionSheet(ctx, api, 'future outcome', 'Incident resolved', 950, 385, 600);
      if (drawConstructionP(ctx, api, 'group-time-cutoff') > 0) {
        drawConstructionArrow(ctx, api, 1110, 550, 490, 550, themeColors.pink);
        drawConstructionLine(ctx, api, 620, 505, 680, 595, themeColors.pink, 5);
        drawConstructionLine(ctx, api, 680, 505, 620, 595, themeColors.pink, 5);
        drawConstructionText(
          ctx,
          api,
          'Unavailable at prediction time',
          960,
          840,
          39,
          themeColors.pink,
          'center',
        );
      }
      drawConstructionNote(
        ctx,
        api,
        'Group policy, time policy and training-only preprocessing guard distinct paths.',
      );
    }
  });
}
export default {
  id: 'group-leakage',
  draw: drawGroupLeakage,
  cues: [
    'group-leakage-b1',
    'group-leakage-voice-1',
    'group-leakage-b2',
    'group-leakage-voice-2',
    'group-ticket-override',
    'group-leakage-b3',
    'group-leakage-voice-3',
    'group-time-cutoff',
  ],
};
