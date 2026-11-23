import { visibleLineSegments } from '../arithmetic.mjs';
import { directed, rectangleFrame } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionNote,
  extensionRing,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawFreshSeedRepair(ctx, scene, state, api) {
  return api.focus.target('fresh-seed-repair-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-fresh-seed-repair-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
      ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    {
      const frame = rectangleFrame(state),
        q = extensionAxes(ctx, api, [-0.8, 8.8], [-1, 3], 150, 345, 1010, 500);
      if (frame.assigned)
        frame.data.forEach((p, i) =>
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            p,
            frame.centers[frame.assignments[i]],
            colors[frame.assignments[i]],
            5,
          ),
        );
      extensionDots(
        ctx,
        api,
        'fresh-seed-repair',
        colors,
        ids,
        labelBoxes,
        q,
        frame.data,
        ['R0', 'R1', 'R2', 'R3'],
        frame.assigned ? frame.assignments : null,
      );
      if (currentBeat > 0 || cueProgress(0, 1) > 0)
        frame.centers.forEach((p) => extensionRing(ctx, api, q, p));
      extensionText(
        ctx,
        api,
        labelBoxes,
        currentBeat >= 2 ? 'Restart: bottom-corner seeds' : 'Initial seeds: left edge',
        1490,
        330,
        32,
        themeColors.yellow,
      );
      extensionText(ctx, api, labelBoxes, 'Updated centers', 1490, 460, 30, themeColors.muted);
      frame.centers.forEach((p, i) =>
        extensionText(
          ctx,
          api,
          labelBoxes,
          frame.meanKnown
            ? 'C' + i + ' [' + p.map((v) => v.toFixed(1)).join(', ') + ']'
            : 'C' + i + ' [ ?, ? ]',
          1490,
          570 + i * 100,
          36,
          colors[i],
        ),
      );
      extensionText(
        ctx,
        api,
        labelBoxes,
        frame.errorKnown ? 'J = ' + frame.error.toFixed(0) : 'J = ?',
        1490,
        820,
        55,
        frame.errorKnown
          ? currentBeat >= 2
            ? themeColors.green
            : themeColors.pink
          : themeColors.yellow,
      );
      if (currentBeat >= 2 && resultComplete(2, 2))
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Same points · 64 → 4',
          1490,
          945,
          34,
          themeColors.green,
        );
      extensionNote(
        ctx,
        api,
        labelBoxes,
        currentBeat === 0
          ? 'Predict the updated means and objective; every point remains fixed.'
          : currentBeat === 1
            ? resultComplete(1, 3)
              ? 'Repeated assignments settle this run; they do not establish the global optimum.'
              : 'Track the actual centers and their squared distances.'
            : resultComplete(2, 3)
              ? 'Changing only the seeds changes the attained partition and its computed objective.'
              : 'Restart with the same points and compare the newly computed partition.',
      );
    }
    for (const { q, a, z, color, width } of pendingSegments)
      for (const points of visibleLineSegments(a, z, labelBoxes))
        api.path(ctx, points, {
          color,
          width,
          clip: q.bounds,
        });
  });
}
export default {
  id: 'fresh-seed-repair',
  draw: drawFreshSeedRepair,
  cues: [
    'cp-fresh-seed-repair-0-0',
    'cp-fresh-seed-repair-0-1',
    'cp-fresh-seed-repair-0-2',
    'cp-fresh-seed-repair-0-3',
    'cp-fresh-seed-repair-0-4',
    'cp-fresh-seed-repair-0-5',
    'cp-fresh-seed-repair-1-0',
    'cp-fresh-seed-repair-1-1',
    'cp-fresh-seed-repair-1-2',
    'cp-fresh-seed-repair-1-3',
    'cp-fresh-seed-repair-2-0',
    'cp-fresh-seed-repair-2-1',
    'cp-fresh-seed-repair-2-2',
    'cp-fresh-seed-repair-2-3',
    'cp-fresh-seed-repair-2-4',
    'cp-fresh-seed-repair-2-5',
  ],
};
