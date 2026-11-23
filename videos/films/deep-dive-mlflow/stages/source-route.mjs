import { bound, mix } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, table } from '../defaults.mjs';
export function drawSourceRoute(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('source-route', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('source-route', state, beat, sentence);
  {
    const { C } = api,
      id = 'source-route';
    {
      const { C } = api,
        id = 'source-route';
      const drawQueue = (model) => {
        const gap = 235,
          start = 565,
          y = 500,
          incoming = {
            x: 1650,
            y: 350,
          };
        const moving = model.travel > 0 ? model.next?.event : null;
        const locate = (name, value) => {
          let index = value.queue.indexOf(name);
          if (index >= 0)
            return {
              x: start + index * gap,
              y,
            };
          index = value.sentIds.indexOf(name);
          if (index >= 0)
            return {
              x: 150 + index * 160,
              y: 795,
            };
          index = value.droppedIds.indexOf(name);
          if (index >= 0)
            return {
              x: 1460 + index * 135,
              y: 795,
            };
          return incoming;
        };
        chapterText(
          ctx,
          api,
          `FIFO · capacity ${model.capacity}`,
          960,
          285,
          35,
          C.yellow,
          'center',
        );
        chapterText(ctx, api, 'front', 465, 545, 25, C.muted);
        chapterText(ctx, api, 'New arrivals', 1695, 325, 24, C.blue, 'center');
        for (let i = 0; i < model.capacity; i++)
          api.rect(ctx, start + i * gap - 10, y - 20, 205, 120, C.panel, C.muted, 3);
        for (const name of model.arrivedIds) {
          if (moving?.id === name) continue;
          const old = locate(name, model),
            next = model.next ? locate(name, model.next) : old;
          const color = model.droppedIds.includes(name)
            ? C.pink
            : model.sentIds.includes(name)
              ? C.green
              : C.cyan;
          chip(
            ctx,
            api,
            name,
            mix(old.x, next.x, model.travel),
            mix(old.y, next.y, model.travel),
            model.queue.includes(name) ? 180 : 120,
            color,
            75,
            28,
          );
        }
        if (moving) {
          const old = locate(moving.id, model),
            next = locate(moving.id, model.next);
          let x = mix(old.x, next.x, model.travel),
            y = mix(old.y, next.y, model.travel);
          if (moving.kind === 'sent' || moving.kind === 'discarded') {
            const points = [
                old,
                {
                  x: old.x,
                  y: 690,
                },
                {
                  x: next.x,
                  y: 690,
                },
                next,
              ],
              lengths = points
                .slice(1)
                .map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
            let remaining = model.travel * lengths.reduce((a, z) => a + z, 0),
              edge = 0;
            while (edge < lengths.length - 1 && remaining > lengths[edge])
              remaining -= lengths[edge++];
            const fraction = remaining / lengths[edge];
            x = mix(points[edge].x, points[edge + 1].x, fraction);
            y = mix(points[edge].y, points[edge + 1].y, fraction);
          }
          chip(ctx, api, moving.id, x, y, 120, C.blue, 75, 28);
        }
        chapterText(ctx, api, 'Sent', 165, 930, 28, C.green);
        chapterText(ctx, api, 'Dropped', 1475, 930, 28, C.pink);
        if (model.countReady)
          chapterText(
            ctx,
            api,
            `${model.arrivedIds.length} arrivals = ${model.sentIds.length} sent + ${model.queue.length} queued + ${model.droppedIds.length} dropped`,
            960,
            930,
            34,
            C.yellow,
            'center',
          );
      };
      {
        chapterText(
          ctx,
          api,
          'v3.16.1 · follow (R8, retrieval k, 50)',
          960,
          285,
          35,
          C.yellow,
          'center',
        );
        const nodes = ['MlflowClient', 'Tracking client', 'SQL store', 'Unique run / key'].map(
          (name, i) =>
            chip(ctx, api, name, 140 + i * 430, 400, 360, i === 3 ? C.yellow : C.blue, 100, 26),
        );
        for (let i = 0; i < 3; i++)
          flow(ctx, api, nodes[i], nodes[i + 1], bound(teaching2(0, 1) * 3 - i));
        if (currentBeat === 0) {
          chip(ctx, api, 'Existing value: 40', 220, 715, 600, C.blue, 100);
          chip(
            ctx,
            api,
            teaching2(0, 2) >= 1
              ? 'Different value: rollback + error'
              : 'Attempt unique insert / compare',
            1020,
            715,
            740,
            teaching2(0, 2) >= 1 ? C.pink : C.yellow,
            100,
          );
        }
        if (currentBeat === 1)
          table(
            ctx,
            api,
            210,
            700,
            [420, 540, 620],
            [
              ['Mutation path', 'Operation', 'Later state'],
              ['run tag', 'pending → approved', teaching2(1, 1) >= 1 ? 'approved' : 'pending'],
              ['prompt config', '.2 → .8 under same version', teaching2(1, 1) >= 1 ? '.8' : '.2'],
            ],
            [C.muted, C.cyan, C.green],
          );
        if (currentBeat === 2) {
          const paths = [
            'tracing/provider → client',
            'model entity',
            'genai/evaluation',
            'gateway routing',
          ];
          paths.forEach((name, i) =>
            chip(
              ctx,
              api,
              name,
              150 + (i % 2) * 860,
              700 + Math.floor(i / 2) * 125,
              750,
              C.cyan,
              90,
              25,
            ),
          );
        }
        footer(ctx, api, 'Read the enforcing state transition, not just three public API names');
      }
    }
  }
}
export default {
  id: 'source-route',
  draw: drawSourceRoute,
  cues: [
    'mf-source-route-0',
    'mf-sentence-source-route-0-0',
    'mf-sentence-source-route-0-1',
    'mf-sentence-source-route-0-2',
    'mf-sentence-source-route-0-3',
    'mf-source-route-1',
    'mf-sentence-source-route-1-0',
    'mf-sentence-source-route-1-1',
    'mf-sentence-source-route-1-2',
    'mf-sentence-source-route-1-3',
    'mf-source-route-2',
    'mf-sentence-source-route-2-0',
    'mf-sentence-source-route-2-1',
    'mf-sentence-source-route-2-2',
  ],
};
