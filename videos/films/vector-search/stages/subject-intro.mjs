import { cueProgress } from '../construction.mjs';
import { mapPosition, neighborhood } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';
import { probe } from '../model.mjs';

const hits = probe(1).result;
const passages = {
  A: ['Rollback checklist', 'Restore the previous version.'],
  C: ['Release history', 'Dates of checkout releases.'],
};

function page(ctx, api, id, x, y) {
  const { C } = api;
  api.path(ctx, [
    { x: x - 251, y: y - 80 }, { x: x + 211, y: y - 80 }, { x: x + 251, y: y - 40 },
    { x: x + 251, y: y + 80 }, { x: x - 251, y: y + 80 },
  ], { closed: true, fill: C.ink, color: C.ink, width: 2 });
  api.path(ctx, [
    { x: x + 211, y: y - 75 }, { x: x + 211, y: y - 40 }, { x: x + 246, y: y - 40 },
  ], { color: C.bg, width: 3 });
  text(ctx, api, id, x - 190, y + 23, 64, C.bg, 'center');
  api.line(ctx, x - 139, y - 52, x - 139, y + 52, C.muted, 3);
  text(ctx, api, passages[id][0], x - 114, y - 10, 39, C.bg);
  text(ctx, api, passages[id][1], x - 114, y + 37, 24, C.bg);
}

export default {
  id: 'subject-intro',
  cues: ['rollback-request', 'returned-pair', 'compare-c', 'compare-b'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    if (state.t < 0.35) ctx.globalAlpha = 1;
    const c = cueProgress(state, 'compare-c'), b = cueProgress(state, 'compare-b');
    api.focus.target('passage-map', () => neighborhood(ctx, api, {
      axes: false,
      links: [['C', c], ['B', b]].filter(([, progress]) => progress > 0),
    }));
    api.focus.target('search-receipt', () => {
      api.rect(ctx, 1155, 208, 665, 102, C.panel, C.yellow, 48);
      api.circle(ctx, 1215, 252, 17, null, C.yellow, 4);
      api.line(ctx, 1228, 265, 1244, 281, C.yellow, 4);
      text(ctx, api, 'How do I roll back checkout?', 1271, 273, 38, C.ink);

      const travel = api.ease(api.clamp(((state.t ?? 0) + 0.33) / 2, 0, 1));
      const origin = mapPosition(hits[1]);
      for (const [i, hit] of hits.entries()) {
        const y = 480 + i * 235;
        const progress = i === 0 ? 1 : travel;
        text(ctx, api, 'Result ' + (i + 1), 1249, y - 99, 31, C.muted);
        const px = api.lerp(origin.x + 200, 1500, progress);
        const py = api.lerp(origin.y + 98, y, progress) + 126 * Math.sin(Math.PI * progress);
        page(ctx, api, hit.id, px, py);
      }
    });
  },
};
