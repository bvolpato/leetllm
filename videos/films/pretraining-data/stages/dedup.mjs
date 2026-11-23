import { NEAR_DUPLICATE_TEXT, corpus } from '../fixtures.mjs';
import { dedupSnapshot } from '../model.mjs';
import {
  documentCard,
  legacyCard,
  legacyEquation,
  legacyText,
  withPretrainingOriginalFrame,
} from '../defaults.mjs';
export function paintPretrainingOriginalDedup(ctx, scene, state, api, C, c, t, b, p, s) {
  const v = dedupSnapshot(b, p);
  legacyText(
    ctx,
    api,
    C,
    'Inventory branch reset · score cutoff 0.50 · source rule off · 800 tokens',
    960,
    335,
    28,
    C.muted,
    'center',
  );
  if (b === 0) {
    const a = api.focus.target('duplicate-records', () =>
        documentCard(ctx, api, C, c, corpus[0], 300, 370),
      ),
      d = api.focus.target('duplicate-records', () =>
        documentCard(ctx, api, C, c, corpus[1], 760, 370, v.merged ? 0.4 : 1),
      );
    api.focus.target('duplicate-records', () => documentCard(ctx, api, C, c, corpus[4], 1260, 370));
    if (v.seconds >= 8.9875) {
      legacyText(
        ctx,
        api,
        C,
        v.exactDuplicate ? 'Normalized text A = normalized text B' : 'Contents differ',
        960,
        675,
        32,
        C.cyan,
        'center',
      );
    }
    if (v.merged) {
      api.connect(ctx, d, a, {
        color: C.yellow,
        gap: 14,
      });
      legacyCard(ctx, api, C, c, 'Source B → retained representative A', 430, 730, 1050, C.yellow);
      legacyText(
        ctx,
        api,
        C,
        'Remove B’s repeated 240 tokens · retain both source receipts',
        960,
        915,
        29,
        C.yellow,
        'center',
      );
    }
  } else {
    v.sets.forEach((rows, k) =>
      c.panel(
        {
          x: 240 + k * 820,
          y: 370,
          width: 620,
          height: 365,
          fill: C.panel,
          stroke: k ? C.pink : C.blue,
          padding: 24,
        },
        () => {
          NEAR_DUPLICATE_TEXT[k]
            .split(' ')
            .forEach((word, i) =>
              api.focus.target('shingle-words', () =>
                legacyText(
                  ctx,
                  api,
                  C,
                  word,
                  270 + k * 820 + i * 88,
                  420,
                  28,
                  v.shown < 4 && i >= Math.max(0, v.shown - 1) && i < Math.max(0, v.shown - 1) + 3
                    ? C.yellow
                    : C.ink,
                ),
              ),
            );
          rows.forEach((value, i) => {
            if (i < v.shown)
              api.focus.target('shingle-sets', () =>
                legacyText(
                  ctx,
                  api,
                  C,
                  value,
                  270 + k * 820,
                  490 + i * 58,
                  29,
                  v.comparing && v.intersection.includes(value) ? C.cyan : k ? C.pink : C.blue,
                ),
              );
          });
        },
      ),
    );
    if (v.comparing) {
      v.union.forEach((value, i) =>
        api.focus.target('shingle-union', () =>
          c.card({
            label: value,
            x: 135 + i * 275,
            y: 780,
            width: 250,
            height: 60,
            fontSize: 21,
            fill: C.panel,
            stroke: v.intersection.includes(value) ? C.cyan : C.muted,
            textColor: v.intersection.includes(value) ? C.cyan : C.muted,
          }),
        ),
      );
      legacyText(
        ctx,
        api,
        C,
        'Unique union entries · cyan entries occur in both documents',
        960,
        885,
        27,
        C.muted,
        'center',
      );
    }
    if (v.exact)
      api.focus.target('jaccard', () =>
        legacyEquation(
          ctx,
          api,
          C,
          String.raw`J=\frac{|A\cap B|}{|A\cup B|}=\frac{2}{6}=\frac13`,
          960,
          955,
          42,
          C.yellow,
          'center',
        ),
      );
    if (v.decision)
      legacyText(
        ctx,
        api,
        C,
        '1/3 < 0.5 · retain both complete documents',
        960,
        1030,
        28,
        C.green,
        'center',
      );
  }
}
export function drawDedupStage(ctx, scene, state, api) {
  withPretrainingOriginalFrame(ctx, scene, state, api, paintPretrainingOriginalDedup);
}
export default {
  id: 'dedup',
  draw: drawDedupStage,
  cues: ['dedup-b1-1', 'dedup-b2-1', 'dedup-b2-2', 'dedup-b2-3', 'dedup-b3-1', 'dedup-b3-2'],
};
