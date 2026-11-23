import { RECORDS } from '../fixtures.mjs';
import { bookGraph, cueAmount, footer, paper, text } from '../defaults.mjs';
export function drawWalkEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.['walk-evidence-' + id]?.phase === 'after';
  api.focus.target('walk-evidence-mechanism', () => {
    const h1 = currentBeat > 0 ? 1 : cueAmount(ctx, api, 'walk-evidence', 'walk-author'),
      h2 = currentBeat > 0 ? 1 : cueAmount(ctx, api, 'walk-evidence', 'walk-publisher');
    bookGraph(ctx, api, 'walk-evidence', {
      hops: [h1, h2],
      y: 450,
    });
    if (h1 >= 1)
      paper(
        ctx,
        api,
        'walk-evidence',
        'A · current / permitted',
        [RECORDS.author.text],
        120,
        680,
        760,
        themeColors.blue,
      );
    if (h2 >= 1)
      paper(
        ctx,
        api,
        'walk-evidence',
        'B · current / permitted',
        ['River Walk was published by Willow Press.'],
        1020,
        680,
        780,
        themeColors.green,
      );
    if (currentBeat > 1 || done('publisher-answer'))
      text(
        ctx,
        api,
        'walk-evidence',
        'Willow Press · supported by A + B',
        960,
        925,
        39,
        themeColors.green,
        'center',
      );
    footer(
      ctx,
      api,
      'walk-evidence',
      'The path locates evidence; current access, versions and semantic support decide admission',
    );
  });
}
export default {
  id: 'walk-evidence',
  draw: drawWalkEvidence,
  cues: [
    'walk-evidence-b1-1',
    'walk-evidence-b1-2',
    'walk-evidence-walk-author',
    'walk-evidence-walk-publisher',
    'walk-evidence-b2-1',
    'walk-evidence-admit-evidence',
    'walk-evidence-publisher-answer',
    'walk-evidence-b3-1',
  ],
};
