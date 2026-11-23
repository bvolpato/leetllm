import { mix } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer } from '../defaults.mjs';
export function drawProjectSource(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('project-source', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('project-source', state, beat, sentence);
  {
    const { C } = api,
      id = 'project-source';
    {
      const { C } = api,
        id = 'project-source';
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
        const sources = [
          ['2018 paper', 'Open-interface design'],
          ['2020 LF home', 'Governance'],
          ['Pinned 3.16.1', 'Executed SDK contract'],
        ];
        sources.forEach(([name, scope], i) => {
          const p = teaching2(0, Math.min(i, 2)),
            x = 170 + i * 575;
          chip(
            ctx,
            api,
            name,
            x,
            mix(500, 360, currentBeat ? 1 : p),
            500,
            i === 2 ? C.cyan : C.blue,
            110,
          );
          chapterText(ctx, api, scope, x + 250, 650, 28, C.muted, 'center');
        });
        if (currentBeat === 1) {
          ['Code: Apache-2.0', 'Docs: CC BY 4.0', 'Assets: separate terms'].forEach((name, i) =>
            chip(ctx, api, name, 155 + i * 575, 790, 530, i === 2 ? C.yellow : C.cyan, 105, 26),
          );
        }
        if (currentBeat === 2) {
          const evidence = chip(
              ctx,
              api,
              'MLflow: linked execution evidence',
              160,
              790,
              740,
              C.blue,
              105,
            ),
            gpu = chip(
              ctx,
              api,
              'Scheduler / profiler: own decisions',
              1040,
              790,
              730,
              C.yellow,
              105,
            );
          flow(ctx, api, gpu, evidence, teaching2(2, 3), C.cyan);
        }
        footer(
          ctx,
          api,
          currentBeat === 0
            ? '2018 paper for the design   /   Release source for the tracing API'
            : currentBeat === 1
              ? 'Project licensing does not grant rights to every logged model, prompt or dataset'
              : 'Trace actual identifiers across systems without assigning them the same owner',
        );
      }
    }
  }
}
export default {
  id: 'project-source',
  draw: drawProjectSource,
  cues: [
    'mf-project-source-0',
    'mf-sentence-project-source-0-0',
    'mf-sentence-project-source-0-1',
    'mf-sentence-project-source-0-2',
    'mf-sentence-project-source-0-3',
    'mf-project-source-1',
    'mf-sentence-project-source-1-0',
    'mf-sentence-project-source-1-1',
    'mf-sentence-project-source-1-2',
    'mf-sentence-project-source-1-3',
    'mf-project-source-2',
    'mf-sentence-project-source-2-0',
    'mf-sentence-project-source-2-1',
    'mf-sentence-project-source-2-2',
    'mf-sentence-project-source-2-3',
  ],
};
