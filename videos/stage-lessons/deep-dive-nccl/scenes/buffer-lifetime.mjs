// Scene 14: Who still uses this allocation? Buffer B lifetime through producer -> NCCL -> consumer + optimizer update waiting on BOTH grad (6ms) AND bwd weight read (9ms) -> starts at 9ms.
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
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function bufferLifetime(s, c) {
  const phase = s.value(0);
  // step: 0..4=Buffer B lifetime + reject free at host return, 5..8=Optimizer W update waits for grad(6ms) AND bwd(9ms) -> 9ms
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#6ee7b718');
  const title = heroTitle(['Who Still Uses', 'This Allocation?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'BUFFER LIFETIME · DUAL PARAMETER READ GUARD',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const mx = (ms) => -580 + ms * 118; // 0..11 ms

    const nodes = [
      txt(
        st >= 5
          ? 'OPTIMIZER UPDATE ON WEIGHT W: WAIT FOR MAX(grad=6 ms, bwd_read=9 ms) = 9 ms'
          : 'ONE ALLOCATION B: STAY VALID FROM PRODUCER THROUGH NCCL TO CONSUMER',
        0,
        -222,
        26,
        st >= 5 ? COSMOS.gold : ROLE.comm,
        'mono',
      ),
      line([mx(0), -155], [mx(11), -155], { stroke: COSMOS.muted, width: 2.4 }),
    ];
    [0, 3, 6, 9, 11].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -166], [tx, -144], { stroke: ms === 9 ? ROLE.good : COSMOS.muted, width: 2.2 }),
        txt(`${ms} ms`, tx, -188, 26, ms === 9 ? ROLE.good : COSMOS.muted, 'mono'),
      );
    });

    if (st < 5) {
      nodes.push(
        rect(mx(2.5) - mx(0), 74, { fill: '#12284a', stroke: ROLE.r0, width: 2.4, radius: 8 }).at(
          mx(1.25),
          -55,
        ),
        txt('Producer', mx(1.25), -55, 26, ROLE.r0, 'mono'),
        rect(mx(7) - mx(2.5) - 4, 74, { fill: '#0e2834', stroke: ROLE.comm, width: 2.8, radius: 8 })
          .at(mx(4.75), -55)
          .glow(8, ROLE.comm),
        txt('NCCL Reads/Writes B', mx(4.75), -55, 26, COSMOS.ink, 'mono'),
        rect(mx(10.5) - mx(7) - 4, 74, {
          fill: '#0d2924',
          stroke: ROLE.good,
          width: 2.6,
          radius: 8,
        }).at(mx(8.75), -55),
        txt('Consumer Reads B', mx(8.75), -55, 26, ROLE.good, 'mono'),

        glassCell(0, 125, 1340, 132, st >= 4 ? ROLE.bad : COSMOS.dim, {
          fill: st >= 4 ? '#2d1222' : '#0a0f1c',
          glow: st >= 4 ? 10 : 2,
        }),
        txt(
          'FREEING OR OVERWRITING B AT HOST RETURN CORRUPTS IN-FLIGHT COLLECTIVE DATA!',
          0,
          125,
          26,
          st >= 4 ? ROLE.bad : COSMOS.muted,
          'mono',
        ),
      );
    } else {
      nodes.push(
        txt('GRAD g', -760, -72, 26, ROLE.comm, 'mono'),
        rect(mx(6) - mx(0), 66, { fill: '#0e2834', stroke: ROLE.comm, width: 2.6, radius: 8 }).at(
          mx(3),
          -72,
        ),
        txt('Grad Write Done @ 6 ms', mx(3), -72, 26, ROLE.comm, 'mono'),

        txt('OLD W', -760, 32, 26, ROLE.r3, 'mono'),
        rect(mx(9) - mx(0), 66, { fill: '#22153d', stroke: ROLE.r3, width: 2.6, radius: 8 }).at(
          mx(4.5),
          32,
        ),
        txt('Backward Kernel Reads Old Weight W (until 9 ms)', mx(4.5), 32, 26, ROLE.r3, 'mono'),

        txt('OPT STEP', -760, 138, 26, ROLE.good, 'mono'),
        rect(mx(11) - mx(9), 66, { fill: '#0d2924', stroke: ROLE.good, width: 3.0, radius: 8 })
          .at(mx(10), 138)
          .glow(10, ROLE.good),
        txt('W += ...', mx(10), 138, 26, ROLE.good, 'mono'),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 268, { radius: 6, color: st >= 5 ? ROLE.good : ROLE.bad }),
      txt(
        st >= 5
          ? 'Both dependencies must finish: gradient ready at 6 ms AND old-weight readers done at 9 ms'
          : 'Keep buffer storage allocated and untouched until every queued GPU read and write completes',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['nc-buffer-lifetime-b0-s0', 0],
    ['nc-buffer-lifetime-b0-s1', 1],
    ['nc-buffer-lifetime-b0-s2', 2],
    ['nc-buffer-lifetime-b0-s3', 3],
    ['nc-buffer-lifetime-b0-s4', 4],
    ['nc-buffer-lifetime-b1-s0', 5],
    ['nc-buffer-lifetime-b1-s1', 6],
    ['nc-buffer-lifetime-b1-s2', 7],
    ['nc-buffer-lifetime-b1-s3', 8],
  ]);
}
