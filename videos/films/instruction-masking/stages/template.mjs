import { CONSTRUCTION_TARGETS, TOKENS, TOKEN_IDS } from '../fixtures.mjs';
import { clamp, cueProgress, done, mix } from '../construction.mjs';
import { instructionCell, instructionF, instructionRoleColor, instructionT } from '../defaults.mjs';
export function drawTemplate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['template'] ?? [], () =>
    instructionF(ctx, api, 'template-construction', () => {
      const p = cueProgress2('im-flatten'),
        stream = resultComplete('im-token-ids', 1),
        spans = [
          [0, 5],
          [5, 10],
          [10, 12],
          [12, 17],
        ],
        order = spans.flatMap(([a, b]) =>
          Array.from(
            {
              length: b - a,
            },
            (_v, k) => b - 1 - k,
          ),
        );
      instructionT(
        ctx,
        api,
        'Same turn owners · serialization preserves their order',
        180,
        270,
        33,
        themeColors.ink,
      );
      instructionF(ctx, api, 'template-object-turn-label-2', () =>
        TOKENS.forEach((token, i) => {
          const turn = spans.findIndex(([a, b]) => i >= a && i < b),
            source = {
              x: 180 + (i - spans[turn][0]) * 270,
              y: 310 + turn * 130,
            },
            dest = {
              x: 110 + i * 100,
              y: 900,
            },
            progress = clamp(p * 17 - order.indexOf(i)),
            points = [
              source,
              {
                x: source.x,
                y: source.y + 75,
              },
              {
                x: 1750,
                y: source.y + 75,
              },
              {
                x: 1750,
                y: 810,
              },
              {
                x: dest.x,
                y: 810,
              },
              dest,
            ],
            lengths = points
              .slice(1)
              .map((v, k) => Math.hypot(v.x - points[k].x, v.y - points[k].y));
          let distance = progress * lengths.reduce((a, b) => a + b, 0),
            pos = points[0];
          for (let k = 0; k < lengths.length; k++) {
            if (distance <= lengths[k]) {
              const f = lengths[k] ? distance / lengths[k] : 1;
              pos = {
                x: mix(points[k].x, points[k + 1].x, f),
                y: mix(points[k].y, points[k + 1].y, f),
              };
              break;
            }
            distance -= lengths[k];
            pos = points[k + 1];
          }
          instructionCell(
            ctx,
            api,
            stream ? TOKEN_IDS[i] : token,
            pos.x,
            pos.y,
            94,
            progress > 0 && progress < 1 ? 48 : 64,
            instructionRoleColor(ctx, api, i),
            token.length > 7 ? 24 : 26,
          );
          if (progress === 1) {
            instructionT(ctx, api, i, dest.x + 47, 878, 24, themeColors.muted, 'center');
            if (stream)
              instructionT(
                ctx,
                api,
                token,
                dest.x + 47,
                840,
                token.length > 7 ? 24 : 26,
                instructionRoleColor(ctx, api, i),
                'center',
              );
          }
        }),
      );
      if (p < 1)
        instructionT(
          ctx,
          api,
          'Role/content/end pieces move through one serialization lane',
          180,
          1000,
          30,
          themeColors.muted,
        );
      else
        instructionT(
          ctx,
          api,
          stream
            ? 'Illustrative IDs · token position stays fixed · repeated is keeps one ID'
            : 'Seventeen indexed positions in the serialized stream',
          960,
          1015,
          28,
          themeColors.muted,
          'center',
        );
    }),
  );
  function drawExtended() {
    throw Error('Unknown instruction-masking scene template');
  }
}
export default {
  id: 'template',
  draw: drawTemplate,
  cues: ['template-beat-1-focus-1', 'im-flatten', 'template-beat-2-focus-1', 'im-token-ids'],
};
