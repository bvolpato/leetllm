import { ADVANTAGES, CANDIDATES, REWARDS, rewardMean, sharedCreditUpdate } from '../arithmetic.mjs';
import { CLAMP_CASES } from '../fixtures.mjs';
import { drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
import { timedScene } from '../timed-scene.mjs';

function probabilityBars(ctx, api, time) {
  const { C: themeColors, teaching } = api;
  const tied = time.done(2, 2);
  const advantages = tied ? REWARDS.map(() => 0) : ADVANTAGES;
  const p = time.progress(2, 1);
  const update = sharedCreditUpdate(p, advantages);
  drawOriginalText(
    ctx,
    api,
    tied
      ? 'Tied-reward probe · fresh θ = 0 · reward-only update'
      : 'One shared parameter θ · four candidate slots · softmax(θ f)',
    960,
    280,
    33,
    themeColors.blue,
    'center',
  );
  api.focus.target('group-credit-probability-state', () =>
    advantages.forEach((adv, i) => {
      const x = 230 + i * 400,
        color = tied ? themeColors.cyan : adv > 0 ? themeColors.green : themeColors.pink;
      drawOriginalText(ctx, api, 'Completion ' + i, x + 140, 365, 29, color, 'center');
      drawOriginalText(
        ctx,
        api,
        'A = ' + (adv > 0 ? '+' : '') + adv.toFixed(1),
        x + 140,
        425,
        30,
        themeColors.yellow,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'z = ' + update.logits[i].toFixed(3),
        x + 140,
        485,
        29,
        color,
        'center',
      );
      api.rect(ctx, x, 550, 280, 250, themeColors.panel, themeColors.muted, 4);
      api.line(
        ctx,
        x,
        800 - (0.25 / 0.4) * 250,
        x + 280,
        800 - (0.25 / 0.4) * 250,
        themeColors.muted,
        2,
      );
      teaching.changeCue(
        {
          x: x - 12,
          y: 535,
          width: 304,
          height: 360,
          from: 0.25,
          to: update.probabilities[i],
          progress: 1,
          emphasis: !tied && p > 0 && p < 1 ? 0.6 : 0,
          color,
        },
        () => {
          api.rect(
            ctx,
            x,
            800 - (update.probabilities[i] / 0.4) * 250,
            280,
            (update.probabilities[i] / 0.4) * 250,
            color,
            undefined,
            4,
          );
          drawOriginalText(
            ctx,
            api,
            (100 * update.probabilities[i]).toFixed(2) + '%',
            x + 140,
            860,
            34,
            color,
            'center',
          );
        },
      );
    }),
  );
  api.focus.target('group-credit-reward-gradient', () =>
    drawOriginalEquation(
      ctx,
      api,
      'f=[1,-1,1,-1],\\quad \\partial J_{reward}/\\partial\\theta=\\tfrac14\\sum_i A_if_i=' +
        update.gradient.toFixed(1) +
        ',\\quad \\eta=0.25',
      960,
      950,
      31,
    ),
  );
  if (tied)
    api.focus.target('group-credit-auxiliary-gradient', () =>
      drawOriginalEquation(
        ctx,
        api,
        '\\nabla J=\\underbrace{0}_{reward}+\\underbrace{\\nabla J_{aux}}_{separate\\ objective}',
        960,
        995,
        28,
        themeColors.yellow,
      ),
    );
}

const names = ['min(max(x, lo), hi)', 'max(min(x, lo), hi)', 'min(max(x, lo), hi)', 'x'];
const fixtureOrder = [2, 0, 1, 3, 4];

export default timedScene('group-credit', [4, 3, 4], (ctx, api, time) => {
  if (time.beat === 2) return probabilityBars(ctx, api, time);
  const { C, focus } = api;
  const at = (i) => 695 + i * 155;
  const revealAll = time.done(0, 3);
  focus.target('group-checks', () => {
    api.text(ctx, 'Returned value for each fixture', 130, 246, 36, C.ink);
    api.text(ctx, 'Function body', 130, 427, 34, C.muted);
    names.forEach((name, i) => api.text(ctx, name, 130, 530 + i * 106, 36, C.ink, 'left', 'mono'));
    fixtureOrder.forEach((fixtureIndex, j) => {
      const [x, lo, hi, expected] = CLAMP_CASES[fixtureIndex];
      const visible = j === 0 ? time.done(0, 1) : j === 1 ? time.done(0, 2) : revealAll;
      const cx = at(j);
      focus.target(j === 0 ? 'group-above' : j === 1 ? 'group-below' : 'group-remaining', () => {
        api.text(ctx, 'x = ' + x, cx, 322, 31, C.ink, 'center');
        api.text(ctx, '[' + lo + ', ' + hi + ']', cx, 367, 28, C.blue, 'center');
        api.text(ctx, 'want ' + expected, cx, 425, 28, C.yellow, 'center');
        CANDIDATES.forEach((fn, i) => {
          const result = fn(x, lo, hi);
          api.text(
            ctx,
            visible ? String(result) : '·',
            cx,
            532 + i * 106,
            47,
            visible ? (result === expected ? C.green : C.pink) : C.muted,
            'center',
          );
        });
      });
    });
  });
  focus.target('group-rewards', () => {
    api.text(ctx, 'Reward', 1508, 425, 31, C.ink, 'center');
    REWARDS.forEach((r, i) =>
      api.text(ctx, revealAll ? String(r) : '?', 1508, 532 + i * 106, 47, C.ink, 'center'),
    );
  });
  if (time.beat === 1) {
    focus.target('group-mean', () => {
      api.text(
        ctx,
        'Mean reward   (1 + 0 + 1 + 0) / 4' + (time.done(1, 1) ? '  =  ' + rewardMean : ''),
        130,
        986,
        40,
        C.cyan,
      );
    });
    focus.target('group-advantages', () => {
      api.text(ctx, 'Advantage', 1730, 425, 31, C.yellow, 'center');
      ADVANTAGES.forEach((a, i) =>
        api.text(
          ctx,
          time.done(1, 2) ? (a > 0 ? '+' : '') + a : '?',
          1730,
          532 + i * 106,
          47,
          C.yellow,
          'center',
        ),
      );
    });
  }
});
