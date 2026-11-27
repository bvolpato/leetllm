// Scene 16: Keep the failed evidence with its repair
// Beat 0-1: Actual Compute Sanitizer runs on broken N=33 (memcheck 0 err/7 mm, racecheck 4 hazards exit 99/108 mm, synccheck 0 err/95 mm).
// Beat 2: Repair barrier -> 4 variants × 2 shapes (N33, N1024) × 3 tools = 24/24 clean commands.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function raceRecovery(s, c) {
  const showLogs = s.value(1);
  const showMatrix = s.value(0);

  const brokenShow = s.value(0);
  const memFirst = s.value(0);
  const noTiming = s.value(0);

  const memErr = s.value(0);
  const memOut = s.value(0);
  const raceHaz = s.value(0);
  const raceExit = s.value(0);
  const raceOut = s.value(0);
  const syncErr = s.value(0);
  const syncOut = s.value(0);
  const diffExec = s.value(0);

  const restoreShow = s.value(0);
  const matrixShow = s.value(0);
  const cleanShow = s.value(0);
  const limitsShow = s.value(0);

  const bgAura = aura(0, 10, 660, '#ff6b8b1c', '#6ee7b718');
  const title = heroTitle(['Keep Failed Evidence', 'with Its Repair'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.bad,
    eyebrow: 'COMPUTE SANITIZER · MEMCHECK · RACECHECK · SYNCCHECK',
  });

  // Beats 0 & 1: Three sanitizer instrument gauges on broken N=33
  const logsView = guardedDynamic(showLogs, (a) => {
    const cards = [
      {
        name: 'memcheck',
        role: 'checks addresses',
        x: -575,
        col: ROLE.input,
        toolTxt: memErr.value > 0.3 ? '0 errors' : 'awaiting run',
        outTxt: memOut.value > 0.3 ? '7 bit mismatches' : 'N = 33 · broken',
        lit: memErr.value > 0.3,
        isFail: false,
      },
      {
        name: 'racecheck',
        role: 'shared RAW/WAR/WAW',
        x: 0,
        col: ROLE.bad,
        toolTxt:
          raceHaz.value > 0.3
            ? raceExit.value > 0.3
              ? '4 hazards · exit 99'
              : '4 hazards'
            : 'awaiting run',
        outTxt: raceOut.value > 0.3 ? '108 bit mismatches' : 'N = 33 · broken',
        lit: raceHaz.value > 0.3,
        isFail: true,
      },
      {
        name: 'synccheck',
        role: 'checks barrier use',
        x: 575,
        col: ROLE.gold,
        toolTxt: syncErr.value > 0.3 ? '0 errors' : 'awaiting run',
        outTxt: syncOut.value > 0.3 ? '95 bit mismatches' : 'N = 33 · broken',
        lit: syncErr.value > 0.3,
        isFail: false,
      },
    ];

    const nodes = [
      txt(
        memFirst.value > 0.3
          ? 'RUN MEMCHECK FIRST, THEN RACECHECK · RECORD APP + TOOL STATUS'
          : brokenShow.value > 0.3
            ? 'BROKEN KERNEL: MISSING SHARED-WRITE → SHARED-READ BARRIER'
            : 'COMPUTE SANITIZER EVIDENCE (N = 33)',
        0,
        -220,
        26,
        ROLE.bad,
        'mono',
      ).opacity(a),
    ];

    cards.forEach((cd) => {
      nodes.push(
        glassCell(cd.x, 30, 500, 360, cd.lit ? cd.col : COSMOS.rule, {
          fill: cd.lit && cd.isFail ? '#32101e' : '#0e182e',
          glow: cd.lit && cd.isFail ? 12 : cd.lit ? 7 : 2,
          opacity: a,
        }),
        txt(cd.name, cd.x, -95, 38, cd.col, 'mono').opacity(a),
        txt(cd.role, cd.x, -40, 26, COSMOS.muted, 'sans').opacity(a),
        txt(
          cd.toolTxt,
          cd.x,
          44,
          32,
          cd.lit ? (cd.isFail ? ROLE.bad : ROLE.good) : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(cd.outTxt, cd.x, 128, 28, cd.lit ? ROLE.warn : COSMOS.muted, 'mono').opacity(a),
      );
    });

    const bottom =
      diffExec.value > 0.3
        ? 'Each tool saw a different schedule (7 vs 108 vs 95) · racecheck caught the hazard'
        : noTiming.value > 0.3
          ? 'Harness exits with code 2 and leaves timing blank for broken variant'
          : 'Valid addresses do not rule out shared-memory data races';
    nodes.push(
      txt(bottom, 0, 330, 28, diffExec.value > 0.3 ? ROLE.bad : ROLE.gold, 'sans').opacity(a),
    );
    return group(...nodes);
  });

  // Beat 2: 4 variants × 2 shapes × 3 tools = 24/24 clean recovery matrix
  const matrixView = guardedDynamic(showMatrix, (a) => {
    const cl = cleanShow.value > 0.3;
    const lm = limitsShow.value > 0.3;
    const variants = ['copy', 'naive', 'tiled', 'padded'];
    const tools = ['mem', 'race', 'sync'];

    const nodes = [
      txt(
        restoreShow.value > 0.3
          ? 'UNCONDITIONAL __syncthreads() RESTORED · FULL RECOVERY MATRIX'
          : 'POST-REPAIR SANITIZER MATRIX',
        0,
        -245,
        28,
        cl ? ROLE.good : ROLE.output,
        'mono',
      ).opacity(a),
      txt('N = 33 (EDGE)', -140, -172, 28, ROLE.input, 'mono').opacity(a),
      txt('N = 1024 (FULL)', 520, -172, 28, ROLE.output, 'mono').opacity(a),
    ];

    for (let sIdx = 0; sIdx < 2; sIdx++) {
      for (let t = 0; t < 3; t++) {
        const cx = -320 + sIdx * 660 + t * 180;
        nodes.push(txt(tools[t], cx, -120, 26, COSMOS.muted, 'mono').opacity(a));
      }
    }

    variants.forEach((v, r) => {
      const y = -42 + r * 88;
      nodes.push(txt(v, -690, y, 32, ROLE.input, 'mono').opacity(a));
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        for (let t = 0; t < 3; t++) {
          const cx = -320 + sIdx * 660 + t * 180;
          nodes.push(
            glassCell(
              cx,
              y,
              156,
              66,
              cl ? ROLE.good : matrixShow.value > 0.3 ? ROLE.output : COSMOS.rule,
              {
                fill: cl ? '#0d2922' : '#0f1a30',
                glow: cl ? 7 : 2,
                opacity: a,
              },
            ),
            txt(cl ? 'clean' : 'run', cx, y, 26, cl ? ROLE.good : COSMOS.muted, 'mono').opacity(a),
          );
        }
      }
    });

    nodes.push(
      txt(
        cl
          ? '24 / 24 sanitizer commands clean (4 variants × 2 shapes × 3 tools)'
          : 'Running memcheck, racecheck, and synccheck on N = 33 and N = 1024',
        0,
        305,
        30,
        cl ? ROLE.good : ROLE.gold,
        'mono',
      )
        .glow(6, cl ? ROLE.good : ROLE.gold)
        .opacity(a),
      txt(
        lm
          ? 'Archive hazard + repair with source hash & logs'
          : 'Retain failing evidence to reproduce the race',
        0,
        375,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, logsView, matrixView);

  c.on('gpu-race-recovery-broken', () =>
    s.play(brokenShow.to(1, { duration: remainDuration(c, 'gpu-race-recovery-broken', 0.4) })),
  );
  c.on('gpu-race-recovery-memfirst', () =>
    s.play(memFirst.to(1, { duration: remainDuration(c, 'gpu-race-recovery-memfirst', 0.4) })),
  );
  c.on('gpu-race-recovery-notiming', () =>
    s.play(noTiming.to(1, { duration: remainDuration(c, 'gpu-race-recovery-notiming', 0.4) })),
  );

  c.on('gpu-race-recovery-mem', () =>
    s.play(memErr.to(1, { duration: remainDuration(c, 'gpu-race-recovery-mem', 0.4) })),
  );
  c.on('gpu-race-recovery-memoutput', () =>
    s.play(memOut.to(1, { duration: remainDuration(c, 'gpu-race-recovery-memoutput', 0.4) })),
  );
  c.on('gpu-race-recovery-race', () =>
    s.play(raceHaz.to(1, { duration: remainDuration(c, 'gpu-race-recovery-race', 0.4) })),
  );
  c.on('gpu-race-recovery-exit', () =>
    s.play(raceExit.to(1, { duration: remainDuration(c, 'gpu-race-recovery-exit', 0.4) })),
  );
  c.on('gpu-race-recovery-raceoutput', () =>
    s.play(raceOut.to(1, { duration: remainDuration(c, 'gpu-race-recovery-raceoutput', 0.4) })),
  );
  c.on('gpu-race-recovery-sync', () =>
    s.play(syncErr.to(1, { duration: remainDuration(c, 'gpu-race-recovery-sync', 0.4) })),
  );
  c.on('gpu-race-recovery-syncoutput', () =>
    s.play(syncOut.to(1, { duration: remainDuration(c, 'gpu-race-recovery-syncoutput', 0.4) })),
  );
  c.on('gpu-race-recovery-different', () =>
    s.play(diffExec.to(1, { duration: remainDuration(c, 'gpu-race-recovery-different', 0.4) })),
  );

  c.onBeat(2, () =>
    s.play(
      par(showLogs.to(0, { duration: 0.18 }), delay(showMatrix.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.on('gpu-race-recovery-restore', () =>
    s.play(restoreShow.to(1, { duration: remainDuration(c, 'gpu-race-recovery-restore', 0.4) })),
  );
  c.on('gpu-race-recovery-matrix', () =>
    s.play(matrixShow.to(1, { duration: remainDuration(c, 'gpu-race-recovery-matrix', 0.45) })),
  );
  c.after('gpu-race-recovery-clean', () =>
    s.play(cleanShow.to(1, { duration: remainAfterDuration(c, 'gpu-race-recovery-clean', 0.45) })),
  );
  c.on('gpu-race-recovery-limits', () =>
    s.play(limitsShow.to(1, { duration: remainDuration(c, 'gpu-race-recovery-limits', 0.45) })),
  );
}
