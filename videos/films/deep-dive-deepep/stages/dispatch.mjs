import { hidden, source } from '../fixtures.mjs';
import { dispatchExpansionSnapshot, sampleModel } from '../construction.mjs';
import { card, grid, text } from '../defaults.mjs';
export function drawDispatch(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('dispatch', state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  const route = (a, z, progress, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    text(
      ctx,
      api,
      'Ranks 0 and 1 · experts [0, 1] and [2, 3]',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 1) {
      const fallback = dispatchExpansionSnapshot(state.beatP ?? 0);
      const leg = (id, complete) => state.cues?.[id]?.progress ?? Number(complete);
      const send = leg('de-dispatch-send', fallback.delivered);
      const branch = [
        leg('de-dispatch-e2', fallback.expanded >= 1),
        leg('de-dispatch-e3', fallback.expanded === 2),
      ];
      const received = Number(send === 1);
      const expanded = branch.filter((p) => p === 1).length;
      const a = card(ctx, api, 'a · [1, 0] · source rank 0', 130, 470, 510, themeColors.yellow),
        dest = api.focus.target(
          'dispatch-ex-delivered-a-one-row-at-rank-1-rank-1-receive-pending',
          () =>
            card(
              ctx,
              api,
              received ? 'a · one row at rank 1' : 'Rank 1 receive slot',
              780,
              470,
              500,
              received ? themeColors.cyan : themeColors.muted,
            ),
        );
      if (send > 0) route(a, dest, send);
      [2, 3].forEach((expert, i) => {
        const node = api.focus.target(
          'dispatch-ex-expertrows-includes-expert-a-e-expert-gate-7-3-i-e-expert-slot-pe',
          () =>
            card(
              ctx,
              api,
              branch[i] === 1
                ? 'a → E' + expert + ' · gate ' + [0.7, 0.3][i]
                : 'E' + expert + ' slot pending',
              1430,
              340 + i * 290,
              380,
              branch[i] === 1 ? themeColors.green : themeColors.muted,
            ),
        );
        if (branch[i] > 0) route(dest, node, branch[i], themeColors.green);
      });
      text(
        ctx,
        api,
        'One destination row carries two expert selections',
        960,
        765,
        34,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Token a     destination rows delivered   ' +
          received +
          '     expert slots filled   ' +
          expanded,
        960,
        860,
        34,
        themeColors.ink,
        'center',
      );
      api.focus.target('dep-dispatch-summary', () =>
        text(
          ctx,
          api,
          result('dispatch-seven')
            ? 'Complete four-token fixture: 8 assignments · 7 destination rows'
            : expanded === 2
              ? 'Local expansion complete · four-token totals pending'
              : 'Tokens b, c and d still use six destination rows',
          960,
          965,
          29,
          result('dispatch-seven') ? themeColors.green : themeColors.muted,
          'center',
        ),
      );
    } else {
      const rows = Object.keys(hidden).map((token) => [
        token,
        source[token],
        ...modelState.choices[token].map(([e, w]) => (e < 0 ? 'unused' : `E${e} · ${w}`)),
      ]);
      api.focus.target(
        'dispatch-grid-token-source-rank-selection-0-selection-1-rows-250-390-1420-400',
        () =>
          grid(
            ctx,
            api,
            [['Token', 'Source rank', 'Selection 0', 'Selection 1'], ...rows],
            250,
            390,
            1420,
            400,
            themeColors.blue,
            32,
          ),
      );
      api.focus.target('dep-dispatch-summary', () => {
        const ready = result(currentBeat === 0 ? 'dispatch-eight' : 'dispatch-mask');
        text(
          ctx,
          api,
          ready
            ? `Expert assignments ${modelState.slots.length} · distinct token-destination rows ${modelState.destinations}`
            : 'Count current expert selections and token-destination identities',
          960,
          920,
          36,
          ready ? themeColors.green : themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          ready
            ? `Per-expert real counts: [${modelState.counts.join(', ')}] · transport precedes local expert expansion`
            : 'Route inputs retained · completed count summary pending',
          960,
          1010,
          28,
          themeColors.muted,
          'center',
        );
      });
    }
  }
}
export default {
  id: 'dispatch',
  draw: drawDispatch,
  cues: [
    'dispatch-beat-1-focus-1',
    'dep-result-dispatch-eight',
    'de-dispatch-send',
    'de-dispatch-e2',
    'de-dispatch-e3',
    'dep-result-dispatch-seven',
    'dispatch-beat-3-focus-1',
    'dep-result-dispatch-mask',
  ],
};
