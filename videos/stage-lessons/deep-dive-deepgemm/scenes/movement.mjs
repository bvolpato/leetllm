// Scene 08: When can this tile start multiplying?
// PREDICTION SCENE: keep TMEM scale slot EMPTY & MMA blocked until beat 1 cues!
import {
  COSMOS,
  LAYOUT_VIEWS,
  ROLE,
  aura,
  buildTmaTmemPipeline3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function movement(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0.2);
  const loadedSmem = s.value(0);
  const showDesc = s.value(0);
  const showTrans = s.value(0);
  const showAsk = s.value(0);
  const scalesInTmem = s.value(0); // Beat 1: scales copy SMEM -> TMEM
  const mmaIssued = s.value(0); // STRICT: c.after('dg-movement-1-1')
  const showAcc = s.value(0);
  const showEpilogue = s.value(0);
  const showHopper = s.value(0);

  const bgAura = aura(445, 20, 520, '#5ce1e622', '#a78bfa1c');
  const { view: pipe3d } = buildTmaTmemPipeline3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['When Can This Tile', 'Start Multiplying?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'SM100 BLACKWELL · TMA -> SMEM -> TMEM',
    subtitle: 'Operands stay in shared memory; scales must reach TMEM',
  });

  const live = guardedDynamic(1, () => {
    const smemReady = loadedSmem.value > 0.5;
    const tmemReady = scalesInTmem.value > 0.5;
    const issued = mmaIssued.value > 0.5;

    const nodes = [
      txt('3D SM100 TILE PIPELINE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Global -> SMEM (TMA) -> TMEM scales -> tcgen05', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // 3 Hardware Tier Boxes (left to right)
    // 1. Global -> SMEM
    nodes.push(
      glassCell(-735, -120, 240, 128, smemReady ? ROLE.a : COSMOS.dim, {
        fill: '#101d38',
        glow: smemReady ? 8 : 0,
      }),
      txt('SHARED MEM', -735, -158, 26, ROLE.a, 'mono'),
      txt(
        smemReady ? 'A, B: READY' : 'A, B: loading',
        -735,
        -118,
        26,
        smemReady ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(smemReady ? 'scales: staged' : 'scales: wait', -735, -78, 26, ROLE.scale, 'mono'),
    );

    // 2. TMEM (scales + accumulator)
    const tmemBorder = issued
      ? ROLE.good
      : tmemReady
        ? ROLE.scale
        : showAsk.value > 0.5
          ? ROLE.warn
          : COSMOS.dim;
    nodes.push(
      line([-612, -120], [-578, -120], { stroke: tmemReady ? ROLE.scale : COSMOS.dim, width: 3 }),
      glassCell(-445, -120, 260, 128, tmemBorder, {
        fill: tmemReady ? '#142636' : '#1b1420',
        glow: tmemReady || showAsk.value > 0.5 ? 9 : 0,
        dash: tmemReady ? undefined : [8, 6],
      }),
      txt('TMEM', -445, -158, 26, ROLE.c, 'mono'),
      txt(
        tmemReady ? 'scales: READY' : 'scales: EMPTY',
        -445,
        -118,
        26,
        tmemReady ? ROLE.good : ROLE.warn,
        'mono',
      ),
      txt(
        showEpilogue.value > 0.5
          ? 'acc: DONE -> D'
          : showAcc.value > 0.5
            ? 'acc: IN FLIGHT'
            : 'acc: idle',
        -445,
        -78,
        26,
        showEpilogue.value > 0.5 ? ROLE.good : showAcc.value > 0.5 ? ROLE.c : COSMOS.muted,
        'mono',
      ),
    );

    // 3. tcgen05 / Epilogue
    const tcBorder = showEpilogue.value > 0.5 ? ROLE.good : issued ? ROLE.gold : COSMOS.dim;
    nodes.push(
      line([-312, -120], [-278, -120], { stroke: issued ? ROLE.gold : COSMOS.dim, width: 3 }),
      glassCell(-150, -120, 250, 128, tcBorder, {
        fill: issued ? '#122922' : '#0f1422',
        glow: issued ? 10 : 0,
      }),
      txt(showEpilogue.value > 0.5 ? 'EPILOGUE' : 'tcgen05 MMA', -150, -158, 26, tcBorder, 'mono'),
      txt(
        showEpilogue.value > 0.5 ? 'OUT: RELEASED' : issued ? 'ISSUED' : 'WAITING',
        -150,
        -118,
        28,
        showEpilogue.value > 0.5 ? ROLE.good : issued ? ROLE.gold : COSMOS.muted,
        'mono',
      ),
      txt(
        issued ? 'SMEM + TMEM' : tmemReady ? 'ready to issue' : 'needs scales',
        -150,
        -78,
        26,
        COSMOS.muted,
        'mono',
      ),
    );

    // TMA Descriptor Check panel (Base [2,3] stride [3,1] PASS vs Transpose [3,2] stride [1,3] FAIL)
    if (showDesc.value > 0.05) {
      const base = LAYOUT_VIEWS.base;
      const tr = LAYOUT_VIEWS.transpose;
      nodes.push(
        txt('TMA DESCRIPTOR STRIDE CHECK', -860, 14, 26, ROLE.scale, 'mono', 'left').opacity(
          showDesc.value,
        ),
        glassCell(-665, 92, 390, 96, ROLE.good, {
          fill: '#0e2620',
          glow: 6,
          opacity: showDesc.value,
        }),
        txt(
          `Base [${base.shape.join(',')}] · [${base.strides.join(',')}]`,
          -665,
          72,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(showDesc.value),
        txt('inner stride = 1 -> PASS', -665, 114, 26, ROLE.good, 'mono').opacity(showDesc.value),
      );
      if (showTrans.value > 0.05) {
        nodes.push(
          glassCell(-245, 92, 415, 96, ROLE.bad, {
            fill: '#2a1220',
            glow: 6,
            opacity: showTrans.value,
          }),
          txt(
            `Trans [${tr.shape.join(',')}] · [${tr.strides.join(',')}]`,
            -245,
            72,
            26,
            COSMOS.ink,
            'mono',
          ).opacity(showTrans.value),
          txt('inner stride = 3 -> FAIL', -245, 114, 26, ROLE.bad, 'mono').opacity(showTrans.value),
        );
      }
    }

    // Prediction prompt before Beat 1
    if (showAsk.value > 0.5 && scalesInTmem.value < 0.05) {
      nodes.push(
        txt(
          'Predict: A & B are in SMEM, TMEM scales are empty. Issue MMA?',
          -860,
          240,
          28,
          ROLE.gold,
          'serif',
          'left',
        ).glow(6, ROLE.gold),
      );
    }

    // Status banner after beat 1 starts
    if (scalesInTmem.value > 0.05) {
      const msg =
        showHopper.value > 0.5
          ? 'Hopper (SM90): WGMMA + FP32 scales (check GPU handoff)'
          : showEpilogue.value > 0.5
            ? 'MMA done -> epilogue reads TMEM acc & stores D'
            : issued
              ? 'Scales in TMEM + A,B in SMEM -> warp issues tcgen05'
              : 'Step 1: copy scales SMEM -> TMEM before MMA';
      nodes.push(
        glassCell(-460, 265, 800, 86, issued ? ROLE.good : ROLE.scale, {
          fill: '#0e202c',
          glow: 8,
        }),
        txt(msg, -460, 265, 26, issued ? ROLE.good : ROLE.scale, 'sans'),
      );
    }

    nodes.push(
      txt(
        'Check which instruction signals completion on your target GPU',
        -860,
        388,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, pipe3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pipe3d, { theta: -0.18, phi: 0.94 });

  c.on('dg-movement-0-1', () => {
    const dur = remainDuration(c, 'dg-movement-0-1', 0.55);
    s.play(loadedSmem.to(1, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
  c.on('dg-movement-0-2', () =>
    s.play(showDesc.to(1, { duration: remainDuration(c, 'dg-movement-0-2', 0.45) })),
  );
  c.on('dg-movement-0-3', () =>
    s.play(showTrans.to(1, { duration: remainDuration(c, 'dg-movement-0-3', 0.45) })),
  );
  c.on('dg-movement-0-4', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'dg-movement-0-4', 0.45) })),
  );

  c.on('dg-movement-1-0', () => {
    const dur = remainDuration(c, 'dg-movement-1-0', 0.55);
    s.play(scalesInTmem.to(1, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.after('dg-movement-1-1', () =>
    s.play(mmaIssued.to(1, { duration: remainAfterDuration(c, 'dg-movement-1-1', 0.35) })),
  );
  c.on('dg-movement-1-2', () =>
    s.play(showAcc.to(1, { duration: remainDuration(c, 'dg-movement-1-2', 0.45) })),
  );
  c.on('dg-movement-2-0', () => {
    const dur = remainDuration(c, 'dg-movement-2-0', 0.55);
    s.play(showEpilogue.to(1, { duration: dur }));
    s.play(stage3d.to(3, { duration: dur }));
  });
  c.on('dg-movement-2-1', () =>
    s.play(showHopper.to(1, { duration: remainDuration(c, 'dg-movement-2-1', 0.45) })),
  );
}
