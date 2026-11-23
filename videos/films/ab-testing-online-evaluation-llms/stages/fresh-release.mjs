import { freshExperimentSnapshot, onlineCueProgress } from '../construction.mjs';
import { experimentRequirements } from '../model.mjs';
import { line, text } from '../defaults.mjs';

const nextReadout = experimentRequirements({ times: [2.8, 2.8], bSuccess: 620 });
const pp = (rate) => (rate * 100).toFixed(3);

export function drawFreshRelease(ctx, scene, state, api) {
  const { C } = api;
  const s = freshExperimentSnapshot(state);
  const nextCase = (state.beat ?? 0) >= 3;
  const replacement = nextCase && onlineCueProgress(state, 'fresh-case-count', 3) === 1;
  const answered = nextCase && onlineCueProgress(state, 'fresh-case-hold', 4) === 1;
  const r = replacement ? nextReadout : s;
  const showEffect = s.difference && (!nextCase || replacement);
  const showInterval =
    s.interval &&
    (!nextCase || (replacement && onlineCueProgress(state, 'fresh-case-interval', 3) === 1));

  api.focus.target('fresh-clocks', () => {
    text(ctx, api, 'p95 time to first token', 138, 278, 43);
    text(ctx, api, 'Absolute limit for each prompt', 138, 332, 30, C.muted);
    const start = 435;
    const x = (seconds) => start + seconds * 115;
    const limit = x(r.timeLimit);
    line(ctx, api, limit, 426, limit, 707, C.yellow, 5);
    text(ctx, api, r.timeLimit.toFixed(2) + ' s limit', limit, 402, 34, C.yellow, 'center');
    ['A', 'B'].forEach((arm, i) => {
      const y = 501 + 131 * i;
      const color = i === 0 ? C.blue : C.cyan;
      text(ctx, api, arm, 145, y + 19, 45, color);
      line(ctx, api, start, y + 11, x(4), y + 11, C.border, 3);
      if (!s.clockInput) return;
      const time = r.times[i];
      api.rect(ctx, start, y, x(time) - start, 22, color, undefined, 3);
      line(ctx, api, x(time), y - 8, x(time), y + 30, color, 4);
      const moving = s.repair > 0 && s.repair < 1;
      text(ctx, api, moving ? 'adjusting' : time.toFixed(2) + ' s', 224, y + 22, 41, color);
    });
    if (s.clockInput && (s.repair === 0 || s.repair === 1)) {
      const delta = r.times[1] - r.times[0];
      text(ctx, api, 'B − A = ' + delta.toFixed(2) + ' s', 145, 789, 37);
    }
  });

  api.focus.target('fresh-benefit', () => {
    const x = (rate) => 1070 + ((100 * rate + 3) / 13) * 646;
    text(ctx, api, 'Resolved users', 1025, 278, 43);
    text(ctx, api, nextCase ? 'Second experiment' : 'First experiment', 1025, 332, 30, C.muted);
    if (s.counts) {
      text(ctx, api, 'A    ' + r.aSuccess + ' / 1,000', 1025, 418, 38, C.blue);
      text(
        ctx,
        api,
        nextCase && !replacement ? 'B    awaiting count' : 'B    ' + r.bSuccess + ' / 1,000',
        1415,
        418,
        38,
        C.cyan,
      );
    }
    text(ctx, api, 'Resolution difference (percentage points)', 1025, 523, 32);
    line(ctx, api, x(0), 622, x(0), 745, C.yellow, 4);
    line(ctx, api, x(-0.03), 733, x(0.1), 733, C.muted, 3);
    text(ctx, api, '0', x(0), 782, 31, C.yellow, 'center');
    if (showInterval) {
      line(ctx, api, x(r.low), 646, x(r.high), 646, C.cyan, 8);
      for (const endpoint of [r.low, r.high]) {
        line(ctx, api, x(endpoint), 632, x(endpoint), 660, C.cyan, 4);
        text(ctx, api, pp(endpoint), x(endpoint), 608, 33, C.cyan, 'center');
      }
    }
    if (showEffect) {
      line(ctx, api, x(r.d), 622, x(r.d), 669, C.ink, 6);
      text(ctx, api, Math.round(100 * r.d) + ' pp', x(r.d), 704, 32, C.ink, 'center');
    }
  });

  api.focus.target('fresh-safety', () => {
    text(
      ctx,
      api,
      s.safetyInput
        ? 'Safety pass-rate change (pp)    [' +
            r.safetyLow.toFixed(2).replace('-', '−') +
            ', +0.01]    /    lower bound must exceed ' +
            r.safetyMargin.toFixed(2).replace('-', '−')
        : 'Safety pass-rate change   ·   awaiting interval',
      145,
      867,
      32,
      s.safetyReveal ? C.green : C.muted,
    );
  });
  api.focus.target('fresh-decision', () => {
    let label = 'Check benefit, safety and both clocks';
    let color = C.ink;
    if (s.clockInput) label = 'Which measurement already blocks release?';
    if (s.hold) {
      label = 'Hold  ·  both p95 times exceed the deadline';
      color = C.pink;
    }
    if (s.repair > 0) {
      label = 'Same outcomes  ·  new timing measurements';
      color = C.ink;
    }
    if (s.verdict && !nextCase && r.eligible) {
      label = 'Eligible on this worksheet  ·  all required checks pass';
      color = C.green;
    }
    if (nextCase) {
      label = showInterval
        ? 'Does the second experiment establish a benefit?'
        : 'Both clocks and the safety interval stay fixed';
      color = C.ink;
      if (answered && !r.eligible) {
        label = 'Hold  ·  the resolution interval includes zero';
        color = C.pink;
      }
    }
    text(ctx, api, label, 960, 975, 43, color, 'center');
  });
}
export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'oa-fresh-release-counts',
    'oa-fresh-release-safety',
    'oa-fresh-release-clock',
    'oa-fresh-release-hold',
    'oa-fresh-release-difference',
    'oa-fresh-release-interval',
    'oa-fresh-release-safety-pass',
    'oa-fresh-release-repair',
    'oa-fresh-release-eligible',
    'fresh-case-count',
    'fresh-case-interval',
    'fresh-case-hold',
  ],
};
