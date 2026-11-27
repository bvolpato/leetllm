// Scene 27: Follow the owner before changing a kernel (6-file V1 code route: CLI/API -> EngineCore -> Scheduler -> KV Manager -> Block Pool -> Selected Runner; quiet GPU + rising ITL + recompute -> check KV first; Request A [80,5,7,3] -> API vs Request B [3,75,6,2] -> Queue).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

const CODE_ROUTE = [
  ['1. CLI / API SERVER', 'entrypoints/openai/api_server.py', 'HTTP, tokenize, stream', ROLE.r0],
  ['2. ENGINE CORE', 'v1/engine/core.py', 'Event loop & ZeroMQ handoff', COSMOS.gold],
  ['3. SCHEDULER', 'v1/core/sched/scheduler.py', 'Token budget & recompute', ROLE.r1],
  ['4. KV MANAGER', 'v1/core/kv_cache_manager.py', 'APC hits & slot reserve', ROLE.kv],
  ['5. BLOCK POOL', 'v1/core/block_pool.py', 'Refs, hash map, LRU queue', ROLE.good],
  ['6. SELECTED RUNNER', 'v1/worker/gpu_worker.py', 'CUDA graphs & attention', COSMOS.amber],
];

export default function sourceDiagnosis(s, c) {
  // step: 0=op-0 6-file source route, 1=op-1 / kv-first telemetry dashboard, 2=op-2 / input-trace Request A [80,5,7,3], 3=queue-trace Request B [3,75,6,2]
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61a', '#ff6b8b16');
  const title = heroTitle(['Follow the Owner Before', 'Changing a Kernel'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'V1 CODE-READING ROUTE · TELEMETRY TRIAGE · TRACE DIAGNOSIS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st === 0) {
      CODE_ROUTE.forEach(([titleStr, pathStr, roleStr, col], i) => {
        const colIdx = i % 3;
        const rowIdx = Math.floor(i / 3);
        const cx = -575 + colIdx * 575;
        const cy = -115 + rowIdx * 225;
        nodes.push(
          glassCell(cx, cy, 535, 185, col, { fill: '#101a2d', glow: 8 }),
          txt(titleStr, cx, cy - 52, 26, col, 'mono'),
          txt(pathStr, cx, cy + 2, 26, COSMOS.ink, 'mono'),
          txt(roleStr, cx, cy + 54, 26, COSMOS.muted, 'sans'),
        );
      });
    } else if (st === 1) {
      // Quiet GPU + Rising ITL + Increasing Recompute -> Inspect KV usage & free blocks FIRST
      const metrics = [
        ['GPU ACTIVITY', 'QUIET', ROLE.r0],
        ['INTER-TOKEN LATENCY', 'RISING', ROLE.bad],
        ['RECOMPUTE PREEMPTIONS', 'INCREASING', ROLE.bad],
        ['INSPECT FIRST', 'KV USAGE & FREE BLOCKS', ROLE.good],
      ];
      metrics.forEach(([k, v, col], i) => {
        const cx = -645 + i * 430;
        nodes.push(
          glassCell(cx, -125, 398, 175, col, {
            fill: i === 3 ? '#0e2922' : '#111a2c',
            glow: i === 3 ? 11 : 7,
          }),
          txt(k, cx, -162, 26, col, 'mono'),
          txt(v, cx, -96, 26, COSMOS.ink, 'mono'),
        );
      });

      nodes.push(
        glassCell(0, 120, 1680, 175, COSMOS.gold, { fill: '#221c0e', glow: 8 }),
        txt('FOLLOW-UP TRIAGE ORDER', 0, 72, 26, COSMOS.gold, 'mono'),
        txt(
          '1. Token & seq caps + prompt lengths   2. Engine-core CPU   3. TP / PP collectives',
          0,
          130,
          26,
          COSMOS.ink,
          'sans',
        ),
        txt(
          'Hit rate shows how often prefixes reused; free blocks show how much room remained',
          0,
          182,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    } else {
      // Request A [80, 5, 7, 3] vs Request B [3, 75, 6, 2]
      const traces = [
        {
          label: 'REQUEST A (95 MS TOTAL)',
          vals: [80, 5, 7, 3],
          verdict: 'LONGEST: 80 MS INPUT -> INVESTIGATE API INPUT STAGE FIRST',
          verdictCol: ROLE.r0,
          show: true,
        },
        {
          label: 'REQUEST B (86 MS TOTAL)',
          vals: [3, 75, 6, 2],
          verdict: 'LONGEST: 75 MS QUEUE -> INVESTIGATE ENGINE ADMISSION / SCHEDULING FIRST',
          verdictCol: ROLE.r1,
          show: st >= 3,
        },
      ];
      const segCols = [ROLE.r0, ROLE.r1, ROLE.kv, ROLE.good];
      const segNames = ['Input', 'Queue', 'Prefill', 'Deliver'];
      const scale = 15.5;

      traces.forEach((tr, row) => {
        if (!tr.show) return;
        const baseY = -148 + row * 255;
        nodes.push(
          txt(tr.label, -830, baseY - 64, 26, COSMOS.ink, 'mono', 'left'),
          txt(tr.verdict, 830, baseY - 64, 26, tr.verdictCol, 'mono', 'right'),
        );
        let curX = -830;
        tr.vals.forEach((ms, i) => {
          const w = Math.max(46, ms * scale);
          nodes.push(
            glassCell(curX + w * 0.5, baseY + 12, w - 4, 82, segCols[i], {
              fill: '#132036',
              glow: ms >= 70 ? 11 : 4,
            }),
            txt(
              ms >= 20 ? `${segNames[i]} ${ms} ms` : `${ms}`,
              curX + w * 0.5,
              baseY + 12,
              26,
              COSMOS.ink,
              'mono',
            ),
          );
          curX += w;
        });
        nodes.push(
          txt(
            `Input ${tr.vals[0]} ms   |   Queue ${tr.vals[1]} ms   |   Prefill ${tr.vals[2]} ms   |   Deliver ${tr.vals[3]} ms`,
            -830,
            baseY + 86,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
      });
    }

    nodes.push(
      txt(
        st === 0
          ? 'Follow one request ID through these six V1 files instead of blaming the attention kernel first'
          : st === 1
            ? 'Correlate recompute preemptions with free blocks before rewriting CUDA kernels'
            : 'Open every slow request trace at its single longest interval',
        0,
        382,
        26,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-source-diagnosis-op-0', 0],
    ['vv-source-diagnosis-op-1', 1],
    ['vv-source-diagnosis-kv-first', 1, true],
    ['vv-source-diagnosis-op-2', 2],
    ['vv-source-diagnosis-input-trace', 2, true],
    ['vv-source-diagnosis-queue-trace', 3, true],
  ]);
}
