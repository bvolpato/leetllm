import { speculativeAcceptance } from '../arithmetic.mjs';
import { capacityEvent } from '../construction.mjs';
import {
  drawArrow,
  drawCapacityCard,
  drawCapacityText,
  drawCells,
  drawCenteredText,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawSpeculativeContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('speculative-contract-mechanism', () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Draft sequentially · target verifies every drafted prefix',
        960,
        300,
        34,
        themeColors.yellow,
      );
      ['prefix', 'draft 0', 'draft 1', 'bonus distribution'].forEach((v, i) => {
        drawCapacityCard(
          ctx,
          api,
          v,
          160 + i * 430,
          470,
          370,
          140,
          i === 0 ? themeColors.blue : i === 3 ? themeColors.green : themeColors.cyan,
          32,
        );
        if (i < 3) drawArrow(ctx, api, 550 + i * 430, 540, 570 + i * 430, 540, themeColors.muted);
      });
      if (done('rule', 0))
        drawCenteredText(
          ctx,
          api,
          'accept proposed token x when u < min(1,p(x)/q(x))',
          960,
          850,
          38,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      const rows = [
        {
          label: 'proposed 0',
          p: [0.7, 0.3],
          q: [0.8, 0.2],
          u: 0.5,
          token: 0,
          name: 'first',
        },
        {
          label: 'proposed 1',
          p: [0.2, 0.8],
          q: [0.3, 0.7],
          u: 0.9,
          token: 1,
          name: 'second',
        },
      ];
      rows.forEach((r, i) => {
        const y = 390 + i * 220,
          m = speculativeAcceptance(r.p, r.q, r.token, r.u);
        drawCapacityText(ctx, api, r.label, 150, y + 55, 31, themeColors.blue);
        drawCells(
          ctx,
          api,
          r.q.map((v) => 'q ' + v),
          500,
          y,
          190,
          100,
          themeColors.cyan,
        );
        drawCells(
          ctx,
          api,
          r.p.map((v) => 'p ' + v),
          940,
          y,
          190,
          100,
          themeColors.green,
        );
        drawCapacityText(ctx, api, 'u = ' + r.u, 1410, y + 38, 29, themeColors.yellow);
        api.rect(ctx, 1410, y + 56, 280, 18, themeColors.panel, themeColors.muted, 0);
        api.rect(ctx, 1410, y + 56, 280 * m.threshold, 18, themeColors.green, undefined, 0);
        drawLine(
          ctx,
          api,
          1410 + 280 * r.u,
          y + 50,
          1410 + 280 * r.u,
          y + 80,
          themeColors.yellow,
          3,
        );
        if (done(r.name, 1))
          drawCapacityText(
            ctx,
            api,
            'threshold ' + m.threshold.toFixed(3) + ' · accept',
            1410,
            y + 100,
            27,
            themeColors.green,
          );
      });
      drawCenteredText(ctx, api, 'Output', 440, 930, 31, themeColors.muted);
      drawCells(
        ctx,
        api,
        [done('first', 1) ? 0 : null, done('second', 1) ? 1 : null, done('bonus', 1) ? 1 : null],
        640,
        875,
        190,
        110,
        themeColors.green,
      );
      if (done('bonus', 1))
        drawCenteredText(
          ctx,
          api,
          'bonus target [0.4,0.6], u=0.5 → ID1',
          960,
          815,
          28,
          themeColors.green,
        );
    } else {
      const m = speculativeAcceptance([0, 1], [1, 0], 0, 0.5);
      drawCenteredText(
        ctx,
        api,
        'New forced-rejection premise · q=[1,0], p=[0,1]',
        960,
        300,
        33,
        themeColors.yellow,
      );
      drawCells(
        ctx,
        api,
        done('reject', 2) ? ['rejected 0', 'discarded tail'] : ['draft 0', 'later proposal'],
        260,
        430,
        300,
        115,
        done('reject', 2) ? themeColors.pink : themeColors.cyan,
      );
      if (done('reject', 2)) {
        drawCenteredText(
          ctx,
          api,
          'threshold 0 · discard proposal and all drafted tail',
          960,
          630,
          34,
          themeColors.pink,
        );
      }
      if (begun('residual', 2)) {
        drawCells(
          ctx,
          api,
          ['max(0,0−1)=0', 'max(0,1−0)=1'],
          330,
          740,
          620,
          100,
          themeColors.green,
        );
      }
      if (done('correction', 2))
        drawCenteredText(
          ctx,
          api,
          'normalize residual [0,1] → correction ID1',
          960,
          950,
          36,
          themeColors.green,
        );
    }
    drawFooter(
      ctx,
      api,
      'Use the same accepted prefix when comparing draft and target probabilities',
    );
  });
}
export default {
  id: 'speculative-contract',
  draw: drawSpeculativeContract,
  cues: [
    'ic-speculative-contract-proposal',
    'ic-speculative-contract-rule',
    'ic-speculative-contract-first',
    'ic-speculative-contract-second',
    'ic-speculative-contract-bonus',
    'ic-speculative-contract-reject',
    'ic-speculative-contract-residual',
    'ic-speculative-contract-correction',
  ],
};
