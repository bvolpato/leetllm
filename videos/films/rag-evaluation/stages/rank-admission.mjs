import { completed, spoken } from '../construction.mjs';
import { POLICY_ID, POLICY_TEXT } from '../fixtures.mjs';
import { reorderPositions } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterEquation,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
  wrapLabel,
} from '../defaults.mjs';

function drawPolicyCopy(ctx, state, api) {
  const { C, text, line } = api;
  const copyId = 'freeze-handbook-copy';
  const acceptsCopy = completed(state, 'accept-copy', 2);
  const checked = completed(state, 'id-miss', 2);
  const acceptedIds = acceptsCopy ? [POLICY_ID, copyId] : [POLICY_ID];
  const credit = Number(acceptedIds.includes(copyId));
  for (const [i, id] of [POLICY_ID, copyId].entries()) {
    const x = 145 + i * 870;
    const color = i === 0 ? C.blue : C.cyan;
    text(ctx, i === 0 ? 'Reference passage' : 'Retrieved copy', x, 330, 41, color);
    text(ctx, id, x, 430, 37, C.ink, 'left', 'mono');
    line(ctx, x, 473, x + 750, 473, color, 3);
    text(ctx, wrapLabel(ctx, POLICY_TEXT, 745, 35).label, x, 550, 35, C.ink);
  }
  const key = acceptsCopy ? 'Accept either source ID' : 'Accept the reference ID only';
  text(ctx, key, 145, 885, 41, C.ink);
  text(ctx, 'Credit for finding the rule', 1015, 885, 39, C.muted);
  text(
    ctx,
    checked ? credit + ' / 1' : '?',
    1750,
    888,
    55,
    acceptsCopy ? C.green : checked ? C.yellow : C.ink,
    'right',
  );
}

export function drawRankAdmission(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat);
  api.focus.target('rank-admission-mechanism', () => {
    if (currentBeat === 0) {
      const drop = cueProgress('admission-drop'),
        dropped = drop === 1;
      drawPolicyChapterText(
        ctx,
        api,
        'Follow the freeze rule from search to the prompt',
        960,
        290,
        37,
        themeColors.ink,
        'center',
      );
      drawPolicyChapterCard(
        ctx,
        api,
        'Candidates · DEPLOY-17',
        160,
        430,
        700,
        themeColors.cyan,
        105,
      );
      if (dropped)
        drawPolicyChapterCard(
          ctx,
          api,
          'Selected · rollback drill only',
          1040,
          430,
          700,
          themeColors.pink,
          105,
        );
      else
        drawPolicyChapterCard(
          ctx,
          api,
          'Selected · DEPLOY-17',
          1040,
          430 + 240 * drop,
          700,
          themeColors.cyan,
          105,
        );
      api.arrow(ctx, 900, 482, 1000, 482, dropped ? themeColors.pink : themeColors.cyan, 4);
      if (drop > 0)
        drawPolicyChapterText(
          ctx,
          api,
          'DEPLOY-17 removed during selection',
          1390,
          825,
          28,
          themeColors.pink,
          'center',
        );
      drawPolicyChapterEquation(
        ctx,
        api,
        String.raw`R_{\rm candidate}=1`,
        510,
        920,
        40,
        themeColors.cyan,
      );
      drawPolicyChapterEquation(
        ctx,
        api,
        String.raw`R_{\rm context}=` + (dropped ? '0' : drop === 0 ? '1' : '?'),
        1390,
        920,
        40,
        dropped ? themeColors.pink : themeColors.cyan,
      );
      drawPolicyChapterFooter(
        ctx,
        api,
        'Selection, filtering or packing is the first observed broken boundary',
      );
    } else if (currentBeat === 1 || !cueProgress('alternative-source', 2)) {
      const move = cueProgress('rank-move', 1),
        ranks = [0, 1, 2],
        positions = reorderPositions(move, 'horizontal');
      drawPolicyChapterText(
        ctx,
        api,
        'Same three selected IDs · change only order',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      ranks.forEach((i) =>
        drawPolicyChapterText(
          ctx,
          api,
          'Rank ' + (i + 1),
          355 + i * 570,
          415,
          31,
          themeColors.muted,
          'center',
        ),
      );
      const names = ['DEPLOY-17', 'Rollback drill', 'Frontend docs'];
      names.forEach((name, i) =>
        drawPolicyChapterCard(
          ctx,
          api,
          name,
          positions[i].x,
          positions[i].y,
          470,
          i === 0 ? themeColors.cyan : themeColors.muted,
          110,
        ),
      );
      drawPolicyChapterEquation(
        ctx,
        api,
        String.raw`P_{\rm set}=1/3`,
        540,
        920,
        43,
        themeColors.cyan,
      );
      if (move === 1)
        drawPolicyChapterEquation(
          ctx,
          api,
          String.raw`P_{\rm ranked}=1/3`,
          1400,
          920,
          43,
          themeColors.yellow,
        );
      else if (move === 0)
        drawPolicyChapterEquation(
          ctx,
          api,
          String.raw`P_{\rm ranked}=1`,
          1400,
          920,
          43,
          themeColors.yellow,
        );
      else
        drawPolicyChapterText(
          ctx,
          api,
          'Reordering · rank-weighted metric changes',
          1400,
          920,
          28,
          themeColors.yellow,
          'center',
        );
      drawPolicyChapterFooter(
        ctx,
        api,
        currentBeat === 1
          ? 'The same three passages stay in the prompt.'
          : 'Change the position of the rule. Keep the other passages fixed.',
      );
    } else {
      drawPolicyCopy(ctx, state, api);
    }
  });
}
export default {
  id: 'rank-admission',
  draw: drawRankAdmission,
  cues: [
    'rank-admission-1',
    'admission-drop',
    'rank-admission-2',
    'rank-move',
    'rank-admission-3',
    'alternative-source',
    'id-miss',
    'accept-copy',
  ],
};
