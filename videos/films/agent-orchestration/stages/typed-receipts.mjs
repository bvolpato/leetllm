import { RECEIPTS } from '../fixtures.mjs';
import { focusTarget, graphText } from '../defaults.mjs';
export function drawTypedReceipts(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  {
    const visible =
        beat === 0
          ? Math.max(1, Math.min(3, Math.ceil(api.focus.progress('owned-branch-results', q) * 3)))
          : 3,
      rows = RECEIPTS.slice(0, visible);
    const owned = (receipt) =>
      receipt.branch === 'eval'
        ? receipt.value.failures + '/' + receipt.value.cases + ' failures'
        : receipt.branch === 'health'
          ? receipt.value.errors + '/' + receipt.value.requests + ' errors'
          : 'max traffic ' + receipt.value.maxTraffic + '%';
    const conflictProgress = api.focus.progress(
        'scalar-conflict',
        beat === 2 ? api.phase(progress, 0.3, 0.55) : 0,
      ),
      ownerProgress = api.focus.progress(
        'unique-owners',
        beat === 2 ? api.phase(progress, 0.75, 0.9) : 0,
      );
    const hasConflictCue = Boolean(state.cues?.['scalar-conflict']),
      hasOwnerCue = Boolean(state.cues?.['unique-owners']);
    const conflictStarted = hasConflictCue
      ? api.focus.visible('scalar-conflict')
      : conflictProgress > 0;
    const ownersStarted = hasOwnerCue ? api.focus.visible('unique-owners') : ownerProgress > 0;
    const tableY = beat === 2 && (conflictStarted || ownersStarted) ? 245 : 350;
    teaching.grid({
      x: 150,
      y: tableY,
      width: 1620,
      height: 100 * (visible + 1),
      rows: visible + 1,
      columns: 5,
      cellFocusTarget: (row, column) =>
        row === 0
          ? undefined
          : column === 1 || column === 2
            ? 'receipt-identity'
            : column === 3
              ? 'owned-results'
              : column === 4
                ? 'source-digest'
                : 'branch-owners',
      labels: [
        ['Branch', 'Tenant / request', 'Release / revision', 'Owned result', 'Source digest'],
        ...rows.map((receipt) => [
          receipt.branch,
          receipt.tenant + '\n' + receipt.request,
          receipt.release + ' / v' + receipt.version,
          owned(receipt),
          receipt.digest.slice(0, 12),
        ]),
      ],
      fontSize: 24,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
      padding: 10,
    });
    if (beat === 2 && conflictStarted && !ownersStarted) {
      const evalReceipt = RECEIPTS.find((receipt) => receipt.branch === 'eval'),
        healthReceipt = RECEIPTS.find((receipt) => receipt.branch === 'health');
      const nodes = [
        {
          id: 'worker-a',
          focusTarget: 'scalar-write-collision',
          label: 'Eval update · ' + owned(evalReceipt),
          x: 150,
          y: 710,
          width: 500,
          height: 92,
          color: themeColors.blue,
          fontSize: 25,
        },
        {
          id: 'shared-scalar',
          focusTarget: 'scalar-write-collision',
          label: 'One shared scalar slot',
          x: 1270,
          y: 790,
          width: 500,
          height: 105,
          color: themeColors.pink,
          fontSize: 27,
        },
      ];
      const edges = [
        {
          from: 'worker-a',
          to: 'shared-scalar',
          focusTarget: 'scalar-write-collision',
          color: themeColors.pink,
          gap: 30,
        },
      ];
      if (conflictProgress >= 0.4) {
        nodes.push({
          id: 'worker-b',
          focusTarget: 'scalar-write-collision',
          label: 'Health update · ' + owned(healthReceipt),
          x: 150,
          y: 880,
          width: 500,
          height: 92,
          color: themeColors.pink,
          fontSize: 25,
        });
        edges.push({
          from: 'worker-b',
          to: 'shared-scalar',
          focusTarget: 'scalar-write-collision',
          color: themeColors.pink,
          gap: 30,
        });
      }
      focusTarget(ctx, api, 'scalar-write-collision', () =>
        teaching.flowGraph({
          nodes,
          edges,
        }),
      );
      if (conflictProgress >= 0.72)
        focusTarget(ctx, api, 'scalar-write-collision', () =>
          graphText(ctx, api, 'Potential conflict', 960, 1010, 28, themeColors.pink, 'center'),
        );
    } else if (beat === 2 && ownersStarted) {
      const colors = {
        eval: themeColors.blue,
        health: themeColors.pink,
        policy: themeColors.green,
      };
      const lanes = RECEIPTS.map((receipt, index) => {
        const label = receipt.branch[0].toUpperCase() + receipt.branch.slice(1),
          y = 710 + index * 88;
        return [
          {
            id: receipt.branch + '-worker',
            focusTarget: 'unique-owner-resolution',
            label: label + ' worker · ' + owned(receipt),
            x: 150,
            y,
            width: 650,
            height: 74,
            color: colors[receipt.branch],
            fontSize: 22,
          },
          {
            id: receipt.branch + '-receipt',
            focusTarget: 'unique-owner-resolution',
            label: label + '-owned receipt',
            x: 1120,
            y,
            width: 650,
            height: 74,
            color: colors[receipt.branch],
            fontSize: 24,
          },
        ];
      });
      focusTarget(ctx, api, 'unique-owner-resolution', () =>
        teaching.flowGraph({
          nodes: lanes.flat(),
          edges: RECEIPTS.map((receipt) => ({
            from: receipt.branch + '-worker',
            to: receipt.branch + '-receipt',
            focusTarget: 'unique-owner-resolution',
            color: colors[receipt.branch],
            gap: 24,
          })),
        }),
      );
      focusTarget(ctx, api, 'branch-ownership-rule', () =>
        graphText(
          ctx,
          api,
          'Duplicate branch updates fail the unique-owner contract',
          960,
          1010,
          26,
          themeColors.yellow,
          'center',
        ),
      );
    } else {
      focusTarget(ctx, api, 'branch-ownership-rule', () =>
        graphText(
          ctx,
          api,
          visible + '/3 branch-owned receipts admitted',
          960,
          850,
          32,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'typed-receipts',
  draw: drawTypedReceipts,
  cues: [
    'trusted-identity',
    'owned-branch-results',
    'field-ownership',
    'source-identity',
    'branch-ownership',
    'scalar-conflict',
    'unique-owners',
  ],
};
