// Scene 13: A running-set limit and a full cache block different work (max_num_seqs=256 vs max_num_active_seqs=64 blocks req #65; KV exhaustion -> V1 default recompute preemption; thrashing latency trace).
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

export default function runningPreemption(s, c) {
  // step: 0=op-0 three independent limits, 1=running-cap blocks #65, 2=op-1 KV exhaustion, 3=preempt-reset (R3 blocks freed, record kept), 4=op-2 recompute cost trace
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1a', '#ffd16618');
  const title = heroTitle(['Running-Set Caps &', 'Recompute Preemption'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.bad,
    eyebrow: 'BACKPRESSURE · MAX_NUM_ACTIVE_SEQS · V1 DEFAULT PREEMPTION',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      // Three independent scheduler caps
      const caps = [
        ['EXECUTION CAPACITY', '256 seqs', 'max_num_seqs (batch table)', ROLE.r0],
        ['ACTIVE RUNNING CAP (v0.31)', '64 seqs', 'max_num_active_seqs (KV growth)', COSMOS.gold],
        ['CURRENT RUNNING SET', '64 / 64', 'Full even with spare token slots!', ROLE.bad],
      ];
      caps.forEach(([k, val, sub, col], i) => {
        const cx = -575 + i * 575;
        nodes.push(
          glassCell(cx, -145, 535, 165, col, { fill: '#111a2c', glow: 8 }),
          txt(k, cx, -192, 26, col, 'mono'),
          txt(val, cx, -135, 42, COSMOS.ink, 'mono'),
          txt(sub, cx, -88, 26, COSMOS.muted, 'sans'),
        );
      });

      nodes.push(
        glassCell(-430, 110, 780, 132, ROLE.r1, { fill: '#1a1430', glow: 7 }),
        txt('INCOMING REQUEST #65', -430, 78, 26, ROLE.r1, 'mono'),
        txt('Spare token budget exists in this step', -430, 134, 28, COSMOS.ink, 'sans'),

        glassCell(430, 110, 780, 132, st >= 1 ? ROLE.bad : COSMOS.gold, {
          fill: st >= 1 ? '#2c1320' : '#231c0e',
          glow: 10,
        }),
        txt(
          st >= 1 ? 'VERDICT: WAIT IN QUEUE' : 'CHECK RUNNING-SET CAP',
          430,
          78,
          26,
          st >= 1 ? ROLE.bad : COSMOS.gold,
          'mono',
        ),
        txt(
          st >= 1
            ? '65th request blocked by 64 active-seq limit'
            : 'Comparing against 64-sequence cap...',
          430,
          134,
          28,
          COSMOS.ink,
          'sans',
        ),
      );
    } else if (st <= 3) {
      const reset = st >= 3;
      nodes.push(
        glassCell(-430, -145, 780, 138, ROLE.r1, { fill: '#1a1430', glow: 8 }),
        txt('REQUEST R3 RECORD', -430, -178, 26, ROLE.r1, 'mono'),
        txt('Prompt + generated tokens RETAINED', -430, -122, 28, COSMOS.ink, 'sans'),

        glassCell(430, -145, 780, 138, reset ? COSMOS.gold : ROLE.good, {
          fill: reset ? '#261f0e' : '#0e2824',
          glow: 9,
        }),
        txt('SCHEDULER STATE', 430, -178, 26, reset ? COSMOS.gold : ROLE.good, 'mono'),
        txt(
          reset ? 'WAITING  |  computed = 0 (reset)' : 'RUNNING  |  computed = 8',
          430,
          -122,
          30,
          COSMOS.ink,
          'mono',
        ),

        txt('PHYSICAL KV BLOCKS PREVIOUSLY HELD BY R3', -855, 4, 26, ROLE.kv, 'mono', 'left'),
        glassCell(-430, 108, 780, 128, reset ? ROLE.good : ROLE.kv, {
          fill: reset ? '#0d2922' : '#0f2230',
          glow: 8,
        }),
        txt(
          reset ? 'BLOCK FREED -> RETURNS TO POOL' : 'Block A: R3 tokens t0..t3',
          -430,
          108,
          30,
          reset ? ROLE.good : COSMOS.ink,
          'mono',
        ),

        glassCell(430, 108, 780, 128, reset ? ROLE.good : ROLE.kv, {
          fill: reset ? '#0d2922' : '#0f2230',
          glow: 8,
        }),
        txt(
          reset ? 'BLOCK FREED -> RETURNS TO POOL' : 'Block B: R3 tokens t4..t7',
          430,
          108,
          30,
          reset ? ROLE.good : COSMOS.ink,
          'mono',
        ),
      );
    } else {
      // Recompute latency cost trace
      const rows = [
        ['Attempt 1', 760, ROLE.bad, 'Preempted: KV rebuilt from scratch'],
        ['Attempt 2', 760, ROLE.bad, 'Preempted: repeated prefill burns GPU'],
        ['Attempt 3', 1020, ROLE.good, 'Useful continuation completes'],
      ];
      rows.forEach(([label, barW, col, note], i) => {
        const cy = -165 + i * 145;
        nodes.push(
          txt(label, -855, cy, 28, col, 'mono', 'left'),
          glassCell(-640 + barW * 0.5, cy, barW, 86, col, {
            fill: i === 2 ? '#0e2924' : '#2b1320',
            glow: 8,
          }),
          txt(note, -640 + barW * 0.5, cy, 26, COSMOS.ink, 'sans'),
        );
      });
      nodes.push(
        txt(
          'V0 CPU-swap & explicit KV-offload connectors have separate movement rules',
          0,
          245,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
    }

    const caption =
      st <= 1
        ? 'Token cap, execution capacity & active running-set limit constrain three distinct resources'
        : st <= 3
          ? 'V1 default preemption frees KV blocks & recomputes later (eligible prefix hits still help)'
          : 'Inspect free blocks, KV usage, preemptions, queue wait & token latency together';

    nodes.push(txt(caption, 0, 378, 26, COSMOS.ink, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-running-preemption-op-0', 0],
    ['vv-running-preemption-running-cap', 1, true],
    ['vv-running-preemption-op-1', 2],
    ['vv-running-preemption-preempt-reset', 3, true],
    ['vv-running-preemption-op-2', 4],
  ]);
}
