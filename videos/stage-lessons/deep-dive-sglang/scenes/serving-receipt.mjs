// Scene 28: Bind workload, cache state and timing to the same comparison (Release receipt + isolated replay + Nsight Systems vs Nsight Compute).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function servingReceipt(s, c) {
  const phase = s.value(0);
  // step: 0=release receipt fields, 1=telemetry & cold/warm trials, 2=isolated 1-mechanism replay (schema fixed!),
  // 3=Nsight Systems (host gaps, queues, transfers, launches), 4=Nsight Compute (selected kernel occupancy & memory traffic)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1a', '#5ce1e618');
  const title = heroTitle(['Bind Environment,', 'Cache & Profiler Traces'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefill,
    eyebrow: 'SERVING RECEIPT · ISOLATED REPLAY · NSIGHT PROFILING',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st === 0) {
      const fields = [
        {
          k: 'Hardware',
          v: 'Accelerator model, count, topology, precision, quantization',
          col: ROLE.prefill,
        },
        {
          k: 'Revisions',
          v: 'SGLang commit, model weights, tokenizer, attention backend, flags',
          col: ROLE.radix,
        },
        {
          k: 'Workload',
          v: 'Prompt/output length distribution, arrival rate, program vs HTTP API',
          col: ROLE.grammar,
        },
        {
          k: 'Regime',
          v: 'Warmup + steady-state window, cold vs warm cache, correctness checks',
          col: ROLE.decode,
        },
      ];
      fields.forEach((f, i) => {
        const y = -168 + i * 118;
        nodes.push(
          glassCell(0, y, 1540, 96, f.col, { fill: '#0f1c32', glow: 8 }),
          txt(f.k, -720, y, 28, f.col, 'mono', 'left'),
          txt(f.v, -460, y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else if (st <= 2) {
      nodes.push(
        txt(
          'ISOLATED REPLAY CONTRACT (CHANGE ONE MECHANISM ONLY)',
          0,
          -205,
          28,
          COSMOS.gold,
          'mono',
        ),
      );
      const rows = [
        ['Dimension', 'Baseline Run', 'Candidate Run', false],
        ['Requests & arrival times', 'R42 / R43 identical', 'R42 / R43 identical', false],
        ['Cache regime (cold vs warm)', 'separated trials', 'matched regime', false],
        ['Required JSON schema & quality', 'ENFORCED', 'ENFORCED', st >= 2],
        ['Target mechanism under test', 'disabled', 'enabled', st >= 2],
      ];
      rows.forEach((r, i) => {
        const y = -125 + i * 88;
        const isHdr = i === 0;
        const hi = r[3];
        nodes.push(
          glassCell(0, y, 1540, 74, hi ? COSMOS.gold : isHdr ? ROLE.prefill : ROLE.radix, {
            fill: hi ? '#201c10' : isHdr ? '#10213d' : '#0d1628',
            glow: hi || isHdr ? 9 : 3,
          }),
          txt(
            r[0],
            -720,
            y,
            26,
            hi ? COSMOS.gold : isHdr ? ROLE.prefill : COSMOS.ink,
            'mono',
            'left',
          ),
          txt(r[1], 140, y, 26, isHdr ? ROLE.prefill : COSMOS.muted, 'mono'),
          txt(r[2], 540, y, 26, hi ? COSMOS.gold : ROLE.decode, 'mono'),
        );
      });
    } else {
      const compute = st >= 4;
      nodes.push(
        glassCell(-420, -15, 740, 340, !compute ? ROLE.radix : COSMOS.dim, {
          fill: !compute ? '#0e2436' : '#0b101d',
          glow: !compute ? 11 : 2,
        }),
        txt('NSIGHT SYSTEMS', -420, -130, 32, !compute ? ROLE.radix : COSMOS.muted, 'mono'),
        txt('Timeline across host & device', -420, -68, 26, COSMOS.gold, 'mono'),
        txt('Host CPU gaps & scheduler queues', -420, -6, 26, COSMOS.ink, 'sans'),
        txt('KV transfers & kernel launch gaps', -420, 50, 26, COSMOS.ink, 'sans'),
        txt('Locates WHICH gap moved on replay', -420, 110, 26, ROLE.decode, 'mono'),

        glassCell(420, -15, 740, 340, compute ? ROLE.grammar : COSMOS.dim, {
          fill: compute ? '#1e1638' : '#0b101d',
          glow: compute ? 11 : 2,
        }),
        txt('NSIGHT COMPUTE', 420, -130, 32, compute ? ROLE.grammar : COSMOS.muted, 'mono'),
        txt('Single selected GPU kernel', 420, -68, 26, COSMOS.gold, 'mono'),
        txt('Warp occupancy & stall reasons', 420, -6, 26, COSMOS.ink, 'sans'),
        txt('HBM memory traffic & roofline', 420, 50, 26, COSMOS.ink, 'sans'),
        txt('Does not replace end-to-end latency', 420, 110, 26, ROLE.fail, 'mono'),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 295, { radius: 6, color: ROLE.radix }),
      txt(
        st >= 3
          ? 'Report p50 and p99 latency, memory pressure, warmup time, and errors alongside throughput.'
          : st >= 2
            ? 'A grammar-off run diagnoses mask overhead but does not represent the constrained product.'
            : 'Record full hardware, revision, workload, and cache state in every serving benchmark receipt.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-serving-receipt-beat-0', 0],
    ['sg-serving-receipt-beat-1', 1],
    ['sg-receipt-replay', 2],
    ['sg-serving-receipt-beat-2', 3],
    ['sg-receipt-compute', 4],
  ]);
}
