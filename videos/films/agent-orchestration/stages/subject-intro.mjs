import { readSchedule } from '../arithmetic.mjs';
import { focusTarget, graphText, line, requestIdentity, text } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  const graph = (cycle = false) => {
    const elapsed = beat === 0 ? api.focus.progress('read-branches', q) * 3.5 : 3.5,
      schedule = readSchedule(elapsed);
    const result = teaching.flowGraph({
      nodes: [
        {
          id: 'triage',
          focusTarget: 'release-request',
          label: 'Triage request',
          x: 160,
          y: 500,
          width: 340,
          height: 110,
          color: themeColors.yellow,
        },
        ...schedule.branches.map((row, i) => ({
          id: row.id,
          focusTarget: row.id.toLowerCase() + '-read',
          label: row.id + (row.complete ? ' receipt ready' : ' read running'),
          x: 760,
          y: 290 + i * 220,
          width: 360,
          height: 100,
          color: row.complete
            ? themeColors.green
            : [themeColors.blue, themeColors.pink, themeColors.green][i],
          fontSize: 29,
        })),
        {
          id: 'merge',
          focusTarget: 'validated-merge',
          label: schedule.mergeComplete
            ? 'Validated merge ready'
            : schedule.allReads
              ? 'Merging receipts'
              : 'Wait for all 3 reads',
          x: 1430,
          y: 500,
          width: 350,
          height: 110,
          color: schedule.mergeComplete ? themeColors.green : themeColors.yellow,
          fontSize: 28,
        },
      ],
      edges: ['Eval', 'Health', 'Policy'].flatMap((id, i) => [
        {
          from: 'triage',
          to: id,
          focusTarget: 'read-routes',
          color: [themeColors.blue, themeColors.pink, themeColors.green][i],
          gap: 35,
        },
        {
          from: id,
          to: 'merge',
          focusTarget: 'receipt-routes',
          color: schedule.branches[i].complete ? themeColors.green : themeColors.muted,
          gap: 35,
        },
      ]),
    });
    if (cycle) {
      const pts = [
        {
          x: 1605,
          y: 635,
        },
        {
          x: 1605,
          y: 860,
        },
        {
          x: 330,
          y: 860,
        },
        {
          x: 330,
          y: 635,
        },
      ];
      focusTarget(ctx, api, 'review-cycle', () => {
        api.path(ctx, pts, {
          color: themeColors.yellow,
          width: 3,
        });
        api.arrow(ctx, 330, 710, 330, 635, themeColors.yellow, 3);
        graphText(
          ctx,
          api,
          'Re-review creates a cycle',
          960,
          915,
          30,
          themeColors.yellow,
          'center',
        );
      });
    } else
      graphText(
        ctx,
        api,
        'Supplied read clock ' + elapsed.toFixed(1) + ' s',
        960,
        885,
        28,
        themeColors.muted,
        'center',
      );
    return result;
  };
  {
    focusTarget(ctx, api, 'proposal-parameters', () =>
      graphText(
        ctx,
        api,
        'Release r17 · revision 3 · traffic 25%',
        960,
        235,
        38,
        themeColors.ink,
        'center',
      ),
    );
    graph();
  }
}
export function drawSubjectIntro(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    requestIdentity(ctx, api);
    text(
      ctx,
      api,
      'Which work benefits from separate model contexts?',
      960,
      370,
      37,
      themeColors.yellow,
      'center',
    );
    const n = Math.max(1, Math.ceil(q(3) * 3));
    [
      [
        'Independent source interpretation',
        'bounded specialist contexts',
        'typed evidence returns',
      ],
      ['Deterministic ETL over known schema', 'parallel code workers', 'same validated rows'],
      [
        'Coupled edits over changing trace',
        'one scoped evolving context',
        'ordered edits + replay',
      ],
    ]
      .slice(0, n)
      .forEach((r, i) => {
        const y = 455 + i * 165;
        text(ctx, api, r[0], 180, y, 34, themeColors.blue);
        text(ctx, api, r[1], 1070, y, 32, themeColors.green);
        text(ctx, api, r[2], 1070, y + 60, 28, themeColors.muted);
        line(ctx, api, 820, y - 10, 1010, y - 10, themeColors.muted, 3);
      });
    text(
      ctx,
      api,
      'Measure wall time, tokens, coordination and review cost',
      960,
      1020,
      33,
      themeColors.cyan,
      'center',
    );
  };
  api.focus.target('subject-intro-construction', body);
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'read-branches',
    'receipts-reunite',
    'owned-results',
    'validated-join',
    'traffic-proposal',
    'same-action',
    'subject-intro-construct-3',
  ],
};
