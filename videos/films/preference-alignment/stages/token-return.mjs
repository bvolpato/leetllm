import { prefBound, prefLerp } from '../arithmetic.mjs';
import { alignmentGae } from '../model.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
  line,
  signedValue,
} from '../defaults.mjs';
export function drawTokenReturn(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue token-return/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'Charge every sampled token; insert the sequence reward only once');
      const xs = [240, 780, 1320],
        charge = cueProgress('token-return-b0', 0),
        terminal = cueProgress('pa-terminal-once', 0);
      for (let i = 0; i < 3; i++) {
        const x = xs[i];
        cell(ctx, api, 'token ' + i, x, 405, 430, 85, themeColors.blue, 35);
        if (i < 2) api.arrow(ctx, x + 440, 447, x + 515, 447, themeColors.blue, 4);
        if (charge > (i + 1) / 3 - 0.001) {
          constructionEquation(
            ctx,
            api,
            String.raw`-\beta(\ell_{{\rm old},` +
              i +
              String.raw`}-\ell_{{\rm ref},` +
              i +
              String.raw`})`,
            x + 215,
            645,
            33,
            themeColors.cyan,
          );
          line(ctx, api, x + 215, 505, x + 215, 590, themeColors.cyan, 3);
        }
        if (i === 2 && terminal > 0) {
          const y = prefLerp(895, 760, terminal);
          constructionEquation(ctx, api, '+R', x + 215, y, 48, themeColors.yellow);
          if (terminal === 1)
            constructionText(
              ctx,
              api,
              'one terminal insertion',
              x + 215,
              900,
              29,
              themeColors.yellow,
              'center',
            );
        }
      }
      caption(ctx, api, 'The terminal score is not copied into each immediate reward.');
      return;
    }
    if (currentBeat === 1) {
      heading(ctx, api, 'One sampled log ratio may be negative');
      const ratios = [Math.log(0.8 / 0.5), Math.log(0.2 / 0.5)],
        weights = [0.8, 0.2];
      for (let i = 0; i < 2; i++) {
        const y = 440 + i * 200;
        constructionText(
          ctx,
          api,
          'response ' + (i === 0 ? 'A' : 'B') + ' · p = ' + weights[i],
          180,
          y,
          33,
          i === 0 ? themeColors.green : themeColors.pink,
        );
        signedValue(ctx, api, ratios[i], 1000, y, 440);
      }
      focusTarget(ctx, api, 'pa-kl-expectation', () => {
        constructionText(
          ctx,
          api,
          resultComplete('pa-kl-expectation', 1)
            ? '0.8 × 0.470 + 0.2 × (−0.916) = 0.193'
            : 'Policy-weighted full-distribution expectation: ?',
          960,
          875,
          38,
          resultComplete('pa-kl-expectation', 1) ? themeColors.yellow : themeColors.muted,
          'center',
        );
      });
      caption(
        ctx,
        api,
        'Forward KL is an expectation; an individual log-ratio sample has no nonnegativity guarantee.',
      );
      return;
    }
    heading(ctx, api, 'One terminal score · retained three-token trajectory');
    const rewards = [0, 0, 1],
      lambda = currentBeat < 3 ? 1 : prefLerp(1, 0.5, cueProgress('pa-gae-half', 3)),
      gae = alignmentGae(rewards, [0, 0, 0, 0], 1, lambda);
    for (let i = 0; i < 3; i++) {
      const x = 240 + i * 540;
      cell(ctx, api, 'token ' + i, x, 420, 430, 85, themeColors.blue, 34);
      constructionText(
        ctx,
        api,
        'immediate r = ' + rewards[i],
        x + 215,
        590,
        32,
        i === 2 ? themeColors.yellow : themeColors.muted,
        'center',
      );
      if (i < 2) api.arrow(ctx, x + 440, 462, x + 515, 462, themeColors.blue, 4);
      if (currentBeat >= 2) {
        constructionText(ctx, api, 'Vt = 0', x + 215, 705, 29, themeColors.green, 'center');
        focusTarget(ctx, api, 'pa-gae-values', () =>
          constructionText(
            ctx,
            api,
            currentBeat === 3 && resultComplete('pa-gae-full', 3)
              ? 'A' + i + ' = ' + gae.advantages[i].toFixed(2)
              : 'δ' + i + ' = r' + i + ' + γV' + (i + 1) + ' − V' + i,
            x + 215,
            850,
            31,
            themeColors.yellow,
            'center',
          ),
        );
      }
    }
    if (currentBeat === 2) {
      const q = cueProgress('pa-gae-backward', 2);
      for (let i = 0; i < 2; i++) {
        const a = 1535 - i * 540,
          z = a - 540,
          local = prefBound(q * 2 - i);
        if (local > 0) {
          api.arrow(ctx, a, 775, prefLerp(a, z, local), 775, themeColors.cyan, 4);
        }
      }
    }
    if (currentBeat >= 2) {
      constructionText(ctx, api, 'terminal V3 = 0', 1570, 745, 26, themeColors.muted);
      constructionEquation(
        ctx,
        api,
        String.raw`A_t=\delta_t+\gamma\lambda A_{t+1}`,
        960,
        925,
        37,
        themeColors.cyan,
      );
      if (currentBeat === 3)
        constructionText(ctx, api, 'λ = ' + lambda.toFixed(2), 170, 335, 32, themeColors.yellow);
    }
    caption(
      ctx,
      api,
      currentBeat < 2
        ? 'The sequence score and per-token reference charge are separate signals.'
        : 'Backward credit assignment does not identify which token caused the outcome.',
    );
    return;
  };
  focusTarget(ctx, api, 'token-return-construction', construction);
}
export default {
  id: 'token-return',
  draw: drawTokenReturn,
  cues: [
    'token-return-b0',
    'pa-terminal-once',
    'token-return-b1',
    'pa-kl-expectation',
    'token-return-b2',
    'pa-gae-backward',
    'token-return-b3',
    'pa-gae-full',
    'pa-gae-half',
  ],
};
