import { prefBound } from '../arithmetic.mjs';
import { CONTROLLED_CASES } from '../fixtures.mjs';
import { twoLogitState, twoLogitTrace } from '../model.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
  table,
} from '../defaults.mjs';
export function drawProxyControls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue proxy-controls/' + id);
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
  const construction = () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'One controlled intervention · exact policy action stays fixed');
      constructionText(
        ctx,
        api,
        'A: Submit a reviewer ticket and cite P7.',
        170,
        415,
        35,
        themeColors.green,
      );
      const prefix = cueProgress('pa-proxy-preamble', 0);
      if (prefix > 0) {
        cell(ctx, api, 'Policy-safe answer:', 170, 565, 520, 90, themeColors.yellow, 33);
        constructionText(
          ctx,
          api,
          'Submit a reviewer ticket and cite P7.',
          730,
          625,
          32,
          themeColors.green,
        );
      }
      constructionEquation(
        ctx,
        api,
        String.raw`\Delta r=r(\text{prefix}+A)-r(A)`,
        960,
        825,
        43,
        themeColors.cyan,
      );
      constructionText(
        ctx,
        api,
        'If Δr > 0, the preamble raised the reward for the same action.',
        170,
        950,
        30,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Length-matched content change · the same eight word positions');
      const row = CONTROLLED_CASES[1];
      for (const [r, text] of [row.good, row.bad].entries()) {
        const y = 460 + r * 215;
        for (const [i, word] of text.split(' ').entries()) {
          const x = 170 + i * 205;
          cell(
            ctx,
            api,
            word,
            x,
            y,
            185,
            82,
            i === 7 ? (r === 0 ? themeColors.green : themeColors.pink) : themeColors.blue,
            25,
          );
        }
      }
      constructionText(
        ctx,
        api,
        'Only the final answer changes: five ↔ six',
        170,
        925,
        34,
        themeColors.yellow,
      );
      caption(
        ctx,
        api,
        'Matched length removes one shortcut without replacing correctness or refusal review.',
      );
    } else {
      heading(
        ctx,
        api,
        'Near ln 2 after real updates: inspect the update before blaming the labels',
      );
      const initial = twoLogitState([0, 0]),
        next = twoLogitTrace(1)[1];
      table(
        ctx,
        api,
        ['quantity', 'before', 'after supplied route step'],
        [
          ['chosen logit', '0', next.logits[0].toFixed(3)],
          ['rejected logit', '0', next.logits[1].toFixed(3)],
          ['DPO loss', initial.loss.toFixed(6), next.loss.toFixed(6)],
        ],
        170,
        420,
        1580,
        145,
      );
      constructionText(
        ctx,
        api,
        'Then inspect contradictory votes, ties, template, deployment and new-output coverage.',
        170,
        955,
        29,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Diagnostic illustration; a loss value by itself does not identify a unique failure.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'proxy-controls-construction', construction);
}
export default {
  id: 'proxy-controls',
  draw: drawProxyControls,
  cues: [
    'proxy-controls-b0',
    'pa-proxy-preamble',
    'proxy-controls-b1',
    'proxy-controls-b2',
    'pa-proxy-triage',
  ],
};
