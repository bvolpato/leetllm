import { COSTS, MAY_EVIDENCE } from '../fixtures.mjs';
import { APRIL_POLICY } from '../model.mjs';
import { cellText, chapterText, footer, outlineBox } from '../defaults.mjs';
export function drawHoldout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('holdout-model', () => {
    if (currentBeat === 2)
      cellText(
        ctx,
        api,
        'May AUC  0.882     ·     Booster workload  ' +
          (MAY_EVIDENCE[0].tp + MAY_EVIDENCE[0].fp) +
          ' alerts',
        960,
        259,
        themeColors.cyan,
        38,
      );
    api.focus.target('holdout-object-april-threshold-55', () => {
      outlineBox(ctx, api, 260, 330, 1450, 100, themeColors.cyan);
      cellText(ctx, api, 'Booster', 365, 393, themeColors.yellow, 35);
      cellText(ctx, api, '50 trees', 605, 393, themeColors.ink, 31);
      cellText(ctx, api, 't = ' + APRIL_POLICY.threshold, 1100, 393, themeColors.cyan, 28);
      cellText(ctx, api, 'May', 1600, 393, themeColors.cyan, 32);
    });
    api.focus.target('holdout-simulation-57', () => {
      if (currentBeat === 0) {
        const [booster, , heartbeat] = MAY_EVIDENCE;
        for (const [i, policy] of [booster, heartbeat].entries()) {
          const x = 580 + 760 * i;
          cellText(ctx, api, i ? 'Heartbeat rule' : 'Booster', x, 602, themeColors.ink, 43);
          cellText(ctx, api, policy.tp + policy.fp + ' alerts', x, 747, themeColors.cyan, 81);
        }
      } else
        MAY_EVIDENCE.forEach((r, i) => {
          const y = 565 + i * 170,
            label = ['Booster', 'Alert all', 'Heartbeat'][i];
          chapterText(
            ctx,
            api,
            label,
            250,
            y,
            29,
            [themeColors.green, themeColors.blue, themeColors.pink][i],
          );
          chapterText(
            ctx,
            api,
            `TP ${r.tp} · FP ${r.fp} · FN ${r.fn} · TN ${r.tn}`,
            650,
            y - 50,
            27,
            themeColors.ink,
          );
          const parts = [
            {
              cost: r.fp * COSTS.falseAlarm,
              label: r.fp + ' × ' + COSTS.falseAlarm + ' = ' + r.fp * COSTS.falseAlarm,
              col: themeColors.blue,
            },
            {
              cost: r.fnStandard * COSTS.standardMiss,
              label:
                r.fnStandard +
                ' × ' +
                COSTS.standardMiss +
                ' = ' +
                r.fnStandard * COSTS.standardMiss,
              col: themeColors.pink,
            },
            {
              cost: r.fnPriority * COSTS.priorityMiss,
              label:
                r.fnPriority +
                ' × ' +
                COSTS.priorityMiss +
                ' = ' +
                r.fnPriority * COSTS.priorityMiss,
              col: themeColors.yellow,
            },
          ];
          let offset = 0;
          api.focus.target('holdout-object-cost-units-62', () => {
            for (const part of parts) {
              const w = (part.cost / 1100) * 970;
              if (w) {
                api.rect(ctx, 650 + offset, y - 25, w, 48, part.col);
                chapterText(
                  ctx,
                  api,
                  part.label,
                  650 + offset + w / 2,
                  y + 65,
                  23,
                  part.col,
                  'center',
                );
              }
              offset += w;
            }
            chapterText(ctx, api, r.cost + ' units', 1660, y + 8, 27, themeColors.ink);
          });
        });
    });
    footer(
      ctx,
      api,
      currentBeat === 0
        ? 'Alerts sent on the same 140 May jobs'
        : 'Blue = false alarm     ·     Pink = missed standard deadline     ·     Yellow = missed priority deadline',
    );
  });
}
export default {
  id: 'holdout',
  draw: drawHoldout,
  cues: [
    'holdout-beat-1-focus-1',
    'holdout-beat-1-focus-2',
    'holdout-beat-2-focus-1',
    'holdout-beat-2-focus-2',
    'holdout-beat-3-focus-1',
  ],
};
