// Scene 26: Would you release this training mix?: Finale: fresh 3-record batch (600 -> 180), 20-case scorecard with 16-case code floor, HOLD verdict, and code-only restore to 0.70.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_RESTORED,
  FRESH_STRICT,
  FRESH_TOTAL,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  laserRail,
  rect,
  releaseBatch,
  releaseEvaluation,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshCorpus(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const predictOn = s.value(0);
  const cutoff = s.value(0.7);
  const movedReveal = s.value(0);
  const fracReveal = s.value(0);

  const showPart2 = s.value(0);
  const docsReveal = s.value(0);
  const codeReveal = s.value(0);
  const combReveal = s.value(0);
  const holdReveal = s.value(0);

  const showPart3 = s.value(0);
  const restoreOn = s.value(0);
  const resumeOn = s.value(0);

  const bgAura = aura(0, 0, 660, '#16284f2a', '#ffd16616');

  // Part 1: Fresh 3-record batch (Code 0.72/120, Web 0.88/300, Docs 0.94/180) on score laser rail
  const part1Live = guardedDynamic(showPart1, (a) => {
    const pr = predictOn.value;
    const cut = cutoff.value;
    const mv = movedReveal.value;
    const fr = fracReveal.value;

    const railX0 = -740;
    const railX1 = 740;
    const railY = 160;
    const scoreX = (v) => railX0 + (railX1 - railX0) * v;
    const cx = scoreX(cut);

    const cards = [
      { rec: releaseBatch[0], y: -125, boxX: 220, col: COSMOS.violet }, // Code 0.72, 120 tok
      { rec: releaseBatch[2], y: 12, boxX: 520, col: COSMOS.blue }, // Web 0.88, 300 tok
      { rec: releaseBatch[1], y: -255, boxX: 610, col: COSMOS.cyan }, // Docs 0.94, 180 tok
    ];

    const nodes = [
      heroTitle(['Fresh Batch', 'Release Decision'], {
        x: -855,
        y: -435,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.gold,
        eyebrow: 'YOUR TURN · 600 TOKENS AT CUTOFF 0.70',
      }).opacity(a),

      ...laserRail(railX0, railX1, railY, { activeFrom: cut, opacity: a }),

      // Active cutoff laser (starts below card band so it never crosses card text)
      glowingTrail(
        [
          [cx, 74],
          [cx, railY + 78],
        ],
        { color: COSMOS.gold, width: 5, glow: 14, opacity: a },
      ),
      txt(`CUTOFF ${cut.toFixed(2)}`, cx, railY + 122, 36, COSMOS.gold, 'mono')
        .glow(8, COSMOS.gold)
        .opacity(a),

      // Left summary table of the 3 records so left half stays rich & balanced
      txt('FRESH BATCH (600 TOKENS)', -855, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
    ];

    releaseBatch.forEach((rec, i) => {
      const y = -130 + i * 95;
      const alive = rec.score >= cut - 1e-9;
      const baseCol =
        rec.source === 'Code' ? COSMOS.violet : rec.source === 'Docs' ? COSMOS.cyan : COSMOS.blue;
      const col = alive ? baseCol : COSMOS.dim;
      nodes.push(
        glassCell(-555, y, 580, 74, col, {
          fill: alive ? '#10182d' : '#0b0e18',
          glow: alive ? 7 : 0,
          opacity: (alive ? 0.95 : 0.42) * a,
          dash: alive ? undefined : [8, 6],
        }),
        txt(`${rec.source}`, -810, y + 2, 30, col, 'mono', 'left').opacity(a),
        txt(`${rec.tokens} tok`, -540, y + 2, 28, alive ? COSMOS.ink : COSMOS.dim, 'mono').opacity(
          a,
        ),
        txt(
          `score ${rec.score.toFixed(2)}`,
          -295,
          y + 2,
          28,
          alive ? COSMOS.gold : COSMOS.dim,
          'mono',
          'right',
        ).opacity(a),
      );
    });

    // Plot the 3 markers along the rail
    cards.forEach(({ rec, y, boxX, col: baseCol }) => {
      const rx = scoreX(rec.score);
      const alive = rec.score >= cut - 1e-9;
      const col = alive ? baseCol : COSMOS.dim;
      nodes.push(
        glowDot(rx, railY, {
          radius: alive ? 11 : 7,
          color: col,
          glow: alive ? 12 : 0,
          opacity: a,
        }),
        glassCell(boxX, y, 360, 88, col, {
          fill: alive ? '#10192e' : '#0b0e18',
          glow: alive ? 8 : 0,
          opacity: (alive ? 0.96 : 0.4) * a,
          dash: alive ? undefined : [8, 6],
        }),
        txt(`${rec.source} · ${rec.score.toFixed(2)}`, boxX, y - 14, 28, col, 'mono').opacity(a),
        txt(
          mv > 0.5 ? (alive ? `KEEP · ${rec.tokens} tok` : 'DROPPED') : `${rec.tokens} tokens`,
          boxX,
          y + 24,
          26,
          mv > 0.5 ? (alive ? COSMOS.emerald : COSMOS.rose) : COSMOS.ink,
          'mono',
        ).opacity(a),
      );
    });

    // Bottom prompt / strict prediction withholding of 180 / 600 = 30%
    const bottomMsg =
      fr > 0.5
        ? `Docs only: ${FRESH_STRICT} / ${FRESH_TOTAL} tokens survive = ${Math.round((100 * FRESH_STRICT) / FRESH_TOTAL)}% (score 0.94)`
        : mv > 0.5
          ? 'Cutoff 0.90 crosses Code (0.72) and Web (0.88) · Docs survives'
          : pr > 0.5
            ? 'Move cutoff to 0.90: how many of 600 tokens survive, and from which source?'
            : 'All three sources pass at cutoff 0.70 (600 tokens)';
    nodes.push(
      txt(
        bottomMsg,
        0,
        405,
        34,
        fr > 0.5 ? COSMOS.cyan : pr > 0.5 ? COSMOS.gold : COSMOS.ink,
        'sans',
      )
        .glow(fr > 0.5 ? 6 : 0, COSMOS.cyan)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: 20-case held-out scorecard (Docs 16->19, Code 17->15 vs floor 16) + HOLD verdict
  const part2Live = guardedDynamic(showPart2, (a) => {
    const dr = docsReveal.value > 0.5;
    const cr = codeReveal.value > 0.5;
    const cm = combReveal.value > 0.5;
    const hl = holdReveal.value > 0.5;

    const { tasks, baseline, candidate, casesPerTask, codeFloor } = releaseEvaluation;
    const leftX = -430;
    const pitch = 54;
    const floorX = leftX + codeFloor * pitch - 6;

    const nodes = [
      txt(
        'MATCHED HELD-OUT EVALUATION · 20 CASES PER TASK',
        -855,
        -430,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Release Gate & Code Floor', -855, -355, 52, COSMOS.ink, 'serif', 'left').opacity(a),
      txt('CODE MINIMUM', 855, -415, 26, COSMOS.gold, 'mono', 'right').opacity(a),
      txt(`${codeFloor} / ${casesPerTask}`, 855, -345, 54, COSMOS.gold, 'mono', 'right')
        .glow(10, COSMOS.gold)
        .opacity(a),
    ];

    tasks.forEach((task, j) => {
      const baseY = -165 + j * 255;
      const showCand = j === 0 ? dr : cr;
      nodes.push(
        txt(
          task,
          -855,
          baseY + 25,
          46,
          j === 0 ? COSMOS.cyan : COSMOS.violet,
          'serif',
          'left',
        ).opacity(a),
      );

      [baseline, candidate].forEach((scores, k) => {
        const y = baseY + k * 84;
        nodes.push(
          txt(
            k === 0 ? '0.70' : '0.90',
            leftX - 24,
            y + 2,
            28,
            COSMOS.muted,
            'mono',
            'right',
          ).opacity(a),
        );
        for (let i = 0; i < casesPerTask; i++) {
          const filled = (k === 0 || showCand) && i < scores[j];
          const failCode = k === 1 && j === 1 && showCand && scores[j] < codeFloor;
          const col = !filled
            ? '#111626'
            : k === 0
              ? COSMOS.blue
              : failCode
                ? COSMOS.rose
                : COSMOS.emerald;
          nodes.push(
            rect(44, 48, {
              fill: col,
              stroke: filled ? col : '#2a3656',
              width: 1.5,
              radius: 5,
            })
              .at(leftX + i * pitch + 22, y)
              .opacity((filled ? 0.94 : 0.42) * a),
          );
        }
        nodes.push(
          txt(
            k === 1 && !showCand ? '? / 20' : `${scores[j]} / ${casesPerTask}`,
            745,
            y + 2,
            34,
            k === 1 && j === 1 && showCand ? COSMOS.rose : COSMOS.ink,
            'mono',
          ).opacity(a),
        );
      });

      if (task === 'Code') {
        nodes.push(
          glowingTrail(
            [
              [floorX, baseY - 38],
              [floorX, baseY + 125],
            ],
            { color: COSMOS.gold, width: 4.5, glow: 12, opacity: a },
          ),
          txt(`Floor: ${codeFloor}`, floorX, baseY + 162, 28, COSMOS.gold, 'mono')
            .glow(6, COSMOS.gold)
            .opacity(a),
        );
      }
    });

    // Strict prediction withholding: HOLD verdict revealed only after pt-fresh-corpus-hold!
    const footer = hl
      ? 'HOLD THIS MIX · Code fell 1 short of floor (15 < 16) despite +1 combined total'
      : cm
        ? 'Combined: 33 -> 34 of 40 (+1) · Docs +3, Code 17 -> 15 · Release this mix?'
        : 'Compare Cutoff 0.70 vs Cutoff 0.90 from the same checkpoint and budget';
    nodes.push(
      txt(footer, 0, 398, 34, hl ? COSMOS.rose : cm ? COSMOS.gold : COSMOS.ink, 'sans')
        .glow(hl ? 8 : cm ? 6 : 0, hl ? COSMOS.rose : COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Part 3: Finale: Lower only Code cutoff to 0.70 (300 tokens), resume at consumed=2 (prefetch=4), unscored fresh trial (? / 20)
  const part3Live = guardedDynamic(showPart3, (a) => {
    const rs = restoreOn.value > 0.5;
    const rm = resumeOn.value;
    const { candidate, casesPerTask, codeFloor } = releaseEvaluation;
    const prevCode = candidate[1];

    const kept = releaseBatch.filter((r) => r.score >= (r.source === 'Code' && rs ? 0.7 : 0.9));
    const keptTotal = kept.reduce((s, r) => s + r.tokens, 0);

    const nodes = [
      txt(
        'TARGETED FIX · LOWER ONLY CODE CUTOFF TO 0.70',
        -855,
        -430,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),
      txt('Restore, Resume, & Re-Evaluate', -855, -355, 52, COSMOS.ink, 'serif', 'left').opacity(a),

      // Left column: Policy & restored tokens
      txt('CODE CUTOFF', -855, -200, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(rs ? '0.70' : '0.90', -170, -200, 44, COSMOS.violet, 'mono', 'right')
        .glow(8, COSMOS.violet)
        .opacity(a),

      txt('DOCS & WEB CUTOFF', -855, -125, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('0.90', -170, -125, 44, COSMOS.cyan, 'mono', 'right').opacity(a),
    ];

    let rx = -855;
    kept.forEach((rec) => {
      const w = rec.tokens * 2.15;
      const col = rec.source === 'Code' ? COSMOS.violet : COSMOS.cyan;
      nodes.push(
        glassCell(rx + w * 0.5, 10, w - 10, 122, col, { fill: '#10192e', glow: 9, opacity: a }),
        txt(rec.source, rx + w * 0.5, -14, 30, col, 'mono').opacity(a),
        txt(`${rec.tokens} tok`, rx + w * 0.5, 30, 28, COSMOS.ink, 'mono').opacity(a),
      );
      rx += w;
    });

    nodes.push(
      txt(
        `${keptTotal} eligible tokens (${rs ? FRESH_RESTORED : FRESH_STRICT})`,
        -855,
        130,
        36,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(6, COSMOS.emerald)
        .opacity(a),
    );

    if (rm > 0.02) {
      nodes.push(
        glassCell(-510, 265, 690, 126, COSMOS.gold, { fill: '#1c1822', glow: 8, opacity: rm * a }),
        txt('RESUME AT CONSUMED = 2', -510, 236, 28, COSMOS.gold, 'mono').opacity(rm * a),
        txt(
          'Prefetched = 4 -> records 3 & 4 still enter training',
          -510,
          288,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(rm * a),
      );
    }

    // Right column: Previous trial (15/20) vs Fresh unscored trial (?/20) against floor 16
    const gridX = 55;
    const pitch = 40;
    const floorX = gridX + codeFloor * pitch - 4;
    nodes.push(txt('HELD-OUT CODE CASES', gridX, -200, 30, COSMOS.ink, 'mono', 'left').opacity(a));

    const trialRows = [
      { label: 'Previous mix', score: prevCode, y: -55, scored: true },
      { label: 'Fresh trial', score: null, y: 155, scored: false },
    ];
    trialRows.forEach((tr) => {
      nodes.push(
        txt(
          tr.label,
          gridX,
          tr.y - 54,
          30,
          tr.scored ? COSMOS.muted : COSMOS.gold,
          'sans',
          'left',
        ).opacity(a),
        txt(
          tr.scored ? `${tr.score} / ${casesPerTask}` : `? / ${casesPerTask}`,
          gridX + casesPerTask * pitch,
          tr.y - 54,
          40,
          tr.scored ? COSMOS.rose : COSMOS.gold,
          'mono',
          'right',
        )
          .glow(tr.scored ? 0 : 8, COSMOS.gold)
          .opacity(a),
      );
      for (let i = 0; i < casesPerTask; i++) {
        const filled = tr.scored && i < tr.score;
        nodes.push(
          rect(34, 54, {
            fill: filled ? COSMOS.cyan : '#111626',
            stroke: filled ? COSMOS.cyan : '#2a3656',
            width: 1.5,
            radius: 4,
          })
            .at(gridX + i * pitch + 17, tr.y)
            .opacity((filled ? 0.94 : 0.45) * a),
        );
      }
    });

    nodes.push(
      glowingTrail(
        [
          [floorX, -70],
          [floorX, 215],
        ],
        { color: COSMOS.gold, width: 4.5, glow: 12, opacity: a },
      ),
      txt(`Floor ${codeFloor}`, floorX, 255, 30, COSMOS.gold, 'mono')
        .glow(8, COSMOS.gold)
        .opacity(a),
      txt(
        'Verify shards & tokenizer · hold budget fixed · can this mix reach 16 / 20?',
        0,
        405,
        32,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-fresh-corpus-predict', () =>
    s.play(predictOn.to(1, { duration: remainDuration(c, 'pt-fresh-corpus-predict', 0.5) })),
  );
  // Strict prediction withholding: move cutoff to 0.90 only in Beat 1!
  c.on('pt-fresh-corpus-move', () => {
    const dur = remainDuration(c, 'pt-fresh-corpus-move', 0.9);
    s.play(cutoff.to(0.9, { duration: dur }));
    s.play(movedReveal.to(1, { duration: dur }));
  });
  c.after('pt-fresh-corpus-fraction', () =>
    s.play(
      fracReveal.to(1, { duration: remainAfterDuration(c, 'pt-fresh-corpus-fraction', 0.45) }),
    ),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.after('pt-fresh-corpus-docs', () =>
    s.play(docsReveal.to(1, { duration: remainAfterDuration(c, 'pt-fresh-corpus-docs', 0.4) })),
  );
  c.after('pt-fresh-corpus-results', () =>
    s.play(codeReveal.to(1, { duration: remainAfterDuration(c, 'pt-fresh-corpus-results', 0.4) })),
  );
  c.after('pt-fresh-corpus-combined', () =>
    s.play(combReveal.to(1, { duration: remainAfterDuration(c, 'pt-fresh-corpus-combined', 0.4) })),
  );
  // Strict prediction withholding: HOLD verdict only after pt-fresh-corpus-hold in Beat 3!
  c.after('pt-fresh-corpus-hold', () =>
    s.play(holdReveal.to(1, { duration: remainAfterDuration(c, 'pt-fresh-corpus-hold', 0.45) })),
  );

  c.onBeat(4, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-fresh-corpus-restore', () =>
    s.play(restoreOn.to(1, { duration: remainDuration(c, 'pt-fresh-corpus-restore', 0.6) })),
  );
  c.on('pt-fresh-corpus-resume', () =>
    s.play(resumeOn.to(1, { duration: remainDuration(c, 'pt-fresh-corpus-resume', 0.6) })),
  );
}
