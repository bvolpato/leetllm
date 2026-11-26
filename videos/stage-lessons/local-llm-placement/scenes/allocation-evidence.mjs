// Scene 13: allocation-evidence: CUDA device vs explicit CPU/copy vs managed migration; file-backed vs anonymous page faults; occupancy vs activity.
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

export default function allocationEvidence(s, c) {
  const showFaults = s.value(0);
  const showTrace = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Allocation & Paging Evidence:', 'Which Path Did the Bytes Take?'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.weights,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fl = showFaults.value;
    const tr = showTrace.value;

    const nodes = [
      txt('THREE MEMORY PATHS', -855, -225, 26, ROLE.vram, 'mono', 'left').opacity(alpha),
      chipPill('1. CUDA Device (strict OOM)', -575, -135, {
        w: 510,
        h: 72,
        color: ROLE.work,
        size: 26,
        opacity: alpha,
      }),
      chipPill('2. Explicit CPU / Copy', 0, -135, {
        w: 500,
        h: 72,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('3. Managed Memory (migrates)', 575, -135, {
        w: 510,
        h: 72,
        color: ROLE.kv,
        size: 26,
        opacity: alpha,
      }),

      txt(
        'HOST PAGE RELOADS UNDER MEMORY PRESSURE',
        -855,
        -20,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * fl)),
      chipPill('File-backed (Page 7): evict -> fault back from GGUF', -430, 65, {
        w: 820,
        h: 74,
        color: fl > 0.3 ? ROLE.gold : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * fl),
      }),
      chipPill('Anonymous (KV/heap): evict -> swap out & back', 445, 65, {
        w: 790,
        h: 74,
        color: fl > 0.3 ? ROLE.work : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * fl),
      }),

      txt(
        'OCCUPANCY (BYTES USED) != ACTIVITY (LINK TRAFFIC)',
        -855,
        185,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * tr)),
      chipPill(
        'Trace transfer: CPU B16 -> GPU B17 (activation) vs KV copy vs managed migration vs recompute',
        0,
        275,
        {
          w: 1620,
          h: 74,
          color: tr > 0.3 ? ROLE.ok : COSMOS.rule,
          size: 26,
          glow: tr > 0.3 ? 10 : 0,
          opacity: alpha * (0.45 + 0.55 * tr),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-allocation-evidence-1-0', (d) => s.play(showFaults.to(1, { duration: d })));
  playCue(s, c, 'pl-allocation-evidence-2-0', (d) => s.play(showTrace.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-allocation-evidence-0-0',
    'pl-allocation-evidence-0-1',
    'pl-allocation-evidence-0-2',
    'pl-allocation-evidence-0-3',
    'pl-allocation-evidence-1-1',
    'pl-allocation-evidence-1-2',
    'pl-allocation-evidence-1-3',
    'pl-allocation-evidence-1-4',
    'pl-allocation-evidence-2-1',
    'pl-allocation-evidence-2-2',
    'pl-allocation-evidence-2-3',
  ]);
}
