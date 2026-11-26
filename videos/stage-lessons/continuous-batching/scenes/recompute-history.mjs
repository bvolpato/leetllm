// Scene 12: recompute-history: Prompt [101,102,103] + accepted [201,202] -> drop 4 KV -> replay 4 without re-emitting -> feed 202.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function recomputeHistory(s, c) {
  const step = s.value(0); // 0=ledgers, 1=drop KV, 2=replay 4, 3=consume 202, 4=swap vs recompute

  const bgAura = aura(0, 0, 740, '#14335c28', '#22184022');
  const title = heroTitle(['Recompute Preemption:', 'Two Separate Ledgers'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.a,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(step.value);
    const kvDropped = st === 1;
    const kvRebuilt = st >= 2;

    const nodes = [
      // Row 1: Accepted Client Output Ledger (NEVER rolled back!)
      txt(
        '1. CLIENT ACCEPTED OUTPUT LEDGER (IMMUTABLE)',
        -855,
        -215,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('Prompt: 101, 102, 103', -585, -130, {
        w: 540,
        h: 74,
        color: ROLE.a,
        size: 28,
        opacity: alpha,
      }),
      chipPill('Sent: 201', -145, -130, {
        w: 250,
        h: 74,
        color: ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
      chipPill('Sent: 202 (newest)', 225, -130, {
        w: 410,
        h: 74,
        color: st >= 3 ? ROLE.d : ROLE.ok,
        size: 28,
        glow: st >= 3 ? 12 : 6,
        opacity: alpha,
      }),

      // Row 2: GPU KV Cache Ledger (discarded on pause, rebuilt via silent replay!)
      txt(
        kvDropped
          ? '2. GPU KV CACHE LEDGER: 4 POSITIONS DISCARDED!'
          : kvRebuilt
            ? '2. GPU KV CACHE LEDGER: REPLAYED [101, 102, 103, 201] (NO SAMPLING!)'
            : '2. GPU KV CACHE LEDGER (4 CACHED POSITIONS)',
        -855,
        -5,
        26,
        kvDropped ? ROLE.warn : kvRebuilt ? ROLE.ok : ROLE.d,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    const kvToks = ['101', '102', '103', '201'];
    kvToks.forEach((tok, idx) => {
      const cx = -720 + idx * 235;
      nodes.push(
        chipPill(kvDropped ? 'EVICTED' : `KV[${tok}]`, cx, 85, {
          w: 205,
          h: 74,
          color: kvDropped ? ROLE.warn : kvRebuilt ? ROLE.ok : ROLE.d,
          fill: kvDropped ? '#2d1420' : kvRebuilt ? '#0f2d24' : '#10182d',
          size: 28,
          glow: kvRebuilt ? 10 : 4,
          opacity: alpha * (kvDropped ? 0.55 : 1),
        }),
      );
    });

    nodes.push(
      chipPill(st >= 3 ? 'NEXT INPUT: 202 -> predict 203' : 'Pending decode input: 202', 490, 85, {
        w: 620,
        h: 74,
        color: st >= 3 ? ROLE.d : COSMOS.rule,
        fill: st >= 3 ? '#2d2310' : '#10182d',
        size: 28,
        glow: st >= 3 ? 12 : 0,
        opacity: alpha,
      }),

      txt(
        st >= 4
          ? 'Swap-out trades host RAM + PCIe bandwidth; recompute spends GPU replay FLOPs (4 positions here)'
          : 'Replaying accepted history rebuilds KV state silently without sampling or sending duplicate tokens',
        0,
        265,
        28,
        st >= 4 ? ROLE.a : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'recompute-history-b1', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'recompute-history-b2', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'history-drop', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'history-replay', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'history-next', (d) => s.play(step.to(3, { duration: d })));
  playCue(s, c, 'recompute-history-b3', (d) => s.play(step.to(4, { duration: d })));
}
