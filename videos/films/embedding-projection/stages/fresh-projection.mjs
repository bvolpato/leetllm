import { freshCoordinates } from '../model.mjs';
import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterFooter,
  chapterText,
} from '../defaults.mjs';
export function drawFreshProjection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const doc = currentBeat > 0 && chapterCueComplete(ctx, api, 'fresh-doc'),
      query = currentBeat > 0 && chapterCueComplete(ctx, api, 'fresh-query'),
      repairStarted = currentBeat === 2 && chapterCueVisible(ctx, api, 'fresh-repair'),
      repaired = currentBeat === 2 && chapterCueComplete(ctx, api, 'fresh-repair'),
      flip =
        (currentBeat === 1 && chapterCueVisible(ctx, api, 'fresh-flip')) ||
        (currentBeat === 2 && !repaired),
      negativeReady = currentBeat === 1 && chapterCueComplete(ctx, api, 'fresh-negative-query'),
      result = freshCoordinates(flip),
      cos =
        currentBeat > 0 &&
        (flip
          ? chapterCueComplete(ctx, api, 'fresh-negative')
          : chapterCueComplete(ctx, api, 'fresh-cosine'));
    chapterBox(
      ctx,
      api,
      'Saved mean [2, 1]\nbasis [.6, .8] and [−.8, .6]',
      590,
      285,
      740,
      140,
      themeColors.yellow,
    );
    chapterBox(ctx, api, 'Document [4, 2]', 190, 500, 650, 110, themeColors.blue);
    chapterBox(ctx, api, 'Query [3, 3]', 1080, 500, 650, 110, themeColors.cyan);
    if (currentBeat === 1 && chapterCueVisible(ctx, api, 'fresh-doc'))
      chapterBox(
        ctx,
        api,
        doc
          ? 'Centered [2, 1]\nprojected [2, −1]'
          : 'Center [4, 2] − [2, 1]\nProject with saved ordered directions',
        190,
        690,
        650,
        140,
        themeColors.blue,
      );
    if (currentBeat === 1 && chapterCueVisible(ctx, api, 'fresh-query'))
      chapterBox(
        ctx,
        api,
        !query
          ? 'Center [3, 3] − [2, 1]\nQuery projection pending'
          : flip && !negativeReady
            ? 'Centered [1, 2]\nQuery-only sign change: projection pending'
            : 'Centered [1, 2]\nprojected [' +
              result.query.map((x) => x.toFixed(1)).join(', ') +
              ']',
        1080,
        690,
        650,
        140,
        flip ? themeColors.pink : themeColors.cyan,
      );
    if (currentBeat === 0)
      chapterText(
        ctx,
        api,
        'Predict both coordinates and cosine before revealing',
        960,
        940,
        35,
        themeColors.yellow,
      );
    else if (currentBeat === 1) {
      if (cos)
        chapterText(
          ctx,
          api,
          'Cosine = ' + result.cosine.toFixed(1) + (flip ? ' · query-only sign mismatch' : ''),
          960,
          940,
          38,
          flip ? themeColors.pink : themeColors.green,
        );
      else if (query)
        chapterText(ctx, api, 'Cosine comparison pending', 960, 940, 32, themeColors.muted);
    }
    if (currentBeat === 2) {
      chapterBox(
        ctx,
        api,
        repaired
          ? 'Same artifact → [2, −1] and [2.2, .4] · replay the query'
          : repairStarted
            ? 'Loading saved mean, basis and normalization · replay pending'
            : 'Previous query artifact is still inconsistent',
        240,
        690,
        1440,
        130,
        repaired ? themeColors.green : themeColors.yellow,
      );
      chapterText(
        ctx,
        api,
        chapterCueComplete(ctx, api, 'fresh-old-cosine')
          ? 'Original uncentered cosine ≈ .949 · centered consistent cosine = .8'
          : chapterCueComplete(ctx, api, 'fresh-recover')
            ? 'Controlled repair restores cosine .8'
            : 'Replay result comparison pending',
        960,
        940,
        32,
        chapterCueComplete(ctx, api, 'fresh-recover') ? themeColors.green : themeColors.muted,
      );
    }
    chapterFooter(
      ctx,
      api,
      'Same document and query · a local repair does not establish deployment quality',
    );
  }
  return;
}
export default {
  id: 'fresh-projection',
  draw: drawFreshProjection,
  cues: [
    'fresh-axes',
    'fresh-inputs',
    'fresh-predict',
    'fresh-doc',
    'fresh-query',
    'fresh-cosine',
    'fresh-flip',
    'fresh-negative-query',
    'fresh-negative',
    'fresh-repair',
    'fresh-recover',
    'fresh-old-cosine',
  ],
};
