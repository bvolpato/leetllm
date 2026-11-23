import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawIncompleteAdvisory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('incomplete-advisory', state),
    progress = (beat, n) => sentence(state, 'incomplete-advisory', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat
        ? 'Completion, independent eligibility and trimmed text are separate gates'
        : 'An incomplete response retains its usage cost',
    );
    if (!currentBeat) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['provider status', 'visible text', 'usage'],
          ['incomplete', 'Hold', modelState.usage],
        ],
        200,
        370,
        1520,
        220,
        themeColors.cyan,
        35,
      );
      if (done(0, 2))
        drawConstructionBox(
          ctx,
          api,
          'Withhold this draft',
          350,
          700,
          1220,
          120,
          themeColors.pink,
          37,
        );
      if (done(0, 3))
        drawConstructionText(
          ctx,
          api,
          'Charge 700 tokens. Reserve a new call for a retry.',
          960,
          910,
          34,
          themeColors.yellow,
          'center',
        );
    } else {
      modelState.cases.forEach((r, i) => {
        const show = done(1, r.pass ? 2 : 1);
        drawConstructionGrid(
          ctx,
          api,
          [
            [
              r.status,
              'evidence ' + r.eligible,
              'text: ' + r.text,
              show ? (r.pass ? 'ADMIT' : 'WITHHOLD') : 'check gates',
            ],
          ],
          150,
          370 + i * 175,
          1620,
          120,
          show ? (r.pass ? themeColors.green : themeColors.pink) : themeColors.blue,
          28,
        );
      });
      drawConstructionFoot(ctx, api, 'Read the response type before extracting final advice.');
    }
  }
}
export default {
  id: 'incomplete-advisory',
  draw: drawIncompleteAdvisory,
  cues: [
    'ra-incomplete-advisory-0-0',
    'ra-incomplete-advisory-0-1',
    'ra-incomplete-advisory-0-2',
    'ra-incomplete-advisory-0-3',
    'ra-incomplete-advisory-1-0',
    'ra-incomplete-advisory-1-1',
    'ra-incomplete-advisory-1-2',
    'ra-incomplete-advisory-1-3',
  ],
};
