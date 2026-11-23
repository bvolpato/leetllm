import { mix } from '../arithmetic.mjs';
import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, table } from '../defaults.mjs';
export function drawAuthBoundary(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('auth-boundary', state),
    currentBeat = modelState.b;
  {
    const { C } = api,
      id = 'auth-boundary';
    {
      const { C } = api,
        id = 'auth-boundary';
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
        if (currentBeat === 0) {
          const caller = chip(ctx, api, 'Caller B', 150, 400, 360, C.pink, 105),
            metadata = chip(ctx, api, 'Experiment A metadata', 745, 400, 490, C.blue, 105),
            artifact = chip(ctx, api, 'A artifact URI', 1370, 715, 400, C.blue, 105);
          flow(ctx, api, caller, metadata, modelState.readCheck, C.pink);
          chapterText(
            ctx,
            api,
            modelState.readCheck >= 1 ? 'Denied: scope mismatch' : 'Check caller + resource',
            1000,
            320,
            30,
            C.pink,
            'center',
          );
          flow(ctx, api, caller, artifact, 0, C.muted);
          chip(
            ctx,
            api,
            modelState.pathCheck >= 1
              ? 'Direct path: same A-only scope'
              : 'Direct path also needs its own ACL',
            150,
            790,
            1030,
            modelState.pathCheck >= 1 ? C.green : C.yellow,
            95,
          );
        } else if (currentBeat === 1) {
          table(
            ctx,
            api,
            170,
            390,
            [510, 500, 600],
            [
              ['Identity / operation', 'Required scope', 'Observed boundary'],
              ['read principal', 'experiment + artifact', 'check both paths'],
              ['registry writer', 'alias write', 'affects future loads'],
              ['configured basic-auth', 'fail-closed fixes', 'check both tenants'],
            ],
            [C.muted, C.blue, C.cyan, C.yellow],
          );
        } else {
          const approval = chip(
              ctx,
              api,
              'Approval + exact candidate digest',
              150,
              400,
              760,
              C.blue,
              105,
            ),
            alias = chip(
              ctx,
              api,
              modelState.move >= 1 ? 'Production → prompt18' : 'Production → prompt17',
              1080,
              400,
              690,
              C.cyan,
              105,
            );
          flow(ctx, api, approval, alias, modelState.move, C.cyan);
          chip(
            ctx,
            api,
            `Observed worker: prompt${modelState.loaded}`,
            570,
            730,
            800,
            modelState.loaded === 18 ? C.green : C.yellow,
            120,
          );
          chapterText(
            ctx,
            api,
            modelState.loaded === 18
              ? 'Supplied post-move receipt T105 confirms the loaded version'
              : 'Alias intent does not fill the missing worker observation',
            960,
            930,
            30,
            C.yellow,
            'center',
          );
        }
        footer(ctx, api, 'Apply the caller’s permissions to both the record and its artifact.');
      }
    }
  }
}
export default {
  id: 'auth-boundary',
  draw: drawAuthBoundary,
  cues: [
    'mf-auth-boundary-0',
    'mf-sentence-auth-boundary-0-0',
    'mf-sentence-auth-boundary-0-1',
    'mf-sentence-auth-boundary-0-2',
    'mf-sentence-auth-boundary-0-3',
    'mf-auth-boundary-1',
    'mf-sentence-auth-boundary-1-0',
    'mf-sentence-auth-boundary-1-1',
    'mf-sentence-auth-boundary-1-2',
    'mf-sentence-auth-boundary-1-3',
    'mf-auth-boundary-2',
    'mf-sentence-auth-boundary-2-0',
    'mf-sentence-auth-boundary-2-1',
    'mf-sentence-auth-boundary-2-2',
    'mf-sentence-auth-boundary-2-3',
  ],
};
