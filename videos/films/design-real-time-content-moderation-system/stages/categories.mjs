import { names, thresholds } from '../fixtures.mjs';
import { decide, sampleModel } from '../model.mjs';
import { categorySnapshot } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawCategories(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel(state);
  {
    const beat = Math.min(1, state.beat ?? 0),
      data = categorySnapshot(beat, state.beatP ?? 0);
    const x = (value) => 630 + value * 560;
    text(
      ctx,
      api,
      beat
        ? 'Validate the complete response before choosing an action'
        : 'One post · accumulate every triggered reason',
      960,
      275,
      34,
      themeColors.ink,
      'center',
    );
    ['Score', 'Review', 'Block', 'Action'].forEach((label, index) =>
      text(
        ctx,
        api,
        label,
        [1335, 1455, 1575, 1735][index],
        330,
        24,
        index === 1 ? themeColors.yellow : index === 2 ? themeColors.pink : themeColors.muted,
        'center',
      ),
    );
    text(ctx, api, '0', x(0), 330, 24, themeColors.muted, 'center');
    text(ctx, api, '1', x(1), 330, 24, themeColors.muted, 'center');
    names.forEach((name, index) => {
      const row = data.rows[index],
        y = 395 + index * 74,
        active = row.arrived && row.fraction < 1;
      text(ctx, api, name, 165, y + 9, 27, active ? themeColors.cyan : themeColors.ink);
      api.line(ctx, x(0), y, x(1), y, themeColors.muted, 2);
      thresholds[index].forEach((value, j) =>
        api.line(
          ctx,
          x(value),
          y - 13,
          x(value),
          y + 14,
          j ? themeColors.pink : themeColors.yellow,
          3,
        ),
      );
      if (row.arrived && Number.isFinite(row.value))
        api.circle(
          ctx,
          x(row.value),
          y,
          10,
          row.action === 'BLOCK'
            ? themeColors.pink
            : row.action === 'REVIEW'
              ? themeColors.yellow
              : themeColors.blue,
        );
      api.focus.target('category-score-set', () =>
        text(
          ctx,
          api,
          !row.arrived ? '…' : Number.isFinite(row.value) ? row.value.toFixed(2) : 'NaN',
          1335,
          y + 9,
          26,
          Number.isFinite(row.value) ? themeColors.cyan : themeColors.pink,
          'center',
        ),
      );
      text(
        ctx,
        api,
        thresholds[index][0].toFixed(2),
        1455,
        y + 9,
        24,
        themeColors.yellow,
        'center',
      );
      text(ctx, api, thresholds[index][1].toFixed(2), 1575, y + 9, 24, themeColors.pink, 'center');
      const action =
        beat && index === 1
          ? data.malformed
            ? 'INVALID'
            : 'PENDING'
          : row.arrived && row.fraction === 1
            ? row.action
            : '…';
      text(
        ctx,
        api,
        action,
        1735,
        y + 9,
        24,
        action === 'BLOCK' || action === 'INVALID'
          ? themeColors.pink
          : action === 'REVIEW'
            ? themeColors.yellow
            : themeColors.muted,
        'center',
      );
    });
    if (!beat) {
      api.focus.target('categories-names-reason-index-reason-action', () => {
        if (!data.reasons.length)
          card(
            ctx,
            api,
            'Triggered-reason ledger · pending scores',
            400,
            845,
            1120,
            themeColors.muted,
            65,
          );
        data.reasons.forEach((reason, index) =>
          card(
            ctx,
            api,
            names[reason.index] + ' → ' + reason.action,
            365 + index * 650,
            845,
            570,
            reason.action === 'BLOCK' ? themeColors.pink : themeColors.yellow,
            65,
          ),
        );
      });
      const checked = data.rows.filter((row) => row.arrived && row.fraction === 1).length;
      const operation = state.cues
        ? api.focus.progress('category-controller-precedence', 0) >= 0.55
        : data.ready;
      const decision =
        checked === names.length && operation ? decide(data.rows.map((row) => row.value)) : null;
      api.focus.target('category-controller-decision', () =>
        card(
          ctx,
          api,
          decision
            ? `${checked} / ${names.length} checked · BLOCK outranks REVIEW → ${decision}`
            : `${checked} / ${names.length} checked · controller decision pending`,
          270,
          950,
          1380,
          decision ? themeColors.pink : themeColors.muted,
          70,
        ),
      );
    } else {
      const checks = [
        ['6 / 6 categories', true],
        ['All finite', false],
        ['All in [0, 1]', false],
      ];
      checks.forEach(([label, pass], index) =>
        api.focus.target('categories-data-checks-index-pass-label-label-pending', () =>
          card(
            ctx,
            api,
            data.checks[index] ? (pass ? '✓ ' : '× ') + label : label + ' · pending',
            205 + index * 515,
            850,
            480,
            data.checks[index] ? (pass ? themeColors.green : themeColors.pink) : themeColors.muted,
            65,
          ),
        ),
      );
      text(
        ctx,
        api,
        data.review
          ? 'Invalid violence score → explicit REVIEW disposition'
          : data.malformed
            ? 'NaN fails finite/range validation · no threshold decision'
            : 'Checking response P17 before threshold evaluation',
        960,
        982,
        30,
        data.review ? themeColors.yellow : themeColors.muted,
        'center',
      );
      if (state.cues ? api.focus.visible('categories-beat-2-focus-1') : data.seconds > 13.7)
        api.focus.target('category-calibration', () =>
          text(
            ctx,
            api,
            'Calibrate scores against reviewed outcomes before probability language.',
            960,
            1032,
            25,
            themeColors.muted,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'categories',
  draw: drawCategories,
  cues: [
    'categories-beat-1-focus-1',
    'category-controller-precedence',
    'categories-beat-2-focus-1',
    'categories-beat-2-focus-2',
  ],
};
