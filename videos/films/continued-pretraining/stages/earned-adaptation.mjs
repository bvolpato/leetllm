import { phraseProgress } from '../construction.mjs';
import { drawCheckpointRuler } from '../checkpoint-ruler.mjs';
import { FRESH_CHECKPOINTS } from '../fixtures.mjs';
import { chooseCheckpoint, freshReductionFrame, mixtureReduction } from '../model.mjs';

function drawFreshWindow(ctx, state, api) {
  const { C } = api;
  const { weights, share, gradient } = freshReductionFrame(state);
  const example = mixtureReduction(4, 2, 3, 1);
  const counted = phraseProgress(state, 'cpt-fresh-share', 1) > 0;
  const scored = phraseProgress(state, 'cpt-fresh-pooled', 1, 0.2, 0.4) > 0;
  const block = phraseProgress(state, 'cpt-fresh-block', 1, 0.5, 0.65);
  const repair = phraseProgress(state, 'cpt-fresh-repair', 1, 0.75, 0.9);
  const width = 1480 / 14;
  api.text(ctx, 'New window at logit zero', 170, 300, 42, C.ink);
  api.focus.target('fresh-window', () => {
    let index = 0;
    for (let group = 0; group < 6; group++) {
      const domain = group < 4;
      const n = domain ? 3 : 1;
      const x = 188 + index * width + group * 14;
      const col = domain ? C.cyan : C.yellow;
      api.text(
        ctx,
        domain ? 'Field ' + (group + 1) : 'R' + (group - 3),
        x + (n * width) / 2,
        422,
        34,
        col,
        'center',
      );
      api.line(ctx, x + 3, 690, x + n * width - 3, 690, col, 3);
      for (let k = 0; k < n; k++, index++) {
        const h = counted ? 1130 * weights[index] : 40;
        api.rect(ctx, x + k * width + 6, 660 - h, width - 12, h, col, undefined, 2);
      }
    }
    api.text(ctx, 'Field target gradient   −0.5', 188, 765, 35, C.cyan);
    api.text(ctx, 'Replay target gradient   +0.5', 1735, 765, 35, C.yellow, 'right');
    if (counted) {
      const equalTargets = block === 0 || repair === 1;
      const mode = equalTargets ? 'Equal weight per target' : 'Equal weight per block';
      api.text(ctx, mode + '   ·   bar height = target weight', 188, 870, 32, C.muted);
      const fraction = equalTargets ? example.nr + '/' + example.total : '2/6';
      const settled = (block === 0 || block === 1) && (repair === 0 || repair === 1);
      api.text(
        ctx,
        settled ? 'Replay share   ' + fraction : 'Replay share   ' + (share * 100).toFixed(1) + '%',
        188,
        974,
        47,
        C.ink,
      );
      if (scored)
        api.text(
          ctx,
          'Mean gradient   ' + gradient.toFixed(3).replace('-', '−'),
          1725,
          974,
          44,
          C.ink,
          'right',
        );
    } else {
      api.text(
        ctx,
        'Pool all scored targets. What is replay’s share? What is the mean gradient?',
        960,
        946,
        38,
        C.ink,
        'center',
      );
    }
  });
}

export function drawEarnedAdaptation(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) return drawFreshWindow(ctx, state, api);
  const winner = chooseCheckpoint(FRESH_CHECKPOINTS, 18, 1);
  if (state.beat < 5) {
    const gated = phraseProgress(state, 'fresh-gate', 3) >= 1;
    const ranked = phraseProgress(state, 'fresh-winner', 4) >= 1;
    drawCheckpointRuler(ctx, api, {
      rows: FRESH_CHECKPOINTS,
      base: 18,
      budget: 1,
      domain: [18, 19.35],
      visibleCount: Math.ceil(FRESH_CHECKPOINTS.length * phraseProgress(state, 'fresh-ledger', 2)),
      gated,
      ranked,
      message: ranked
        ? 'C and A tie at 78%. C has the lower domain perplexity.'
        : gated
          ? 'A and C tie on the task. Which has the lower domain perplexity?'
          : 'Gate general PPL, then rank task accuracy. Lower domain PPL breaks a tie. Which wins?',
    });
    return;
  }
  api.text(ctx, 'Reserved incident  /  AUTH_TIMEOUT', 170, 269, 39, C.yellow, 'left', 'mono');
  api.text(ctx, 'How should we retry token reissue?', 170, 350, 58, C.ink);
  api.focus.target('reserved-assistants', () => {
    api.text(ctx, 'Base + supervised tuning', 170, 439, 38, C.blue);
    api.text(ctx, 'Checkpoint ' + winner.label + ' + same tuning', 970, 439, 38, C.cyan);
    api.text(
      ctx,
      'Same runbook: add jitter to retries and reuse the idempotency token.',
      170,
      515,
      35,
      C.ink,
    );
  });
  const example = phraseProgress(state, 'reserved-example', 5, 0.48, 0.6) > 0;
  if (!example) return;
  api.focus.target('sample-reply', () => {
    api.rect(ctx, 170, 565, 1580, 190, C.panel, undefined, 16);
    api.text(ctx, 'Practice reply', 210, 626, 32, C.muted);
    api.text(
      ctx,
      '“Wait exactly one second. Retry with the same idempotency token.”',
      210,
      707,
      44,
      C.ink,
    );
  });
  const kept = phraseProgress(state, 'reserved-token', 6, 0.04, 0.18) >= 1;
  const missed = phraseProgress(state, 'reserved-delay', 6, 0.2, 0.36) >= 1;
  api.focus.target('token-check', () => {
    api.text(ctx, 'Idempotency token', 195, 855, 38, C.ink);
    api.text(
      ctx,
      kept ? 'Pass  /  same token' : 'Meets requirement?',
      195,
      927,
      40,
      kept ? C.green : C.muted,
    );
  });
  api.focus.target('jitter-check', () => {
    api.text(ctx, 'Jittered retry', 965, 855, 38, C.ink);
    api.text(
      ctx,
      missed ? 'Miss  /  fixed delay' : 'Meets requirement?',
      965,
      927,
      40,
      missed ? C.pink : C.muted,
    );
  });
  if (phraseProgress(state, 'reserved-decision', 6, 0.65, 0.75) > 0)
    api.focus.target('deployment-check', () => {
      api.text(
        ctx,
        'Keep C if it handles incidents better and passes the general checks.',
        960,
        1020,
        36,
        C.ink,
        'center',
      );
    });
}

export default {
  id: 'earned-adaptation',
  draw: drawEarnedAdaptation,
  cues: [
    'fresh-count',
    'cpt-fresh-share',
    'cpt-fresh-pooled',
    'cpt-fresh-block',
    'cpt-fresh-repair',
    'fresh-ledger',
    'fresh-gate',
    'fresh-winner',
    'fresh-reserved',
    'reserved-example',
    'reserved-token',
    'reserved-delay',
    'reserved-decision',
  ],
};
