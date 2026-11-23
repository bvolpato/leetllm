import { historyRing } from '../arithmetic.mjs';
import {
  constructionArrow,
  constructionBox,
  constructionEquation,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionHistoryConstruction(
  ctx,
  scene,
  state,
  api,
  C,
  f,
  b,
  p,
  show,
  prog,
  done,
  original,
) {
  if (b === 0) {
    constructionHeading(ctx, api, C, 'Enable bounded history before the workload');
    constructionBox(
      ctx,
      api,
      C,
      'same CUDA process · private history API',
      960,
      420,
      1100,
      110,
      C.blue,
      33,
    );
    constructionEquation(
      ctx,
      api,
      C,
      String.raw`\mathrm{max\_entries}=100000`,
      960,
      650,
      49,
      C.cyan,
    );
    constructionText(
      ctx,
      api,
      C,
      'pin version · bounded window · local sensitive snapshot',
      960,
      850,
      33,
      C.yellow,
      'center',
    );
    constructionNote(
      ctx,
      api,
      C,
      'Record in the same process that runs the workload.',
    );
  } else if (b <= 2) {
    constructionHeading(ctx, api, C, 'Allocator history   /   four slots');
    const initial = Math.floor(prog('gpu-history-four', 1) * 4);
    const writes = initial + Number(done('gpu-history-wrap', 2)) + Number(done('gpu-history-next', 2));
    const events = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, writes);
    const ring = historyRing(events, 4);
    const slots = Array(4).fill(null);
    events.forEach((event, i) => (slots[i % 4] = event));
    slots.forEach((v, i) => {
      const x = 390 + i * 380;
      constructionBox(
        ctx,
        api,
        C,
        v === 'A' ? 'A · OOM' : v ?? 'empty',
        x,
        520,
        310,
        120,
        v === 'A' ? C.pink : v === 'E' || v === 'F' ? C.yellow : C.cyan,
        39,
      );
    });
    for (const [i, cue] of ['gpu-history-wrap', 'gpu-history-next'].entries()) {
      const drop = prog(cue, 2);
      if (drop > 0 && drop < 1) {
        constructionBox(ctx, api, C, i === 0 ? 'E' : 'F', 390 + i * 380, 330 + 85 * drop,
          98, 60, C.yellow, 35);
      }
    }
    if (events.length) {
      const x = 390 + ring.pointer * 380;
      constructionText(ctx, api, C, 'next write', x, 800, 31, C.yellow, 'center');
      constructionArrow(ctx, api, C, x, 760, x, 620, C.yellow);
    }
    constructionText(
      ctx,
      api,
      C,
      'Oldest to newest   ' + ring.retained.join('  ·  '),
      960,
      850,
      38,
      C.cyan,
      'center',
    );
    if (ring.overwritten.length) {
      constructionText(ctx, api, C, 'Overwritten   ' + ring.overwritten.join('  ·  '),
        960, 950, 32, C.pink, 'center');
    }
  } else {
    constructionHeading(
      ctx,
      api,
      C,
      'Durable dump and volatile process history have different lifetimes',
    );
    const retained = historyRing(['A', 'B', 'C', 'D', 'E', 'F'], 4).retained;
    constructionBox(ctx, api, C, 'volatile P17 history', 500, 400, 650, 95, C.blue, 34);
    constructionBox(ctx, api, C, 'durable bounded dump', 1430, 400, 650, 95, C.cyan, 34);
    const saved = Math.floor(retained.length * prog('history-construction-2', 3));
    const ended = done('gpu-history-restart', 3);
    retained.forEach((v, i) => {
      if (!ended)
        constructionBox(ctx, api, C, v, 260 + i * 150, 600, 110, 85, C.blue, 37);
      if (i < saved)
        constructionBox(ctx, api, C, v, 1190 + i * 150, 600, 110, 85, C.cyan, 37);
    });
    if (ended) {
      constructionText(
        ctx,
        api,
        C,
        'P17 ended · unsaved history lost',
        500,
        840,
        31,
        C.pink,
        'center',
      );
      constructionText(ctx, api, C, 'C, D, E and F survive in the dump', 1430, 840, 31, C.green, 'center');
    }
    constructionNote(
      ctx,
      api,
      C,
      'Record the capture window, entry limit and dump time.',
    );
  }
}
export function drawHistoryConstructionStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionHistoryConstruction);
}
export default {
  id: 'history-construction',
  draw: drawHistoryConstructionStage,
  cues: [
    'history-construction-0',
    'history-construction-1',
    'gpu-history-four',
    'gpu-history-wrap',
    'gpu-history-next',
    'history-construction-2',
    'gpu-history-restart',
  ],
};
