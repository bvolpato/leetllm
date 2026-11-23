import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

const outcomes = [
  [1, 0, 1, 0],
  [0, 0, 0, 0],
  [0, 1, 0, 0],
];

export function drawEvaluationProtocol(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  const mean = heard(state, 'dec-evaluation-mean', 1, 0.67);
  const any = heard(state, 'dec-evaluation-any', 1, 0.92);
  const counted = heard(state, 'evaluation-counts', 3, 0.3);
  const n = b < 2 ? 1 : 3;
  api.focus.target('draft-outcomes', () => {
    coreText(ctx, api, 'One row per held-out prompt', 140, 280, 42, C.ink, 'left');
    coreText(ctx, api, 'Four drafts per prompt', 900, 390, 32, C.muted);
    for (let i = 0; i < n; i++) {
      const y = 455 + i * 145;
      coreText(ctx, api, 'Prompt ' + ['A', 'B', 'C'][i], 140, y + 50, 40, C.ink, 'left');
      const row = outcomes[i];
      const dealt =
        b === 0
          ? 0
          : b === 1
            ? Math.floor(4 * movement(state, 'evaluation-deal', 1, 0.1, 0.48))
            : 4;
      row.forEach((value, j) => {
        const x = 490 + j * 236;
        const shown = j < dealt;
        const tone = shown ? (value ? C.green : C.muted) : C.blue;
        api.rect(ctx, x, y, 190, 76, C.panel, tone, 6);
        coreText(
          ctx,
          api,
          shown ? (value ? 'correct' : 'wrong') : 'draft ' + (j + 1),
          x + 95,
          y + 50,
          31,
          tone,
        );
      });
      if (any && (b === 1 || counted))
        coreText(
          ctx,
          api,
          'any success = ' + Number(row.some(Boolean)),
          1450,
          y + 50,
          32,
          C.yellow,
          'left',
        );
    }
    if (b === 0) {
      coreText(
        ctx,
        api,
        'Status answer   →   compare with the deployment record',
        960,
        716,
        40,
        C.ink,
      );
      coreText(
        ctx,
        api,
        'Same model, prompts, evidence, budget, stopping rule and scorer',
        960,
        902,
        32,
        C.muted,
      );
    } else if (b === 1) {
      const right = outcomes[0].reduce((s, v) => s + v, 0);
      coreText(
        ctx,
        api,
        mean
          ? right + ' correct drafts / ' + outcomes[0].length + ' = 50%'
          : 'How often is one draft correct?',
        960,
        721,
        43,
        mean ? C.green : C.ink,
      );
      coreText(
        ctx,
        api,
        'DeepSeek-R1 evaluation     T = 0.6     top-p = 0.95',
        960,
        904,
        31,
        C.muted,
      );
    } else {
      const right = outcomes.flat().filter(Boolean).length;
      const covered = outcomes.filter((row) => row.some(Boolean)).length;
      const note = counted
        ? right +
          ' / ' +
          outcomes.flat().length +
          ' drafts correct   ·   ' +
          covered +
          ' / ' +
          outcomes.length +
          ' prompts with any correct draft'
        : 'How many drafts are correct? How many prompts have a correct draft?';
      coreText(ctx, api, note, 960, 958, 38, counted ? C.green : C.ink);
    }
  });
}
export default {
  id: 'evaluation-protocol',
  draw: drawEvaluationProtocol,
  cues: [
    'evaluation-task',
    'evaluation-deal',
    'dec-evaluation-mean',
    'dec-evaluation-any',
    'evaluation-more',
    'evaluation-counts',
  ],
};
