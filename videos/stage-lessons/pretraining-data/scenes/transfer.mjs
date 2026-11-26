// Scene 25: What changed when the cutoff moved?: Repeat draw tracing (C, A, C, E), tightening 0.50 -> 0.85 erasing code, and 10 held-out test cases (7 -> 5).
import { delay, par } from 'vizmatic/stage';
import {
  BRANCH_050,
  BRANCH_085,
  COSMOS,
  PROXY_RESULTS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  preparationBranch,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const drawSteps = s.value(0); // 0..4 draws

  const showPart2 = s.value(0);
  const strictCut = s.value(0.5);
  const showEval = s.value(0);
  const evalSeen = s.value(0); // 0..10 cases
  const totalsOn = s.value(0);
  const restoreNote = s.value(0);

  const bgAura = aura(0, 0, 640, '#16274e2a', '#a78bfa16');

  function drawInventoryStrip(branch, y, label, a) {
    const nodes = [
      txt(label, -820, y - 16, 30, COSMOS.ink, 'mono', 'left').opacity(a),
      txt(`${branch.tokens} unique tok`, -820, y + 26, 26, COSMOS.muted, 'mono', 'left').opacity(a),
    ];
    let x = -420;
    const scale = 2.05;
    for (const rec of branch.unique) {
      const w = rec.tokens * scale;
      const col = rec.source === 'Code' ? COSMOS.violet : COSMOS.cyan;
      nodes.push(
        glassCell(x + w * 0.5, y, w - 10, 96, col, { fill: '#10182d', glow: 7, opacity: a }),
        txt(`${rec.id} · ${rec.source}`, x + w * 0.5, y - 16, 26, col, 'mono').opacity(a),
        txt(`${rec.tokens} tok`, x + w * 0.5, y + 24, 26, COSMOS.ink, 'mono').opacity(a),
      );
      x += w;
    }
    return nodes;
  }

  // Part 1: Four 100-token draws [C, A, C, E] exposing repeated code offset
  const part1Live = guardedDynamic(showPart1, (a) => {
    const n = Math.round(drawSteps.value);
    const drawIds = ['C', 'A', 'C', 'E'];

    const nodes = [
      heroTitle(['Trace Every Draw', '& Every Removal'], {
        x: -855,
        y: -435,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.violet,
        eyebrow: 'UNIQUE INVENTORY VS PRESENTATIONS · CUTOFF 0.50',
      }).opacity(a),
      ...drawInventoryStrip(BRANCH_050, -175, 'Cutoff 0.50', a),

      txt('FOUR DRAWS OF 100 TOKENS EACH', -820, -15, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];

    drawIds.forEach((id, i) => {
      const cx = -570 + i * 380;
      const shown = i < n;
      const isCode = id === 'C';
      const col = isCode ? COSMOS.violet : COSMOS.cyan;
      nodes.push(
        txt(`Draw ${i + 1}`, cx, 42, 26, COSMOS.muted, 'mono').opacity(a),
        glassCell(cx, 130, 330, 126, shown ? col : '#455982', {
          fill: shown ? (isCode ? '#221542' : '#0f1d30') : '#0d1324',
          glow: shown ? 9 : 2,
          opacity: a,
          dash: shown ? undefined : [8, 6],
        }),
      );
      if (shown) {
        nodes.push(
          txt(`Record ${id}`, cx, 108, 34, col, 'mono').opacity(a),
          txt('offset 1..100', cx, 154, 26, COSMOS.ink, 'mono').opacity(a),
        );
      } else {
        nodes.push(txt('100-tok slot', cx, 132, 26, COSMOS.dim, 'mono').opacity(a));
      }
    });

    nodes.push(
      txt(
        n >= 4
          ? '200 code presentations drawn from the exact same 100 token positions of C'
          : 'Trace source ID and token offset across 4 consecutive 100-token draws',
        0,
        355,
        n >= 4 ? 34 : 30,
        n >= 4 ? COSMOS.violet : COSMOS.muted,
        'sans',
      )
        .glow(n >= 4 ? 6 : 0, COSMOS.violet)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Part 2 & 3: Tightening cutoff 0.50 -> 0.85 erases C & E, mean rises 0.821 -> 0.900, then 10 held-out cases 7 -> 5
  const part2Live = guardedDynamic(showPart2, (a) => {
    const cut = strictCut.value;
    const ev = showEval.value;
    const seen = Math.round(evalSeen.value);
    const tot = totalsOn.value;
    const rn = restoreNote.value;

    const branch = preparationBranch(cut);
    const nodes = [
      txt(
        'RAISE ONLY THE CUTOFF: 0.50 -> 0.85',
        -855,
        -430,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      ...drawInventoryStrip(BRANCH_050, -310, 'Cutoff 0.50', a),
      ...drawInventoryStrip(branch, -170, `Cutoff ${cut.toFixed(2)}`, a),
    ];

    if (ev < 0.05) {
      // Beat 1: Mean score jumps 0.821 -> 0.900 while code vanishes; ask prediction question!
      nodes.push(
        txt('TOKEN-WEIGHTED MEAN CLASSIFIER SCORE', 0, 20, 28, COSMOS.muted, 'mono').opacity(a),
        txt(
          `${BRANCH_050.mean.toFixed(3)}   ->   ${branch.mean.toFixed(3)}`,
          0,
          115,
          66,
          COSMOS.gold,
          'mono',
        )
          .glow(10, COSMOS.gold)
          .opacity(a),
        txt(
          cut > 0.84
            ? 'Can this inventory supply even 1 code token, however often we sample?'
            : 'C (120) and E (200) drop · only A (240) remains',
          0,
          315,
          34,
          COSMOS.ink,
          'serif',
        ).opacity(a),
      );
    } else {
      // Beat 2: 10 matched held-out cases comparing Cutoff 0.50 (7/10) vs Cutoff 0.85 (5/10)
      nodes.push(
        txt(
          'SAME 10 HELD-OUT CASES · MATCHED CHECKPOINT & BUDGET',
          -820,
          -25,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(ev * a),
      );
      const cellLeft = -460;
      const cellPitch = 112;
      for (let i = 0; i < 10; i++) {
        nodes.push(
          txt(String(i + 1), cellLeft + i * cellPitch, 32, 26, COSMOS.dim, 'mono').opacity(ev * a),
        );
      }

      const rows = [
        { label: 'Cutoff 0.50', data: PROXY_RESULTS.baseline, y: 105, compare: null },
        {
          label: 'Cutoff 0.85',
          data: PROXY_RESULTS.strict,
          y: 215,
          compare: PROXY_RESULTS.baseline,
        },
      ];
      rows.forEach((row) => {
        nodes.push(txt(row.label, -820, row.y + 2, 30, COSMOS.ink, 'mono', 'left').opacity(ev * a));
        let okCount = 0;
        row.data.forEach((pass, i) => {
          const shown = i < seen;
          if (shown && pass) okCount++;
          const flipped = shown && row.compare && row.compare[i] !== pass;
          const cx = cellLeft + i * cellPitch;
          const stroke = flipped
            ? COSMOS.gold
            : shown
              ? pass
                ? COSMOS.emerald
                : COSMOS.rose
              : '#283454';
          nodes.push(
            rect(92, 74, {
              fill: flipped ? '#2b1e12' : '#0f1628',
              stroke,
              width: flipped ? 3.4 : 2,
              radius: 8,
            })
              .at(cx, row.y)
              .glow(flipped ? 10 : 3, stroke)
              .opacity(ev * a),
          );
          if (shown) {
            nodes.push(
              txt(
                pass ? 'OK' : 'X',
                cx,
                row.y + 2,
                30,
                pass ? COSMOS.emerald : COSMOS.rose,
                'mono',
              ).opacity(ev * a),
            );
          }
        });
        if (tot > 0.5) {
          nodes.push(
            txt(
              `${okCount} / 10`,
              755,
              row.y + 2,
              42,
              row.compare ? COSMOS.rose : COSMOS.emerald,
              'mono',
            )
              .glow(8, row.compare ? COSMOS.rose : COSMOS.emerald)
              .opacity(tot * ev * a),
          );
        }
      });

      nodes.push(
        txt(
          rn > 0.5
            ? 'Cases 1 & 2 flipped (7 -> 5) · restore C alone at fixed budget on fresh cases'
            : '0 code tokens left to draw · compare matched runs on the same 10 cases',
          0,
          375,
          32,
          rn > 0.5 ? COSMOS.gold : COSMOS.ink,
          'sans',
        )
          .glow(rn > 0.5 ? 6 : 0, COSMOS.gold)
          .opacity(ev * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live);
  runPhase(s, c, phase, 14);

  c.on('pt-transfer-draws', () =>
    s.play(drawSteps.to(4, { duration: remainDuration(c, 'pt-transfer-draws', 1.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-transfer-tighten', () =>
    s.play(strictCut.to(0.85, { duration: remainDuration(c, 'pt-transfer-tighten', 1.0) })),
  );

  c.onBeat(2, () => {
    s.play(showEval.to(1, { duration: 0.35 }));
  });
  c.on('pt-transfer-tests', () =>
    s.play(evalSeen.to(10, { duration: remainDuration(c, 'pt-transfer-tests', 1.1) })),
  );
  c.after('pt-transfer-totals', () =>
    s.play(totalsOn.to(1, { duration: remainAfterDuration(c, 'pt-transfer-totals', 0.4) })),
  );
  c.on('pt-transfer-test-code', () =>
    s.play(restoreNote.to(1, { duration: remainDuration(c, 'pt-transfer-test-code', 0.5) })),
  );
}
