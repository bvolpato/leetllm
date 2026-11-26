// Scene 24: diagnostic-replay: One-factor-at-a-time replay matrix (context sweep, prefill chunk sweep, threads/NUMA, request ID binding).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function diagnosticReplay(s, c) {
  const showLog = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Diagnostic Replay:', 'Isolate One Factor at a Time'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const lg = showLog.value;

    const nodes = [
      txt('CONTROLLED ISOLATION SWEEPS', -855, -220, 26, ROLE.vram, 'mono', 'left').opacity(alpha),

      chipPill('Startup OOM -> pool + live bytes', -450, -125, {
        w: 760,
        h: 72,
        color: ROLE.work,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Long Input -> sweep ctx, then chunk', 435, -125, {
        w: 780,
        h: 72,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Slow CPU -> sweep threads, then NUMA', -450, -25, {
        w: 760,
        h: 72,
        color: ROLE.gold,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Slow Link -> trace xfer vs faults vs replay', 435, -25, {
        w: 780,
        h: 72,
        color: ROLE.kv,
        size: 26,
        opacity: alpha,
      }),

      txt(
        'HEALTH CHECK OK != INFERENCE OK (BIND REQUEST ID TO WORKER LOG)',
        -855,
        100,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * lg)),
      chipPill('GET /health -> 200 OK', -560, 195, {
        w: 480,
        h: 74,
        color: ROLE.ok,
        size: 28,
        opacity: alpha * (0.45 + 0.55 * lg),
      }),
      chipPill('POST /generate [req_id] -> FAIL (phase + loaded model)', 285, 195, {
        w: 1080,
        h: 74,
        color: lg > 0.3 ? ROLE.work : COSMOS.rule,
        fill: lg > 0.3 ? '#321420' : '#10182d',
        size: 26,
        glow: lg > 0.3 ? 10 : 0,
        opacity: alpha * (0.45 + 0.55 * lg),
      }),
      txt(
        'For changed answers, compare artifact + template + decoding policy on paired prompts',
        0,
        320,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-diagnostic-replay-1-0', (d) => s.play(showLog.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-diagnostic-replay-0-0',
    'pl-diagnostic-replay-0-1',
    'pl-diagnostic-replay-0-2',
    'pl-diagnostic-replay-0-3',
    'pl-diagnostic-replay-1-1',
    'pl-diagnostic-replay-1-2',
    'pl-diagnostic-replay-1-3',
  ]);
}
