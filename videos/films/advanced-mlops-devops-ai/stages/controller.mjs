import { cueClock } from '../cue-clock.mjs';
import { guardedReleaseTransition } from '../protocols.mjs';
import {
  RELEASE_RULES,
  ReleaseMetricSample,
  releaseTelemetry,
  combineReleaseActions,
} from '../telemetry.mjs';

const history = [
  { release: 'C', generation: 12 },
  { release: 'B', generation: 13 },
  { release: 'C', generation: 14 },
];
const latency = 910;
const grounding = 0.79;
const readings = [latency, grounding].map((value, i) => {
  const rule = RELEASE_RULES[i];
  const record = new ReleaseMetricSample({
    value,
    window: rule.window,
    age: 30,
    count: 200,
    release: 'C',
  });
  return releaseTelemetry(rule, record, 'C').action;
});

export function drawController(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const { C, focus } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const recommendation = combineReleaseActions(readings);
  const stages = [1, p('intervening-restore'), p('repeat-bytes')];
  const currentIndex = stages.lastIndexOf(1);
  const before = history[0];
  const current = history[currentIndex];
  const rejected = !guardedReleaseTransition(current, before, 'B').committed;

  focus.target('canary-evidence', () => {
    text('Measurements from generation 12', 160, 275, 34, C.muted);
    text(
      p('latency-window') > 0
        ? '5 min TTFT p95     ' + latency + '  >  ' + RELEASE_RULES[0].max + ' ms'
        : '5 min TTFT p95',
      160,
      360,
      40,
      C.ink,
    );
    if (p('quality-window') > 0)
      text('15 min groundedness     ' + grounding + '  <  ' + RELEASE_RULES[1].min, 160, 440, 40);
  });
  focus.target('alert-ticket', () => {
    text('Controller recommendation', 1070, 275, 34, C.muted);
    if (p('issue-decision') > 0) {
      text(
        recommendation.toUpperCase() + '   ·   C / gen ' + before.generation,
        1070,
        362,
        43,
        C.yellow,
      );
      text(
        p('deliver-alert') > 0 ? 'Delivered to the executor' : 'Awaiting delivery',
        1070,
        433,
        34,
        C.yellow,
      );
    }
  });

  const x = [490, 1010, 1530];
  const y = [614, 778, 614];
  focus.target('routing-history', () => {
    text('Candidate C', 155, y[0] + 12, 35, C.cyan);
    text('Baseline B', 155, y[1] + 12, 35, C.blue);
    for (const h of [y[0], y[1]]) api.line(ctx, 404, h, 1700, h, C.muted, 2);
    for (const [i, part] of stages.entries()) {
      if (part === 0) continue;
      if (i > 0) {
        const from = x[i - 1],
          to = x[i],
          bend = to - 94;
        api.trace(
          ctx,
          [
            { x: from, y: y[i - 1] },
            { x: bend, y: y[i - 1] },
            { x: bend, y: y[i] },
            { x: to, y: y[i] },
          ],
          part,
          C.cyan,
          6,
        );
      }
      if (part === 1) {
        api.circle(ctx, x[i], y[i], 12, i === 1 ? C.blue : C.cyan);
        text(
          'gen ' + history[i].generation,
          x[i],
          y[i] - 36,
          35,
          i === currentIndex ? C.ink : C.muted,
          'center',
        );
      }
    }
  });
  focus.target('controller-outcome', () => {
    api.line(ctx, 155, 883, 1765, 883, C.muted, 2);
    let line = 'Live route   ·   ' + current.release + ' / gen ' + current.generation;
    if (p('predict-write') > 0) line = 'Should the delayed recommendation move traffic?';
    if (p('reject-old') > 0 && rejected) line = 'Keep C at generation 14';
    if (p('compare-rows') > 0 && rejected)
      line = 'C = C      ·      12 ≠ 14      ·      0 rows updated';
    text(line, 960, 980, 45, p('reject-old') > 0 ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'controller',
  draw: drawController,
  cues: [
    'latency-window',
    'quality-window',
    'issue-decision',
    'intervening-restore',
    'repeat-bytes',
    'deliver-alert',
    'predict-write',
    'reject-old',
    'compare-rows',
  ],
};
