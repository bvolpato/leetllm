import { PATCH_SCORES } from '../fixtures.mjs';
import { lateInteraction } from '../model.mjs';
import { desk, said } from '../document-desk.mjs';
import { cueProgress, cueStarted, detailText, equation, focusTarget, heading, rectangle } from '../defaults.mjs';

const splitScores = [
  [PATCH_SCORES[0][1], PATCH_SCORES[0][0], PATCH_SCORES[0][2]],
  PATCH_SCORES[1],
];

function drawMatches(ctx, scene, state, api) {
  const { C, ink, rule, sheet, focus, visible } = desk(ctx, api);
  const beat = state.beat ?? 0;
  const split = beat >= 3 || visible('other-page');
  const scores = split ? splitScores : PATCH_SCORES;
  const regionNames = ['Header', split ? 'Log entry' : 'Policy line', 'Footer'];
  const patchText = split
    ? ['Section 15', 'Log time spent in minutes.', 'Operations handbook']
    : ['Release runbook', 'Page within 15 minutes.', 'Operations handbook'];
  const winnerCue = split ? 'late-maxima' : 'patch-winners';
  const resultCue = split ? 'late-sum' : 'late-original-result';
  const showWins = said(state, winnerCue);
  const showSum = said(state, resultCue);
  focus('other-page', () => focus('picture-patches', () => {
    sheet(115, 287, 681, 490, split ? 'Page B   /   time log' : 'Page A   /   rollback');
    for (let j = 0; j < 3; j++) {
      const y = 440 + 122 * j;
      ink(regionNames[j], 148, y, 26, C.muted);
      ink(patchText[j], 148, y + 52, 37, C.ink, 'left', 'serif');
      if (showWins && scores.some(row => row.indexOf(Math.max(...row)) === j)) {
        rule(133, y - 14, 133, y + 56, C.yellow, 5);
      }
    }
  }));
  const showScores = beat > 0 || visible('patch-products');
  focus('patch-products', () => {
    ink('Query   “15 minutes”', 875, 340, 41, C.blue);
    ink('Example dot products', 876, 402, 29, C.muted);
    regionNames.forEach((s, j) => ink(s, 1207 + j * 222, 504, 30, C.muted, 'center'));
    scores.forEach((row, i) => {
      const y = 604 + 119 * i;
      ink(['15','minutes'][i], 875, y, 41);
      if (showScores) focus(winnerCue, () => row.forEach((v, j) => {
        const x = 1207 + j * 222;
        const win = showWins && v === Math.max(...row);
        ink(v.toFixed(2), x, y, 47, win ? C.yellow : C.ink, 'center');
        if (win) rule(x - 56, y + 18, x + 56, y + 18, C.yellow, 4);
      }));
    });
  });
  if (beat === 0) ink('Which patch wins for each query word?', 960, 919, 40, C.yellow, 'center');
  else if (beat === 2) ink('Does the score change when the two words match different patches?', 960, 919, 38, C.yellow, 'center');
  else focus(resultCue, () => {
    if (showSum) {
      const maxima = scores.map(row => Math.max(...row).toFixed(2));
      equation(ctx, api, maxima.join('+') + '=' + lateInteraction(scores).toFixed(2), 960, 894, 53);
      if (split) ink('The header supplies 15. The time log supplies minutes.', 960, 971, 32, C.ink, 'center');
    } else ink('Page score   =   best match for 15   +   best match for minutes', 960, 903, 35, C.cyan, 'center');
  });
}

function drawStorage(ctx, scene, state, api) {
  const themeColors = api.C;
  const imageVectors = 32 * 32, textVectors = 6;
  const coordinates = 128, bytesPerCoordinate = 2;
  const vectors = imageVectors + textVectors;
  const bytes = vectors * coordinates * bytesPerCoordinate;
  heading(ctx, api, 'Vector storage for one page');
  focusTarget(ctx, api, 'storage-vectors', () => {
    const count = Math.floor(imageVectors * cueProgress(ctx, api, 'storage-vectors')),
      rows = Math.floor(count / 32),
      partial = count % 32;
    api.rect(ctx, 190, 365, 384, 384, themeColors.muted, undefined, 0);
    if (rows) api.rect(ctx, 190, 365, 384, 12 * rows, themeColors.blue, undefined, 0);
    if (partial)
      api.rect(ctx, 190, 365 + 12 * rows, 12 * partial, 12, themeColors.blue, undefined, 0);
    for (let i = 0; i <= 32; i++) {
      api.path(
        ctx,
        [
          {
            x: 190 + i * 12,
            y: 365,
          },
          {
            x: 190 + i * 12,
            y: 749,
          },
        ],
        {
          color: themeColors.bg,
          width: 3,
        },
      );
      api.path(
        ctx,
        [
          {
            x: 190,
            y: 365 + i * 12,
          },
          {
            x: 574,
            y: 365 + i * 12,
          },
        ],
        {
          color: themeColors.bg,
          width: 3,
        },
      );
    }
    detailText(ctx, api, count.toLocaleString('en-US') + ' image vectors', 382, 817, 28, themeColors.blue, 'center');
    for (let i = 0; i < textVectors; i++) {
      rectangle(ctx, api, 650 + i * 48, 530, 32, 32, themeColors.yellow);
    }
    detailText(ctx, api, '+ ' + textVectors + ' text vectors', 790, 635, 28, themeColors.yellow, 'center');
  });
  if (cueStarted(ctx, api, 'storage-factors') || cueStarted(ctx, api, 'storage-total')) {
    const factors = [vectors.toLocaleString('en-US'), coordinates, bytesPerCoordinate].join(' × ');
    focusTarget(ctx, api, 'storage-factors', () => {
      detailText(ctx, api, 'Vectors × coordinates × bytes', 1310, 405, 30, themeColors.muted, 'center');
      detailText(ctx, api, factors, 1310, 480, 56, themeColors.ink, 'center');
    });
    if (cueStarted(ctx, api, 'storage-total')) focusTarget(ctx, api, 'storage-total', () => {
      if (said(state, 'storage-total')) {
        detailText(ctx, api, bytes.toLocaleString('en-US') + ' bytes', 1310, 560, 38, themeColors.ink, 'center');
        detailText(ctx, api, (bytes / 1024) + ' KiB per page', 1310, 632, 47, themeColors.cyan, 'center');
      } else detailText(ctx, api, '÷ 1,024 bytes per KiB', 1310, 559, 33, themeColors.cyan, 'center');
    });
  }
  if (cueStarted(ctx, api, 'paper-scope'))
    focusTarget(ctx, api, 'paper-scope', () => {
      detailText(
        ctx,
        api,
        'Original paper: 256 KB storage table',
        1300,
        734,
        29,
        themeColors.yellow,
        'center',
      );
      detailText(
        ctx,
        api,
        'ViDoRe nDCG@5   ·   ColPali 81.3',
        1300,
        799,
        28,
        themeColors.muted,
        'center',
      );
      detailText(ctx, api, 'OCR 66.1   ·   captioning 67.0', 1300, 851, 27, themeColors.muted, 'center');
    });
  if (cueStarted(ctx, api, 'migration-api'))
    focusTarget(ctx, api, 'migration-api', () =>
      api.text(
        ctx,
        'ST v6 MultiVectorEncoder   ·   encode_query   ·   encode_document   ·   similarity',
        960,
        955,
        27,
        themeColors.cyan,
        'center',
        'mono',
      ),
    );
}

export function drawVisualRetrieval(ctx, scene, state, api) {
  if (state.beat === 4) drawStorage(ctx, scene, state, api);
  else drawMatches(ctx, scene, state, api);
}
export default {
  id: 'visual-retrieval', draw: drawVisualRetrieval,
  cues: ['picture-patches','patch-products','patch-winners','late-original-result','other-page','late-maxima','late-sum','storage-vectors','storage-factors','storage-total','paper-scope','migration-api'],
};
