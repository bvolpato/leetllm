import { publicationInput } from '../fixtures.mjs';
import { directed, sampleModel } from '../construction.mjs';
import {
  drawSqlBox,
  drawSqlCaption,
  drawSqlRow,
  drawSqlText,
  withSqlFade,
  withSqlFocus,
} from '../defaults.mjs';
export function drawRetries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('retries', state);
  {
    const stored = m.storedHash.slice(0, 12),
      incoming = m.incomingHash.slice(0, 12);
    drawSqlText(
      ctx,
      api,
      'Durable request marker · publish-1',
      960,
      275,
      32,
      themeColors.yellow,
      'center',
    );
    withSqlFocus(ctx, api, 'stored-request', () => {
      drawSqlBox(ctx, api, 140, 335, 1640, 120, themeColors.yellow);
      drawSqlText(ctx, api, 'request identity', 180, 375, 25, themeColors.muted);
      drawSqlText(ctx, api, 'publish-1', 180, 425, 31, themeColors.yellow);
      drawSqlText(ctx, api, 'full payload SHA-256', 620, 375, 25, themeColors.muted);
      drawSqlText(ctx, api, stored + '…', 620, 425, 31, themeColors.cyan);
      drawSqlText(ctx, api, 'result document: d7-next', 1260, 410, 29, themeColors.green);
    });
    if (currentBeat === 0) {
      drawSqlRow(
        ctx,
        api,
        'committed clothing paragraph',
        publicationInput.chunks[2].text,
        140,
        535,
        900,
        themeColors.green,
      );
      withSqlFocus(ctx, api, 'retry-input', () => {
        withSqlFade(ctx, api, 1 - m.lost, () =>
          api.arrow(ctx, 1470, 475, 1470, 545, themeColors.yellow, 4),
        );
        drawSqlText(
          ctx,
          api,
          m.lost === 1 ? 'reply lost\nsame request arrives again' : 'reply to publication worker',
          1430,
          635,
          30,
          themeColors.yellow,
          'center',
        );
      });
    } else {
      withSqlFocus(ctx, api, 'retry-input', () =>
        drawSqlRow(
          ctx,
          api,
          'arriving clothing paragraph',
          m.input.chunks[2].text,
          140,
          535,
          1040,
          currentBeat === 2 && m.change > 0 ? themeColors.yellow : themeColors.cyan,
        ),
      );
      withSqlFocus(ctx, api, 'retry-comparison', () => {
        drawSqlText(ctx, api, 'stored ' + stored + '…', 1370, 570, 28, themeColors.cyan, 'center');
        drawSqlText(
          ctx,
          api,
          'arriving ' + incoming + '…',
          1370,
          635,
          28,
          m.change === 1 ? themeColors.pink : themeColors.green,
          'center',
        );
        drawSqlText(
          ctx,
          api,
          m.status === 'compare input'
            ? 'compare every field'
            : m.status === 'reused'
              ? 'same input → retained result'
              : 'changed input → rejected',
          960,
          748,
          34,
          m.status === 'changed input rejected' ? themeColors.pink : themeColors.green,
          'center',
        );
        if (m.status === 'reused')
          drawSqlText(ctx, api, 'return d7-next', 960, 865, 33, themeColors.green, 'center');
      });
      withSqlFocus(ctx, api, 'next-request', () => {
        if (currentBeat === 2 && directed(state, 'prepare-revision', 2, 0.88, 0.97) > 0) {
          drawSqlText(ctx, api, 'Next request   /   draft', 150, 824, 29, themeColors.blue);
          drawSqlText(
            ctx,
            api,
            'publish-2    ·    Aug 13    ·    d7-next → d8    ·    new chunks c8a, c8b, c8c',
            150,
            877,
            31,
            themeColors.ink,
          );
        }
      });
    }
    drawSqlText(
      ctx,
      api,
      'Stored rows: ' +
        m.documentRows +
        ' documents · ' +
        m.chunkRows +
        ' paragraphs · ' +
        m.markers +
        ' request marker',
      960,
      950,
      28,
      themeColors.muted,
      'center',
    );
    drawSqlCaption(
      ctx,
      api,
      'A service authenticates the caller and checks write permission for the requested workspace.',
    );
  }
}
export default {
  id: 'retries',
  draw: drawRetries,
  cues: [
    'lose-publication-reply',
    'compare-same-retry',
    'change-retry-payload',
    'reject-changed-retry',
    'prepare-revision',
  ],
};
