import { event } from '../construction.mjs';
import { A, labels } from '../fixtures.mjs';
import { retrievalFrame } from '../model.mjs';
import { target, text } from '../defaults.mjs';

export function drawRetrievalCheck(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.pink, C.green];
  const c = retrievalFrame(state);
  const relevant = A.map((row) => row[0] === 1);
  const order = [0, 1, 2].sort((i, j) => (c.progress === 1 ? i - j : c.scores[j] - c.scores[i]));
  const hits = order.slice(0, 2).filter((i) => relevant[i]).length;
  const totalRelevant = relevant.filter(Boolean).length;
  const showOrder = c.progress < 1 || event(state, 1, 'break-tie') === 1;
  text(ctx, api, 'Query   “slow pages”', 135, 287, 42, C.yellow);
  text(ctx, api, 'Cosine similarity', 840, 370, 32, C.muted, 'center');
  text(ctx, api, 'First two results', 1515, 370, 32, C.muted, 'center');
  target(ctx, api, 'retrieval-ties', () => {
    c.scores.forEach((v, i) => {
      const y = 490 + i * 142;
      text(ctx, api, labels[i], 135, y + 13, 36, colors[i]);
      api.line(ctx, 480, y, 1030, y, C.muted, 2);
      const x = 480 + 550 * v;
      if (v > 0) api.line(ctx, 480, y, x, y, colors[i], 10);
      api.circle(ctx, x, y, 10, colors[i]);
      text(ctx, api, v.toFixed(3), 1090, y + 12, 34, colors[i]);
    });
  });
  target(ctx, api, 'ranking', () => {
    order.slice(0, 2).forEach((id, slot) => {
      const y = 475 + slot * 156;
      api.rect(ctx, 1290, y - 42, 460, 108, C.panel, C.muted, 8);
      text(ctx, api, String(slot + 1), 1330, y + 19, 29, C.muted);
      text(
        ctx,
        api,
        showOrder ? labels[id] : '?',
        1400,
        y + 20,
        35,
        showOrder ? colors[id] : C.muted,
      );
    });
    if (showOrder)
      text(
        ctx,
        api,
        hits + ' of ' + totalRelevant + ' relevant tickets',
        1515,
        810,
        32,
        C.ink,
        'center',
      );
  });
  const footer =
    c.progress === 1
      ? 'Equal scores use ticket order: slow pages, undo release, both.'
      : 'Relevant to this query: slow pages and the ticket with both issues.';
  text(ctx, api, footer, 960, 955, 32, C.muted, 'center');
}

export default {
  id: 'retrieval-check',
  draw: drawRetrievalCheck,
  cues: ['retrieval-ties', 'break-tie'],
};
