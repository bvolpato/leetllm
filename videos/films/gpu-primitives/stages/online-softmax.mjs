import { FIRST } from '../fixtures.mjs';
import { onlineRescale } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawOnlineSoftmax(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.06, 0.94);
  {
    if (currentBeat === 0) {
      api.focus.target('online-softmax-first-chunk-2-1', () =>
        card(ctx, api, 'First chunk [2, 1]', 180, 330, 580, themeColors.blue, 1, 90, 33),
      );
      components.fade(phaseForBeat(0), () => {
        api.focus.target('online-softmax-math-m-2', () =>
          equation(ctx, api, 'm=2', 1130, 370, 44, themeColors.cyan),
        );
        api.focus.target('online-softmax-math-1-e-1-1-368', () =>
          equation(ctx, api, '\\ell=1+e^{-1}\\approx 1.368', 1130, 485, 44, themeColors.yellow),
        );
      });
    } else {
      const snapshot = onlineRescale(currentBeat === 1 ? (state.beatP ?? 0) : 1);
      if (currentBeat === 1 && state.cues?.['online-new-maximum'])
        snapshot.stage = [
          ['online-new-maximum', 1],
          ['online-rescale-prior', 2],
          ['online-add-incoming', 3],
          ['online-combined-result', 4],
        ].reduce((stage, [cue, next]) => (api.focus.progress(cue, 0) > 0 ? next : stage), 0);
      api.focus.target('online-softmax-prior-state-m-2-first-denominator-tofixed-3', () =>
        card(
          ctx,
          api,
          'Prior state · m = 2, ℓ ≈ ' + FIRST.denominator.toFixed(3),
          180,
          330,
          660,
          themeColors.blue,
          1,
          96,
          31,
        ),
      );
      api.focus.target('online-softmax-incoming-logits-4-0', () =>
        card(ctx, api, 'Incoming logits · [4, 0]', 180, 625, 660, themeColors.pink, 1, 96, 34),
      );
      const massQ =
        currentBeat > 1
          ? 1
          : (state.cues?.['online-rescale-prior']?.progress ?? api.phase(progress, 0.3, 0.55));
      const oldWidth = 520 * (1 + (Math.exp(-2) - 1) * api.clamp(massQ));
      api.rect(ctx, 230, 520, oldWidth, 48, themeColors.blue, undefined, 4);
      text(ctx, api, 'Same old exponential mass', 490, 600, 27, themeColors.blue);
      if (snapshot.stage >= 3) {
        api.rect(
          ctx,
          230,
          755,
          (520 / FIRST.denominator) * snapshot.newContribution,
          48,
          themeColors.cyan,
          undefined,
          4,
        );
        text(ctx, api, 'New mass at reference m = 4', 490, 830, 27, themeColors.cyan);
      }
      if (snapshot.stage >= 1)
        api.focus.target('online-softmax-math-m-2-4-4', () =>
          equation(ctx, api, 'm^{\\prime}=\\max(2,4)=4', 1220, 365, 42, themeColors.pink),
        );
      if (snapshot.stage >= 2)
        api.focus.target('online-softmax-math-e-2-4-1-368-snapshot-oldcontribution-tofixed-3', () =>
          equation(
            ctx,
            api,
            'e^{2-4}\\times 1.368\\approx ' + snapshot.oldContribution.toFixed(3),
            1220,
            510,
            38,
            themeColors.cyan,
          ),
        );
      if (snapshot.stage >= 3)
        api.focus.target('online-softmax-math-e-4-4-e-0-4-snapshot-newcontribution-tofixed-3', () =>
          equation(
            ctx,
            api,
            'e^{4-4}+e^{0-4}\\approx ' + snapshot.newContribution.toFixed(3),
            1220,
            655,
            38,
            themeColors.yellow,
          ),
        );
      if (snapshot.stage >= 4)
        api.focus.target(
          'online-softmax-math-snapshot-oldcontribution-tofixed-3-snapshot-newcontribution-tofixed',
          () =>
            equation(
              ctx,
              api,
              '\\ell^{\\prime}=' +
                snapshot.oldContribution.toFixed(3) +
                '+' +
                snapshot.newContribution.toFixed(3) +
                '\\approx ' +
                snapshot.total.toFixed(3),
              960,
              860,
              43,
              themeColors.green,
            ),
        );
    }
  }
}
export default {
  id: 'online-softmax',
  draw: drawOnlineSoftmax,
  cues: [
    'online-softmax-beat-1-focus-1',
    'online-softmax-beat-2-focus-1',
    'online-new-maximum',
    'online-rescale-prior',
    'online-add-incoming',
    'online-combined-result',
    'online-softmax-beat-3-focus-1',
  ],
};
