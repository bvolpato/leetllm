import { motion, sum } from '../arithmetic.mjs';
import { sampleModel, servedSelectionSnapshot } from '../construction.mjs';
import { card, text as originalText } from '../defaults.mjs';
export function drawAssignment(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('assignment', state),
    currentBeat = modelState.step;
  {
    const filter = state.cues?.['served-only-selection'],
      filtered = filter ? filter.phase !== 'before' : modelState.filterApplied;
    if (filtered) {
      const selection = servedSelectionSnapshot(
          filter
            ? filter.phase === 'after'
              ? 1
              : filter.progress
            : motion((state.beatP - 0.6) / 0.4),
        ),
        assigned = selection.users;
      originalText(ctx, api, 'Assigned treatment', 510, 300, 34, themeColors.cyan, 'center');
      originalText(
        ctx,
        api,
        'Filter: served treatment only',
        1420,
        300,
        34,
        themeColors.yellow,
        'center',
      );
      originalText(
        ctx,
        api,
        'Same three user identities · observed outcomes',
        960,
        245,
        27,
        themeColors.muted,
        'center',
      );
      assigned.forEach((row, i) => {
        const y = 400 + i * 155,
          selected = row.served === 'T';
        api.focus.target('assignment-row-id', () =>
          card(
            ctx,
            api,
            row.id + ' · ' + (row.y ? 'resolved' : 'failed'),
            240,
            y,
            540,
            row.y ? themeColors.green : themeColors.pink,
            95,
            30,
          ),
        );
        components.fade(1 - 0.7 * row.drop, () =>
          api.focus.target('served-only-users', () =>
            card(
              ctx,
              api,
              selected
                ? row.id + ' · resolved'
                : row.id +
                    (row.drop === 1
                      ? ' · dropped: ' + (row.served === 'timeout' ? 'timeout' : 'fallback')
                      : ' · failed'),
              1150 + 60 * row.drop,
              y,
              560,
              selected ? themeColors.green : row.drop ? themeColors.muted : themeColors.pink,
              95,
              29,
            ),
          ),
        );
        api.arrow(
          ctx,
          810,
          y + 47,
          1115,
          y + 47,
          selected ? themeColors.cyan : themeColors.pink,
          4,
        );
      });
      api.focus.target('assignment-row-id', () =>
        originalText(
          ctx,
          api,
          'Assigned: ' + sum(assigned.map((row) => row.y)) + '/' + assigned.length + ' resolved',
          510,
          925,
          38,
          themeColors.cyan,
          'center',
        ),
      );
      api.focus.target('served-only-users', () =>
        originalText(
          ctx,
          api,
          'Filtered: ' + selection.success + '/' + selection.n + ' resolved',
          1420,
          925,
          38,
          themeColors.yellow,
          'center',
        ),
      );
      originalText(
        ctx,
        api,
        selection.n === 1
          ? 'The filter removes both failed treatment assignments'
          : 'Keep the outcomes attached as the denominator changes',
        960,
        995,
        28,
        themeColors.pink,
        'center',
      );
      return;
    }
    originalText(ctx, api, 'CONTROL · current prompt', 350, 300, 30, themeColors.blue, 'center');
    originalText(ctx, api, 'TREATMENT · edited prompt', 1550, 300, 30, themeColors.cyan, 'center');
    originalText(
      ctx,
      api,
      modelState.settled
        ? `${modelState.users.length} unique users · assignment persisted`
        : 'Eligible user identities',
      960,
      260,
      30,
      themeColors.yellow,
      'center',
    );
    modelState.users.forEach((row) => {
      const color = row.settled
        ? row.assigned === 'C'
          ? themeColors.blue
          : themeColors.cyan
        : themeColors.muted;
      api.focus.target('assignment-row-id', () =>
        components.card({
          label: row.id,
          x: row.cx - 42,
          y: row.cy - 36,
          width: 84,
          height: 72,
          radius: 32,
          fontSize: 29,
          padding: 8,
          fill: themeColors.panel,
          stroke: color,
          textColor: color,
        }),
      );
      if (modelState.settled) {
        const left = row.assigned === 'C',
          x = left ? 470 : 1050;
        const label = row.observed
          ? `${row.served === 'timeout' ? 'timeout' : `served ${row.served}`}${row.id === 'T2' ? ' · fallback' : ''}\noutcome ${row.y ? 'resolved' : 'failed'}`
          : `assigned ${row.assigned} · prompt ${left ? 'current' : 'edited'}\noutcome pending`;
        card(
          ctx,
          api,
          label,
          x,
          row.cy - 55,
          390,
          row.observed ? (row.y ? themeColors.green : themeColors.pink) : themeColors.muted,
          110,
          25,
        );
        api.arrow(ctx, left ? 398 : 1502, row.cy, left ? 458 : 1452, row.cy, color, 3);
      }
    });
    const counts = ['C', 'T'].map(
      (arm) => modelState.users.filter((row) => row.assigned === arm).length,
    );
    originalText(
      ctx,
      api,
      modelState.complete
        ? 'Primary assigned users: ' +
            modelState.assignedRates
              .map((row) => `${row.arm === 'C' ? 'control' : 'treatment'} ${row.success}/${row.n}`)
              .join(' · ')
        : modelState.settled
          ? `Observed outcomes ${modelState.mature.length}/${modelState.users.length} · assigned users stay ${counts.join(' + ')}`
          : 'Each user keeps one arm across later turns',
      960,
      920,
      34,
      modelState.complete ? themeColors.yellow : themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'assignment',
  draw: drawAssignment,
  cues: ['assignment-beat-1-focus-1', 'served-only-selection', 'assignment-beat-2-focus-1'],
};
