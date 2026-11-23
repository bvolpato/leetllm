import { freshAuditFixture } from '../model.mjs';
import { code, datum, detailText, focusProgress, footer, label } from '../defaults.mjs';
export function drawFreshAudit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%';
  api.focus.target('cau-fresh-audit-mechanism', () => {
    const filtered = q('fresh-assistant-count'),
      f = freshAuditFixture(filtered),
      rateA = done('fresh-assistant-rate'),
      rateC = done('fresh-control');
    label(
      ctx,
      api,
      'Fresh full ledger · 8 successes + 12 failures in each arm',
      960,
      280,
      themeColors.ink,
      32,
    );
    f.arms.forEach((arm, i) => {
      const yy = 350 + i * 260,
        color = i ? themeColors.pink : themeColors.cyan;
      detailText(ctx, api, arm.arm, 160, yy + 36, 30, color);
      arm.full.forEach((t, j) => {
        const x = 180 + (j % 10) * 68,
          y = yy + 65 + Math.floor(j / 10) * 66;
        api.rect(ctx, x, y, 56, 48, t.resolved ? themeColors.green : themeColors.red, undefined, 5);
        code(ctx, api, t.id, x + 28, y + 33, 26, themeColors.bg, 'center');
      });
      detailText(
        ctx,
        api,
        filtered > 0 ? 'Selected audit' : 'Before the new filter',
        1050,
        yy + 36,
        29,
        color,
      );
      arm.selected.forEach((t, j) => {
        const x = 1050 + (j % 10) * 68,
          y = yy + 65 + Math.floor(j / 10) * 66;
        api.rect(ctx, x, y, 56, 48, t.resolved ? themeColors.green : themeColors.red, undefined, 5);
        code(ctx, api, t.id, x + 28, y + 33, 26, themeColors.bg, 'center');
      });
      datum(
        ctx,
        api,
        `${arm.successes}/${arm.count} = ${pc(arm.rate, 0)}`,
        1400,
        yy + 225,
        i ? rateC : rateA,
        color,
        32,
      );
    });
    datum(
      ctx,
      api,
      'Assistant − control: −40 points',
      960,
      940,
      done('fresh-audit-difference'),
      themeColors.yellow,
      38,
    );
    footer(
      ctx,
      api,
      'The omitted successes keep their original outcomes in the full ledger. No workflow effect changed.',
    );
  });
}
export default {
  id: 'fresh-audit',
  draw: drawFreshAudit,
  cues: [
    'cau-fresh-audit-0',
    'cau-fresh-audit-1',
    'cau-fresh-control',
    'cau-fresh-assistant-count',
    'cau-fresh-assistant-rate',
    'cau-fresh-audit-difference',
    'cau-fresh-audit-2',
  ],
};
