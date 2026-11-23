import { onlineCueProgress } from '../construction.mjs';
import { telemetryReadouts } from '../model.mjs';
import { line, text } from '../defaults.mjs';
import { latencyRuler, resolutionRows } from './prompt-readout.mjs';

const cohort = telemetryReadouts[0].correct;
const counts = cohort.arms.map(({ success, n }) => [success, n]);

function drawThread(ctx, state, api, p) {
  const { C } = api;
  const opening = p('intro-open-guide', 0);
  api.focus.target('intro-thread', () => {
    api.rect(ctx, 410, 228, 1310, 149, C.panel, C.border, 45);
    text(ctx, api, 'Developer', 466, 279, 32, C.muted);
    text(ctx, api, 'My batch exports hit the rate limit. What is it?', 466, 346, 47);
    text(ctx, api, 'Docs assistant', 178, 479, 34, C.cyan);
    text(ctx, api, '100 requests per minute.', 172, 575, 75);
    api.rect(ctx, 176, 627, 531, 95, C.panel, C.cyan, 22);
    text(ctx, api, 'API guide', 235, 690, 45, C.cyan);
    api.arrow(ctx, 609, 690, 643, 657, C.cyan, 5);

    if (opening === 1) {
      api.rect(ctx, 1106, 452, 608, 295, C.panel, C.cyan, 10);
      text(ctx, api, 'API guide  /  v2', 1160, 517, 38, C.cyan);
      line(ctx, api, 1160, 550, 1656, 550, C.border);
      text(ctx, api, 'Batch exports', 1160, 614, 40);
      text(ctx, api, '100 requests per minute', 1160, 685, 41);
    }
    if (state.beat === 0) {
      const untilClick = state.cues?.['intro-open-guide']?.end ?? 1.7;
      const travel = Math.min(1, (state.t ?? 0) / untilClick);
      const x = 862 - 215 * travel;
      const y = 812 - 124 * travel;
      api.path(
        ctx,
        [
          { x, y },
          { x: x + 16, y: y + 67 },
          { x: x + 30, y: y + 45 },
          { x: x + 52, y: y + 69 },
          { x: x + 63, y: y + 58 },
          { x: x + 41, y: y + 35 },
          { x: x + 65, y: y + 28 },
        ],
        { closed: true, fill: C.ink, color: C.bg, width: 4 },
      );
    }
  });
  if (state.beat === 0) return;
  api.focus.target('intro-follow-up', () => {
    text(ctx, api, 'Follow-up', 174, 844, 33, C.muted);
    text(
      ctx,
      api,
      p('intro-confirmed', 1) === 1 ? '“That fixed it.”' : 'Waiting for confirmation',
      174,
      925,
      45,
    );
    const day = p('intro-follow-up-day', 1);
    line(ctx, api, 734, 852, 1174, 852, C.border, 6);
    if (day > 0) line(ctx, api, 734, 852, 734 + day * 440, 852, C.cyan, 8);
    text(ctx, api, '24 hours', 954, 824, 32, C.muted, 'center');
    if (day === 1) text(ctx, api, 'No escalation', 954, 926, 39, C.ink, 'center');
    if (p('intro-resolved', 1) === 1)
      text(ctx, api, '+1 resolved', 1480, 915, 55, C.green, 'center');
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, beat) => onlineCueProgress(state, id, beat);
  if (state.beat < 2) {
    if (state.t < 0.35) ctx.globalAlpha = 1;
    drawThread(ctx, state, api, p);
    return;
  }
  api.focus.target('intro-outcomes', () => {
    resolutionRows(ctx, api, {
      counts,
      rates: [cohort.a, cohort.b],
      visible: [true, p('intro-enroll-b', 2) > 0],
      showRates: p('intro-rates', 3) === 1,
    });
    if (p('intro-lift', 3) === 1)
      text(
        ctx,
        api,
        'From the counts: +' +
          (100 * cohort.d).toFixed(2) +
          ' pp   ·   +' +
          ((100 * cohort.d) / cohort.a).toFixed(1) +
          '% relative to A',
        595,
        573,
        32,
        C.cyan,
      );
  });
  if (state.beat === 2) {
    text(ctx, api, '4,000 simulated users  ·  one question each', 145, 690, 34, C.muted);
    if (p('intro-denominator', 2) > 0)
      text(ctx, api, 'Which prompt resolved the larger share?', 145, 849, 49);
    return;
  }
  api.focus.target('intro-time', () => {
    if (p('intro-time-limit', 3) > 0) latencyRuler(ctx, api, { limit: 300 });
    else text(ctx, api, 'Resolved users ÷ assigned users', 145, 690, 38);
    if (p('intro-time-limit', 3) === 1) {
      text(
        ctx,
        api,
        p('intro-missing', 4) === 1
          ? 'Needed here: p95 response time for A and B'
          : 'Do the resolution counts tell us where B lands?',
        145,
        982,
        36,
      );
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-open-guide',
    'intro-confirmed',
    'intro-follow-up-day',
    'intro-resolved',
    'intro-enroll-b',
    'intro-denominator',
    'intro-rates',
    'intro-lift',
    'intro-time-limit',
    'intro-missing',
  ],
};
