import { prefBound } from '../arithmetic.mjs';
import { caption, constructionText, focusTarget, heading, rectangle, table } from '../defaults.mjs';
export function drawTrainingContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue training-contract/' + id);
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
      heading(ctx, api, 'A ten-step DPO configuration');
      table(
        ctx,
        api,
        ['data owner', 'provided contents', 'chosen setting'],
        [
          ['train pairs', 'prompt / chosen / rejected', 'β = 0.1'],
          ['pair evaluation', 'prepared held-out pair rows', 'learning rate 5×10⁻⁶'],
          [
            'SFT tokenizer + checkpoint',
            'same template and target masks',
            'max length 2048 · 10 steps',
          ],
        ],
        170,
        410,
        1580,
        145,
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Retain the actual inputs and outputs of a proposed run');
      const rows = [
        ['collated row counts', 'inspect both branches'],
        ['reference parameters', 'frozen; valid cache'],
        ['optimizer / precision', 'record actual state'],
        ['saved model + tokenizer', 'same release artifact'],
      ];
      table(ctx, api, ['boundary', 'required artifact'], rows, 170, 410, 1560, 115);
    } else {
      const fresh = resultComplete('pa-training-generation', 2);
      heading(ctx, api, 'Stored pair loss and new-answer behavior use different evidence');
      rectangle(ctx, api, 170, 400, 720, 420, themeColors.blue);
      constructionText(ctx, api, 'Prepared pair IDs C1, C2', 215, 470, 32, themeColors.blue);
      constructionText(ctx, api, 'chosen / rejected texts fixed', 215, 580, 29, themeColors.muted);
      constructionText(ctx, api, 'pair loss + pair metrics', 215, 720, 34, themeColors.cyan);
      rectangle(ctx, api, 1080, 400, 670, 420, fresh ? themeColors.green : themeColors.muted);
      constructionText(ctx, api, 'Held-out prompt IDs H1, H2', 1120, 470, 30, themeColors.green);
      constructionText(
        ctx,
        api,
        fresh ? 'generate fresh X / Y answers' : 'new generations not observed',
        1120,
        580,
        28,
        fresh ? themeColors.ink : themeColors.muted,
      );
      constructionText(
        ctx,
        api,
        fresh ? 'independent judgments' : 'behavioral win rate: ?',
        1120,
        720,
        31,
        fresh ? themeColors.yellow : themeColors.muted,
      );
      caption(
        ctx,
        api,
        'Compare the models on the same prompts, with the same rubric and decoding settings.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'training-contract-construction', construction);
}
export default {
  id: 'training-contract',
  draw: drawTrainingContract,
  cues: [
    'training-contract-b0',
    'training-contract-b1',
    'training-contract-b2',
    'pa-training-generation',
  ],
};
