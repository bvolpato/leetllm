import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawMinpEvidence(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('dec-minp-evidence-mechanism', () => {
    if (state.beat === 0) {
      coreText(ctx, api, 'Why try min-p?', 160, 350, 48, C.blue, 'left');
      coreText(
        ctx,
        api,
        'Heating the row gives rare words more of the pool.',
        160,
        447,
        48,
        C.ink,
        'left',
      );
      if (movement(state, 'dec-minp-evidence-1', 0, 0.48, 0.75) > 0) {
        coreText(ctx, api, 'What did the later comparison find?', 160, 682, 48, C.cyan, 'left');
        if (heard(state, 'dec-minp-finding', 0, 0.92))
          coreText(
            ctx,
            api,
            'No reliable gain in quality and variety on those tasks.',
            160,
            780,
            48,
            C.ink,
            'left',
          );
      }
      return;
    }
    coreText(ctx, api, 'Top-p', 905, 325, 52, C.blue);
    coreText(ctx, api, 'Min-p', 1480, 325, 52, C.cyan);
    const rows = [
      ['Input', 'Same writing prompts'],
      ['Model', 'Same checkpoint'],
      ['Tuning', 'Same budget'],
      ['Scoring', 'Same judges and rubric'],
    ];
    const reveal = movement(state, 'dec-minp-evidence-2', 1, 0.25, 0.76);
    rows.slice(0, 2 + Math.floor(2 * reveal)).forEach(([name, value], i) => {
      const y = 455 + i * 111;
      coreText(ctx, api, name, 205, y, 38, C.muted, 'left');
      coreText(ctx, api, value, 905, y, 39, C.ink);
      coreText(ctx, api, value, 1480, y, 39, C.ink);
    });
    if (reveal === 1)
      coreText(
        ctx,
        api,
        'How coherent are the drafts? How much do they vary?',
        960,
        944,
        41,
        C.yellow,
      );
  });
}

export default {
  id: 'minp-evidence',
  draw: drawMinpEvidence,
  cues: ['dec-minp-evidence-1', 'dec-minp-finding', 'dec-minp-evidence-2'],
};
