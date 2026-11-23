import { assignmentBuckets } from '../fixtures.mjs';
import { chip, cueProgress, cueVisible, dot, footer, line, text } from '../defaults.mjs';

// A separate request log for four of the original SHA-assigned jobs.
const traffic = [
  [20, 70],
  [31, 5],
  [0, 10],
  [1, 15],
].map(([index, count]) => ({
  job: `job-${String(index).padStart(4, '0')}`,
  bucket: assignmentBuckets[index],
  count,
}));

function drawRequestShare(ctx, api, state) {
  const { C } = api;
  const answered = state.cues?.['m-staged-rollout-share']?.phase === 'after';
  const q = cueProgress(ctx, api, 'staged-rollout', 'traffic');
  text(
    ctx,
    api,
    'Four-job request log   /   original canary rule: bucket < 5',
    960,
    271,
    37,
    C.ink,
  );
  for (const [i, row] of traffic.entries()) {
    const y = 382 + i * 96;
    const selected = row.bucket < 5;
    const col = selected ? C.cyan : C.muted;
    text(ctx, api, row.job, 160, y + 10, 32, C.ink, 'left');
    text(ctx, api, `bucket ${row.bucket}`, 560, y + 10, 31, col);
    line(ctx, api, 760, y, 760 + row.count * 11 * q, y, col, 12);
    text(ctx, api, `${row.count} requests`, 760 + row.count * 11 + 23, y + 10, 29, col, 'left');
  }
  const admitted = traffic.filter((row) => row.bucket < 5);
  const sum = (rows) => rows.reduce((total, row) => total + row.count, 0);
  if (answered) {
    text(ctx, api, `${admitted.length} / ${traffic.length} jobs`, 565, 837, 42, C.blue);
    text(ctx, api, `${sum(admitted)} / ${sum(traffic)} requests`, 1300, 837, 42, C.cyan);
    footer(ctx, api, 'Each request inherits the bucket of its job.');
  } else if (cueVisible(ctx, api, 'staged-rollout', 'ask')) {
    text(ctx, api, 'How many of these 100 requests go to the canary?', 960, 868, 42, C.yellow);
  }
}
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const smooth = (q) => q * q * (3 - 2 * q);
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    if (currentBeat === 0) {
      chip(ctx, api, 'incoming request', 180, 430, 400, themeColors.blue);
      chip(ctx, api, 'stable v3', 790, 300, 470, themeColors.blue);
      chip(ctx, api, 'candidate v4', 790, 590, 470, themeColors.cyan);
      line(ctx, api, 580, 463, 790, 333, themeColors.blue, 4);
      line(ctx, api, 580, 463, 790, 623, themeColors.cyan, 4);
      line(ctx, api, 1260, 333, 1650, 333, themeColors.blue, 4);
      text(ctx, api, 'user response', 1610, 290, 28, themeColors.blue);
      line(ctx, api, 1260, 623, 1640, 623, themeColors.red, 4);
      line(ctx, api, 1500, 575, 1500, 670, themeColors.red, 6);
      text(ctx, api, 'review effect blocked', 1490, 735, 28, themeColors.red);
      footer(
        ctx,
        api,
        'Shadow still shares finite workers, queues, networks and logs. Bound them.',
      );
    } else if (currentBeat < 3) {
      text(
        ctx,
        api,
        'SHA-256(UTF-8("job-risk-canary-v1:" + job ID))   /   first 8 bytes   /   big endian   /   mod 100',
        960,
        275,
        29,
        themeColors.blue,
      );
      const expanded = cueVisible(ctx, api, 'staged-rollout', 'expand'),
        cutoff = expanded ? 25 : cueVisible(ctx, api, 'staged-rollout', 'five') ? 5 : 0;
      for (let i = 0; i < 1000; i++) {
        const x = 175 + (i % 50) * 31,
          y = 365 + Math.floor(i / 50) * 21;
        dot(
          ctx,
          api,
          x,
          y,
          assignmentBuckets[i] < cutoff
            ? assignmentBuckets[i] < 5
              ? themeColors.cyan
              : themeColors.blue
            : themeColors.muted,
          5,
        );
      }
      if (cutoff)
        text(
          ctx,
          api,
          `${assignmentBuckets.filter((x) => x < cutoff).length} / 1,000 jobs · buckets < ${cutoff}`,
          960,
          850,
          37,
          themeColors.cyan,
        );
      if (cueVisible(ctx, api, 'staged-rollout', 'nested'))
        text(
          ctx,
          api,
          'The first 48 identities remain in the 257-job group',
          960,
          310,
          31,
          themeColors.cyan,
        );
      footer(ctx, api, 'Fixed job assignment is approximate job share, not exact request share.');
    } else if (currentBeat < 5) {
      drawRequestShare(ctx, api, state);
    } else {
      const q = cueProgress(ctx, api, 'staged-rollout', 'switch');
      chip(ctx, api, 'active blue · v3', 250, 390, 560, themeColors.blue, 140, 34);
      chip(ctx, api, 'prepared green · v4', 1110, 390, 560, themeColors.green, 140, 34);
      chip(ctx, api, 'request route', 710, 720, 500, themeColors.cyan);
      line(ctx, api, 960, 720, lerp(530, 1390, smooth(q)), 530, themeColors.cyan, 6);
      text(ctx, api, 'pre-switch analysis', 530, 620, 29, themeColors.blue);
      text(ctx, api, 'post-switch analysis', 1390, 620, 29, themeColors.green);
      footer(ctx, api, 'Propagation, in-flight requests and compatibility still govern exposure.');
    }
  }
}
export function drawStagedRollout(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('staged-rollout-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'staged-rollout',
  draw: drawStagedRollout,
  cues: [
    'staged-rollout-beat-0',
    'm-staged-rollout-shadow',
    'staged-rollout-beat-1',
    'm-staged-rollout-hash',
    'm-staged-rollout-five',
    'staged-rollout-beat-2',
    'm-staged-rollout-expand',
    'm-staged-rollout-nested',
    'm-staged-rollout-traffic',
    'm-staged-rollout-ask',
    'm-staged-rollout-share',
    'staged-rollout-beat-3',
    'm-staged-rollout-switch',
  ],
};
