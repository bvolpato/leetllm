import { bucket } from '../arithmetic.mjs';
import { sampleModel, stickySnapshot } from '../construction.mjs';
import { STABLE, route } from '../model.mjs';
import { stableConversation } from '../fixtures.mjs';
import { legacyText, recordCard, releaseName } from '../defaults.mjs';
export function drawSticky(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('sticky', state),
    currentBeat = modelState.beat;
  if (state.cues) {
    const assignments = new Map(
        stickySnapshot(0, 1).assignments.map((row) => [row.id, row.target]),
      ),
      threshold = 10 + Math.round(90 * api.focus.progress('widen-threshold', currentBeat ? 1 : 0));
    if (api.focus.cue('new-conversation')?.phase === 'after')
      route('new-thread', threshold, assignments);
    Object.assign(modelState, {
      threshold,
      assignments: [...assignments].map(([id, target]) => ({
        id,
        bucket: bucket(id),
        target,
      })),
    });
  }
  {
    api.focus.target('conversation-threshold', () =>
      legacyText(
        ctx,
        api,
        'New-conversation threshold: ' + modelState.threshold + '%',
        960,
        285,
        36,
        themeColors.yellow,
        'center',
      ),
    );
    const plot = teaching.axes({
      x: 250,
      y: 370,
      width: 1300,
      height: 450,
      xDomain: [0, 100],
      yDomain: [0, 3],
      xTicks: [0, 10, 25, 50, 75, 100],
      yTicks: [],
      xLabel: 'deterministic SHA-256 bucket',
      fontSize: 26,
    });
    api.rect(
      ctx,
      250,
      370,
      Math.max(0.1, 13 * modelState.threshold),
      450,
      themeColors.yellow + '18',
    );
    modelState.assignments.forEach((row, i) => {
      const point = plot.point(row.bucket, 2.5 - i),
        color = row.target === STABLE ? themeColors.blue : themeColors.cyan;
      api.focus.target('conversation-identities', () =>
        legacyText(
          ctx,
          api,
          row.id + ' · bucket ' + row.bucket,
          Math.max(420, point.x),
          point.y - 50,
          26,
          color,
          'center',
        ),
      );
      const dot = api.focus.target('conversation-identities', () =>
        api.circle(ctx, point.x, point.y, 12, color),
      );
      const badge = api.focus.target('persisted-release', () =>
        recordCard(
          ctx,
          api,
          releaseName(ctx, api, row.target),
          1650,
          point.y - 35,
          190,
          color,
          70,
          23,
        ),
      );
      api.connect(ctx, dot, badge, {
        color,
        gap: 15,
      });
      if (row.id === stableConversation && api.focus.cue('sticky-existing')?.phase === 'after') {
        const travel = api.focus.progress('follow-fourth-turn', 0);
        const x = point.x + travel * (1618 - point.x);
        api.focus.target('turn-state', () => api.circle(ctx, x, point.y, 15, themeColors.green));
      }
      api.focus.target('persisted-release', () =>
        legacyText(ctx, api, row.target.slice(0, 12), 1745, point.y + 68, 23, color, 'center'),
      );
      api.focus.target('turn-state', () =>
        legacyText(
          ctx,
          api,
          row.id === 'new-thread'
            ? 'First turn · assigning now'
            : 'Saved on turn 1',
          1280,
          point.y + 50,
          24,
          themeColors.muted,
          'center',
        ),
      );
    });
    legacyText(
      ctx,
      api,
      currentBeat
        ? api.focus.cue('sticky-existing')?.phase === 'after'
          ? 'Next existing turn → STABLE'
          : 'Predict the next existing turn → ?'
        : 'Shaded buckets admit NEW conversations to candidate',
      960,
      940,
      31,
      currentBeat && api.focus.cue('sticky-existing')?.phase === 'after'
        ? themeColors.green
        : themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'sticky',
  draw: drawSticky,
  cues: [
    'hash-conversations',
    'persist-release',
    'widen-threshold',
    'new-conversation',
    'sticky-existing',
    'follow-fourth-turn',
  ],
};
