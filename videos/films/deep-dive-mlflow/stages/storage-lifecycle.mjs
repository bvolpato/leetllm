import { mix } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer } from '../defaults.mjs';
export function drawStorageLifecycle(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('storage-lifecycle', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('storage-lifecycle', state, beat, sentence);
  {
    const { C } = api,
      id = 'storage-lifecycle';
    {
      const { C } = api,
        id = 'storage-lifecycle';
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
        const row = chip(
          ctx,
          api,
          modelState.purged
            ? 'R8 metadata: purged'
            : modelState.softDeleted
              ? 'R8 metadata: soft-deleted'
              : 'R8 metadata: active',
          150,
          400,
          740,
          modelState.purged ? C.muted : C.blue,
          115,
        );
        const file = chip(
          ctx,
          api,
          modelState.purged ? 'Original artifact: purged' : 'Original artifact bytes',
          1080,
          400,
          690,
          modelState.purged ? C.muted : C.green,
          115,
        );
        flow(ctx, api, row, file, currentBeat ? 1 : teaching2(0, 0));
        const backup = chip(ctx, api, 'Independent retained backup', 1040, 725, 730, C.cyan, 115);
        if (modelState.backup > 0) flow(ctx, api, file, backup, modelState.backup, C.cyan);
        chapterText(
          ctx,
          api,
          modelState.softDeleted
            ? 'UI deletion can hide a row while its bytes remain'
            : 'Metadata and artifact storage have different operational load',
          960,
          625,
          31,
          C.yellow,
          'center',
        );
        if (currentBeat === 1)
          chapterText(
            ctx,
            api,
            modelState.purged
              ? 'Owned original cleaned; copied backup still exists'
              : 'Restore is possible after soft deletion',
            960,
            935,
            33,
            C.yellow,
            'center',
          );
        if (currentBeat === 2) {
          chip(ctx, api, 'Backup checksum: byte identity', 160, 725, 720, C.blue, 115);
          chapterText(
            ctx,
            api,
            'Backup retention and restore authorization need their own policy',
            960,
            935,
            31,
            C.yellow,
            'center',
          );
        }
        footer(ctx, api, 'The run, its artifact and its backup each have a retention policy.');
      }
    }
  }
}
export default {
  id: 'storage-lifecycle',
  draw: drawStorageLifecycle,
  cues: [
    'mf-storage-lifecycle-0',
    'mf-sentence-storage-lifecycle-0-0',
    'mf-sentence-storage-lifecycle-0-1',
    'mf-sentence-storage-lifecycle-0-2',
    'mf-sentence-storage-lifecycle-0-3',
    'mf-storage-lifecycle-1',
    'mf-sentence-storage-lifecycle-1-0',
    'mf-sentence-storage-lifecycle-1-1',
    'mf-sentence-storage-lifecycle-1-2',
    'mf-sentence-storage-lifecycle-1-3',
    'mf-storage-lifecycle-2',
    'mf-sentence-storage-lifecycle-2-0',
    'mf-sentence-storage-lifecycle-2-1',
    'mf-sentence-storage-lifecycle-2-2',
    'mf-sentence-storage-lifecycle-2-3',
  ],
};
