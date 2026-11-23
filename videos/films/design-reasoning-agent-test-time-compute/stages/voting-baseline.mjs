import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawVotingBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('voting-baseline', state),
    progress = (beat, n) => sentence(state, 'voting-baseline', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat
        ? 'A token beam can retain near-duplicate hypotheses'
        : 'Comparable labels vote; exact constraints still apply',
    );
    if (!currentBeat) {
      const labs = ['A', 'A', 'B', 'A', 'B'];
      labs.forEach((v, i) =>
        drawConstructionBox(
          ctx,
          api,
          v,
          200 + i * 315,
          420,
          250,
          110,
          v === 'A' ? themeColors.blue : themeColors.cyan,
          45,
        ),
      );
      if (done(0, 1))
        drawConstructionText(
          ctx,
          api,
          'Majority: A · 3 of 5',
          960,
          650,
          42,
          themeColors.blue,
          'center',
        );
      if (done(0, 2)) {
        drawConstructionBox(
          ctx,
          api,
          'A repeats the blocked hop to the legacy adapter',
          200,
          765,
          1500,
          100,
          themeColors.pink,
          33,
        );
        drawConstructionText(
          ctx,
          api,
          'Voting cannot repair the same repeated mistake',
          960,
          930,
          34,
          themeColors.yellow,
          'center',
        );
      }
    } else {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['token beam', 'explicit partial alternatives'],
          ['pin parser v2 then…', 'v2 + compatibility shim'],
          ['pin parser v2 and…', 'v1 + sanitizer patch'],
          ['pin parser v2 with…', 'alternative state + evidence'],
        ],
        180,
        370,
        1560,
        390,
        themeColors.blue,
        30,
      );
      if (done(1, 2))
        drawConstructionBox(
          ctx,
          api,
          'Evaluate state diversity and served-task outcomes',
          330,
          835,
          1260,
          100,
          themeColors.yellow,
          32,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Supplied labels and prefixes illustrate distinct selection mechanisms.',
    );
  }
}
export default {
  id: 'voting-baseline',
  draw: drawVotingBaseline,
  cues: [
    'ra-voting-baseline-0-0',
    'ra-voting-baseline-0-1',
    'ra-voting-baseline-0-2',
    'ra-voting-baseline-0-3',
    'ra-voting-baseline-1-0',
    'ra-voting-baseline-1-1',
    'ra-voting-baseline-1-2',
    'ra-voting-baseline-1-3',
  ],
};
