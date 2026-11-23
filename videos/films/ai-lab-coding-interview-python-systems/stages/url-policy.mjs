import { normalizeUrl } from '../arithmetic.mjs';
import { URLS } from '../fixtures.mjs';
import { codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawFooter,
  drawHeading,
  drawLine,
  drawMovingCard,
} from '../defaults.mjs';
export function drawUrlPolicy(ctx, scene, state, api) {
  api.focus.target('ci-url-policy-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('url-policy', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'Resolve one raw link, then normalize its fetch identity');
        drawChapterCard(
          ctx,
          api,
          'https://REPO.example:443/api?mode=full#auth',
          190,
          360,
          1540,
          100,
          themeColors.blue,
          31,
        );
        const pieces = ['https', 'repo.example', '443', '/api', '?mode=full', '#auth'];
        pieces.forEach((v, i) =>
          drawChapterCard(
            ctx,
            api,
            v,
            190 + i * 260,
            570,
            230,
            90,
            i === 2 || i === 5 ? themeColors.yellow : themeColors.cyan,
            25,
          ),
        );
        const normalized = normalizeUrl('https://REPO.example:443/api?mode=full#auth').href;
        if (q > 0.35) {
          drawArrow(ctx, api, 960, 690, 960, 750);
          drawChapterCard(
            ctx,
            api,
            q > 0.75 ? normalized : 'remove default port and fragment',
            280,
            785,
            1360,
            100,
            themeColors.green,
            30,
          );
        }
        drawFooter(
          ctx,
          api,
          'Origin = scheme + lowercase host + effective port; the query remains part of identity',
        );
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Invalid syntax stops before queue admission');
        const inputs = [
          'https://user@repo.example/a',
          'https://repo.example:bad/a',
          'https://repo.example/white space',
          'ftp://repo.example/a',
          '/api?mode=full#second',
        ];
        inputs.forEach((v, i) => {
          const y = 370 + i * 112;
          drawChapterCard(ctx, api, v, 190, y, 1040, 75, themeColors.blue, 25);
          if (q > (i + 1) / 6) {
            const u = normalizeUrl(v, URLS.start),
              admit = u?.origin === new URL(URLS.start).origin;
            drawChapterCard(
              ctx,
              api,
              admit ? 'same origin → claim' : 'skip before claim',
              1350,
              y,
              370,
              75,
              admit ? themeColors.green : themeColors.pink,
              25,
            );
          }
        });
        drawFooter(
          ctx,
          api,
          'The callback link order determines the single-worker breadth-first result',
        );
      } else {
        drawHeading(ctx, api, 'String identity and the eventual network destination differ');
        drawChapterCard(
          ctx,
          api,
          'normalized same-origin URL',
          190,
          420,
          650,
          110,
          themeColors.green,
          30,
        );
        drawLine(ctx, api, 960, 355, 960, 935, themeColors.yellow, 4);
        drawChapterCard(
          ctx,
          api,
          'DNS + redirects + address checks',
          1090,
          420,
          650,
          110,
          themeColors.yellow,
          28,
        );
        drawArrow(ctx, api, 860, 650, 1060, 650, themeColors.yellow);
        drawMovingCard(ctx, api, 'fetch attempt', 210, 760, 1330, 760, q, themeColors.blue, 360);
        drawFooter(
          ctx,
          api,
          'The actual local normalizer stops at the string boundary; real fetch limits need enforcement',
        );
      }
    }
  });
}
export default {
  id: 'url-policy',
  draw: drawUrlPolicy,
  cues: ['ci-url-policy-0-build', 'ci-url-policy-1-build', 'ci-url-policy-2-build'],
};
