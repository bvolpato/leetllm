// Scene 13: One more key on the same page: Inspector-Executor plan/run + appending k9 into Page 6 slot 1.
import {
  COSMOS,
  ROLE,
  aura,
  buildPlanRunPipeline3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfter,
  remainBeat,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function planning(s, c) {
  const phase = s.value(0);
  const pipeStage = s.value(0); // 0=plan, 1=workspace, 2=run
  const appended = s.value(0); // k9 appended to Page 6 slot 1
  const askReach = s.value(0); // prediction hold!
  const revShort = s.value(0); // revealed at beat 2 start ("It stops one key short")
  const refreshed = s.value(0); // refreshed at planning-beat-3-focus-1

  const bgAura = aura(440, 20, 520, '#60a5fa20', '#6ee7b71a');
  const { view: pipe3d } = buildPlanRunPipeline3d(pipeStage, phase, { x: 455, y: 20, unit: 98 });

  const title = heroTitle(['One More Key on', 'the Same Page'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'PLAN THEN RUN · INSPECTOR-EXECUTOR',
    subtitle: 'Same page IDs [3, 14, 6], but tail grows 1 -> 2',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const app = appended.value > 0.5;
    const ask = askReach.value > 0.5;
    const shrt = revShort.value > 0.5;
    const ref = refreshed.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const cacheLen = app ? 10 : 9;
    const planLen = ref ? 10 : 9;

    const nodes = [
      txt('3D PLAN -> WORKSPACE -> RUN PIPELINE', 455, -405, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        ref
          ? 'Plan refreshed to 10 keys without recompiling kernel'
          : 'Host plan() reserves tiles; run() reuses across layers',
        455,
        420,
        26,
        ref ? ROLE.good : COSMOS.muted,
        'sans',
      ),
      txt('PAGE 6 TAIL SLOTS (PAGES 3 & 14 HOLD k0..k7)', -455, -165, 26, ROLE.r2, 'mono'),
    ];

    // Summary block for k0..k7 + 4 explicit slots of Page 6
    nodes.push(
      glassCell(-750, -78, 210, 96, ROLE.r0, { fill: '#10213d', glow: 5 }),
      txt('P3, P14', -750, -100, 26, ROLE.r0, 'mono'),
      txt('k0..k7', -750, -60, 28, COSMOS.ink, 'mono'),
    );

    const slotXs = [-520, -355, -190, -25];
    for (let sl = 0; sl < 4; sl++) {
      const cx = slotXs[sl];
      const isK8 = sl === 0;
      const isK9 = sl === 1;
      const occupied = isK8 || (isK9 && app);
      const isNewK9 = isK9 && app;
      const col = isNewK9
        ? ref
          ? ROLE.good
          : shrt
            ? ROLE.bad
            : COSMOS.gold
        : isK8
          ? ROLE.r2
          : COSMOS.dim;
      nodes.push(
        glassCell(cx, -78, 148, 96, col, {
          fill: isNewK9
            ? ref
              ? '#0f2b25'
              : shrt
                ? '#30101c'
                : '#2a2110'
            : occupied
              ? '#102438'
              : '#0b101d',
          glow: isNewK9 ? 11 * pulse : occupied ? 5 : 0,
          dash: occupied ? undefined : [8, 6],
        }),
        txt(`P6 s${sl}`, cx, -100, 26, COSMOS.muted, 'mono'),
        txt(
          isK8 ? 'k8' : isNewK9 ? 'k9' : 'empty',
          cx,
          -60,
          28,
          occupied ? col : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Two aligned length brackets with common left origin (-850)
    const originX = -850;
    const end9X = -448;
    const end10X = -283;
    const cacheEndX = cacheLen === 10 ? end10X : end9X;
    const planEndX = planLen === 10 ? end10X : end9X;

    // Upper bracket: Live Cache length
    nodes.push(
      line([originX, 24], [cacheEndX, 24], { stroke: ROLE.r2, width: 4.0 }).glow(6, ROLE.r2),
      line([originX, 10], [originX, 38], { stroke: ROLE.r2, width: 3.5 }),
      line([cacheEndX, 10], [cacheEndX, 38], { stroke: ROLE.r2, width: 3.5 }),
      txt(`LIVE CACHE: ${cacheLen} keys (tail = ${cacheLen - 8})`, -455, 72, 28, ROLE.r2, 'mono'),
    );

    // Lower bracket: Plan coverage
    const planCol = ref ? ROLE.good : shrt ? ROLE.bad : COSMOS.gold;
    nodes.push(
      line([originX, 144], [planEndX, 144], { stroke: planCol, width: 4.0 }).glow(6, planCol),
      line([originX, 130], [originX, 158], { stroke: planCol, width: 3.5 }),
      line([planEndX, 130], [planEndX, 158], { stroke: planCol, width: 3.5 }),
      txt(
        `PLAN COVERS: ${planLen} keys (planned tail = ${planLen - 8})`,
        -455,
        192,
        28,
        planCol,
        'mono',
      ),
    );

    // Verdict box (strictly withholds stale verdict during beat 1 prediction!)
    let vCol = ROLE.r2;
    let vLine1 = 'Plan inspects pages once; run() reuses across layers';
    let vLine2 = 'Addresses fixed: pages = [3, 14, 6]';

    if (app && ask && !shrt && !ref) {
      vCol = COSMOS.gold;
      vLine1 = 'k9 appended to Page 6 slot 1 (addresses fixed)';
      vLine2 = 'Can the old length-dependent plan reach k9?';
    } else if (shrt && !ref) {
      vCol = ROLE.bad;
      vLine1 = 'STOPS 1 KEY SHORT: old tail = 1 covers k0..k8';
      vLine2 = 'Page list still points to Page 6, but plan misses slot 1';
    } else if (ref) {
      vCol = ROLE.good;
      vLine1 = 'REFRESHED: both brackets cover all 10 keys';
      vLine2 = 'Length change refreshes plan metadata, not compilation';
    }

    nodes.push(
      glassCell(-445, 325, 840, 118, vCol, { fill: '#0e172a', glow: 9 }),
      txt(vLine1, -445, 300, 26, vCol, 'mono').glow(5, vCol),
      txt(vLine2, -445, 348, 26, COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, pipe3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pipe3d, { theta: -0.22, phi: 0.92 });

  c.on('planning-prepare', () =>
    s.play(pipeStage.to(1.8, { duration: remainDuration(c, 'planning-prepare', 1.4) })),
  );
  c.on('planning-append', () =>
    s.play(appended.to(1, { duration: remainDuration(c, 'planning-append', 0.45) })),
  );
  c.on('planning-limit', () =>
    s.play(askReach.to(1, { duration: remainDuration(c, 'planning-limit', 0.4) })),
  );
  c.onBeat(2, () => s.play(revShort.to(1, { duration: remainBeat(c, 2, 0.35) })));
  c.after('planning-beat-3-focus-1', () => {
    s.play(refreshed.to(1, { duration: remainAfter(c, 'planning-beat-3-focus-1', 0.4) }));
    s.play(pipeStage.to(2, { duration: remainAfter(c, 'planning-beat-3-focus-1', 0.4) }));
  });
}
