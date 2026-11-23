import { filterEvidence, sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawFilter(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('filter', state),
    currentBeat = modelState.step;
  {
    const evidence =
        currentBeat === 2
          ? modelState.evidence
          : filterEvidence(
              currentBeat,
              state.cues?.['compare-lanes'] && currentBeat === 0
                ? 0.04 + 0.72 * api.focus.progress('compare-lanes', 0)
                : (state.beatP ?? 0),
            ),
      input = currentBeat === 2 ? modelState.context : 24000,
      oversizedCue = state.cues?.['oversized-input'],
      emptySetCue = state.cues?.['empty-set'];
    api.focus.target('context-demand', () =>
      teaching.changeCue(
        {
          x: 130,
          y: 235,
          width: 1250,
          height: 75,
          from: 24000,
          to: input,
          progress: 1,
          emphasis:
            currentBeat === 2 &&
            (oversizedCue?.phase === 'during' || emptySetCue?.phase === 'during')
              ? 1
              : 0,
          color: themeColors.yellow,
          restColor: themeColors.muted,
        },
        (cue) =>
          text(
            ctx,
            api,
            `R900 · required context ${Math.round(cue.value).toLocaleString('en-US')} · full contract applies`,
            155,
            285,
            29,
            cue.color,
          ),
      ),
    );
    const xs = [265, 500, 665, 830, 995, 1160, 1325],
      labels = ['Lane', 'Data', 'Max tokens', 'Schema', 'Cites', 'Review', 'Cost'];
    labels.forEach((label, i) =>
      text(ctx, api, label, xs[i], 350, 25, themeColors.muted, 'center'),
    );
    text(
      ctx,
      api,
      currentBeat === 2 ? 'Capacity vs. demand' : 'Feasible set',
      1650,
      350,
      27,
      currentBeat === 2 ? themeColors.yellow : themeColors.green,
      'center',
    );
    evidence.rows.forEach(({ lane, checks }, i) => {
      const y = 385 + i * 76,
        eligible = evidence.admitted.includes(lane.id),
        rowDone = checks.every((check) => check.checked);
      api.focus.target('lane-records', () =>
        components.panel({
          x: 130,
          y,
          width: 1300,
          height: 65,
          fill: themeColors.panel,
          stroke: currentBeat === 1 && lane.id === 'F' ? themeColors.yellow : themeColors.muted,
        }),
      );
      api.focus.target('lane-records', () =>
        text(ctx, api, `${lane.id} · ${lane.name}`, 150, y + 42, 23, themeColors.blue),
      );
      checks.forEach((check, j) => {
        const focused =
          currentBeat === 1 &&
          lane.id === 'F' &&
          ['schema', 'citations', 'review'].includes(check.field);
        if (check.field === 'context') {
          api.focus.target('capability-checks', () =>
            text(
              ctx,
              api,
              lane.capacity.toLocaleString('en-US'),
              xs[j + 1],
              y + 25,
              22,
              themeColors.ink,
              'center',
            ),
          );
        }
        api.focus.target('capability-checks', () =>
          text(
            ctx,
            api,
            check.checked ? (check.pass ? 'pass' : 'FAIL') : '?',
            xs[j + 1],
            y + (check.field === 'context' ? 55 : 42),
            focused ? 28 : 24,
            check.checked
              ? check.pass
                ? currentBeat > 0
                  ? themeColors.muted
                  : themeColors.green
                : themeColors.pink
              : themeColors.muted,
            'center',
          ),
        );
      });
      if (currentBeat === 2) {
        const x = (tokens) => 1470 + (tokens / 72000) * 340;
        api.focus.target('context-demand', () => {
          api.rect(ctx, x(0), y + 8, x(lane.capacity) - x(0), 12, themeColors.blue);
          api.line(ctx, x(input), y + 3, x(input), y + 25, themeColors.yellow, 4);
        });
      }
      if (eligible && currentBeat !== 2) {
        const travel =
          currentBeat === 0
            ? api.phase(state.beatP ?? 0, 0.04 + (i + 1) * 0.12, 0.085 + (i + 1) * 0.12)
            : 1;
        const x = api.lerp(1460, 1530, travel);
        api.focus.target('feasible-lanes', () =>
          components.panel({
            x,
            y,
            width: 240,
            height: 65,
            fill: themeColors.panel,
            stroke: themeColors.green,
          }),
        );
        api.focus.target('feasible-lanes', () =>
          text(ctx, api, `${lane.id} · admitted`, x + 120, y + 43, 25, themeColors.green, 'center'),
        );
      } else if (currentBeat === 2 && ['C', 'D', 'E'].includes(lane.id))
        api.focus.target('filter-outcome', () =>
          text(
            ctx,
            api,
            eligible
              ? `${lane.id} · admitted`
              : rowDone
                ? `${lane.id} · rejected`
                : `${lane.id} · pending`,
            1650,
            y + 58,
            25,
            eligible ? themeColors.green : rowDone ? themeColors.pink : themeColors.yellow,
            'center',
          ),
        );
    });
    if (currentBeat === 2)
      text(
        ctx,
        api,
        'Blue bars show lane capacity. Yellow marks the required input.',
        960,
        890,
        27,
        themeColors.muted,
        'center',
      );
    const noFeasible =
      currentBeat === 2 && evidence.completed === 6 && evidence.admitted.length === 0;
    api.focus.target('filter-outcome', () =>
      text(
        ctx,
        api,
        currentBeat === 2
          ? noFeasible
            ? 'No feasible lane → escalate without generation'
            : 'Recheck each lane’s context capacity before dispatch'
          : currentBeat === 1
            ? 'F: acceptable data and price · schema, citations and review fail'
            : `${evidence.completed}/36 field comparisons · only complete passing rows enter the set`,
        960,
        960,
        30,
        currentBeat === 2 ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'filter',
  draw: drawFilter,
  cues: ['compare-lanes', 'feasible-survivors', 'cheap-lane', 'oversized-input', 'empty-set'],
};
