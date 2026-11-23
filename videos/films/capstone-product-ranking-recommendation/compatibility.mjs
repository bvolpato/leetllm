import { clip } from './arithmetic.mjs';
import { EXTENDED_SCENES } from './fixtures.mjs';
import { rankingResponse } from './model.mjs';
import { sampleModel } from './construction.mjs';
import { card, text } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  EXTENDED_SCENES.has(scene.id);
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state);
  const response = rankingResponse(),
    originalIds = ['P4', 'P5', 'P6'];
  text(ctx, api, response.request + ' · Search: ' + response.query, 960, 280, 38, C.ink, 'center');
  text(ctx, api, 'Eligible candidates · learned scores', 455, 365, 30, C.cyan, 'center');
  api.focus.target('display-slate', () =>
    api.rect(ctx, 1040, 335, 740, 565, 'transparent', C.green, 20),
  );
  text(ctx, api, 'Saved response order', 1410, 385, 31, C.green, 'center');
  response.slate.forEach((row) => {
    const sourceIndex = originalIds.indexOf(row.id),
      sourceY = 430 + sourceIndex * 155,
      targetY = 430 + (row.rank - 1) * 155;
    const fallback =
      state.beat === 0 ? 0 : clip((state.beatP - ((row.rank - 1) * 0.18 + 0.02)) / 0.18);
    const progress = api.focus.progress('synthesis-store-' + row.id.toLowerCase(), fallback);
    const x = api.lerp(200, 1110, progress),
      y = api.lerp(sourceY, targetY, api.phase(progress, 0.3, 0.7));
    if (progress > 0) c.fade(0.22, () => card(ctx, api, row.id, 200, sourceY, 510, C.muted, 95));
    api.focus.target('eligibility-scores', () =>
      api.focus.target('slate-' + row.id.toLowerCase(), () =>
        card(
          ctx,
          api,
          (progress === 1 ? row.rank + ' · ' : '') + row.id + ' · ' + row.score.toFixed(3),
          x,
          y,
          510,
          [C.green, C.blue, C.pink][row.rank - 1],
          95,
        ),
      ),
    );
  });
  text(ctx, api, 'P8: policy block · P11: wrong region', 455, 955, 27, C.pink, 'center');
  const committed =
    state.beat > 0
      ? api.focus.progress('synthesis-store-p4', clip((state.beatP - 0.38) / 0.18))
      : 0;
  c.fade(committed, () =>
    api.focus.target('evidence-fields', () => {
      text(
        ctx,
        api,
        'R42 · pairwise-v1 · policy-v7 · assignment B',
        1410,
        955,
        26,
        C.green,
        'center',
      );
      text(ctx, api, 'Later outcomes join this saved slate', 1410, 1015, 27, C.muted, 'center');
    }),
  );
}
