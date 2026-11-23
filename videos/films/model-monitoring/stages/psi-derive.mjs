import { current, psi, psiTerms, reference } from '../fixtures.mjs';
import { chip, cueVisible, footer, line, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (key) => state.cues?.[`m-${'psi-derive'}-${key}`]?.phase === 'after';
  {
    const labels = ['0–4 h', '4–12 h', '12–24 h', '24 h+'];
    if (currentBeat <= 1) {
      labels.forEach((label, i) => {
        const x = 155 + i * 425;
        panel(
          ctx,
          api,
          x,
          285,
          390,
          455,
          i === 3 && cueVisible(ctx, api, 'psi-derive', 'share')
            ? themeColors.yellow
            : themeColors.muted,
        );
        text(ctx, api, label, x + 195, 335, 28, themeColors.muted);
        text(
          ctx,
          api,
          `e ${reference[i].toFixed(2)}  →  a ${current[i].toFixed(2)}`,
          x + 195,
          400,
          29,
          themeColors.blue,
        );
        const visible = i === 0 ? done('subtract') : done('terms');
        if (visible)
          text(
            ctx,
            api,
            `a − e = ${(current[i] - reference[i]).toFixed(2)}`,
            x + 195,
            465,
            29,
            themeColors.cyan,
          );
        if (i === 0 ? done('log') : done('terms'))
          text(
            ctx,
            api,
            `ln(a/e) = ${Math.log(current[i] / reference[i]).toFixed(3)}`,
            x + 195,
            530,
            27,
            themeColors.pink,
          );
        if (i === 0 ? done('product') : done('terms')) {
          const h = psiTerms[i] * 500;
          api.rect(ctx, x + 50, 735 - h, 290, h, i === 3 ? themeColors.yellow : themeColors.cyan);
          text(ctx, api, psiTerms[i].toFixed(3), x + 195, 735 - h - 22, 32, themeColors.ink);
        }
      });
      if (cueVisible(ctx, api, 'psi-derive', 'total')) {
        let x = 300;
        psiTerms.forEach((v, i) => {
          api.rect(
            ctx,
            x,
            805,
            (v / psi) * 1150,
            48,
            i === 3 ? themeColors.yellow : i === 0 ? themeColors.blue : themeColors.cyan,
          );
          x += (v / psi) * 1150;
        });
        text(ctx, api, `Σ = ${psi.toFixed(3)}`, 1610, 842, 35, themeColors.yellow);
      }
      footer(
        ctx,
        api,
        done('share')
          ? '24 h+ supplies 56.2% of the total; every positive-share term is nonnegative.'
          : 'Multiply the signed share change by the signed log ratio.',
      );
    } else if (currentBeat === 2) {
      text(ctx, api, 'Jeffreys divergence = KL(a ∥ e) + KL(e ∥ a)', 960, 300, 40, themeColors.blue);
      chip(ctx, api, 'A', 180, 470, 130, themeColors.cyan);
      chip(ctx, api, 'B', 870, 470, 130, themeColors.cyan);
      chip(ctx, api, 'C', 1580, 470, 130, themeColors.cyan);
      line(ctx, api, 310, 503, 870, 503, themeColors.muted, 4);
      line(ctx, api, 1000, 503, 1580, 503, themeColors.muted, 4);
      text(ctx, api, 'two-step total = 0.135', 960, 620, 35, themeColors.cyan);
      line(ctx, api, 245, 760, 1645, 760, themeColors.yellow, 9);
      text(ctx, api, 'direct A → C = 0.270', 960, 715, 35, themeColors.yellow);
      if (cueVisible(ctx, api, 'psi-derive', 'triangle'))
        text(
          ctx,
          api,
          '0.270 > 0.135 · triangle inequality fails',
          960,
          850,
          37,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        'Historical cutoffs are heuristics. The local 0.20 rule is an inspection policy.',
      );
    } else {
      const rows = [
        ['e = 0', 'a = 0', cueVisible(ctx, api, 'psi-derive', 'empty') ? 'contribution 0' : '—'],
        [
          'e = 0',
          'a > 0',
          cueVisible(ctx, api, 'psi-derive', 'infinity') ? 'infinite divergence' : '—',
        ],
        ['empty window', 'zero observed rows', 'invalid window'],
      ];
      rows.forEach((r, i) => {
        const y = 335 + i * 130;
        chip(ctx, api, r[0], 180, y, 360, themeColors.blue);
        chip(ctx, api, r[1], 650, y, 390, themeColors.cyan);
        chip(ctx, api, r[2], 1150, y, 560, i === 1 ? themeColors.yellow : themeColors.muted);
      });
      if (cueVisible(ctx, api, 'psi-derive', 'smooth')) {
        text(ctx, api, 'add the same pseudocount to every bin', 960, 800, 33, themeColors.pink);
        text(
          ctx,
          api,
          'renormalize each whole window → a different diagnostic',
          960,
          860,
          30,
          themeColors.pink,
        );
      }
      footer(
        ctx,
        api,
        'Fixed bins hide within-bin and joint changes; repeated alerts need their own policy.',
      );
    }
  }
}
export function drawPsiDerive(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('psi-derive-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'psi-derive',
  draw: drawPsiDerive,
  cues: [
    'psi-derive-beat-0',
    'm-psi-derive-subtract',
    'm-psi-derive-log',
    'm-psi-derive-product',
    'psi-derive-beat-1',
    'm-psi-derive-terms',
    'm-psi-derive-total',
    'm-psi-derive-share',
    'psi-derive-beat-2',
    'm-psi-derive-triangle',
    'psi-derive-beat-3',
    'm-psi-derive-empty',
    'm-psi-derive-infinity',
    'm-psi-derive-smooth',
  ],
};
