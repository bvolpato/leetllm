import { prefBound } from '../arithmetic.mjs';
import { alignmentSoftmax, alignmentTokenScores } from '../model.mjs';
import {
  caption,
  cell,
  constructionText,
  focusTarget,
  heading,
  line,
  table,
} from '../defaults.mjs';
export function drawSummedTokenScores(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue summed-token-scores/' + id);
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
      heading(ctx, api, 'Two labeled examples · keep each complete recipe together');
      table(
        ctx,
        api,
        ['example', 'chosen π / ref', 'rejected π / ref', 'β · margin · loss'],
        [
          ['P1 route', '−3.4 / −4.0', '−3.4 / −3.0', '0.5 · 1.0 · 0.474'],
          ['P7 access', '−8.2 / −8.5', '−9.5 / −9.1', '0.1 · 0.7 · 0.659'],
        ],
        170,
        440,
        1590,
        175,
      );
      caption(
        ctx,
        api,
        'The next token fixture is a third authored arithmetic example, not either summed-score table.',
      );
      return;
    }
    const boost = currentBeat === 3 ? cueProgress('pa-token-boost', 3) : 0,
      excluded = currentBeat === 3 && resultComplete('pa-token-excluded', 3) ? 1000 : 0,
      v = alignmentTokenScores(boost, excluded);
    if (currentBeat === 1) {
      heading(ctx, api, 'Row t−1 predicts target ID at t · five-class log-softmax');
      const ids = v.fixture.chosenIds;
      ids.forEach((id, i) => {
        cell(
          ctx,
          api,
          id,
          220 + i * 245,
          365,
          200,
          76,
          i < 2 ? themeColors.blue : i === 5 ? themeColors.muted : themeColors.green,
          36,
        );
        constructionText(
          ctx,
          api,
          'position ' + i,
          320 + i * 245,
          335,
          23,
          themeColors.muted,
          'center',
        );
      });
      const rows = [1, 2, 3],
        chosenTargets = [1, 2, 4];
      rows.forEach((r, i) => {
        const y = 560 + i * 122;
        constructionText(ctx, api, 'logit row ' + r, 170, y + 44, 27, themeColors.blue);
        const probs = alignmentSoftmax(v.fixture.chosenPolicy[r]);
        v.fixture.chosenPolicy[r].forEach((z, k) => {
          const selected = k === chosenTargets[i],
            x = 420 + k * 200;
          cell(
            ctx,
            api,
            z.toFixed(1),
            x,
            y,
            170,
            70,
            selected ? themeColors.yellow : themeColors.muted,
            30,
          );
          if (selected) {
            api.arrow(ctx, x + 85, y + 78, 1480, y + 78, themeColors.yellow, 3);
            constructionText(
              ctx,
              api,
              'ln p = ' + Math.log(probs[k]).toFixed(3),
              1510,
              y + 84,
              27,
              themeColors.yellow,
            );
          }
        });
      });
      constructionText(
        ctx,
        api,
        'Every vocabulary class contributes to the normalizer; gather only the observed ID.',
        170,
        965,
        27,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Prompt and padding predictors are excluded by positions and attention validity.',
      );
      return;
    }
    if (currentBeat === 2) {
      heading(ctx, api, 'ID 0 can be response content or padding: positions decide');
      for (const [r, ids] of [v.fixture.chosenIds, v.fixture.rejectedIds].entries()) {
        const y = 420 + r * 255;
        constructionText(
          ctx,
          api,
          r === 0 ? 'chosen' : 'rejected',
          170,
          y + 47,
          29,
          r === 0 ? themeColors.green : themeColors.pink,
        );
        ids.forEach((id, i) => {
          const x = 400 + i * 215,
            color =
              i < 2
                ? themeColors.blue
                : i === 5
                  ? themeColors.muted
                  : id === 4
                    ? themeColors.yellow
                    : r === 0
                      ? themeColors.green
                      : themeColors.pink;
          cell(ctx, api, id, x, y, 180, 80, color, 35);
          constructionText(
            ctx,
            api,
            i < 2 ? 'prompt' : i === 5 ? 'padding' : id === 4 ? 'EOS' : 'response',
            x + 90,
            y + 125,
            25,
            color,
            'center',
          );
          if (i >= 2 && i < 5) {
            line(ctx, api, x + 90, y + 145, x + 90, y + 180, themeColors.cyan, 2);
            constructionText(
              ctx,
              api,
              'score t=' + i,
              x + 90,
              y + 215,
              25,
              themeColors.cyan,
              'center',
            );
          }
        });
      }
      caption(
        ctx,
        api,
        'Three scored response targets on each path; internal ID 0 remains scored on the rejected path.',
      );
      return;
    }
    heading(ctx, api, 'Actual CPU fixture · change selected logits, then excluded predictors');
    table(
      ctx,
      api,
      ['quantity', 'chosen', 'rejected', 'derived value'],
      [
        [
          'selected log p',
          v.chosen.toFixed(6),
          v.rejected.toFixed(6),
          'margin ' + v.margin.toFixed(6),
        ],
        ['reference log p', v.chosenRef.toFixed(6), v.rejectedRef.toFixed(6), 'β = 0.1'],
      ],
      170,
      400,
      1580,
      140,
    );
    focusTarget(ctx, api, 'pa-token-loss-value', () =>
      constructionText(
        ctx,
        api,
        resultComplete('pa-token-result', 3) ? 'DPO loss = ' + v.loss.toFixed(6) : 'DPO loss: ?',
        960,
        770,
        40,
        themeColors.yellow,
        'center',
      ),
    );
    constructionText(
      ctx,
      api,
      'Selected logits: ' + (2.4 + boost).toFixed(3) + ' and ' + (2.1 + boost).toFixed(3),
      170,
      885,
      32,
      themeColors.green,
    );
    constructionText(
      ctx,
      api,
      excluded
        ? 'Excluded predictor entries = 1000; same selected sum'
        : 'Excluded prompt / padding predictors remain outside the sum',
      170,
      955,
      28,
      excluded ? themeColors.pink : themeColors.muted,
    );
    caption(
      ctx,
      api,
      'This recomputes full-vocabulary log-softmax, gathered terms and loss from the displayed intervention.',
    );
    return;
  };
  focusTarget(ctx, api, 'summed-token-scores-construction', construction);
}
export default {
  id: 'summed-token-scores',
  draw: drawSummedTokenScores,
  cues: [
    'summed-token-scores-b0',
    'summed-token-scores-b1',
    'pa-token-gather',
    'summed-token-scores-b2',
    'pa-token-eos',
    'summed-token-scores-b3',
    'pa-token-result',
    'pa-token-boost',
    'pa-token-excluded',
  ],
};
