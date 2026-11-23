import { SHADOW_PIXEL } from '../fixtures.mjs';
import { afterPhrase, blend, decimal, drawPair, worksheet } from '../pixel-study.mjs';

const jump = worksheet(0.36, 0.64);

export function drawRecap(ctx, scene, state, api) {
  const b = state.beat;
  const built = afterPhrase(state, 'shadow-scaled', 1);
  const uncovered = afterPhrase(state, 'shadow-uncover', 3);
  const adding = afterPhrase(state, 'shadow-add', 3);
  const answered = afterPhrase(state, 'shadow-result', 3);
  const end = state.cues?.['shadow-result']?.end;
  const travel =
    answered && Number.isFinite(end) ? api.phase(state.t - end, 0, 0.45) : Number(answered);
  const right = built ? blend(jump.scaled, jump.destination, travel) : null;
  const label =
    travel === 1 ? 'Completed jump' : travel > 0 ? 'Adding the direction' : 'Clean contribution';
  drawPair(ctx, api, {
    selected: SHADOW_PIXEL,
    left: {
      title: uncovered ? 'Forward exposure at 0.64' : 'Input at 0.36',
      pixels: uncovered ? jump.reference : jump.input,
    },
    right: { title: built ? label : 'Destination at 0.64', pixels: right },
    notes:
      b === 0
        ? ['Between the legs', 'Known ε = +0.60', 'η = 0']
        : b === 1
          ? ['Recover clean', '(0 − 0.8 × 0.6) / 0.6', 'Scale by 0.8']
          : [
              'Destination at 0.64',
              adding ? '−0.64 + 0.36' : '−0.64 + 0.6 × (+0.6)',
              answered ? `= ${decimal(jump.destination[SHADOW_PIXEL])}` : '= ?',
            ],
    ruler: { left: -1, right: 0.2, ticks: [-1, -0.8, -0.6, -0.4, -0.2, 0] },
  });
}

export default {
  id: 'recap',
  draw: drawRecap,
  cues: [
    'shadow-input',
    'shadow-scaled',
    'shadow-question',
    'shadow-add',
    'shadow-result',
    'shadow-uncover',
  ],
};
