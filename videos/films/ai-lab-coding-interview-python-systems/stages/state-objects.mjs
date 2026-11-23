import { codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
  drawRow,
} from '../defaults.mjs';
export function drawStateObjects(ctx, scene, state, api) {
  api.focus.target('ci-state-objects-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('state-objects', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'The operation selects its state owner');
        const n = Math.floor(q * 7.99);
        drawChapterText(ctx, api, 'deque: FIFO', 190, 380, 28, themeColors.cyan);
        drawRow(
          ctx,
          api,
          n ? ['/guide', '/api', '/faq'] : ['/start', '/guide', '/api'],
          190,
          410,
          650,
          90,
          themeColors.cyan,
        );
        if (n) drawChapterText(ctx, api, 'popleft → /start', 190, 550, 27, themeColors.green);
        drawChapterText(ctx, api, 'heap: priority', 1110, 380, 28, themeColors.yellow);
        drawChapterCard(ctx, api, '(1, docs)', 1210, 410, 290, 70, themeColors.yellow, 25);
        if (n > 1) {
          drawChapterCard(ctx, api, '(2, test)', 1050, 560, 290, 70, themeColors.blue, 25);
          drawChapterCard(ctx, api, '(3, deploy)', 1430, 560, 290, 70, themeColors.blue, 25);
          drawLine(ctx, api, 1280, 490, 1200, 540, themeColors.yellow);
          drawLine(ctx, api, 1450, 490, 1550, 540, themeColors.yellow);
        }
        if (n > 2) {
          drawChapterText(ctx, api, 'Counter', 190, 700, 27, themeColors.pink);
          api.rect(ctx, 190, 750, 170, 45, themeColors.pink);
          api.rect(ctx, 190, 825, 85, 45, themeColors.blue);
          drawChapterText(ctx, api, '/api: 2', 410, 785, 27, themeColors.pink);
          drawChapterText(ctx, api, '/faq: 1', 410, 860, 27, themeColors.blue);
        }
        if (n > 3) {
          drawChapterText(ctx, api, 'OrderedDict: recency', 1060, 720, 27, themeColors.green);
          drawRow(ctx, api, ['older', 'newer'], 1060, 765, 660, 85, themeColors.green);
        }
        if (n > 4)
          drawFooter(
            ctx,
            api,
            n > 6
              ? 'Condition rechecks a predicate · Event carries stop'
              : 'Monotonic clock owns time; Lock protects a compound transition',
            themeColors.yellow,
          );
      } else {
        drawHeading(ctx, api, 'Separate graph work from heap work');
        const nodes = [
            [300, 480],
            [600, 390],
            [600, 660],
            [900, 480],
          ],
          edges = [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
            [3, 0],
          ],
          n = Math.floor(q * 6);
        edges.slice(0, n).forEach(([a, z]) => {
          const dx = nodes[z][0] - nodes[a][0],
            dy = nodes[z][1] - nodes[a][1],
            d = Math.hypot(dx, dy),
            k = 43 / d;
          drawLine(
            ctx,
            api,
            nodes[a][0] + dx * k,
            nodes[a][1] + dy * k,
            nodes[z][0] - dx * k,
            nodes[z][1] - dy * k,
            themeColors.muted,
          );
        });
        nodes.forEach(([x, y], i) => {
          api.circle(ctx, x, y, 37, themeColors.blue);
          drawChapterText(ctx, api, String(i), x, y + 10, 28, themeColors.bg, 'center');
        });
        drawChapterText(ctx, api, 'Supplied graph: V = 4, E = 5', 230, 820, 29, themeColors.cyan);
        api.math(
          ctx,
          String.raw`O(V+E)\ \text{work},\quad O(V)\ \text{state}`,
          1330,
          480,
          37,
          themeColors.cyan,
        );
        if (q > 0.4) {
          api.math(ctx, String.raw`O(AV\log V)`, 1330, 670, 42, themeColors.yellow);
          drawChapterText(
            ctx,
            api,
            'A attempts per task · heap operations',
            1330,
            760,
            26,
            themeColors.muted,
            'center',
          );
        }
        drawFooter(ctx, api, 'Callback and URL-string costs remain outside these local bounds');
      }
    }
  });
}
export default {
  id: 'state-objects',
  draw: drawStateObjects,
  cues: ['ci-state-objects-0-build', 'ci-state-objects-1-build'],
};
