import { LIBRARY_RECORD } from '../fixtures.mjs';
import { libraryEvidence } from '../model.mjs';
import { drawLibraryIntroductionTarget, drawLibraryIntroductionText } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
  const { phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85);
  {
    drawLibraryIntroduction(ctx, scene, state, api);
  }
}
function drawLibraryIntroduction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => state.cues?.[id]?.progress ?? 0,
    done = (id) => progress(id) === 1;
  const code = currentBeat === 0,
    query = code ? 'G-14' : 'growing tomatoes',
    e = libraryEvidence(query);
  drawLibraryIntroductionTarget(ctx, api, 'book-identity', () => {
    api.rect(ctx, 1120, 340, 600, 560, themeColors.panel, themeColors.green, 2, 12);
    api.rect(ctx, 1120, 340, 34, 560, themeColors.green);
    drawLibraryIntroductionText(ctx, api, 'G-14', 1190, 405, 39, themeColors.green);
    drawLibraryIntroductionText(ctx, api, 'posting: g-14 → G-14', 1190, 825, 28, themeColors.blue);
    drawLibraryIntroductionText(
      ctx,
      api,
      'supplied vector [1.0, 0.1]',
      1190,
      875,
      27,
      themeColors.green,
    );
  });
  drawLibraryIntroductionTarget(ctx, api, 'stored-title', () => {
    LIBRARY_RECORD.title.forEach((s, i) =>
      drawLibraryIntroductionText(ctx, api, s, 1190, 480 + i * 52, 31, themeColors.ink),
    );
    LIBRARY_RECORD.tokens.forEach((s, i) => {
      const x = 1190,
        y = 605 + i * 65;
      api.rect(ctx, x, y, 450, 49, themeColors.panel, themeColors.blue, 1.5, 5);
      drawLibraryIntroductionText(ctx, api, s, x + 22, y + 34, 27, themeColors.blue);
    });
  });
  drawLibraryIntroductionText(
    ctx,
    api,
    code ? 'Exact catalog code' : 'Remembered wording',
    220,
    320,
    32,
    themeColors.yellow,
  );
  drawLibraryIntroductionTarget(ctx, api, 'query-paraphrase', () => {
    drawLibraryIntroductionText(
      ctx,
      api,
      query,
      220,
      405,
      37,
      code ? themeColors.blue : themeColors.pink,
    );
    drawLibraryIntroductionText(
      ctx,
      api,
      'analyzed: ' + e.terms.join(' | '),
      220,
      480,
      29,
      code ? themeColors.blue : themeColors.pink,
    );
  });
  if (code) {
    const known = done('intro-exact-code');
    drawLibraryIntroductionText(
      ctx,
      api,
      'inverted posting',
      700,
      325,
      29,
      themeColors.muted,
      'center',
    );
    api.rect(ctx, 540, 370, 420, 145, themeColors.panel, themeColors.blue, 2, 9);
    drawLibraryIntroductionText(ctx, api, 'g-14', 570, 425, 32, themeColors.blue);
    drawLibraryIntroductionText(
      ctx,
      api,
      known ? '→ G-14' : '→ ?',
      760,
      480,
      32,
      known ? themeColors.green : themeColors.muted,
    );
    if (progress('intro-exact-code') > 0) {
      const x = 380 + 160 * progress('intro-exact-code');
      api.circle(ctx, x, 550, 10, themeColors.blue);
    }
    drawLibraryIntroductionText(
      ctx,
      api,
      known
        ? 'The stored identifier exposes this record'
        : 'The same identifier will select one posting',
      220,
      710,
      30,
      themeColors.muted,
    );
  } else {
    drawLibraryIntroductionText(
      ctx,
      api,
      'Exact title overlap: ' + e.hits.length + ' posting hits',
      220,
      550,
      29,
      themeColors.pink,
    );
    const plot = api.teaching.axes({
        x: 220,
        y: 650,
        width: 620,
        height: 240,
        xDomain: [0, 1.1],
        yDomain: [0, 0.4],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.2, 0.4],
        equalUnits: true,
        fontSize: 25,
      }),
      origin = plot.point(0, 0);
    for (const [v, c] of [
      [LIBRARY_RECORD.vector, themeColors.green],
      [e.queryVector, themeColors.pink],
    ]) {
      const end = plot.point(...v);
      api.arrow(ctx, origin.x, origin.y, end.x, end.y, c, 5);
    }
    drawLibraryIntroductionText(
      ctx,
      api,
      'Supplied two-coordinate geometry',
      220,
      610,
      27,
      themeColors.muted,
    );
    if (done('intro-dense-evidence') || currentBeat > 1)
      drawLibraryIntroductionText(
        ctx,
        api,
        'cosine = ' + e.similarity.toFixed(3),
        880,
        720,
        32,
        themeColors.yellow,
        'center',
      );
    if (done('intro-both-candidates') || currentBeat > 1)
      drawLibraryIntroductionText(
        ctx,
        api,
        'candidate: G-14',
        880,
        810,
        32,
        themeColors.green,
        'center',
      );
  }
  drawLibraryIntroductionText(
    ctx,
    api,
    currentBeat === 2
      ? 'Exact posting and semantic candidate retain the same G-14 identity'
      : 'Same record · actual title terms,posting identity and supplied vector',
    960,
    1005,
    27,
    themeColors.muted,
    'center',
  );
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'find-book',
    'intro-exact-code',
    'complementary-signals',
    'intro-dense-evidence',
    'intro-both-candidates',
    'track-book',
  ],
};
