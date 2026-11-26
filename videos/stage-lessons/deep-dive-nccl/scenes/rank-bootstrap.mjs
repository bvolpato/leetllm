// Scene 03: A rank is an identity inside this communicator (Rank [0,1,2,3] -> GPU [2,0,3,1]; broadcast root=2 -> GPU 3; ncclCommInitAll vs GroupStart init).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function rankBootstrap(s, c) {
  const phase = s.value(0);
  // step: 0..4=setup & root=2 question (hold!), 5=GPU 3 answer!, 6..7=rank identity, 8..11=initAll vs grouped multi-rank init
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16618');
  const title = heroTitle(['A Rank Is Identity', 'Inside a Communicator'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.r0,
    eyebrow: 'BOOTSTRAP UNIQUE ID · RANK-TO-GPU MAPPING',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const mapGpu = [2, 0, 3, 1];
    const xs = [-540, -180, 180, 540];
    const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];

    const nodes = [
      txt(
        st >= 8
          ? 'INITIALIZATION: ncclCommInitAll (1 proc) vs ncclGroupStart/End (1 thread -> N GPUs)'
          : 'SHARED ncclUniqueId  ·  DISTINCT CUDA DEVICE PER RANK',
        0,
        -225,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    // Top row: Ranks 0..3; Bottom row: GPUs 0..3; connecting lines map Rank r -> GPU mapGpu[r]
    for (let r = 0; r < 4; r++) {
      const rx = xs[r];
      const gx = xs[mapGpu[r]];
      const isRoot = r === 2 && st >= 4;
      const showAns = r === 2 && st >= 5;
      nodes.push(
        line([rx, -64], [gx, 64], {
          stroke: showAns ? ROLE.good : isRoot ? COSMOS.gold : COSMOS.dim,
          width: showAns ? 4.8 : isRoot ? 3.4 : 2.2,
        }),
        glassCell(rx, -112, 240, 88, isRoot ? COSMOS.gold : rankCols[r], {
          fill: isRoot ? '#261e0e' : '#101b32',
          glow: isRoot ? 10 : 4,
        }),
        txt(
          isRoot ? 'Rank 2 (ROOT)' : `Rank ${r}`,
          rx,
          -112,
          28,
          isRoot ? COSMOS.gold : rankCols[r],
          'mono',
        ),
      );
    }

    for (let g = 0; g < 4; g++) {
      const gx = xs[g];
      const isAnsGpu = g === 3 && st >= 5;
      nodes.push(
        glassCell(gx, 112, 240, 88, isAnsGpu ? ROLE.good : COSMOS.muted, {
          fill: isAnsGpu ? '#0d2924' : '#0e1628',
          glow: isAnsGpu ? 12 : 3,
        }),
        txt(
          isAnsGpu ? 'GPU 3 (ROOT!)' : `GPU ${g}`,
          gx,
          112,
          28,
          isAnsGpu ? ROLE.good : COSMOS.ink,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 238, { radius: 6, color: st >= 5 ? ROLE.good : COSMOS.gold }),
      txt(
        st >= 10
          ? 'Wrap multi-rank init on 1 host thread in ncclGroupStart/End so every GPU initializes'
          : st >= 5
            ? 'root = 2 selects Rank 2 -> GPU 3 (communicator rank index, NOT physical GPU ID!)'
            : st >= 4
              ? 'Predict: broadcast asks for root = 2; which physical GPU holds its input?'
              : 'torchrun / MPI / Slurm launches workers and broadcasts one ncclUniqueId',
        0,
        320,
        28,
        st >= 5 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['nc-rank-bootstrap-b0-s0', 0],
    ['nc-rank-bootstrap-b0-s1', 1],
    ['nc-rank-bootstrap-b0-s2', 2],
    ['nc-rank-bootstrap-b0-s3', 3],
    ['nc-rank-bootstrap-b0-s4', 4],
    ['nc-rank-bootstrap-b1-s1', 5, true],
    ['nc-rank-bootstrap-b1-s2', 6],
    ['nc-rank-bootstrap-b1-s3', 7],
    ['nc-rank-bootstrap-b2-s0', 8],
    ['nc-rank-bootstrap-b2-s1', 9],
    ['nc-rank-bootstrap-b2-s2', 10],
    ['nc-rank-bootstrap-b2-s3', 11],
  ]);
}
