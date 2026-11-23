import { labels, records } from '../fixtures.mjs';
import { coverageFrame } from '../construction.mjs';
import { accountingCueComplete, accountingEquation, accountingText } from '../defaults.mjs';
export function drawCoverage(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  if (currentBeat === 3) {
    accountingText(
      ctx,
      api,
      'The same ten pair IDs remain in the report',
      960,
      275,
      31,
      themeColors.muted,
    );
    records.forEach((row, i) => {
      const x = 120 + (i % 5) * 340,
        y = 340 + Math.floor(i / 5) * 200,
        color = i < 8 ? themeColors.green : i === 8 ? themeColors.yellow : themeColors.pink;
      api.focus.target('pair-cases', () => {
        api.rect(ctx, x, y, 310, 170, themeColors.panel, color, 12);
        accountingText(
          ctx,
          api,
          'J' + String(i + 1).padStart(2, '0'),
          x + 155,
          y + 35,
          27,
          themeColors.ink,
        );
        accountingText(ctx, api, 'Judge: ' + row.outcome, x + 155, y + 83, 25, color);
        accountingText(
          ctx,
          api,
          i < 8 ? 'Human: ' + row.human : 'Human: excluded',
          x + 155,
          y + 132,
          23,
          i < 8 && row.human === row.outcome ? themeColors.green : themeColors.muted,
        );
      });
    });
    if (api.focus.visible('extra-parse'))
      api.focus.target('extra-parse', () => {
        api.rect(ctx, 130, 760, 450, 120, themeColors.panel, themeColors.pink, 12);
        accountingText(ctx, api, 'J11 · malformed JSON', 355, 807, 30, themeColors.pink);
        accountingText(ctx, api, 'parse failure retained', 355, 855, 27, themeColors.ink);
      });
    if (api.focus.visible('extra-coverage'))
      api.focus.target('extra-coverage', () => {
        if (accountingCueComplete(ctx, api, 'extra-coverage'))
          accountingEquation(
            ctx,
            api,
            '\\mathrm{coverage}=\\frac8{11}\\approx72.7\\%',
            1180,
            815,
            46,
            themeColors.cyan,
          );
        else
          accountingText(
            ctx,
            api,
            'Coverage calculation pending',
            1180,
            815,
            31,
            themeColors.muted,
          );
        accountingText(
          ctx,
          api,
          '8 resolved + 1 unresolved + 1 review + 1 parse failure',
          1120,
          915,
          28,
          themeColors.muted,
        );
      });
    if (api.focus.visible('unchanged-agreement'))
      api.focus.target('unchanged-agreement', () => {
        if (accountingCueComplete(ctx, api, 'unchanged-agreement'))
          accountingEquation(
            ctx,
            api,
            '\\mathrm{agreement}=\\frac68=75\\%\\quad\\mathrm{unchanged}',
            960,
            1000,
            41,
            themeColors.yellow,
          );
        else
          accountingText(
            ctx,
            api,
            'Comparable-label calculation pending',
            960,
            1000,
            31,
            themeColors.muted,
          );
      });
    return;
  }
  {
    const frame = coverageFrame(currentBeat, progress2);
    if (state.cues?.['resolve-rest']) {
      const count = Math.ceil(8 * api.focus.progress('resolve-rest', 0)),
        checked = Math.ceil(8 * api.focus.progress('human-denominator', 0));
      frame.rows = frame.rows.map((row, i) => ({
        ...row,
        classified:
          i < 8
            ? i < count
            : i === 8
              ? api.focus.visible('unresolved-attempts')
              : api.focus.visible('review-attempt'),
        compared: i < checked,
      }));
      const classified = frame.rows.filter((r) => r.classified),
        compared = frame.rows.filter((r) => r.compared);
      Object.assign(frame, {
        resolved: classified.filter((r) => labels.includes(r.outcome)).length,
        pending: 10 - classified.length,
        unresolved: classified.filter((r) => r.outcome === 'unresolved').length,
        review: classified.filter((r) => r.outcome === 'review').length,
        checked: compared.length,
        matching: compared.filter((r) => r.human === r.outcome).length,
      });
    }
    accountingText(
      ctx,
      api,
      'Ten persistent pair IDs · each outcome keeps its denominator',
      960,
      275,
      31,
      themeColors.muted,
      'center',
    );
    frame.rows.forEach((row, i) => {
      const x = 120 + (i % 5) * 340,
        y = 340 + Math.floor(i / 5) * 200;
      const color = !row.classified
        ? themeColors.muted
        : row.outcome === 'unresolved'
          ? themeColors.yellow
          : row.outcome === 'review'
            ? themeColors.pink
            : themeColors.green;
      api.focus.target('pair-cases', () =>
        components.panel({
          x,
          y,
          width: 310,
          height: 170,
          fill: themeColors.panel,
          stroke: color,
        }),
      );
      api.focus.target('pair-cases', () =>
        accountingText(ctx, api, row.id, x + 155, y + 35, 27, themeColors.ink, 'center'),
      );
      api.focus.target('pair-cases', () =>
        accountingText(
          ctx,
          api,
          row.classified ? 'Judge: ' + row.outcome : 'Judge: pending',
          x + 155,
          y + 83,
          25,
          color,
          'center',
        ),
      );
      api.focus.target('human-comparisons', () =>
        accountingText(
          ctx,
          api,
          i >= 8 ? 'Human: excluded' : row.compared ? 'Human: ' + row.human : 'Human: pending',
          x + 155,
          y + 132,
          23,
          row.compared
            ? row.human === row.outcome
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
          'center',
        ),
      );
    });
    api.focus.target('outcome-counts', () =>
      api.teaching.changeCue(
        {
          x: 200,
          y: 730,
          width: 1520,
          height: 65,
          from: 0,
          to: frame.resolved,
          progress: 1,
          color: themeColors.green,
          restColor: themeColors.ink,
          emphasis: currentBeat === 0 && frame.resolved > 0 && progress2 < 0.75 ? 0.7 : 0,
        },
        (cue) =>
          accountingText(
            ctx,
            api,
            'Resolved ' +
              cue.value +
              ' / 10 · unresolved ' +
              frame.unresolved +
              ' · review ' +
              frame.review +
              ' · pending ' +
              frame.pending,
            960,
            775,
            30,
            cue.color,
            'center',
          ),
      ),
    );
    const x = 220,
      width = 1480,
      y = 825,
      groups = [
        [frame.resolved, themeColors.green],
        [frame.unresolved, themeColors.yellow],
        [frame.review, themeColors.pink],
        [frame.pending, themeColors.muted],
      ];
    let offset = 0;
    for (const [count, color] of groups) {
      if (count > 0)
        api.focus.target('outcome-counts', () =>
          api.rect(ctx, x + (width * offset) / 10, y, (width * count) / 10, 35, color),
        );
      offset += count;
    }
    if (frame.pending === 0)
      api.focus.target('coverage-score', () =>
        accountingEquation(
          ctx,
          api,
          String.raw`\mathrm{coverage}=\frac{${frame.resolved}}{10}=${(frame.resolved / 10).toFixed(2)}`,
          540,
          950,
          40,
          themeColors.cyan,
        ),
      );
    else
      accountingText(
        ctx,
        api,
        'Coverage waits for every attempt outcome',
        540,
        950,
        28,
        themeColors.muted,
        'center',
      );
    if (frame.checked > 0)
      api.focus.target('agreement-score', () =>
        accountingEquation(
          ctx,
          api,
          String.raw`\mathrm{agreement}=\frac{${frame.matching}}{${frame.checked}}=${(frame.matching / frame.checked).toFixed(2)}`,
          1380,
          950,
          38,
          themeColors.yellow,
        ),
      );
    else
      accountingText(
        ctx,
        api,
        'Agreement waits for human-label comparisons',
        1380,
        950,
        27,
        themeColors.muted,
        'center',
      );
    accountingText(
      ctx,
      api,
      frame.checked < 8
        ? 'Human comparisons completed: ' + frame.checked + ' / 8 resolved pairs'
        : 'All eight resolved pairs compared · stable ties remain resolved',
      960,
      1040,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'coverage',
  draw: drawCoverage,
  cues: [
    'all-attempts',
    'unresolved-attempts',
    'review-attempt',
    'resolve-rest',
    'resolved-denominator',
    'human-denominator',
    'difficult-cases',
    'extra-parse',
    'extra-coverage',
    'unchanged-agreement',
  ],
};
