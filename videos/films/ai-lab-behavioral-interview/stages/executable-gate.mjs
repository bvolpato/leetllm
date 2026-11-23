import { launchRecommendation } from '../arithmetic.mjs';
import { CASES, PASSING_CASES } from '../fixtures.mjs';
import { cueProgress, drawEvidenceBox, drawText, withFocus } from '../defaults.mjs';
export function drawExecutableGate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) >= 1;
  {
    const base = {
      ...PASSING_CASES,
    };
    if (currentBeat === 0) {
      const showExtraKey = resultComplete('gate-key-failures');
      withFocus(ctx, api, 'gate-keys', () => {
        drawText(ctx, api, 'Python requires exactly these keys', 440, 300, 32, themeColors.yellow);
        CASES.forEach((s, i) =>
          drawEvidenceBox(
            ctx,
            api,
            'gate-case-' + i,
            s,
            145,
            350 + i * 125,
            620,
            90,
            themeColors.blue,
            27,
          ),
        );
        if (showExtraKey)
          drawEvidenceBox(
            ctx,
            api,
            'gate-extra',
            'Another input adds an unexpected key',
            145,
            600,
            620,
            80,
            themeColors.pink,
            24,
          );
      });
      withFocus(ctx, api, 'gate-values', () => {
        const trueReady = resultComplete('executable-gate-true');
        drawText(
          ctx,
          api,
          'Boolean identity • JavaScript equivalent',
          1230,
          300,
          32,
          themeColors.yellow,
        );
        drawEvidenceBox(
          ctx,
          api,
          'gate-boolean',
          trueReady ? 'true === true  → PASS' : 'value pending',
          970,
          350,
          620,
          90,
          trueReady ? themeColors.green : themeColors.muted,
        );
        if (resultComplete('gate-numeric-one')) {
          const invalid = resultComplete('gate-invalid-result');
          drawEvidenceBox(
            ctx,
            api,
            'gate-number',
            invalid ? '1 === true  → FAIL' : 'Numeric 1 vs literal true · pending',
            970,
            480,
            620,
            90,
            invalid ? themeColors.pink : themeColors.muted,
            27,
          );
          drawEvidenceBox(
            ctx,
            api,
            'gate-key-repair',
            invalid ? 'Missing / extra key → HOLD' : 'Missing / extra key · pending',
            970,
            610,
            620,
            90,
            invalid ? themeColors.pink : themeColors.muted,
            27,
          );
        }
      });
      withFocus(ctx, api, 'gate-result', () => {
        const ready = resultComplete('executable-gate-offline'),
          out = launchRecommendation(base, {
            otherGatesPass: true,
          });
        drawEvidenceBox(
          ctx,
          api,
          'gate-result-box',
          ready
            ? 'Valid dictionary: ' +
                out.action +
                '\nrecommended share ' +
                out.candidateTraffic +
                '%'
            : 'Complete exact keys + true results\n+ other gates = pending',
          350,
          815,
          1220,
          130,
          ready ? themeColors.green : themeColors.muted,
          31,
        );
      });
    } else if (currentBeat === 1) {
      drawLatencyReview(ctx, api);
    } else {
      drawAccessReplay(ctx, api);
    }
  }
}
function drawLatencyReview(ctx, api) {
  const { C, focus } = api;
  const seen = (id) => focus.visible(id);
  const exact = seen('executable-gate-rollback'),
    below = seen('gate-lower-input');
  const value = below ? 499 : exact ? 500 : null;
  const x = (ms) => 360 + (ms - 498) * 380;
  focus.target('gate-window', () => {
    const status = seen('executable-gate-window') ? 'Window complete' : 'Waiting for the window';
    api.text(ctx, status, 125, 288, 42, C.ink, 'left', 'serif');
    api.text(ctx, 'p95 must be finite, numeric and at least zero.', 125, 368, 34, C.muted);
  });
  focus.target('gate-limit', () => {
    const y = 582;
    api.line(ctx, x(498), y, x(501), y, C.muted, 4);
    for (const tick of [498, 499, 500, 501]) {
      api.line(ctx, x(tick), y - 22, x(tick), y + 24, tick === 500 ? C.yellow : C.muted, 3);
      api.text(ctx, tick + ' ms', x(tick), y + 86, 34, C.muted, 'center');
    }
    api.text(ctx, 'Strict limit', x(500), 455, 34, C.yellow, 'center');
    if (value !== null) {
      api.circle(ctx, x(value), y, 17, C.cyan);
      api.text(ctx, 'p95 = ' + value + ' ms', x(value), y - 57, 43, C.cyan, 'center');
    } else {
      api.text(ctx, 'No valid p95 yet', x(498), y - 64, 36, C.muted);
    }
  });
  const returned = below
    ? seen('executable-gate-advance')
    : exact
      ? seen('gate-zero-result')
      : seen('gate-latency-hold');
  const output = launchRecommendation(PASSING_CASES, {
    stage: 'canary',
    windowComplete: true,
    p95Ms: value,
    otherGatesPass: true,
  });
  focus.target('gate-next', () => {
    const status =
      output.candidateTraffic === 20
        ? 'Review for 20%'
        : output.candidateTraffic === 0
          ? 'Withdraw to 0%'
          : 'Hold review at 5%';
    api.text(ctx, 'Policy recommendation', 125, 827, 34, C.muted);
    api.text(ctx, returned ? status : '?', 715, 840, 56, C.ink, 'left', 'serif');
  });
}

function drawAccessReplay(ctx, api) {
  const { C, focus } = api;
  const changed = focus.visible('gate-change-access');
  const options = { stage: 'canary', p95Ms: 420, windowComplete: true, otherGatesPass: true };
  const failed = { ...PASSING_CASES, [CASES[0]]: false };
  const columnX = [820, 1370];
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  write('Canary review • complete window • other release checks pass', 120, 250, 35, C.muted);
  write('Friday packet', columnX[0], 349, 43, C.ink, 'serif');
  if (changed) write('Snippet fails again', columnX[1], 349, 42, C.ink, 'serif');
  const rowY = [472, 572, 672];
  ['acl-denied-snippet', 'acl-denied-citation', 'p95 in this window'].forEach((label, i) => {
    api.line(ctx, 118, rowY[i] - 63, 1812, rowY[i] - 63, '#555961', 2);
    write(label, 120, rowY[i], 36, C.muted, i < 2 ? 'mono' : 'sans');
  });
  for (const [i, checks] of [PASSING_CASES, failed].entries()) {
    if (i === 1 && !changed) continue;
    focus.target(i ? 'gate-changed-input' : 'gate-original-input', () => {
      CASES.forEach((key, j) =>
        write(
          checks[key] ? 'True' : 'False',
          columnX[i],
          rowY[j],
          43,
          checks[key] ? C.green : C.pink,
          'mono',
        ),
      );
      write('420 ms', columnX[i], rowY[2], 46, C.ink);
    });
    focus.target(i ? 'gate-withdraw' : 'gate-pass-output', () => {
      const ready = focus.visible(i ? 'executable-gate-withdraw' : 'gate-pass-return');
      const result = launchRecommendation(checks, options);
      const label = ready
        ? result.candidateTraffic === 0
          ? 'Withdraw • 0%'
          : 'Review for 20%'
        : '?';
      write(label, columnX[i], 810, 43, ready ? (i ? C.pink : C.cyan) : C.yellow, 'serif');
    });
  }
  api.line(ctx, 118, 735, 1812, 735, '#555961', 2);
  write('Recommended share', 120, 810, 36);
  focus.target('gate-call', () =>
    write(
      'launch_action(' + (changed ? 'failed' : 'passed') + ', p95_ms=420, **canary)',
      120,
      925,
      34,
      C.cyan,
      'mono',
    ),
  );
  const predicting =
    focus.visible('gate-replay-question') && !focus.visible('executable-gate-withdraw');
  focus.target(predicting ? 'gate-question' : 'gate-scope', () =>
    write(
      focus.visible('executable-gate-scope')
        ? 'Priya acts on the recommendation. Verify routing and contain any exposure.'
        : predicting
          ? 'What candidate share does the function recommend now?'
          : 'Python • local release policy',
      120,
      1005,
      32,
      C.muted,
    ),
  );
}

export default {
  id: 'executable-gate',
  draw: drawExecutableGate,
  cues: [
    'executable-gate-keys',
    'executable-gate-true',
    'executable-gate-offline',
    'gate-key-failures',
    'gate-numeric-one',
    'gate-invalid-result',
    'executable-gate-window',
    'executable-gate-rollback',
    'gate-lower-input',
    'executable-gate-advance',
    'gate-latency-hold',
    'gate-zero-result',
    'gate-pass-return',
    'gate-change-access',
    'gate-replay-question',
    'executable-gate-withdraw',
    'executable-gate-scope',
  ],
};
