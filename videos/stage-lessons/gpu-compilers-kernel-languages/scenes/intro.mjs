// Scene 01: Which build can write the sum? CC 12.0 GPU vs Build A (sm_120) vs Build B (sm_90), PTX JIT disabled.
import {
  COSMOS,
  LANE_1,
  ROLE,
  aura,
  buildLoweringConduit3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  nativeOnlyRuns,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const stageCursor = s.value(0);
  const phase = s.value(0);
  const showExp = s.value(0);
  const showDev = s.value(0);
  const showTargets = s.value(0);
  const jitOff = s.value(0);
  const sent = s.value(0);
  const aWrote = s.value(0);
  const bStopped = s.value(0);
  const inspectA = s.value(0);

  const bgAura = aura(400, 20, 520, '#5ce1e620', '#6ee7b716');
  const { view: conduit3d } = buildLoweringConduit3d(stageCursor, phase, {
    x: 420,
    y: 25,
    unit: 96,
  });

  const title = heroTitle(['Which Build Can', 'Write the Sum?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.ir,
    eyebrow: 'CUDA COMPILER LOADER · CC 12.0 GPU',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const se = showExp.value;
    const sd = showDev.value;
    const st = showTargets.value;
    const jo = jitOff.value;
    const sn = sent.value;
    const aw = aWrote.value;
    const bs = bStopped.value;
    const ia = inspectA.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('IR → PTX → CUBIN LOWERING PIPELINE', 420, -405, 26, ROLE.ir, 'mono').glow(5, ROLE.ir),
      txt('Source · NVVM/LLVM IR · PTX · Native Silicon', 420, 420, 26, COSMOS.muted, 'sans'),
    ];

    // Expected output + Device banner
    nodes.push(
      glassCell(-715, -155, 275, 92, se > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0f2035',
        glow: se > 0.5 ? 9 : 2,
      }),
      txt('EXPECTED out[1]', -715, -180, 26, COSMOS.muted, 'mono'),
      txt(String(LANE_1.sum), -715, -135, 36, ROLE.ir, 'mono'),

      glassCell(-390, -155, 310, 92, sd > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: '#231e11',
        glow: sd > 0.5 ? 10 : 2,
      }),
      txt('TARGET GPU', -390, -180, 26, COSMOS.muted, 'mono'),
      txt('Compute Cap 12.0', -390, -135, 30, COSMOS.gold, 'mono'),
    );

    // PTX JIT Fallback switch
    nodes.push(
      glassCell(-545, -30, 620, 68, jo > 0.5 ? ROLE.warn : ROLE.ptx, {
        fill: jo > 0.5 ? '#2b1610' : '#1b1a14',
        glow: jo > 0.5 ? 9 * pulse : 3,
      }),
      txt(
        jo > 0.5 ? 'PTX JIT FALLBACK: OFF (native-only)' : 'Both carry compute_90 PTX fallback',
        -545,
        -30,
        26,
        jo > 0.5 ? ROLE.warn : ROLE.ptx,
        'mono',
      ),
    );

    // Build A track (sm_120) vs Build B track (sm_90)
    const colA = aw > 0.5 ? ROLE.cubin : st > 0.5 ? ROLE.ir : COSMOS.dim;
    const colB = bs > 0.5 ? ROLE.fail : st > 0.5 ? ROLE.ir : COSMOS.dim;

    nodes.push(
      glassCell(-705, 138, 316, 168, colA, {
        fill: aw > 0.5 ? '#0d2924' : '#0f1c32',
        glow: aw > 0.5 ? 11 * pulse : 4,
      }),
      txt(`BUILD A · ${nativeOnlyRuns[0].image}`, -705, 90, 28, colA, 'mono'),
      txt(
        aw > 0.5 ? `out[1] = ${LANE_1.sum}` : sn > 0.5 ? 'loading...' : 'targets CC 12.0',
        -705,
        140,
        28,
        aw > 0.5 ? ROLE.cubin : COSMOS.ink,
        'mono',
      ),
      txt(
        ia > 0.5 ? 'inspect store' : aw > 0.5 ? nativeOnlyRuns[0].selection : 'ready',
        -705,
        186,
        26,
        aw > 0.5 ? ROLE.cubin : COSMOS.muted,
        'mono',
      ),

      glassCell(-360, 138, 316, 168, colB, {
        fill: bs > 0.5 ? '#2e101c' : '#0f1c32',
        glow: bs > 0.5 ? 11 : 4,
      }),
      txt(`BUILD B · ${nativeOnlyRuns[1].image}`, -360, 90, 28, colB, 'mono'),
      txt(
        bs > 0.5 ? 'out[1] = empty' : sn > 0.5 ? 'loading...' : 'targets CC 9.0',
        -360,
        140,
        28,
        bs > 0.5 ? ROLE.fail : COSMOS.ink,
        'mono',
      ),
      txt(
        bs > 0.5 ? nativeOnlyRuns[1].selection : 'ready',
        -360,
        186,
        26,
        bs > 0.5 ? ROLE.fail : COSMOS.muted,
        'mono',
      ),
    );

    if (sn > 0.3 && aw < 0.5 && bs < 0.5) {
      const u = (p * 0.7) % 1;
      nodes.push(glowDot(-840 + u * 600, 232, { radius: 7, color: COSMOS.gold }));
    }

    // Bottom prompt/verdict (withhold answer during prediction hold!)
    const footer =
      bs > 0.5
        ? 'Build A matches CC 12.0 · Build B stops at loader'
        : aw > 0.5
          ? 'Build A writes -1.75 into out[1]'
          : jo > 0.5
            ? 'Predict: which build still writes -1.75?'
            : 'Two native images face the same GPU';
    nodes.push(txt(footer, -855, 345, 30, bs > 0.5 ? ROLE.cubin : COSMOS.gold, 'sans', 'left'));

    return group(...nodes);
  });

  s.add(bgAura, conduit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, conduit3d, { theta: -0.22, phi: 0.92 });

  c.on('expected', () => s.play(showExp.to(1, { duration: remainDuration(c, 'expected', 0.4) })));
  c.on('device', () => s.play(showDev.to(1, { duration: remainDuration(c, 'device', 0.4) })));
  c.on('targets', () => s.play(showTargets.to(1, { duration: remainDuration(c, 'targets', 0.4) })));
  c.on('native-only', () =>
    s.play(jitOff.to(1, { duration: remainDuration(c, 'native-only', 0.45) })),
  );
  c.on('approach', () => {
    s.play(sent.to(1, { duration: remainDuration(c, 'approach', 0.4) }));
    s.play(stageCursor.to(2, { duration: remainDuration(c, 'approach', 0.5) }));
  });
  c.after('write-a', () => {
    s.play(aWrote.to(1, { duration: remainDuration(c, 'write-a', 0.45) }));
    s.play(stageCursor.to(3, { duration: remainDuration(c, 'write-a', 0.45) }));
  });
  c.after('stop-b', () => s.play(bStopped.to(1, { duration: remainDuration(c, 'stop-b', 0.45) })));
  c.on('inspect-a', () =>
    s.play(inspectA.to(1, { duration: remainDuration(c, 'inspect-a', 0.4) })),
  );
}
