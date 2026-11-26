// Scene 03: Copy a shared prefix while preserving branch outputs (fork / join + HTTP / offline Engine parity).
import {
  COSMOS,
  ROLE,
  aura,
  buildRadixTree3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function programBranches(s, c) {
  const phase = s.value(0);
  // step: 0=common prefix, 1=forked independent branches, 2=joined named results, 3=HTTP / Engine + program throughput
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e620', '#6ee7b716');
  const { view: tree3d } = buildRadixTree3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Fork Shared Prefix,', 'Keep Branch State'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'FORK / JOIN · PROGRAM UNITS VS MODEL CALLS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D PREFIX SHARING TREE', 475, -390, 26, ROLE.radix, 'mono').glow(5, ROLE.radix),
      txt('Shared prefix KV reused across branches', 475, 405, 26, COSMOS.gold, 'mono'),
    ];

    // Left diagram: shared prefix -> fork A & B -> join
    nodes.push(
      glassCell(-420, -175, 760, 88, ROLE.radix, { fill: '#0f2236', glow: 8 }),
      txt('SHARED PREFIX: system + role + ticket', -420, -175, 26, ROLE.radix, 'mono'),
      line([-420, -128], [-620, -56], { color: ROLE.prefill, width: 3 }),
      line([-420, -128], [-220, -56], { color: ROLE.grammar, width: 3 }),

      glassCell(-620, 15, 360, 128, st >= 1 ? ROLE.prefill : COSMOS.dim, {
        fill: st >= 1 ? '#11223d' : '#0b101d',
        glow: st >= 1 ? 8 : 2,
      }),
      txt('Branch A (fork)', -620, -16, 26, ROLE.prefill, 'mono'),
      txt(
        st >= 1 ? 'output: feature' : 'pending',
        -620,
        36,
        28,
        st >= 1 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),

      glassCell(-220, 15, 360, 128, st >= 1 ? ROLE.grammar : COSMOS.dim, {
        fill: st >= 1 ? '#1f1738' : '#0b101d',
        glow: st >= 1 ? 8 : 2,
      }),
      txt('Branch B (fork)', -220, -16, 26, ROLE.grammar, 'mono'),
      txt(
        st >= 1 ? 'output: theme req' : 'pending',
        -220,
        36,
        28,
        st >= 1 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
    );

    if (st >= 2) {
      nodes.push(
        line([-620, 82], [-420, 140], { color: ROLE.decode, width: 3 }),
        line([-220, 82], [-420, 140], { color: ROLE.decode, width: 3 }),
        glassCell(-420, 195, 760, 100, ROLE.decode, { fill: '#0d2922', glow: 10 }),
        txt(
          st >= 3
            ? '1 completed program (3 model calls) = 1 unit'
            : 'join() collects separate named branch results',
          -420,
          195,
          26,
          ROLE.decode,
          'mono',
        ),
      );
    }

    const caption =
      st >= 3
        ? 'Plain HTTP & offline Engine get the same warm prefix hit without the frontend.'
        : st >= 2
          ? 'Independent branches run together; dependent steps wait on prior answers.'
          : 'Fork copies prompt state while sharing model context.';

    nodes.push(txt(caption, -855, 355, 26, st >= 3 ? COSMOS.gold : COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.22, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['sg-program-branches-beat-0', 0],
    ['sg-fork', 1, true],
    ['sg-join', 2, true],
    ['sg-program-branches-beat-1', 3],
  ]);
}
