// Scene 04: Assign each handoff its actual state owner (Tokenizer -> Scheduler -> Model Runner -> Grammar/Sampler -> Detokenizer).
import {
  COSMOS,
  ROLE,
  aura,
  buildOverlapStream3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function runtimeOwners(s, c) {
  const phase = s.value(0);
  // step: 0=entrypoints & tokenizer, 1=scheduler & runner, 2=grammar & sampling, 3=detokenizer (ID != text chunk)
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#60a5fa1e', '#5ce1e616');
  const { view: stream3d } = buildOverlapStream3d(step, phase, { x: 475, y: 25, unit: 90 });

  const title = heroTitle(['Trace Request R42', 'Across State Owners'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefill,
    eyebrow: 'SRT RUNTIME OWNERSHIP · MULTIPROCESS HANDOFFS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D HOST -> GPU EXECUTION PIPELINE', 475, -390, 26, ROLE.radix, 'mono').glow(
        5,
        ROLE.radix,
      ),
      txt('Process boundaries vary by mode & parallelism', 475, 405, 26, COSMOS.gold, 'mono'),
    ];

    const owners = [
      {
        name: '1. Tokenizer',
        owns: 'Parses input IDs & output state',
        col: ROLE.prefill,
        hi: st === 0,
      },
      {
        name: '2. Scheduler',
        owns: 'Runnable work & KV cache slots',
        col: ROLE.radix,
        hi: st === 1,
      },
      {
        name: '3. Runner',
        owns: 'Forward batch & attention exec',
        col: ROLE.radix,
        hi: st === 1,
      },
      {
        name: '4. Grammar',
        owns: 'Masks logits & picks next token ID',
        col: ROLE.grammar,
        hi: st === 2,
      },
      {
        name: '5. Detokenizer',
        owns: 'Turns token IDs into output text',
        col: ROLE.decode,
        hi: st >= 3,
      },
    ];

    owners.forEach((o, i) => {
      const y = -185 + i * 112;
      nodes.push(
        glassCell(-420, y, 860, 92, o.hi ? o.col : COSMOS.dim, {
          fill: o.hi ? '#122238' : '#0a0f1c',
          glow: o.hi ? 10 : 2,
        }),
        txt(o.name, -825, y, 26, o.hi ? o.col : COSMOS.muted, 'mono', 'left'),
        txt(o.owns, -560, y, 26, o.hi ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
      );
    });

    const caption =
      st >= 3
        ? 'Generated token ID != delivered text chunk.'
        : st === 2
          ? 'Grammar and sampling constrain the next token before output state advances.'
          : 'Keep the same request identity R42 across every queue and handoff.';

    nodes.push(txt(caption, -855, 360, 26, st >= 3 ? COSMOS.gold : COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, stream3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, stream3d, { theta: -0.22, phi: 0.92 });
  wireStepCues(s, c, step, [
    ['sg-runtime-owners-beat-0', 0],
    ['sg-runtime-scheduler', 1],
    ['sg-runtime-owners-beat-1', 2],
    ['sg-runtime-output', 3],
  ]);
}
