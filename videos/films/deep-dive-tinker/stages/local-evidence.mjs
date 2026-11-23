import { CANDIDATES, REWARDS } from '../arithmetic.mjs';
import { CLAMP_CASES } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

function reversedCheck(ctx, api, fixture, y, showResult) {
  const { C } = api;
  const [x, lo, hi, expected] = fixture;
  const actual = CANDIDATES[1](x, lo, hi);
  const values = [x, '[' + lo + ', ' + hi + ']', expected, showResult ? actual : '?'];
  values.forEach((value, i) => {
    api.text(ctx, String(value), 275 + 370 * i, y, 67, C.ink, 'center');
  });
  if (showResult) {
    const passes = actual === expected;
    api.text(ctx, passes ? 'Pass' : 'Fail', 1635, y, 56, passes ? C.green : C.pink, 'center');
  }
}

export default timedScene('local-evidence', [3, 2, 4], (ctx, api, time) => {
  const { C, focus } = api;
  if (time.beat === 0) {
    api.text(ctx, 'Reversed clamp', 140, 305, 41, C.blue);
    api.text(ctx, 'return max(min(x, lo), hi)', 140, 407, 65, C.ink, 'left', 'mono');
    ['Input', 'Bounds', 'Expected', 'Returned'].forEach((label, i) =>
      api.text(ctx, label, 275 + 370 * i, 580, 37, C.muted, 'center'),
    );
    focus.target('local-equal', () => reversedCheck(ctx, api, CLAMP_CASES[3], 718, true));
    if (time.started(0, 1)) {
      focus.target('local-outside', () =>
        reversedCheck(ctx, api, CLAMP_CASES[0], 891, time.started(0, 2)),
      );
    }
    return;
  }
  if (time.beat === 1) {
    focus.target('local-rewards', () => {
      ['Completion', 'Tests passed', 'Reward'].forEach((label, i) =>
        api.text(ctx, label, 185 + i * 600, 310, 40, C.muted),
      );
      CANDIDATES.forEach((fn, i) => {
        const passed = CLAMP_CASES.filter(([x, lo, hi, expected]) => fn(x, lo, hi) === expected);
        const y = 446 + i * 113;
        api.text(ctx, String(i) + (i === 1 ? '   reversed clamp' : ''), 185, y, 43, C.ink);
        api.text(ctx, passed.length + ' / ' + CLAMP_CASES.length, 785, y, 53, C.ink);
        api.text(ctx, String(REWARDS[i]), 1385, y, 61, REWARDS[i] ? C.green : C.pink);
      });
    });
    if (time.started(1, 1)) {
      focus.target('local-checks', () => {
        api.text(ctx, 'First answer weighted', 185, 970, 38, C.blue);
        api.text(ctx, '9 invalid inputs rejected', 975, 970, 38, C.blue);
      });
    }
    return;
  }
  focus.target('local-probe', () => {
    api.text(ctx, 'Local SDK probe', 140, 290, 42, C.blue);
    api.text(ctx, 'Wire types   ·   protobuf round trip   ·   chunking', 140, 374, 47, C.ink);
  });
  if (time.started(2, 1)) {
    focus.target('local-lengths', () => {
      api.text(ctx, 'Input', 140, 562, 38, C.muted);
      api.text(ctx, '10', 450, 562, 57, C.ink);
      api.text(ctx, 'Targets', 140, 659, 38, C.muted);
      api.text(ctx, '11     20', 450, 659, 57, C.ink);
      api.text(ctx, 'SDK constructs the datum', 905, 565, 46, C.blue);
      if (time.started(2, 2)) api.text(ctx, 'Length check rejects 1 ≠ 2', 905, 660, 46, C.pink);
    });
  }
  if (time.started(2, 3)) {
    focus.target('local-next', () => {
      api.text(ctx, 'Timing and recovery', 140, 871, 35, C.muted);
      api.text(ctx, 'Hosted worker', 140, 945, 46, C.ink);
      api.text(ctx, 'Export evaluation', 905, 871, 35, C.muted);
      api.text(ctx, 'Serving runtime', 905, 945, 46, C.ink);
    });
  }
});
