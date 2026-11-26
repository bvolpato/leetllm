// Scene 02: iterations: Prefill -> resident KV state -> per-iteration decode loop creating scheduling boundaries.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function iterations(s, c) {
  const step = s.value(0); // 0..6

  const bgAura = aura(0, 0, 740, '#14335c28', '#22184022');
  const title = heroTitle(['Generation Creates Repeated', 'Scheduling Boundaries'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.a,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = step.value;
    const nodes = [
      txt('ITERATION-LEVEL EXECUTION LIFECYCLE', -855, -215, 26, ROLE.a, 'mono', 'left').opacity(
        alpha,
      ),

      // Top pipeline: Prefill -> Resident KV -> Decode Step -> Scheduler Decision
      chipPill('1. Prompt Prefill', -680, -100, {
        w: 350,
        h: 82,
        color: st >= 0.5 ? ROLE.b : COSMOS.rule,
        size: 28,
        glow: st >= 0.5 ? 10 : 0,
        opacity: alpha,
      }),
      arrow([-495, -100], [-395, -100], { stroke: ROLE.a, width: 3.5, head: 12 }).opacity(alpha),

      chipPill('2. Resident KV State', -195, -100, {
        w: 380,
        h: 82,
        color: st >= 1.5 ? ROLE.a : COSMOS.rule,
        size: 28,
        glow: st >= 1.5 ? 10 : 0,
        opacity: alpha * (st >= 1 ? 1 : 0.45),
      }),
      arrow([5, -100], [105, -100], { stroke: ROLE.d, width: 3.5, head: 12 }).opacity(alpha),

      chipPill('3. Decode +1 Token', 300, -100, {
        w: 370,
        h: 82,
        color: st >= 2.5 ? ROLE.d : COSMOS.rule,
        size: 28,
        glow: st >= 2.5 ? 10 : 0,
        opacity: alpha * (st >= 2 ? 1 : 0.45),
      }),
      arrow([495, -100], [585, -100], { stroke: ROLE.ok, width: 3.5, head: 12 }).opacity(alpha),

      chipPill('EOS / Cap?', 730, -100, {
        w: 270,
        h: 82,
        color: st >= 4 ? ROLE.ok : COSMOS.rule,
        size: 28,
        glow: st >= 4 ? 10 : 0,
        opacity: alpha * (st >= 3.5 ? 1 : 0.45),
      }),

      // Lower comparison: Fixed-shape vision pass vs Autoregressive ticks
      txt(
        'WHY TEXT SERVING DIFFERS FROM ONE-SHOT CLASSIFICATION',
        -855,
        55,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Image Classifier: 1 fixed pass', -480, 150, {
        w: 640,
        h: 74,
        color: COSMOS.muted,
        size: 28,
        glow: 0,
        opacity: alpha * 0.72,
      }),
      chipPill('LLM Generation: decision after EVERY tick', 360, 150, {
        w: 840,
        h: 74,
        color: st >= 5 ? ROLE.ok : ROLE.d,
        fill: st >= 5 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: st >= 5 ? 12 : 6,
        opacity: alpha,
      }),

      txt(
        st >= 5.5
          ? 'Simulation starts post-prefill: each tick advances every active stream by 1 token'
          : 'A stopped at 2 tokens; B (4) and C (6) keep private histories until EOS or output limit',
        0,
        295,
        28,
        st >= 5.5 ? ROLE.ok : ROLE.a,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'prompt-prefill', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'retained-state', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'decode-step', (d) => s.play(step.to(3, { duration: d })));
  playCue(s, c, 'request-history', (d) => s.play(step.to(3.5, { duration: d })));
  playCue(s, c, 'output-boundary', (d) => s.play(step.to(4.5, { duration: d })));
  playCue(s, c, 'ready-decode', (d) => s.play(step.to(5.5, { duration: d })));
  playCue(s, c, 'iteration-advance', (d) => s.play(step.to(6, { duration: d })));
}
