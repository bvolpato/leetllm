import { cueEnded, cueProgress, focusOn, text } from '../defaults.mjs';
import { drawRiskRuler, riskCheck } from '../risk-ruler.mjs';

const fresh = riskCheck(130, 1000, 1);
const selected = riskCheck(130, 1000, 1000);

export function drawTakeaway(ctx, scene, state, api) {
  const { C } = api;
  const replay = cueEnded(state, 'change-history');
  const freshAnswer = cueEnded(state, 'fresh-end');
  const searchAnswer = cueEnded(state, 'replay-end');
  focusOn(api, 'transfer-ruler', () => {
    text(
      ctx,
      api,
      'P8    ·    130 wrong routes / 1,000 independent tickets    ·    δ = 0.05',
      960,
      270,
      41,
      C.ink,
      'center',
    );
    const rows = [
      {
        name: 'Frozen first',
        detail: 'One prompt scored',
        check: fresh,
        y: 492,
        showObserved: true,
        extension: cueProgress(state, 'fresh-end'),
        showUpper: freshAnswer,
      },
    ];
    if (replay)
      rows.push({
        name: 'Selected here',
        detail: '1,000 prompts scored',
        check: selected,
        y: 685,
        showObserved: true,
        extension: cueProgress(state, 'replay-end'),
        showUpper: searchAnswer,
      });
    drawRiskRuler(ctx, api, {
      min: 0.1,
      max: 0.24,
      ticks: [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24],
      rows,
      axisY: 795,
    });
  });
  focusOn(api, 'transfer-decision', () => {
    let note, question;
    if (replay) {
      note = 'Search allowance = √[ln(2 × 1,000 / 0.05) / (2 × 1,000)]';
      question = 'Does this batch still clear the 20% gate?';
    } else {
      note = 'Fixed allowance = √[ln(2 / 0.05) / (2 × 1,000)]';
      question = 'Does this fresh batch clear the 20% gate?';
    }
    if (state.beat === 0 || state.beat === 2) {
      const radius = replay ? selected.radius : fresh.radius;
      note += '  ≈  ' + (radius * 100).toFixed(2) + ' points';
    }
    if (
      (!replay && cueEnded(state, 'fresh-verdict')) ||
      (replay && cueEnded(state, 'replay-verdict'))
    )
      question = (replay ? selected : fresh).passes
        ? 'Clears the gate on the sampled traffic.'
        : 'Insufficient evidence to clear the gate.';
    if (cueEnded(state, 'new-evidence'))
      note = 'Freeze P8 and score it on fresh tickets from the target queue.';
    text(ctx, api, note, 960, 939, 32, C.muted, 'center');
    text(ctx, api, question, 960, 1014, 45, searchAnswer ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: [
    'transfer-question',
    'fresh-end',
    'fresh-verdict',
    'change-history',
    'replay-end',
    'replay-verdict',
    'new-evidence',
  ],
};
