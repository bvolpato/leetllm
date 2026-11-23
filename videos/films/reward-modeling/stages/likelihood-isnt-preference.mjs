import { LIKELIHOOD_FIXTURE } from '../fixtures.mjs';
import { likelihoodConstruction } from '../model.mjs';
import { arrow, badge, label, panel } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    v = likelihoodConstruction(state);
  api.focus.target('shared-request', () =>
    badge(api, ctx, LIKELIHOOD_FIXTURE.context, 960, 280, api.C.cyan, 35),
  );
  badge(
    api,
    ctx,
    'TOY TOKENIZER · fixed 3-token answers · supplied probabilities',
    960,
    335,
    api.C.muted,
    27,
  );
  for (const [answerIndex, answer] of v.answers.entries()) {
    const x = 150 + answerIndex * 890,
      cx = x + 370;
    panel(api, ctx, x, 375, 740, 485, api.C.blue);
    badge(api, ctx, answer.id, cx, 420, api.C.blue, 36);
    answer.pieces.forEach((piece, i) =>
      api.focus.target(`likelihood-piece-${i + 1}`, () => {
        const y = 457 + i * 108,
          p = v.pieceProgress[i];
        panel(api, ctx, x + 30, y, 410, 65, api.C.muted);
        if (p > 0) {
          api.rect(ctx, x + 33, y + 3, 404 * p, 59, api.C.blue, undefined, 8);
          label(api, ctx, piece, x + 235, y + 42, 29, p >= 1 ? api.C.bg : api.C.ink, 'center');
        } else badge(api, ctx, `piece ${i + 1}`, x + 235, y + 42, api.C.muted, 28);
        badge(
          api,
          ctx,
          p >= 1 ? answer.probabilities[i].toFixed(2) : 'P pending',
          x + 585,
          y + 43,
          p >= 1 ? api.C.yellow : api.C.muted,
          p >= 1 ? 37 : 26,
        );
        if (p > 0 && p < 1) {
          arrow(api, ctx, x + 454, y + 33, x + 454 + 58 * p, y + 33, api.C.yellow, 3);
        }
      }),
    );
    api.focus.target('likelihood-products', () => {
      const count = v.pieceProgress.filter((p) => p >= 1).length;
      const factors = answer.probabilities.slice(0, count).map((p) => p.toFixed(2));
      const value =
        count < 3
          ? count
            ? answer.prefixProducts[count - 1].toFixed(2)
            : null
          : v.productReady
            ? answer.product.toFixed(2)
            : '?';
      badge(
        api,
        ctx,
        count ? `${factors.join(' × ')} = ${value}` : 'Sequence probability pending',
        cx,
        825,
        v.productReady ? api.C.yellow : api.C.ink,
        count === 3 ? 35 : 30,
      );
    });
  }
  api.focus.target('likelihood-ranking', () =>
    badge(
      api,
      ctx,
      v.productReady
        ? 'WRITER LIKELIHOOD: B > A'
        : beat === 0
          ? 'Which complete answer gets more probability?'
          : 'Multiplying the supplied factors…',
      960,
      925,
      v.productReady ? api.C.yellow : api.C.ink,
      37,
    ),
  );
  api.focus.target('human-label', () =>
    badge(
      api,
      ctx,
      v.humanReady ? 'APPROVAL RULE: A > B' : 'Human comparison uses the approval rule',
      960,
      1000,
      v.humanReady ? api.C.green : api.C.muted,
      34,
    ),
  );
}

export function drawLikelihoodIsntPreference(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'likelihood-isnt-preference',
  draw: drawLikelihoodIsntPreference,
  cues: [
    'likelihood-first-piece',
    'likelihood-second-piece',
    'likelihood-third-piece',
    'likelihood-product-result',
    'likelihood-rule-choice',
  ],
};
