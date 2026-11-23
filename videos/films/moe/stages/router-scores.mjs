import { ROUTER_LOGITS, ROUTING } from '../fixtures.mjs';
import { routerScoreSnapshot } from '../construction.mjs';
import { line, link, math, node, rect, text } from '../defaults.mjs';
export function drawRouterScores(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const fade = api.components.fade;
  {
    const fallback = routerScoreSnapshot(beat, bp),
      logitP = api.focus.progress('project-router-logits', stage(0, 0.2, 0.9)),
      softmaxP = api.focus.progress('router-softmax', fallback.softmax ? 1 : 0),
      softmax = state.cues ? state.cues['router-softmax']?.phase === 'after' : softmaxP > 0;
    const current = {
      softmax,
      zeroX: softmax ? 1040 : 1590,
      rows: (softmax ? ROUTING.probabilities : ROUTER_LOGITS).map((value, i) => {
        const width = softmax ? value * 790 : -value * 150;
        return {
          value,
          width,
          x: softmax ? 1040 : 1590 - width,
          opacity: softmax ? softmaxP : api.phase(logitP, i * 0.14, 0.4 + i * 0.14),
        };
      }),
    };
    const hidden = {
      x: 145,
      y: 360,
      width: 320,
      height: 330,
    };
    const router = {
      x: 590,
      y: 410,
      width: 220,
      height: 220,
    };
    link(ctx, api, hidden, router, themeColors.cyan, 4);
    api.focus.target('token-hidden-state', () => {
      node(ctx, api, hidden, '', themeColors.cyan);
      api.container(
        ctx,
        hidden,
        () => {
          math(ctx, api, String.raw`x`, 305, 430, 54, themeColors.cyan, 'center');
          [1, 0, 0, 0].forEach((value, i) => {
            rect(ctx, api, 175 + i * 66, 490, 52, 80, themeColors.bg, themeColors.cyan, 7);
            text(ctx, api, value, 201 + i * 66, 543, 32, themeColors.cyan, 'center', 'mono');
          });
          text(ctx, api, 'hidden state', 305, 638, 30, themeColors.muted, 'center');
        },
        {
          padding: 20,
        },
      );
    });
    api.focus.target('router-projection', () => {
      node(ctx, api, router, '', themeColors.blue);
      math(ctx, api, String.raw`W_gx`, 700, 540, 58, themeColors.blue, 'center');
      text(ctx, api, 'learned projection', 700, 715, 28, themeColors.muted, 'center');
    });
    api.focus.target('expert-scores', () => {
      text(
        ctx,
        api,
        current.softmax ? 'SOFTMAX (ROUNDED)' : 'ROUTER LOGITS',
        1375,
        285,
        32,
        themeColors.muted,
        'center',
      );
      line(ctx, api, current.zeroX, 325, current.zeroX, 825, themeColors.muted, 2);
      text(ctx, api, '0', current.zeroX, 305, 28, themeColors.muted, 'center');
      for (let i = 0; i < 4; i += 1) {
        const y = 365 + i * 130;
        text(ctx, api, `E${i + 1}`, 965, y + 45, 34, colors[i]);
        const row = current.rows[i];
        fade(row.opacity, () => {
          rect(ctx, api, row.x, y, row.width, 58, colors[i], undefined, 7);
          text(
            ctx,
            api,
            row.value.toFixed(current.softmax ? 3 : 2),
            1710,
            y + 42,
            34,
            colors[i],
            'right',
            'mono',
          );
        });
      }
    });
    api.focus.reveal('router-softmax', () =>
      api.focus.target('softmax-normalization', () =>
        math(
          ctx,
          api,
          String.raw`p_i=\frac{e^{z_i}}{\sum_j e^{z_j}}`,
          1375,
          925,
          44,
          themeColors.ink,
          'center',
        ),
      ),
    );
  }
}
export default {
  id: 'router-scores',
  draw: drawRouterScores,
  cues: [
    'router-hidden-state',
    'project-router-logits',
    'router-softmax',
    'expert-probability-shares',
    'expert-identities',
  ],
};
