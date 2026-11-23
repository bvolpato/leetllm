import { rayChapterState, rayProgress } from '../construction.mjs';
import { chapterCard, chapterGrid, chapterText, footer, heading } from '../defaults.mjs';
export function drawBundleMembership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('bundle-membership', state),
    { b: currentBeat, p: progress } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-bundle-membership-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Bind workers to the reservation they consume'
        : currentBeat === 1
          ? modelState.strategy === 'BUNDLE'
            ? 'One four-GPU bundle · same two nodes'
            : modelState.strategy.replaceAll('_', ' ') + ' · four one-GPU bundles'
          : 'Later node loss leaves surviving reservations intact',
    );
    const labels = [[], []];
    if (currentBeat === 1) {
      for (let i = 0; i < modelState.assignment.length; i++)
        labels[modelState.assignment[i]].push('B' + i);
    } else {
      const freed = currentBeat === 0 && done('group-remove', 0);
      labels[0] = freed ? [] : ['B0', 'B1'];
      labels[1] = freed ? [] : modelState.nodeLost ? ['lost B2', 'lost B3'] : ['B2', 'B3'];
    }
    for (let n = 0; n < 2; n++) {
      chapterText(
        ctx,
        api,
        'Node ' + n + ' · GPU capacity2',
        520 + n * 880,
        380,
        31,
        n && modelState.nodeLost ? themeColors.pink : themeColors.blue,
        'center',
      );
      chapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 2,
            },
            (_, i) => labels[n][i] ?? 'free',
          ),
        ],
        170 + n * 880,
        430,
        700,
        130,
        n && modelState.nodeLost ? themeColors.pink : themeColors.blue,
        31,
      );
    }
    if (currentBeat === 0) {
      const use = done('group-consume', 0),
        removed = done('group-remove', 0);
      for (let i = 0; i < 4; i++)
        chapterCard(
          ctx,
          api,
          removed ? 'released' : use ? 'worker' + i + ' → bundle' + i : 'unbound worker' + i,
          150 + i * 430,
          740,
          390,
          removed ? themeColors.green : use ? themeColors.cyan : themeColors.muted,
          95,
          26,
        );
      chapterText(
        ctx,
        api,
        removed
          ? 'Separate unused group G1 released; removal is asynchronous'
          : use
            ? 'Strategy + group + explicit bundle membership'
            : 'Reservation does not enroll ordinary work',
        960,
        920,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      if (modelState.strategy === 'BUNDLE')
        chapterGrid(
          ctx,
          api,
          [['GPU', 'GPU', 'GPU', 'GPU']],
          260,
          650,
          1400,
          90,
          themeColors.yellow,
          28,
        );
      chapterText(
        ctx,
        api,
        !modelState.verdictReady
          ? 'Evaluate the new strategy against these nodes'
          : modelState.strategy === 'BUNDLE'
            ? 'Single GPU4 bundle cannot fit either node'
            : modelState.ready
              ? 'All four initial bundles reserved atomically'
              : 'Initial placement pending · no partial reservation',
        960,
        800,
        34,
        !modelState.verdictReady
          ? themeColors.yellow
          : modelState.ready
            ? themeColors.green
            : themeColors.pink,
        'center',
      );
      chapterText(
        ctx,
        api,
        'Every individual bundle must fit one node',
        960,
        920,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      chapterText(
        ctx,
        api,
        modelState.nodeLost
          ? 'Node0 work survives · Node1 bundles await recovery'
          : 'All bundles placed before the separate failure',
        960,
        800,
        34,
        modelState.nodeLost ? themeColors.yellow : themeColors.green,
        'center',
      );
      chapterText(
        ctx,
        api,
        'Initial atomic creation ≠ whole-group rollback after a later failure',
        960,
        930,
        29,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Node-level placement does not promise physical GPU ranks or NVLink topology');
  });
}
export default {
  id: 'bundle-membership',
  draw: drawBundleMembership,
  cues: [
    'ray-bundle-membership-op-0',
    'ray-group-consume',
    'ray-group-remove',
    'ray-bundle-membership-op-1',
    'ray-pack-prefers',
    'ray-strict-pack',
    'ray-spread-prefers',
    'ray-strict-spread',
    'ray-bundle-fits',
    'ray-bundle-membership-op-2',
    'ray-node-loss',
  ],
};
