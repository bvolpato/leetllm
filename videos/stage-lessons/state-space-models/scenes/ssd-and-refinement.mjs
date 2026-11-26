// Scene 11: ssd-and-refinement: Orbiting 3D SSD matrix -> chunk boundary carry (0.74 -> 1.466) -> Mamba-3 trapezoid, rotation & MIMO.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  buildSsdMatrix3d,
  chunkStateFixture,
  circle,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  multiDirectionFixture,
  orbitScene,
  playCue,
  swapVis,
  trapezoidWriteFixture,
  txt,
  valuePill,
} from '../parts.mjs';

export default function ssdAndRefinement(s, c) {
  const chunkSplit = s.value(0); // 0 -> 1 splits 3D SSD matrix into chunks
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showLocal = s.value(0);
  const revealCarry = s.value(0); // strictly withheld until AFTER `ssd-incoming`!
  const showChunks64 = s.value(0);
  const mamba3Phase = s.value(0); // 0=trapezoid, 1=rotation, 2=MIMO

  const bgAura = aura(350, 20, 560, '#103c362a', '#242e6418');
  const ssd3d = buildSsdMatrix3d(chunkSplit, { x: 350, y: 20 });

  const title = heroTitle(['Mamba-2 SSD', '& Mamba-3 Refinements'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.state,
  });

  const chunks = chunkStateFixture(); // chunk0 outputs [0.6, 0.74], chunk1 local [0.8, 1.12] + boundary [0.666, 0.5994] = [1.466, 1.7194]
  const trapHalf = trapezoidWriteFixture(0.5);
  const mimo = multiDirectionFixture([2, 3]); // outputs [5, -1]

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const loc = showLocal.value;
    const car = revealCarry.value;
    const c64 = showChunks64.value;
    const nodes = [
      txt('3D SEMI-SEPARABLE SSD MATRIX  M_{ij}', 350, -390, 26, ROLE.read, 'mono', 'center')
        .glow(5, ROLE.read)
        .opacity(alpha),
      txt('M_{ij} = C_i · (a_{i:j}) · B_j', -855, -210, 32, ROLE.state, 'mono', 'left')
        .glow(6, ROLE.state)
        .opacity(alpha),
    ];

    if (loc > 0.05) {
      nodes.push(
        txt('CHUNK 0 [3, 1] LOCAL:', -855, -110, 26, ROLE.carry, 'mono', 'left').opacity(
          loc * alpha,
        ),
        valuePill(`[${chunks[0].local.map((v) => v.toFixed(2)).join(', ')}]`, -660, -35, {
          w: 340,
          h: 68,
          color: ROLE.carry,
          size: 30,
          opacity: loc * alpha,
        }),
        txt('CHUNK 1 [4, 2] LOCAL (FROM 0):', -855, 55, 26, ROLE.read, 'mono', 'left').opacity(
          loc * alpha,
        ),
        valuePill(`[${chunks[1].local.map((v) => v.toFixed(2)).join(', ')}]`, -660, 130, {
          w: 340,
          h: 68,
          color: ROLE.read,
          size: 30,
          opacity: loc * alpha,
        }),
      );
      if (car < 0.2) {
        nodes.push(
          txt('What is missing from Chunk 1?', -855, 240, 34, ROLE.delta, 'serif', 'left')
            .glow(8, ROLE.delta)
            .opacity(loc * (1 - car * 5) * alpha),
        );
      }
    }

    if (car > 0.2) {
      nodes.push(
        txt(
          `Boundary 0.74 carried across: +${chunks[1].boundary[0].toFixed(3)} → ${chunks[1].outputs[0].toFixed(3)}, +${chunks[1].boundary[1].toFixed(4)} → ${chunks[1].outputs[1].toFixed(4)}`,
          -855,
          245,
          26,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(6, ROLE.state)
          .opacity(car * alpha),
      );
    }

    if (c64 > 0.05) {
      nodes.push(
        txt(
          '16,384 tokens ÷ 256 = 64 chunks  (+1 token opens chunk 65)',
          -855,
          330,
          26,
          ROLE.delta,
          'mono',
          'left',
        ).opacity(c64 * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: Mamba-3 trio: Exponential Trapezoid (left), Complex Rotation Compass (center), MIMO [2,3] -> [5,-1] (right)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const mp = mamba3Phase.value;
    const rotAng = mp >= 1 ? Math.PI : 0; // 1 turns arrow halfway around (pi rad)
    const nodes = [
      // Left: Exponential Trapezoid
      txt('EXPONENTIAL TRAPEZOID', -630, -210, 26, ROLE.delta, 'mono', 'center').opacity(alpha),
      txt(`weight = 0.5  →  both endpoints`, -630, -135, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(`output = ${trapHalf.output.toFixed(3)}`, -630, -60, 34, ROLE.delta, 'mono', 'center')
        .glow(8, ROLE.delta)
        .opacity(alpha),
      txt('Drops Conv1D; saves prev write', -630, 30, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      // Center: Complex State Rotation (parity dial)
      txt('COMPLEX ROTATION', 0, -210, 26, ROLE.read, 'mono', 'center').opacity(alpha),
      circle(105, { fill: '#0f1830', stroke: ROLE.read, width: 3 }).at(0, -15).opacity(alpha),
      glowingTrail(
        [
          [0, -15],
          [Math.cos(rotAng) * 86, -15 - Math.sin(rotAng) * 86],
        ],
        { color: ROLE.state, width: 5.5, glow: 12, opacity: alpha },
      ),
      glowDot(Math.cos(rotAng) * 86, -15 - Math.sin(rotAng) * 86, {
        radius: 9,
        color: ROLE.state,
        opacity: alpha,
      }),
      txt('1 flips 180° · 0 holds (parity)', 0, 140, 26, ROLE.read, 'mono', 'center').opacity(
        alpha,
      ),

      // Right: MIMO multiple input/output directions
      txt('MIMO READ / WRITE', 600, -210, 26, ROLE.write, 'mono', 'center').opacity(alpha),
      valuePill(`Inputs [${mimo.inputs.join(', ')}]`, 600, -105, {
        w: 280,
        h: 72,
        color: ROLE.carry,
        size: 30,
        opacity: alpha,
      }),
      valuePill(`Sum read = ${mimo.outputs[0]}`, 600, 15, {
        w: 280,
        h: 72,
        color: ROLE.state,
        size: 30,
        glow: mp >= 2 ? 12 : 4,
        opacity: alpha,
      }),
      valuePill(`Diff read = ${mimo.outputs[1]}`, 600, 125, {
        w: 280,
        h: 72,
        color: ROLE.write,
        size: 30,
        glow: mp >= 2 ? 12 : 4,
        opacity: alpha,
      }),
      txt(
        'More arithmetic per state memory read · measure real emitted tokens/sec',
        0,
        320,
        28,
        ROLE.state,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, ssd3d, title, view1, view2);
  orbitScene(s, c, ssd3d, { theta: -0.25, phi: 0.9 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'ssd-and-refinement-b2', (d) => s.play(chunkSplit.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'ssm-ssd-local', (d) => s.play(showLocal.to(1, { duration: d })), { dur: 0.5 });
  // Strictly withhold missing boundary carry until AFTER `ssd-incoming`!
  playCue(s, c, 'ssd-incoming', (d) => s.play(revealCarry.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'ssm-chunks64', (d) => s.play(showChunks64.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'ssd-and-refinement-b3', (d) => s.play(swapVis(view1Vis, view2Vis, d)), {
    dur: 0.6,
  });
  c.hide('ssd-and-refinement-b3', ssd3d);
  playCue(s, c, 'ssm-rotation', (d) => s.play(mamba3Phase.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'ssm-mimo', (d) => s.play(mamba3Phase.to(2, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), [
    'ssd-and-refinement-b1',
    'ssm-ssd-factor',
    'ssd-first-carry',
    'ssm-ssd-boundary',
    'ssm-chunk65',
    'difference-read',
    'ssm-trapezoid-half',
  ]);
}
