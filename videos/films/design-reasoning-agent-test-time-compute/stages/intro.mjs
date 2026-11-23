import { advise } from '../arithmetic.mjs';
import { observation } from '../fixtures.mjs';
import { beatCue } from '../construction.mjs';
import { drawPolicy } from '../receipt.mjs';

function metricsSlip(ctx, api, x, record, showAge) {
  const { C } = api;
  const width = 760;
  const top = 210;
  const bottom = 600;
  const edge = [
    { x, y: top },
    { x: x + width, y: top },
    { x: x + width, y: bottom },
  ];
  for (let i = 1; i <= 40; i++) {
    edge.push({ x: x + width - (width * i) / 40, y: bottom - (i % 2) * 11 });
  }
  api.path(ctx, edge, { fill: C.ink, closed: true, width: 0 });
  api.text(ctx, 'Metrics receipt    /    ' + record.deploy, x + 48, 277, 37, C.bg);
  api.line(ctx, x + 48, 309, x + width - 48, 309, C.muted, 3);
  api.text(ctx, record.latency + ' ms', x + 45, 430, 108, C.bg);
  api.text(ctx, 'p95 latency', x + 485, 423, 41, C.bg);
  api.text(ctx, 'Revision ' + record.revision, x + 48, 526, 62, C.bg);
  if (showAge)
    api.text(ctx, 110 - record.observedAt + ' s old', x + width - 48, 523, 40, C.bg, 'right');
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const smoke = beatCue(state, 'intro-smoke', 0, 0.4);
  const compare = beatCue(state, 'intro-revision', 0, 0.73);
  const request = beatCue(state, 'intro-request', 1, 0.01);
  const match = beatCue(state, 'intro-match', 1, 0.65);
  const policy = beatCue(state, 'intro-policy', 2, 0.42);
  const release = beatCue(state, 'intro-hold', 3, 0.01);
  const record = match.done ? observation : { ...observation, revision: 6 };
  const showAge = beatCue(state, 'intro-age', 2, 0.05).done;
  const elapsed = state.t ?? 0;
  const arrival = Math.min(elapsed / 1.15, 1);

  ctx.save();
  try {
    if (elapsed < 0.35) ctx.globalAlpha = 1;
    api.focus.target('traffic', () => {
      api.text(ctx, 'Live rollout    /    ' + observation.deploy, 140, 277, 37, C.muted);
      api.text(ctx, observation.canary + '% of traffic', 140, 358, 50, C.cyan);
      for (let i = 0; i < 10; i++) {
        api.rect(
          ctx,
          140 + i * 59,
          385,
          49,
          40,
          i < observation.canary / 10 ? C.cyan : C.panel,
          C.muted,
          3,
        );
      }
      api.text(ctx, 'Revision ' + observation.revision, 140, 526, 76, C.ink);
      if (smoke.done) api.text(ctx, 'Smoke test passed', 140, 590, 37, C.ink);
    });
    api.focus.target('receipt', () => {
      metricsSlip(ctx, api, 858 + 225 * (1 - arrival) ** 2, record, showAge);
    });
    let prompt = 'Would you use this reading for revision seven?';
    if (compare.started) prompt = 'Which call would help?';
    if (request.started) prompt = 'Fetching the live revision from the metrics tool';
    if (match.done) prompt = 'Which policy applies to this reading?';
    if (policy.started) prompt = 'Where does 240 ms land?';
    drawPolicy(ctx, api, {
      visible: policy.started,
      latency: release.done ? record.latency : null,
      result: release.done ? 'Advise the owner   /   ' + advise(record) + ' at 10%' : null,
      prompt,
    });
  } finally {
    ctx.restore();
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-smoke',
    'intro-meter',
    'intro-revision',
    'intro-request',
    'intro-match',
    'intro-age',
    'intro-policy',
    'intro-hold',
  ],
};
