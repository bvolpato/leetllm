// Scene 29: Keep transport changes separate from rollout and training changes.
// Beat 0: Colocated rollout -> drain -> trainer phase reuse. Beat 1: Overlapped dispatch/expert/combine critical path (dur 6 vs sum 8).
import {
  COSMOS,
  ROLE,
  aura,
  buildStreamOverlapRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function postTrainingReceipt(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.35);
  const waitGate = s.value(0.5);
  const overlapView = s.value(0);
  const sweep = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#fb923c1c');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Separate Transport', 'From Rollout & Train'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.nvlink,
    eyebrow: 'POST-TRAINING RL · ACTOR, TEACHER & TRAINER',
    subtitle: 'Fix weights, routes & dtypes when changing one comm lever',
  });

  const live = guardedDynamic(1, () => {
    const isOv = Math.round(overlapView.value) >= 1;
    const trackL = -600;
    const trackW = 540;
    const toX = (t) => trackL + (t / 6) * trackW;

    const nodes = [
      txt('3D OVERLAPPED CRITICAL PATH STAGE', 470, -415, 26, ROLE.nvlink, 'mono').glow(
        5,
        ROLE.nvlink,
      ),
      txt(
        isOv
          ? 'Elapsed critical path = 6 (sum of overlapped phases = 8)'
          : 'Drain prior rollout consumers before reusing buffers',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      line([trackL, -135], [trackL + trackW, -135], { stroke: COSMOS.dim, width: 2 }),
    ];

    for (const tk of [0, 1, 3, 4, 5, 6]) {
      const tx = toX(tk);
      nodes.push(
        line([tx, -143], [tx, -127], { stroke: COSMOS.dim, width: 2 }),
        txt(String(tk), tx, -162, 26, COSMOS.muted, 'mono'),
      );
    }

    if (!isOv) {
      // Beat 0: Rollout -> Drain -> Trainer
      const drawBar = (y, label, s0, s1, col) => {
        const x0 = toX(s0);
        const w = toX(s1) - x0;
        nodes.push(
          rect(w, 56, { fill: '#102236', stroke: col, width: 2.4, radius: 6 })
            .at(x0 + w * 0.5, y)
            .glow(6, col),
          txt(label, x0 + w * 0.5, y, 26, col, 'mono'),
        );
      };
      nodes.push(
        txt('Rollout', -855, -52, 27, ROLE.rank0, 'mono', 'left'),
        rect(trackW, 56, { fill: '#0e1424', stroke: COSMOS.rule, width: 1.5, radius: 6 }).at(
          trackL + trackW * 0.5,
          -52,
        ),
        txt('Trainer', -855, 64, 27, ROLE.bad, 'mono', 'left'),
        rect(trackW, 56, { fill: '#0e1424', stroke: COSMOS.rule, width: 1.5, radius: 6 }).at(
          trackL + trackW * 0.5,
          64,
        ),
      );
      drawBar(-52, 'rollout', 0, 3, ROLE.rank0);
      drawBar(-52, 'drain', 3, 4, ROLE.token);
      drawBar(64, 'train', 4, 6, ROLE.bad);
      nodes.push(
        glassCell(-440, 214, 820, 102, ROLE.token, { fill: '#1c180e', glow: 6 }),
        txt('Colocated phases reuse groups only after drain', -440, 192, 26, ROLE.token, 'mono'),
        txt(
          'Record pause & sync cost alongside layer throughput',
          -440,
          240,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      // Beat 1: Overlapped comm + expert compute
      nodes.push(
        txt('Comm', -855, -52, 27, ROLE.brand, 'mono', 'left'),
        rect(trackW, 56, { fill: '#0e1424', stroke: COSMOS.rule, width: 1.5, radius: 6 }).at(
          trackL + trackW * 0.5,
          -52,
        ),
        txt('Experts', -855, 64, 27, ROLE.good, 'mono', 'left'),
        rect(trackW, 56, { fill: '#0e1424', stroke: COSMOS.rule, width: 1.5, radius: 6 }).at(
          trackL + trackW * 0.5,
          64,
        ),
      );
      const segs = [
        { y: -52, label: 'disp', s0: 0, s1: 2, col: ROLE.rank0 },
        { y: 64, label: 'experts', s0: 1, s1: 5, col: ROLE.good },
        { y: -52, label: 'comb', s0: 4, s1: 6, col: ROLE.nvlink },
      ];
      for (const sg of segs) {
        const x0 = toX(sg.s0);
        const w = toX(sg.s1) - x0;
        nodes.push(
          rect(w, 56, { fill: '#102433', stroke: sg.col, width: 2.4, radius: 6 })
            .at(x0 + w * 0.5, sg.y)
            .glow(6, sg.col),
          txt(sg.label, x0 + w * 0.5, sg.y, 26, sg.col, 'mono'),
        );
      }
      nodes.push(
        glassCell(-440, 214, 820, 102, ROLE.good, { fill: '#0d241c', glow: 7 }),
        txt(
          'Critical path: 6  (phases 2 + 4 + 2 = 8 overlapped)',
          -440,
          192,
          26,
          ROLE.good,
          'mono',
        ),
        txt(
          'Reward drop? Check delay, numerics & RL separately',
          -440,
          240,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    }

    const cx = toX(Math.min(6, sweep.value));
    nodes.push(line([cx, -132], [cx, -92], { stroke: ROLE.token, width: 3.5 }).glow(6, ROLE.token));

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-post-training-receipt-b0', () =>
    s.play(sweep.to(4, { duration: remainDuration(c, 'de-post-training-receipt-b0', 1.0) })),
  );
  c.on('de-post-training-receipt-b1', () => {
    const dur = remainDuration(c, 'de-post-training-receipt-b1', 0.9);
    s.play(overlapView.to(1, { duration: 0.25 }));
    s.play(waitGate.to(1, { duration: 0.45 }));
    s.play(sweep.to(6, { duration: dur }));
  });
}
