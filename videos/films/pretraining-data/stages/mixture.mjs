import { DOCUMENT_DRAWS } from '../fixtures.mjs';
import { documentSample } from '../arithmetic.mjs';
import { mixtureSnapshot } from '../model.mjs';
import { legacyCard, legacyEquation, legacyText, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingOriginalMixture(ctx, scene, state, api, C, c, t, b, p, s) {
  const current = mixtureSnapshot(b, p, state.cues),
    probability = current.probabilities,
    tokens = current.shares;
  if (current.prediction) {
    legacyText(
      ctx,
      api,
      C,
      'Target: 50% code tokens · 50% prose tokens',
      960,
      300,
      37,
      C.yellow,
      'center',
    );
    api.focus.target('mixture-prediction-facts', () => {
      legacyCard(ctx, api, C, c, 'Code document: 100 tokens', 250, 445, 620, C.pink);
      legacyCard(ctx, api, C, c, 'Prose document: 900 tokens', 1050, 445, 620, C.blue);
      legacyCard(ctx, api, C, c, 'Whole-document draws: ?', 250, 670, 620, C.cyan);
      legacyCard(ctx, api, C, c, 'Equal-token-block draws: ?', 1050, 670, 620, C.cyan);
    });
    legacyText(
      ctx,
      api,
      C,
      'Choose the sampling unit before choosing its source probabilities',
      960,
      940,
      31,
      C.muted,
      'center',
    );
    return;
  }
  legacyText(
    ctx,
    api,
    C,
    current.blocks ? 'Equal-length token-block sampler' : 'Whole-document sampler',
    960,
    290,
    42,
    C.ink,
    'center',
  );
  legacyText(
    ctx,
    api,
    C,
    current.blocks ? 'Source block draw probability' : 'Document draw probability',
    570,
    370,
    32,
    C.blue,
    'center',
  );
  legacyText(ctx, api, C, 'Expected token share', 1390, 370, 32, C.cyan, 'center');
  api.focus.target('draw-probabilities', () =>
    t.bars({
      x: 300,
      y: 470,
      width: 540,
      height: 280,
      values: probability,
      labels: ['Code', 'Prose'],
      colors: [C.pink, C.blue],
      max: 1,
      showValues: true,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      fontSize: 30,
      gap: 130,
    }),
  );
  api.focus.target('token-shares', () =>
    t.bars({
      x: 1120,
      y: 470,
      width: 540,
      height: 280,
      values: tokens,
      labels: ['Code', 'Prose'],
      colors: [C.pink, C.blue],
      max: 1,
      showValues: true,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      fontSize: 30,
      gap: 130,
    }),
  );
  api.focus.target('weighted-mixture', () =>
    legacyEquation(
      ctx,
      api,
      C,
      String.raw`w_i=\frac{p_i L_i}{\sum_j p_jL_j}`,
      960,
      925,
      48,
      C.yellow,
      'center',
    ),
  );
  if (current.blocks) {
    api.focus.target('mixture-block-contract', () => {
      legacyText(
        ctx,
        api,
        C,
        'Code block: 100 tokens · prose block: 100 tokens',
        960,
        840,
        30,
        C.cyan,
        'center',
      );
      legacyText(
        ctx,
        api,
        C,
        'Whole-document reference: 90/10 draws → 50/50 tokens',
        960,
        1030,
        27,
        C.muted,
        'center',
      );
    });
  }
}
export function paintPretrainingMainMixture(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  const blocks = D('blocks');
  const probability = (50 + Math.round(40 * P('rebalance')) - Math.round(40 * P('even'))) / 100;
  const lengths = [100, blocks ? 100 : 900];
  const sample = documentSample(probability, lengths);
  const visible = Math.floor(5 * P('draws')) + Math.floor(5 * P('pages'));
  const mass = [0, 0];
  const bottom = 778,
    cellHeight = 40,
    pitch = 135,
    left = 306;
  api.text(
    ctx,
    blocks ? 'Draw one 100-token block' : 'Draw one whole document',
    145,
    265,
    41,
    C.ink,
  );
  api.text(
    ctx,
    'Code ' + Math.round(probability * 100) + '% of draws',
    1740,
    265,
    37,
    C.pink,
    'right',
  );
  api.text(ctx, 'Each tile holds 100 retained tokens', 145, 345, 31, C.muted);
  api.text(ctx, '900', left - 34, bottom - cellHeight * 8 + 7, 30, C.muted, 'right');
  api.text(ctx, '100', left - 34, bottom - 2, 30, C.muted, 'right');
  DOCUMENT_DRAWS.forEach((d, i) => {
    const x = left + pitch * i;
    const kind = sample.categories[i];
    const color = kind ? C.blue : C.pink;
    if (i < visible) {
      mass[kind] += lengths[kind];
      for (let j = 0; j < lengths[kind] / 100; j++) {
        api.rect(ctx, x + 22, bottom - j * cellHeight - 28, 75, 33, color, undefined, 4);
      }
    }
    api.line(ctx, x + 9, bottom + 18, x + 109, bottom + 18, C.muted, 2);
    api.text(ctx, d.uniform.toFixed(2), x + 60, bottom + 58, 27, C.muted, 'center');
  });
  api.text(ctx, 'Draw value', left - 24, bottom + 58, 27, C.muted, 'right');
  api.text(ctx, 'Code   ' + mass[0] + ' tokens', 560, 906, 42, C.pink, 'center');
  api.text(ctx, 'Prose   ' + mass[1] + ' tokens', 1335, 906, 42, C.blue, 'center');
  let question = 'Choose code when the draw value is below its probability.';
  if (beg('ask')) question = 'How many 100-token programs balance one 900-token page?';
  if (D('nine')) question = 'Target: nine short programs for one long page.';
  if (beg('rebalance'))
    question = 'The same ten draw values, with a higher chance of choosing code.';
  if (D('rebalance'))
    question = 'Nine short documents and one long document supply equal token mass.';
  if (blocks)
    question = 'How many of ten equal blocks should come from code for a 50% token share?';
  if (D('five')) question = 'Target: five of the ten equal blocks from code.';
  if (beg('even')) question = 'Return the code probability to 50%.';
  if (D('even')) question = 'Five code blocks and five prose blocks have equal length.';
  api.text(ctx, question, 960, 1000, 32, C.ink, 'center');
}
export function drawMixtureStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainMixture);
}
export default {
  id: 'mixture',
  draw: drawMixtureStage,
  cues: [
    'pt-mixture-draws',
    'pt-mixture-pages',
    'pt-mixture-ask',
    'pt-mixture-nine',
    'pt-mixture-rebalance',
    'pt-mixture-blocks',
    'pt-mixture-five',
    'pt-mixture-even',
  ],
};
