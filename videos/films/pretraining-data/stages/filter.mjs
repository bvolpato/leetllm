import { corpus } from '../fixtures.mjs';
import { filterState } from '../model.mjs';
import {
  documentCard,
  legacyCard,
  legacyEquation,
  legacyText,
  withPretrainingOriginalFrame,
} from '../defaults.mjs';
export function paintPretrainingOriginalFilter(ctx, scene, state, api, C, c, t, b, p, s) {
  const current = filterState(state),
    { threshold } = current;
  if (b >= 2)
    legacyText(
      ctx,
      api,
      C,
      'Separate source-rule test · reset score cutoff to 0.50',
      960,
      295,
      31,
      C.yellow,
      'center',
    );
  corpus.forEach((r, i) =>
    api.focus.target('filtered-records', () =>
      documentCard(
        ctx,
        api,
        C,
        c,
        r,
        210 + i * 310,
        370 + (b >= 2 && r.id === 'C' ? 280 * current.removalProgress : 0),
        b >= 2 && r.id === 'C'
          ? 1 - 0.35 * current.removalProgress
          : current.records.includes(r)
            ? 1
            : 0.4,
      ),
    ),
  );
  if (b >= 2 && current.sourceRule)
    legacyText(ctx, api, C, 'Excluded source lane · C', 965, 625, 27, C.pink, 'center');
  api.focus.target('score-cutoff', () =>
    legacyEquation(ctx, api, C, `\\tau=${threshold.toFixed(2)}`, 500, 725, 50, C.yellow, 'center'),
  );
  api.focus.target('retained-tokens', () =>
    legacyCard(
      ctx,
      api,
      C,
      c,
      `${current.tokens} retained tokens`,
      b >= 2 ? 1250 : 1090,
      680,
      490,
      C.cyan,
    ),
  );
  api.focus.target('retained-score', () =>
    legacyText(
      ctx,
      api,
      C,
      'Token-weighted mean score: ' + current.average.toFixed(3),
      b >= 2 ? 1250 : 1090,
      835,
      b >= 2 ? 27 : 30,
      C.yellow,
    ),
  );
  legacyText(
    ctx,
    api,
    C,
    b >= 2
      ? current.sourceRule
        ? 'Additional rule: prose source + at least 200 tokens'
        : 'Which other record fails? Keep prose with at least 200 tokens.'
      : 'A score is a selection signal; inspect what each cutoff removes',
    960,
    910,
    31,
    b >= 2 ? C.yellow : C.muted,
    'center',
  );
  api.rect(ctx, 300, 935, 1320, 32, C.panel);
  api.rect(ctx, 300, 935, (1320 * current.tokens) / 1000, 32, C.cyan);
  legacyText(
    ctx,
    api,
    C,
    'Retained token mass: ' + current.tokens + ' / 1,000 extracted tokens',
    960,
    1015,
    28,
    C.cyan,
    'center',
  );
}
export function drawFilterStage(ctx, scene, state, api) {
  withPretrainingOriginalFrame(ctx, scene, state, api, paintPretrainingOriginalFilter);
}
export default {
  id: 'filter',
  draw: drawFilterStage,
  cues: [
    'filter-b1-1',
    'filter-threshold-rise',
    'filter-b2-1',
    'filter-b2-2',
    'filter-rule-question',
    'filter-b3-1',
  ],
};
