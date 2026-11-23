import { puctWorksheet, visitScore } from '../arithmetic.mjs';
import { beatCue } from '../construction.mjs';

export function drawPuctAllocation(ctx, scene, state, api) {
  const { C } = api;
  const updated = beatCue(state, 'puct-update', 2, 0.47).done;
  const replay = beatCue(state, 'puct-zero', 3, 0.01).done;
  const lowered = beatCue(state, 'puct-bad-update', 3, 0.45).done;
  const a = puctWorksheet(updated, lowered ? 0 : 1);
  const b = visitScore(0.5, 0.15, a.parent, 1);
  const bonus = beatCue(state, 'puct-bonus', 1, 0.43);
  const totals = beatCue(state, 'puct-initial', 1, 0.72).done;
  const initialWin = beatCue(state, 'puct-visit', 1, 0.77).done;
  const winAgain = beatCue(state, 'puct-good-result', 2, 0.69).done;
  const lastWin = beatCue(state, 'puct-bad-result', 4, 0.01).done;
  const showWinner = replay ? lastWin : updated ? winAgain : initialWin;
  const gotPrior = beatCue(state, 'puct-priors', 0, 0.65).started;
  const outcome = beatCue(state, 'puct-good', 2, 0.05);
  api.focus.target('puct-history', () => {
    const data = replay
      ? 'A outcomes     ½  +  0'
      : outcome.started
        ? 'A outcomes     ½  +  1'
        : 'Each child has one previous visit worth ½';
    api.text(ctx, data, 140, 287, 44, C.ink);
    api.text(ctx, 'Parent visits   ' + a.parent, 1760, 287, 40, C.muted, 'right');
  });
  api.focus.target('puct-plot', () => {
    const x = 460,
      scale = 1130;
    api.text(ctx, 'Estimated value', x, 383, 32, C.cyan);
    if (bonus.started) api.text(ctx, '+   exploration bonus', x + 380, 383, 32, C.yellow);
    for (const [i, v] of [a, b].entries()) {
      const y = 452 + i * 202;
      api.text(ctx, 'Branch ' + (i ? 'B' : 'A'), 140, y + 45, 49, C.ink);
      api.text(
        ctx,
        v.visits +
          (v.visits === 1 ? ' visit' : ' visits') +
          (gotPrior ? '   /   prior ' + v.prior.toFixed(2) : ''),
        140,
        y + 100,
        30,
        C.muted,
      );
      api.rect(ctx, x, y, scale * v.Q, 59, C.cyan, undefined, 2);
      api.text(ctx, v.Q.toFixed(2), x + 0.5 * scale * v.Q, y + 44, 37, C.bg, 'center');
      if (bonus.started) {
        const w = scale * v.bonus * bonus.p;
        if (w > 1) api.rect(ctx, x + scale * v.Q + 2, y, w, 59, C.yellow, undefined, 2);
        if (bonus.done)
          api.text(
            ctx,
            '+' + v.bonus.toFixed(3),
            x + scale * (v.Q + v.bonus / 2),
            y + 43,
            31,
            C.bg,
            'center',
          );
      }
      if (totals) api.text(ctx, v.total.toFixed(3), x + scale * v.total + 25, y + 46, 41, C.ink);
    }
    const expression = !bonus.started
      ? 'Which branch gets a visit?'
      : replay && !lowered
        ? 'Same visits and priors   /   update A with outcome 0'
        : showWinner
          ? 'Next visit   /   branch ' + (a.total > b.total ? 'A' : 'B')
          : 'Selection = value + prior × √parent visits / (1 + child visits)';
    api.text(ctx, expression, 140, 930, 43, showWinner ? C.green : C.ink);
  });
}

export default {
  id: 'puct-allocation',
  draw: drawPuctAllocation,
  cues: [
    'puct-input',
    'puct-priors',
    'puct-bonus',
    'puct-initial',
    'puct-visit',
    'puct-good',
    'puct-update',
    'puct-good-result',
    'puct-zero',
    'puct-bad-update',
    'puct-bad-result',
  ],
};
