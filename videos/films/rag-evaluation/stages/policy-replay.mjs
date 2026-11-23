import { POLICY_ID } from '../fixtures.mjs';
import { spoken } from '../construction.mjs';
import { policyFixture, policyVariants, reorderPositions } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterFooter,
  drawPolicyChapterRule,
  drawPolicyChapterText,
} from '../defaults.mjs';
export function drawPolicyReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    f = policyFixture(),
    cases = policyVariants();
  const short = (key) =>
    key === POLICY_ID
      ? 'DEPLOY-17'
      : key.startsWith('payment')
        ? 'Rollback drill'
        : 'Frontend docs';
  api.focus.target('policy-replay-mechanism', () => {
    if (currentBeat === 0) {
      drawPolicyChapterText(
        ctx,
        api,
        'Maya’s fictional requirements question · exact recorded sentence',
        960,
        275,
        31,
        themeColors.muted,
        'center',
      );
      drawPolicyChapterRule(ctx, api);
      const count = Math.ceil(cueProgress('policy-conditions') * 3);
      ['freeze scope', 'IC approval', 'linked rollback plan'].slice(0, count).forEach((v, i) => {
        const color = [themeColors.blue, themeColors.yellow, themeColors.green][i];
        api.arrow(ctx, 460 + i * 560, 475, 460 + i * 560, 590, color, 4);
        drawPolicyChapterCard(ctx, api, v, 210 + i * 560, 625, 500, color, 110);
      });
      drawPolicyChapterText(
        ctx,
        api,
        'Maya needs both conditions before rollout. Starting the deploy requires authorization.',
        960,
        885,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      drawPolicyChapterText(
        ctx,
        api,
        'Same required rule · rank 3 → rank 1 → selected',
        960,
        280,
        34,
        themeColors.ink,
        'center',
      );
      const rerank = cueProgress('policy-rerank'),
        selected = rerank === 1 && cueProgress('policy-select'),
        positions = reorderPositions(rerank);
      [
        'First-stage candidates',
        'Reranked candidates',
        rerank > 0 && rerank < 1 ? 'Rerank transit' : 'Selected context',
      ].forEach((v, i) =>
        drawPolicyChapterText(ctx, api, v, 410 + i * 550, 365, 30, themeColors.muted, 'center'),
      );
      f.trace.candidates.forEach((key, i) => {
        drawPolicyChapterCard(
          ctx,
          api,
          i + 1 + ' · ' + short(key),
          160,
          430 + i * 140,
          490,
          key === POLICY_ID ? themeColors.cyan : themeColors.muted,
          95,
        );
        const destination = key === POLICY_ID ? 0 : i + 1;
        drawPolicyChapterCard(
          ctx,
          api,
          (rerank === 0 ? i + 1 : rerank === 1 ? destination + 1 : '↕') + ' · ' + short(key),
          positions[i].x,
          positions[i].y,
          490,
          key === POLICY_ID ? themeColors.cyan : themeColors.muted,
          95,
        );
      });
      if (selected) {
        api.arrow(ctx, 1225, 478, 1260, 478, themeColors.cyan, 4);
        drawPolicyChapterCard(
          ctx,
          api,
          'DEPLOY-17 · retained',
          1285,
          430,
          480,
          themeColors.cyan,
          95,
        );
        drawPolicyChapterText(
          ctx,
          api,
          'deploy-policy/2026-06-01',
          1525,
          660,
          27,
          themeColors.cyan,
          'center',
        );
      }
      drawPolicyChapterFooter(
        ctx,
        api,
        'The rollback-drill and frontend sources remain different documents',
      );
    } else {
      drawPolicyChapterText(
        ctx,
        api,
        'Replay binds evidence and generation artifacts separately',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawPolicyChapterCard(
        ctx,
        api,
        'DEPLOY-17 · recorded revision 2026-06-01',
        180,
        385,
        1540,
        themeColors.cyan,
        90,
      );
      Object.entries(f.trace.versions).forEach(([name, value], i) => {
        const x = 180 + (i % 3) * 560,
          y = 540 + Math.floor(i / 3) * 145;
        drawPolicyChapterCard(ctx, api, name + ' · ' + value, x, y, 500, themeColors.blue, 105, 26);
      });
      const count = Math.ceil(cueProgress('replay-artifacts') * 4);
      ['Exact prompt', 'Generator', 'Decoding settings', 'Original output']
        .slice(0, count)
        .forEach((v, i) =>
          drawPolicyChapterCard(ctx, api, v, 180 + i * 415, 865, 370, themeColors.yellow, 75, 25),
        );
      drawPolicyChapterFooter(
        ctx,
        api,
        'A hosted resample can differ; retain the original output beside the replay inputs',
      );
    }
  });
}
export default {
  id: 'policy-replay',
  draw: drawPolicyReplay,
  cues: [
    'policy-replay-1',
    'policy-conditions',
    'policy-replay-2',
    'policy-rerank',
    'policy-select',
    'policy-replay-3',
    'replay-artifacts',
  ],
};
