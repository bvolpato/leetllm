// Scene 13: What changes when you unroll the loop?
// Beat 0: Warp-issue pipeline for 4 row offsets (0, 8, 16, 24) overlapping global loads ahead of dependent shared stores.
// Beat 1: Side-by-side SASS comparison: compiler default vs #pragma unroll (identical 4-load schedule).
// Beat 2: Register live-range pressure bars -> local-memory spill warning -> inspect reports + check + time.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function unrollIssue(s, c) {
  const showPipe = s.value(1);
  const showAsm = s.value(0);
  const showLive = s.value(0);

  const offsetsProg = s.value(0);
  const loadsProg = s.value(0);

  const pragmaShow = s.value(0);
  const compProg = s.value(0);
  const asmSame = s.value(0);
  const reqNote = s.value(0);

  const liveProg = s.value(0);
  const spillsShow = s.value(0);
  const notrunShow = s.value(0);
  const measureShow = s.value(0);

  const bgAura = aura(0, 10, 660, '#5ce1e61c', '#a78bfa16');
  const title = heroTitle(['What Changes When You', 'Unroll the Loop?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.violet,
    eyebrow: 'ILP & WARP ISSUE · OFFSETS 0, 8, 16, 24',
  });

  // Beat 0: 4-lane issue pipeline (global LDG latency overlapped ahead of STS shared stores)
  const pipeView = guardedDynamic(showPipe, (a) => {
    const op = offsetsProg.value;
    const lp = loadsProg.value;
    const offsets = [0, 8, 16, 24];

    const nodes = [
      txt(
        '1 THREAD OWNS 4 ROWS (256 THREADS → 1,024 TILE VALUES)',
        0,
        -225,
        26,
        ROLE.output,
        'mono',
      ).opacity(a),
    ];

    offsets.forEach((off, i) => {
      const y = -132 + i * 108;
      const loadStartX = -510 + i * 70;
      const loadW = Math.max(24, 380 * Math.max(0.12, op));
      const storeX = loadStartX + 380 + 80;
      const storeW = Math.max(24, 240 * Math.max(0.05, lp));

      nodes.push(
        txt(`offset ${off}`, -720, y, 30, ROLE.input, 'mono').opacity(a),
        glassCell(110, y, 1340, 74, COSMOS.rule, { fill: '#0b1222', glow: 0, opacity: a }),

        // Independent LDG global load bar
        rect(loadW, 46, { fill: ROLE.input, stroke: ROLE.output, width: 1.8, radius: 6 })
          .at(loadStartX + loadW * 0.5, y)
          .opacity(0.65 * a),
      );

      if (op > 0.85) {
        nodes.push(txt('LDG global', loadStartX + 190, y, 26, COSMOS.ink, 'mono').opacity(a));
      }

      if (lp > 0.05) {
        nodes.push(
          glowingTrail(
            [
              [loadStartX + 385, y],
              [storeX - 6, y],
            ],
            { color: ROLE.gold, width: 3.2, glow: 7, opacity: lp * a },
          ),
          rect(storeW, 46, { fill: ROLE.gold, stroke: ROLE.warn, width: 1.8, radius: 6 })
            .at(storeX + storeW * 0.5, y)
            .opacity(0.65 * lp * a),
        );
        if (lp > 0.85) {
          nodes.push(txt('STS shared', storeX + 120, y, 26, COSMOS.bg, 'mono').opacity(a));
        }
      }
    });

    nodes.push(
      txt(
        'Independent loads can issue in flight before dependent shared stores wait for them',
        0,
        335,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 1: Compiler default vs #pragma unroll generated instruction order
  const asmView = guardedDynamic(showAsm, (a) => {
    const pg = pragmaShow.value;
    const cp = compProg.value;
    const as = asmSame.value;
    const rq = reqNote.value;
    const instrs = [
      'LDG.E  r0, [offset + 0]',
      'LDG.E  r1, [offset + 8]',
      'LDG.E  r2, [offset + 16]',
      'LDG.E  r3, [offset + 24]',
    ];
    const rightCount = Math.min(4, Math.ceil(cp * 4));

    const nodes = [
      txt('COMPARE GENERATED INSTRUCTION ORDER', 0, -230, 28, ROLE.output, 'mono').opacity(a),

      // Left build: compiler default
      glassCell(-440, 20, 680, 380, pg > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0e1b33',
        glow: pg > 0.3 ? 8 : 3,
        opacity: a,
      }),
      txt('COMPILER DEFAULT', -440, -125, 30, ROLE.output, 'mono').opacity(a),

      // Right build: with #pragma unroll
      glassCell(440, 20, 680, 380, cp > 0.3 ? ROLE.violet : COSMOS.rule, {
        fill: '#181430',
        glow: cp > 0.3 ? 8 : 3,
        opacity: a,
      }),
      txt('WITH #pragma unroll', 440, -125, 30, ROLE.violet, 'mono').opacity(a),
    ];

    instrs.forEach((ins, i) => {
      const y = -45 + i * 68;
      nodes.push(
        txt(ins, -440, y, 28, COSMOS.ink, 'mono').opacity(a),
        txt(
          i < rightCount ? ins : '...',
          440,
          y,
          28,
          i < rightCount ? COSMOS.ink : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      txt(
        as > 0.3
          ? 'Both builds issue the same 4 loads in the exact same order'
          : 'Inspect generated SASS before crediting an unroll pragma',
        0,
        275,
        32,
        ROLE.gold,
        'mono',
      )
        .glow(6, ROLE.gold)
        .opacity(a),
      txt(
        rq > 0.3
          ? 'Check whether an independent load actually starts earlier on your GPU'
          : 'nvcc already unrolls small constant-trip loops on its own',
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 2: Register live-range expansion -> spill risk -> validate + time
  const liveView = guardedDynamic(showLive, (a) => {
    const lv = liveProg.value;
    const sp = spillsShow.value;
    const nr = notrunShow.value;
    const ms = measureShow.value;

    const nodes = [
      txt('LONGER LIVE RANGES → HIGHER REGISTER PRESSURE', 0, -230, 28, ROLE.warn, 'mono').opacity(
        a,
      ),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -630 + i * 180;
      const isExtra = i >= 4;
      const h = isExtra ? Math.max(18, 220 * lv) : 220;
      const col = isExtra ? (sp > 0.3 ? ROLE.bad : ROLE.gold) : ROLE.input;
      nodes.push(
        rect(112, h, { fill: col, stroke: col, width: 2, radius: 6 })
          .at(cx, 120 - h * 0.5)
          .opacity((isExtra ? 0.3 + 0.55 * lv : 0.72) * a),
        txt(`r${i}`, cx, 165, 28, isExtra ? col : COSMOS.ink, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        sp > 0.3
          ? 'Register spills go to device-backed local memory (may hit cache, still adds traffic)'
          : 'Hoisting loads earlier keeps values live until their stores finish',
        0,
        245,
        28,
        sp > 0.3 ? ROLE.bad : ROLE.gold,
        'sans',
      ).opacity(a),
      txt(
        ms > 0.3
          ? 'Check regs/spills, verify bits, let clean timing decide'
          : nr > 0.3
            ? 'Compare ptxas regs & spills across builds'
            : 'Fewer resident blocks if regs cross a step',
        0,
        345,
        26,
        ms > 0.3 ? ROLE.good : ROLE.output,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, pipeView, asmView, liveView);

  c.on('gpu-unroll-issue-offsets', () =>
    s.play(offsetsProg.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-offsets', 0.75) })),
  );
  c.on('gpu-unroll-issue-loads', () =>
    s.play(loadsProg.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-loads', 0.75) })),
  );

  c.onBeat(1, () =>
    s.play(par(showPipe.to(0, { duration: 0.18 }), delay(showAsm.to(1, { duration: 0.24 }), 0.22))),
  );
  c.on('gpu-unroll-issue-pragma', () =>
    s.play(pragmaShow.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-pragma', 0.45) })),
  );
  c.on('gpu-unroll-issue-compiler', () =>
    s.play(compProg.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-compiler', 0.75) })),
  );
  c.on('gpu-unroll-issue-assembly', () =>
    s.play(asmSame.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-assembly', 0.45) })),
  );
  c.on('gpu-unroll-issue-request', () =>
    s.play(reqNote.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-request', 0.45) })),
  );

  c.onBeat(2, () =>
    s.play(par(showAsm.to(0, { duration: 0.18 }), delay(showLive.to(1, { duration: 0.24 }), 0.22))),
  );
  c.on('gpu-unroll-issue-live', () =>
    s.play(liveProg.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-live', 0.75) })),
  );
  c.on('gpu-unroll-issue-spills', () =>
    s.play(spillsShow.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-spills', 0.45) })),
  );
  c.on('gpu-unroll-issue-notrun', () =>
    s.play(notrunShow.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-notrun', 0.45) })),
  );
  c.on('gpu-unroll-issue-measure', () =>
    s.play(measureShow.to(1, { duration: remainDuration(c, 'gpu-unroll-issue-measure', 0.45) })),
  );
}
