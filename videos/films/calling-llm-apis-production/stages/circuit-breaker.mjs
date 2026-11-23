import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, legacyText, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyCircuitBreaker(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('circuit-breaker', state);
  {
    legacyText(
      ctx,
      api,
      'Protect one failing provider while keeping recovery controlled',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    const active = modelState.state;
    const states = [
      {
        id: 'closed',
        label: 'Closed · primary calls',
        x: 180,
        color: active === 'closed' ? themeColors.green : themeColors.blue,
      },
      {
        id: 'open',
        label: 'Open · fail fast or fallback',
        x: 760,
        color: active === 'open' ? themeColors.pink : themeColors.blue,
      },
      {
        id: 'half-open',
        label: 'Half-open · one probe',
        x: 1340,
        color: active === 'half_open' ? themeColors.yellow : themeColors.blue,
      },
    ];
    const painted = states.map((item) =>
      api.focus.target('breaker-state-' + item.id, () =>
        legacyCard(ctx, api, item.label, item.x, 415, 400, 100, item.color, 25),
      ),
    );
    api.connect(ctx, painted[0], painted[1], {
      color: themeColors.cyan,
      gap: 18,
    });
    api.connect(ctx, painted[1], painted[2], {
      color: themeColors.cyan,
      gap: 18,
    });
    if (modelState.step === 1) {
      api.focus.target('breaker-failure-one', () =>
        legacyCard(
          ctx,
          api,
          modelState.failures >= 1 ? 'Call R1 → 503' : 'Call R1 pending',
          170,
          570,
          500,
          80,
          modelState.failures >= 1 ? themeColors.pink : themeColors.muted,
          28,
        ),
      );
      api.focus.target('breaker-failure-two', () =>
        legacyCard(
          ctx,
          api,
          modelState.failures >= 2 ? 'Call R2 → 503' : 'Call R2 pending',
          710,
          570,
          500,
          80,
          modelState.failures >= 2 ? themeColors.pink : themeColors.muted,
          28,
        ),
      );
      api.focus.target('breaker-new-request', () =>
        legacyCard(
          ctx,
          api,
          modelState.fallback
            ? 'R3 → checked fallback'
            : modelState.failFast
              ? 'R3 blocked at open gate'
              : 'New request R3 waits',
          1250,
          570,
          500,
          80,
          modelState.fallback ? themeColors.green : themeColors.yellow,
          25,
        ),
      );
      api.focus.target('breaker-failure-count', () =>
        legacyText(
          ctx,
          api,
          `Consecutive qualifying failures: ${modelState.failures} / 2`,
          960,
          745,
          31,
          modelState.failures === 2 ? themeColors.pink : themeColors.ink,
          'center',
        ),
      );
    }
    if (modelState.step > 1) {
      legacyText(
        ctx,
        api,
        'Cooldown ' + modelState.cooldown.toFixed(1) + ' / 10 s',
        960,
        590,
        28,
        themeColors.yellow,
        'center',
      );
      api.rect(ctx, 450, 620, 1000, 22, themeColors.panel, themeColors.muted, 6);
      if (modelState.cooldown > 0)
        api.focus.target('breaker-cooldown', () =>
          api.rect(
            ctx,
            450,
            620,
            (1000 * modelState.cooldown) / 10,
            22,
            themeColors.yellow,
            themeColors.yellow,
            6,
          ),
        );
      const probe = api.focus.target('breaker-probe', () =>
        legacyCard(
          ctx,
          api,
          modelState.probeProgress === 1 ? 'P1 · only admitted probe' : 'P1 · waiting for cooldown',
          610,
          675,
          700,
          70,
          modelState.probeProgress === 1 ? themeColors.cyan : themeColors.muted,
          26,
        ),
      );
      if (modelState.probeProgress > 0)
        teaching.changeCue({
          x: 602,
          y: 667,
          width: 716,
          height: 86,
          from: 0,
          to: 1,
          progress: modelState.probeProgress,
          color: themeColors.cyan,
          emphasis: 0.35,
        });
      if (modelState.success)
        api.focus.target('probe-success', () =>
          legacyCard(ctx, api, 'P1 succeeds → CLOSED', 170, 770, 700, 64, themeColors.green, 26),
        );
      if (modelState.failure)
        api.focus.target('probe-failure', () =>
          legacyCard(
            ctx,
            api,
            'Alternative: P1 fails → OPEN',
            1050,
            770,
            700,
            64,
            themeColors.pink,
            26,
          ),
        );
      void probe;
    }
    api.focus.target('provider-failure-map', () =>
      teaching.grid({
        x: 290,
        y: 850,
        width: 1340,
        height: 120,
        rows: 3,
        columns: 2,
        labels: modelState.failureRows,
        fontSize: 22,
        textColor: themeColors.ink,
        fill: themeColors.panel,
        stroke: themeColors.muted,
      }),
    );
    legacyText(
      ctx,
      api,
      'Scope health state to the provider and failure domain',
      960,
      1030,
      25,
      themeColors.muted,
      'center',
    );
  }
}
export function drawCircuitBreaker(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyCircuitBreaker(ctx, scene, state, api);
    return;
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-circuit-breaker-' + currentBeat),
    done = u >= 0.999999;
  {
    const sx = [200, 780, 1360],
      names = ['CLOSED', 'OPEN', 'HALF-OPEN'];
    sx.forEach((x, i) =>
      api.focus.target('breaker-state-' + ['closed', 'open', 'half-open'][i], () =>
        refinedCard(
          ctx,
          api,
          names[i],
          x,
          440,
          360,
          100,
          [themeColors.green, themeColors.pink, themeColors.yellow][i],
          31,
        ),
      ),
    );
    api.line(ctx, 580, 490, 760, 490, themeColors.cyan, 5);
    api.line(ctx, 1160, 490, 1340, 490, themeColors.cyan, 5);
    if (currentBeat === 2) {
      api.line(ctx, 1710, 540, 1710, 850, themeColors.green, 4);
      api.line(ctx, 1710, 850, 150, 850, themeColors.green, 4);
      api.line(ctx, 150, 850, 150, 560, themeColors.green, 4);
      api.line(ctx, 150, 560, 220, 560, themeColors.green, 4);
      api.line(ctx, 220, 560, 220, 540, themeColors.green, 4);
      refinedText(ctx, api, 'probe success → close', 960, 900, 28, themeColors.green, 'center');
      api.line(ctx, 1690, 540, 1690, 700, themeColors.pink, 4);
      api.line(ctx, 1690, 700, 740, 700, themeColors.pink, 4);
      api.line(ctx, 740, 700, 740, 560, themeColors.pink, 4);
      api.line(ctx, 740, 560, 800, 560, themeColors.pink, 4);
      api.line(ctx, 800, 560, 800, 540, themeColors.pink, 4);
      refinedText(ctx, api, 'probe failure → reopen', 1190, 755, 27, themeColors.pink, 'center');
    }
    const count = currentBeat === 0 ? 0 : currentBeat === 1 ? Math.min(2, Math.floor(u * 3)) : 2;
    api.focus.target('breaker-failure-count', () =>
      refinedText(
        ctx,
        api,
        'Qualifying failures: ' + count + ' / 2',
        960,
        340,
        30,
        themeColors.ink,
        'center',
      ),
    );
    if (currentBeat === 1) {
      api.focus.target('breaker-failure-one', () =>
        refinedText(
          ctx,
          api,
          count >= 1 ? 'R1 → 503' : 'R1 pending',
          350,
          385,
          26,
          themeColors.pink,
          'center',
        ),
      );
      api.focus.target('breaker-failure-two', () =>
        refinedText(
          ctx,
          api,
          count >= 2 ? 'R2 → 503' : 'R2 pending',
          960,
          385,
          26,
          themeColors.pink,
          'center',
        ),
      );
      api.focus.target('breaker-new-request', () =>
        refinedCard(
          ctx,
          api,
          count >= 2 ? 'R3 → fallback' : 'R3 waits',
          630 + 300 * u,
          600,
          400,
          80,
          themeColors.yellow,
          26,
        ),
      );
    }
    if (currentBeat === 2) {
      api.focus.target('breaker-cooldown', () =>
        refinedText(
          ctx,
          api,
          'Cooldown ' + (10 * Math.min(1, u * 2)).toFixed(1) + ' / 10 s',
          960,
          385,
          27,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('breaker-probe', () =>
        refinedCard(
          ctx,
          api,
          u >= 0.7 ? 'P1 · admitted probe' : 'P1 waits',
          780 + 580 * phase(u, 0.45, 0.7),
          600,
          300,
          70,
          themeColors.cyan,
          25,
        ),
      );
      if (done) {
        api.focus.target('probe-success', () =>
          refinedText(ctx, api, 'P1 succeeds → CLOSED', 480, 950, 27, themeColors.green, 'center'),
        );
        api.focus.target('probe-failure', () =>
          refinedText(
            ctx,
            api,
            'Alternative failure → OPEN',
            1370,
            950,
            27,
            themeColors.pink,
            'center',
          ),
        );
      }
    }
    api.focus.target('provider-failure-map', () =>
      refinedText(
        ctx,
        api,
        '429 rate: bounded retry · credit: intervene · unauthorized: repair access',
        960,
        1030,
        24,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'circuit-breaker',
  draw: drawCircuitBreaker,
  cues: [
    'provider-failure-map-b1-1',
    'ap-circuit-breaker-0',
    'breaker-first-receipt',
    'breaker-failure-two-b2-1',
    'ap-circuit-breaker-1',
    'breaker-probe-b3-1',
    'ap-circuit-breaker-2',
  ],
};
