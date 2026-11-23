import { attendedMean, makeAttentionMasks } from '../arithmetic.mjs';
import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionLine,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawPackingStrategies(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['packing-strategies'] ?? [], () =>
    instructionF(ctx, api, 'packing-strategies-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      instructionT(ctx, api, 'One long example: evidence → answer', 180, 315, 35, themeColors.ink);
      const source = Array.from(
        {
          length: 20,
        },
        (_v, i) => (i < 10 ? 'E' + i : 'A' + (i - 10)),
      );
      const kind = resultComplete('im-pack-wrapped')
        ? 'wrapped'
        : resultComplete('im-pack-split')
          ? 'split'
          : 'drop';
      instructionT(
        ctx,
        api,
        kind === 'drop'
          ? 'BFD: overflow beyond maximum removed'
          : kind === 'split'
            ? 'split: long example chunked before packing'
            : 'wrapped: concatenate raw stream, cut fixed blocks',
        180,
        400,
        35,
        themeColors.yellow,
      );
      source.forEach((v, i) =>
        instructionCell(
          ctx,
          api,
          v,
          180 + (i % 10) * 155,
          500 + Math.floor(i / 10) * 150,
          145,
          75,
          kind === 'drop' && i >= 16
            ? themeColors.muted
            : i < 10
              ? themeColors.blue
              : themeColors.green,
          29,
        ),
      );
      const cut = 16;
      instructionLine(
        ctx,
        api,
        180 + (cut % 10) * 155,
        635,
        180 + (cut % 10) * 155,
        755,
        themeColors.pink,
        3,
      );
      instructionT(ctx, api, 'Illustrative maximum: 16 positions', 180, 860, 30, themeColors.muted);
      instructionT(
        ctx,
        api,
        'The retained answer’s context depends on the actual cut',
        180,
        945,
        34,
        themeColors.pink,
      );
    } else if (beat === 1) {
      instructionRow(ctx, api, ['A0', 'A1', 'A2', 'B0', 'B1', 'B2'], 180, 420, {
        step: 260,
        w: 235,
        size: 36,
        color: (i) => (i < 3 ? themeColors.blue : themeColors.green),
      });
      instructionF(ctx, api, 'im-cumulative-lengths', () => {
        instructionT(ctx, api, 'cumulative sequence lengths', 180, 680, 35, themeColors.yellow);
        instructionRow(ctx, api, [0, 3, 6], 900, 630, {
          step: 250,
          w: 225,
          size: 40,
          color: themeColors.yellow,
        });
      });
      instructionT(
        ctx,
        api,
        'The attention kernel uses the segment boundaries supplied with the batch.',
        180,
        890,
        34,
        themeColors.pink,
      );
    } else {
      instructionF(ctx, api, 'im-isolation-probe', () => drawIsolationCheck(ctx, state, api));
    }
  }
}

function drawIsolationCheck(ctx, state, api) {
  const { C } = api;
  const { isolated, segment } = makeAttentionMasks();
  const before = [1, 2, 3, 10, 20, 30];
  const query = 4;
  const progress = cueProgress(state, 'im-isolation-probe', 2);
  const updatedCount = Math.floor(progress * segment.filter((s) => s === 0).length);
  const after = before.map((value, i) => value + (i < updatedCount ? 1000 : 0));
  const revealed = done(state, 'isolation-result', 3);
  const x = (i) => 500 + i * 225;

  instructionT(ctx, api, 'CPU attention  ·  equal scores  ·  dropout off', 150, 252, 33, C.muted);
  for (const [name, first, last, color] of [
    ['Conversation A', 0, 2, C.blue],
    ['Conversation B', 3, 5, C.cyan],
  ]) {
    instructionT(ctx, api, name, (x(first) + x(last)) / 2, 350, 44, color, 'center');
    api.line(ctx, x(first) - 94, 379, x(last) + 94, 379, color, 3);
  }

  for (const [label, values, y] of [
    ['Before', before, 476],
    ['After', after, 595],
  ]) {
    instructionT(ctx, api, label, 150, y, 38, C.muted);
    values.forEach((value, i) => {
      const changed = value !== before[i];
      const allowed = isolated[query][i];
      instructionT(
        ctx,
        api,
        value,
        x(i),
        y,
        54,
        changed ? C.yellow : allowed ? C.cyan : C.muted,
        'center',
      );
      if (allowed) api.line(ctx, x(i) - 49, y + 17, x(i) + 49, y + 17, C.cyan, 4);
    });
  }
  instructionT(ctx, api, 'B’s middle token reads the underlined values.', 150, 718, 37, C.ink);
  instructionT(ctx, api, 'Average before', 150, 865, 37, C.muted);
  instructionT(ctx, api, attendedMean(isolated, query, before), 665, 875, 68, C.ink, 'center');
  instructionT(ctx, api, 'Average after', 980, 865, 37, C.muted);
  instructionT(
    ctx,
    api,
    revealed ? attendedMean(isolated, query, after) : '?',
    1510,
    875,
    68,
    revealed ? C.green : C.yellow,
    'center',
  );
}

export default {
  id: 'packing-strategies',
  draw: drawPackingStrategies,
  cues: [
    'packing-strategies-b1',
    'im-pack-drop',
    'im-pack-split',
    'im-pack-wrapped',
    'packing-strategies-b2',
    'im-cumulative-lengths',
    'packing-strategies-b3',
    'im-isolation-probe',
    'isolation-result',
  ],
};
