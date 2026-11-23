import { beatCue } from '../construction.mjs';
import { observation } from '../fixtures.mjs';

const repairs = [
  { id: 'A', passed: true },
  { id: 'B', passed: false },
  { id: 'C', passed: true },
  { id: 'D', passed: false },
];
const mean = repairs.filter((repair) => repair.passed).length / repairs.length;

function trainingGroup(ctx, state, api) {
  const { C } = api;
  const pass = beatCue(state, 'ra-trained-policy-0-1', 0, 0.15);
  const fail = beatCue(state, 'training-failed', 0, 0.23);
  const average = beatCue(state, 'ra-trained-policy-0-2', 0, 0.35);
  const above = beatCue(state, 'ra-trained-policy-0-3', 0, 0.42);
  const below = beatCue(state, 'training-below', 0, 0.54);
  const x = (reward) => 710 + reward * 820;
  api.text(ctx, 'One failing test   /   four proposed repairs', 145, 277, 49, C.ink);
  api.text(ctx, 'Test reward', 170, 370, 34, C.muted);
  api.text(ctx, '0', x(0), 370, 43, C.ink, 'center');
  api.text(ctx, '1', x(1), 370, 43, C.ink, 'center');
  if (average.done) {
    api.text(ctx, 'Mean  ' + mean, x(mean), 370, 42, C.yellow, 'center');
    api.line(ctx, x(mean), 401, x(mean), 874, C.yellow, 3);
  }
  repairs.forEach(({ id, passed }, i) => {
    const y = 458 + 128 * i;
    const reward = Number(passed);
    api.text(ctx, 'Repair ' + id, 170, y + 13, 42, C.ink);
    api.line(ctx, x(0), y, x(1), y, C.muted, 2);
    if ((passed ? pass : fail).done) {
      const centered = passed ? above : below;
      const color = passed ? C.cyan : C.pink;
      api.text(ctx, passed ? 'Pass' : 'Fail', 425, y + 12, 36, color);
      if (centered.p > 0) {
        api.line(ctx, x(mean), y, x(mean + (reward - mean) * centered.p), y, color, 12);
      }
      api.circle(ctx, x(reward), y, 13, color);
      if (centered.done) {
        const delta = reward - mean;
        api.text(
          ctx,
          delta > 0 ? '+' + delta : '−' + Math.abs(delta),
          x(reward),
          y - 22,
          33,
          color,
          'center',
        );
      }
    }
  });
  if (below.done)
    api.text(ctx, 'The training update favors repairs above the group mean.', 145, 975, 43, C.ink);
}

function liveRequest(ctx, state, api) {
  const { C } = api;
  const route = beatCue(state, 'ra-trained-policy-1-1', 1, 0.45);
  const read = beatCue(state, 'ra-trained-policy-1-2', 1, 0.68);
  api.text(ctx, 'After training   /   model weights frozen', 145, 277, 49, C.ink);
  api.text(ctx, 'Live checkout request', 145, 440, 68, C.ink);
  api.text(
    ctx,
    'Which reading belongs to revision ' + observation.revision + '?',
    145,
    532,
    49,
    C.cyan,
  );
  if (route.started) {
    api.text(ctx, 'Call budget', 145, 675, 32, C.muted);
    api.text(ctx, 'Reserve a metrics lookup', 145, 757, 50, C.ink);
  }
  if (read.started) {
    const x = 913 + 90 * (1 - read.p);
    api.text(ctx, 'Metrics service    /    ' + observation.deploy, x, 675, 32, C.muted);
    api.text(ctx, 'Revision ' + observation.revision, x, 757, 50, C.ink);
    if (read.done) api.text(ctx, observation.latency + ' ms   /   p95 latency', x, 852, 53, C.cyan);
  }
}

export function drawTrainedPolicy(ctx, scene, state, api) {
  if (state.beat === 0) trainingGroup(ctx, state, api);
  else liveRequest(ctx, state, api);
}

export default {
  id: 'trained-policy',
  draw: drawTrainedPolicy,
  cues: [
    'ra-trained-policy-0-0',
    'ra-trained-policy-0-1',
    'training-failed',
    'ra-trained-policy-0-2',
    'ra-trained-policy-0-3',
    'training-below',
    'ra-trained-policy-1-0',
    'ra-trained-policy-1-1',
    'ra-trained-policy-1-2',
  ],
};
