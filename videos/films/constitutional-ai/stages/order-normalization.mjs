import { orderAudit } from '../fixtures.mjs';
import { chapterFrame, logicalState } from '../construction.mjs';
import {
  drawAuditCard,
  drawAuditEquation,
  drawAuditText,
  drawBlock,
  drawFooter,
  withFocus,
} from '../defaults.mjs';
export function drawOrderNormalization(ctx, scene, state, api) {
  state = logicalState('order-normalization', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = chapterFrame('order-normalization', state);
    if (currentBeat === 0) {
      const { forwardA, swappedB, swappedA, meanA } = orderAudit;
      const { C } = api;
      const t = (s, x, y, size, color = C.ink, align = 'left') =>
        api.text(ctx, s, x, y, size, color, align);
      t('A   Portal answer', 165, 282, 40, C.green);
      t('B   Disclose timeline', 1015, 282, 40, C.pink);
      const left = 560;
      const width = 1170;
      withFocus(ctx, api, 'remapped-votes', () => {
        for (const [order, ready, share, firstId, secondId, y] of [
          [1, f.first, forwardA, 'A', 'B', 392],
          [2, f.swapped, swappedB, 'B', 'A', 542],
        ]) {
          t('Ballot ' + order, 165, y + 51, 46);
          if (!ready) {
            api.line(ctx, left, y + 68, left + width, y + 68, C.muted, 2);
            continue;
          }
          const firstColor = order === 1 ? C.green : C.pink;
          const secondColor = order === 1 ? C.pink : C.green;
          drawBlock(ctx, api, left, y, width * share, 77, firstColor);
          drawBlock(ctx, api, left + width * share, y, width * (1 - share), 77, secondColor);
          t(
            firstId + ' ' + share.toFixed(2),
            left + (width * share) / 2,
            y + 52,
            36,
            C.bg,
            'center',
          );
          t(
            order === 2 && !f.remapped ? 'A pending' : secondId + ' ' + (1 - share).toFixed(2),
            left + (width * (1 + share)) / 2,
            y + 52,
            36,
            C.bg,
            'center',
          );
        }
      });
      if (f.remapped) {
        drawAuditEquation(ctx, api, '1-0.70=0.30', 1530, 682, 35, C.green);
        t('Average share for A', 165, 791, 43);
        drawAuditEquation(
          ctx,
          api,
          f.mean ? 'P(A)=(0.80+0.30)/2=0.55' : 'P(A)=(0.80+0.30)/2=?',
          1145,
          783,
          48,
          C.green,
        );
        if (f.mean) {
          drawBlock(ctx, api, left, 848, (width * forwardA) / 2, 46, C.green);
          drawBlock(
            ctx,
            api,
            left + (width * forwardA) / 2 + 2,
            848,
            (width * swappedA) / 2 - 2,
            46,
            C.green,
          );
          api.line(ctx, left, 904, left + width, 904, C.muted, 2);
          t(meanA.toFixed(2), left + width * meanA, 950, 33, C.green, 'center');
        }
      }
      if (f.mean)
        drawFooter(
          ctx,
          api,
          'Send both ballots for review. The preference switched when the order changed.',
        );
    } else {
      const active = f.clamp;
      drawAuditText(
        ctx,
        api,
        'One principle · one graded preference',
        960,
        315,
        38,
        themeColors.ink,
        'center',
      );
      withFocus(ctx, api, 'label-limit', () => {
        api.line(ctx, 300, 555, 1620, 555, themeColors.muted, 4);
        for (const [v, label] of [
          [0.4, '0.40'],
          [0.6, '0.60'],
        ]) {
          api.line(ctx, 300 + 1320 * v, 500, 300 + 1320 * v, 610, themeColors.yellow, 4);
          drawAuditText(ctx, api, label, 300 + 1320 * v, 665, 31, themeColors.yellow, 'center');
        }
        const raw = 0.95,
          clamped = raw + (0.6 - raw) * active;
        api.circle(ctx, 300 + 1320 * clamped, 555, 18, themeColors.green);
        drawAuditText(
          ctx,
          api,
          active === 1
            ? 'CoT target clamped to 0.60'
            : active > 0
              ? 'Clamping target · current ' + clamped.toFixed(3)
              : 'Illustrative overconfident CoT target 0.95',
          960,
          770,
          34,
          themeColors.green,
          'center',
        );
      });
      drawAuditText(
        ctx,
        api,
        'Calibrated correctness still requires independent evidence',
        960,
        900,
        32,
        themeColors.pink,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'Original study’s clamped CoT targets · separate from the q = 0.8 teaching update',
      );
    }
  }
}
export default {
  id: 'order-normalization',
  draw: drawOrderNormalization,
  cues: [
    'order-first',
    'order-swapped',
    'order-remap',
    'order-normalization-1',
    'order-normalization-2',
    'clamp-target',
  ],
};
