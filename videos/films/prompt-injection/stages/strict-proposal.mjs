import { validateDecodedAction } from '../model.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawStrictProposal(ctx, scene, state, api) {
  return paintStrictProposal(ctx, scene, state, api);
}
function paintStrictProposal(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('strict-proposal', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-strict-proposal-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    if (currentBeat === 0) {
      const variants = [
          [
            ['action', 'answer_eval'],
            ['candidate_id', 'C17'],
            ['eval_suite', 'R42'],
          ],
          [
            ['action', 'answer_eval'],
            ['action', 'request_promotion'],
            ['candidate_id', 'C17'],
            ['eval_suite', 'R42'],
          ],
          [
            ['action', 'answer_eval'],
            ['candidate_id', 'C17'],
            ['eval_suite', true],
          ],
        ],
        which = Math.min(2, Math.floor(sentenceProgress * 3)),
        pairs = variants[which],
        result = validateDecodedAction(pairs, 100);
      drawPromptText(
        ctx,
        api,
        'Decoded key/value pairs · before object overwrite',
        170,
        315,
        31,
        themeColors.blue,
      );
      drawPromptRows(
        ctx,
        api,
        pairs.map(([a, v]) => [a, typeof v === 'boolean' ? 'Boolean true' : v]),
        170,
        410,
        1580,
        {
          active: Math.floor(sentenceProgress * 3) % pairs.length,
        },
      );
      drawPromptCard(
        ctx,
        api,
        result.accepted
          ? 'Exact shape, strings and bounded IDs accepted'
          : 'Rejected: ' + result.reason,
        170,
        845,
        1580,
        result.accepted ? themeColors.cyan : themeColors.pink,
        90,
        31,
      );
    } else if (currentBeat === 1) {
      const count = Math.floor(300 * sentenceProgress),
        bytes = new TextEncoder().encode('é'.repeat(count)).length;
      drawPromptText(ctx, api, 'One repeated character: é', 180, 350, 35, themeColors.blue);
      drawPromptText(ctx, api, 'Character limit: 512', 180, 465, 30, themeColors.muted);
      api.rect(ctx, 180, 550, 1400, 65, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 180, 550, (1400 * count) / 600, 65, themeColors.blue);
      drawPromptText(ctx, api, 'Characters ' + count, 180, 520, 30, themeColors.blue);
      api.rect(ctx, 180, 720, 1400, 65, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 180, 720, (1400 * bytes) / 600, 65, themeColors.cyan);
      drawPromptText(ctx, api, 'UTF-8 bytes ' + bytes, 180, 690, 30, themeColors.cyan);
      drawPromptText(
        ctx,
        api,
        'A byte limit must be enforced before decoding',
        960,
        925,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      const outcomes = ['complete, non-refusal', 'refusal', 'incomplete'];
      outcomes.forEach((v, i) => {
        drawPromptCard(
          ctx,
          api,
          v,
          170,
          380 + i * 175,
          660,
          i === 0 ? themeColors.cyan : themeColors.yellow,
          90,
          31,
        );
        drawPromptCard(
          ctx,
          api,
          i === 0 ? 'Parse supported shape → current permission lookup' : 'No action dispatch',
          1000,
          380 + i * 175,
          750,
          i === 0 ? themeColors.green : themeColors.pink,
          90,
          28,
        );
      });
    }
  });
}
export default {
  id: 'strict-proposal',
  draw: drawStrictProposal,
  cues: ['pi-strict-proposal-0', 'pi-strict-proposal-1', 'pi-strict-proposal-2'],
};
