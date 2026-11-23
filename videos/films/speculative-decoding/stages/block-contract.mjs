import { heard } from '../construction.mjs';
import { drawConstructionsBox } from '../defaults.mjs';

export function drawBlockContract(ctx, scene, state, api) {
  const { C } = api;
  const greedy = heard(state, 1, 'sd-block-greedy', 0.66);
  const passedA = heard(state, 0, 'sd-block-contract-b0', 0.14);
  const rejectedB = heard(state, 0, 'sd-block-reject', 0.23);
  const failedA = heard(state, 0, 'sd-block-fail-a', 0.63);
  const passedPair = heard(state, 0, 'sd-block-pair', 0.78);
  const failedFull = heard(state, 0, 'sd-block-full', 0.86);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('sd-block-contract-mechanism', () => {
    text(greedy ? 'Greedy draft' : 'Stochastic draft', 180, 258, 40, C.muted);
    const rows = [
      { name: 'Token tests', tokens: ['A', 'B', 'C'],
        verdicts: [passedA && 'Pass', rejectedB && 'Reject', rejectedB && 'Unreached'],
        result: rejectedB && 'Keep A' },
      { name: 'Prefix tests', tokens: ['A', 'A B', 'A B C'],
        verdicts: [greedy ? 'Pass' : failedA && 'Fail', greedy ? 'Fail' : passedPair && 'Pass',
          failedFull && 'Fail'],
        result: failedFull && (greedy ? 'Keep A' : 'Keep A B') },
    ];
    rows.forEach(({ name, tokens, verdicts, result }, row) => {
      const y = 385 + row * 320;
      text(name, 180, y + 50, 40);
      tokens.forEach((token, i) => {
        const x = 530 + 295 * i;
        const verdict = verdicts[i];
        const color = !verdict || verdict === 'Unreached' ? C.muted
          : verdict === 'Pass' ? C.green : C.pink;
        drawConstructionsBox(ctx, api, token, x, y, 225, color, 86);
        if (verdict) text(verdict, x + 112, y + 155, 36, color, 'center');
      });
      if (result) {
        api.arrow(ctx, 1380, y + 43, 1480, y + 43, C.green, 4);
        text(result, 1520, y + 57, 40, C.green);
      }
    });
  });
}

export default {
  id: 'block-contract', draw: drawBlockContract,
  cues: ['sd-block-contract-b0', 'sd-block-reject', 'sd-block-fail-a', 'sd-block-pair', 'sd-block-full',
    'sd-block-contract-b1', 'sd-block-greedy'],
};
