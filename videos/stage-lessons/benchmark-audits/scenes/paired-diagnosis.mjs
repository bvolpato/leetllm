// Scene 20 (paired-diagnosis): "Which disagreements count in a paired comparison?"
// 100 paired cases sorting into 4 McNemar quadrants -> living exact binomial tails (9/1, 3/1, 5/0) -> Q82..Q88 regressions.
import {
  CASES,
  COSMOS,
  ROLE,
  aura,
  binomialChoose,
  exactPairedP,
  fadeIn,
  fadeOut,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const classify = (r) => (r.A ? (r.B ? 0 : 1) : r.B ? 2 : 3);
const BUCKETS = [0, 1, 2, 3].map((j) => CASES.filter((r) => classify(r) === j));
const BROKEN_IDS = BUCKETS[1].map((r) => r.id); // Q82..Q88

export default function paired(s, c) {
  const phase = s.value(0);
  const showQ93 = s.value(0);
  const sortT = s.value(0);
  const dimShared = s.value(0);
  const showTie = s.value(0);
  const showNull = s.value(0);
  const showCoin = s.value(0);
  const actDist = s.value(0); // 1 = binomial charts, 0 = quadrants
  const distMode = s.value(0); // 0=(9,1), 1=(3,1), 2=(5,0)
  const tailHi0 = s.value(0);
  const showTailMass = s.value(0);
  const showP0 = s.value(0);
  const tailHi1 = s.value(0);
  const showP1 = s.value(0);
  const showAsk5 = s.value(0);
  const tailHi2 = s.value(0);
  const showP2 = s.value(0);
  const showBrokenReturn = s.value(0);

  const bgAura = aura(100, 20, 620, '#14304c36', '#2e1e4820');
  const title = heroTitle(['Which Disagreements Count', 'in a Paired Comparison?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.focus,
    eyebrow: 'EXACT MCNEMAR TEST · DISCORDANT PAIRS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const dActive = actDist.value * fadeOut(showBrokenReturn.value);
    const qOp = fadeOut(actDist.value) + fadeIn(showBrokenReturn.value);
    const dOp = fadeIn(dActive);
    const nodes = [];

    // ACT 1 & ACT 3 (return): 100 paired library cases sorting into 4 quadrants
    if (qOp > 0.02) {
      const clampQ = Math.min(1, qOp);
      const t = sortT.value;
      const easeT = t * t * (3 - 2 * t);
      const dim = dimShared.value;
      const isRet = showBrokenReturn.value > 0.5;

      const quadCenters = [
        [-415, -80], // 0: Both pass (81)
        [415, -80], // 1: A only / broke (7)
        [-415, 165], // 2: B only / fixed (7)
        [415, 165], // 3: Both fail (5)
      ];
      const qNames = ['BOTH PASS', 'A ONLY · BROKE', 'B ONLY · FIXED', 'BOTH FAIL'];
      const qCols = [COSMOS.dim, ROLE.fail, ROLE.pass, COSMOS.dim];

      quadCenters.forEach(([qx, qy], j) => {
        const isShared = j === 0 || j === 3;
        const isFocusBroke = isRet && j === 1;
        const col = isFocusBroke ? ROLE.fail : isShared && dim > 0.5 ? COSMOS.rule : qCols[j];
        nodes.push(
          lumBar(qx, qy, 760, 205, {
            color: col,
            fillOpacity: isFocusBroke ? 0.2 : isShared && dim > 0.5 ? 0.04 : 0.12,
            strokeWidth: isFocusBroke ? 3.2 : 2.0,
            glow: isFocusBroke ? 12 * pulse : isShared ? 2 : 7,
            radius: 12,
            opacity: clampQ,
          }),
          txt(
            showTie.value > 0.5 ? `${qNames[j]}   (${BUCKETS[j].length})` : qNames[j],
            qx,
            qy - 72,
            28,
            isShared && dim > 0.5 ? COSMOS.dim : qCols[j],
            'mono',
          ).opacity(clampQ),
        );
      });

      // Render 100 glowing case dots migrating smoothly from initial 10x10 cloud to quadrant slots
      const bucketIdx = [0, 0, 0, 0];
      CASES.forEach((row, i) => {
        const j = classify(row);
        const posInB = bucketIdx[j]++;
        const startX = -810 + (i % 10) * 18;
        const startY = -245 + Math.floor(i / 10) * 18;
        const [qx, qy] = quadCenters[j];
        const colsInQ = j === 0 ? 18 : 7;
        const dx = qx - (colsInQ - 1) * 18 + (posInB % colsInQ) * 36;
        const dy = qy - 16 + Math.floor(posInB / colsInQ) * 24;
        const cx = startX + (dx - startX) * easeT;
        const cy = startY + (dy - startY) * easeT;
        const isShared = j === 0 || j === 3;
        const dotOp = isShared ? Math.max(0.18, 1 - 0.72 * dim) : 1;
        nodes.push(
          glowDot(cx, cy, {
            radius: isShared ? 5 : 7.5,
            color: qCols[j],
            glow: isShared ? 2 : 10,
            opacity: clampQ * dotOp,
          }),
        );
      });

      // Top/bottom callouts (strictly non-overlapping)
      const exOp = showQ93.value * fadeOut(showNull.value);
      const nuOp = fadeIn(showNull.value);
      if (exOp > 0.02) {
        nodes.push(
          txt('Q93:  A ×   B ✓   ->   1 fix', 415, -248, 34, ROLE.focus, 'mono')
            .glow(7, ROLE.focus)
            .opacity(clampQ * exOp),
        );
      }
      if (nuOp > 0.02) {
        nodes.push(
          txt(
            'Null: independent pairs · equal marginal rates -> P(fix | disagreement) = 1/2',
            415,
            -248,
            26,
            ROLE.A,
            'sans',
          ).opacity(clampQ * nuOp),
        );
      }

      const tieOp = showTie.value * fadeOut(showCoin.value) * fadeOut(showBrokenReturn.value);
      const coinOp = fadeIn(showCoin.value) * fadeOut(showBrokenReturn.value);
      const brkOp = fadeIn(showBrokenReturn.value);

      if (tieOp > 0.02) {
        nodes.push(
          txt('7 fixes - 7 breaks = 0 net passes  (totals tie)', 0, 345, 38, ROLE.focus, 'mono')
            .glow(8, ROLE.focus)
            .opacity(clampQ * tieOp),
        );
      }
      if (coinOp > 0.02) {
        nodes.push(
          txt(
            'Exact McNemar test: fair-coin binomial on the discordant pairs',
            0,
            345,
            34,
            ROLE.A,
            'sans',
          )
            .glow(7, ROLE.A)
            .opacity(clampQ * coinOp),
        );
      }
      if (brkOp > 0.02) {
        nodes.push(
          txt(
            `Retained library regressions: ${BROKEN_IDS[0]} through ${BROKEN_IDS.at(-1)} · inspect before trading off`,
            0,
            345,
            34,
            ROLE.fail,
            'mono',
          )
            .glow(9, ROLE.fail)
            .opacity(clampQ * brkOp),
        );
      }
    }

    // ACT 2: Living exact binomial McNemar distributions (9/1 -> 3/1 -> 5/0)
    if (dOp > 0.02) {
      const m = Math.round(distMode.value);
      const configs = [
        { fix: 9, brk: 1, hi: tailHi0.value, showP: showP0.value },
        { fix: 3, brk: 1, hi: tailHi1.value, showP: showP1.value },
        { fix: 5, brk: 0, hi: tailHi2.value, showP: showP2.value },
      ];
      const cfg = configs[m];
      const n = cfg.fix + cfg.brk;
      const totalSeq = 2 ** n;
      const mass = Array.from({ length: n + 1 }, (_, k) => binomialChoose(n, k));
      const peak = Math.max(...mass);
      const minSide = Math.min(cfg.fix, cfg.brk);
      const maxSide = Math.max(cfg.fix, cfg.brk);
      const oneTail = mass.slice(0, minSide + 1).reduce((a, b) => a + b, 0);
      const pVal = exactPairedP(cfg.fix, cfg.brk);

      nodes.push(
        txt(
          `EXACT BINOMIAL NULL:  ${n} DISAGREEMENTS  (${cfg.fix} FIXES, ${cfg.brk} ${cfg.brk === 1 ? 'BREAK' : 'BREAKS'})`,
          0,
          -225,
          32,
          ROLE.A,
          'mono',
        )
          .glow(6, ROLE.A)
          .opacity(dOp),
      );

      const baseY = 175;
      const maxH = 315;
      const spanW = 1360;
      const leftX = -spanW * 0.5;
      const stepX = spanW / (n + 1);
      const barW = Math.min(110, stepX * 0.68);

      nodes.push(
        rule(leftX - 30, baseY, leftX + spanW + 30, baseY, COSMOS.muted, 2.6).opacity(dOp),
      );

      mass.forEach((ways, k) => {
        const cx = leftX + (k + 0.5) * stepX;
        const h = Math.max(10, (ways / peak) * maxH);
        const isTail = k <= minSide || k >= maxSide;
        const lit = isTail && cfg.hi > 0.3;
        const col = lit ? ROLE.focus : ROLE.B;
        nodes.push(
          lumBar(cx, baseY - h * 0.5 - 2, barW, h, {
            color: col,
            fillOpacity: lit ? 0.65 : 0.24,
            strokeWidth: lit ? 3.0 : 2.0,
            glow: lit ? 12 * pulse : 5,
            radius: 6,
            opacity: dOp,
          }),
          txt(String(k), cx, baseY + 34, 28, lit ? ROLE.focus : COSMOS.muted, 'mono').opacity(dOp),
          txt(String(ways), cx, baseY - h - 26, 26, lit ? ROLE.focus : COSMOS.dim, 'mono').opacity(
            dOp,
          ),
        );
      });

      nodes.push(
        txt(
          'Number of fixes k among fair-coin sequences (height = binomial count)',
          0,
          baseY + 80,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(dOp),
      );

      // Strictly gated p-value / prediction prompt below the chart
      if (m === 0) {
        const tmOp = showTailMass.value * fadeOut(cfg.showP);
        const pOp = fadeIn(cfg.showP);
        if (tmOp > 0.02) {
          nodes.push(
            txt(`One tail = (1 + 10) / ${totalSeq} = 11 / 1024`, 0, 355, 38, ROLE.focus, 'mono')
              .glow(7, ROLE.focus)
              .opacity(dOp * tmOp),
          );
        }
        if (pOp > 0.02) {
          nodes.push(
            txt(
              `Two-sided exact p = 2 × 11 / 1024 = ${pVal.toFixed(4)}  (< 0.05)`,
              0,
              355,
              40,
              ROLE.pass,
              'mono',
            )
              .glow(9, ROLE.pass)
              .opacity(dOp * pOp),
          );
        }
      } else if (m === 1) {
        if (cfg.showP > 0.02) {
          nodes.push(
            txt(
              `Two-sided exact p = 2 × ${oneTail} / ${totalSeq} = ${pVal.toFixed(3)}  (noisy split)`,
              0,
              355,
              40,
              ROLE.accent,
              'mono',
            )
              .glow(8, ROLE.accent)
              .opacity(dOp * cfg.showP),
          );
        }
      } else if (m === 2) {
        const askOp = showAsk5.value * fadeOut(cfg.showP);
        const pOp = fadeIn(cfg.showP);
        if (askOp > 0.02) {
          nodes.push(
            txt('5 fixes, 0 breaks: does exact p fall below 0.05?', 0, 355, 40, ROLE.focus, 'serif')
              .glow(8, ROLE.focus)
              .opacity(dOp * askOp),
          );
        }
        if (pOp > 0.02) {
          nodes.push(
            txt(
              `Two-sided exact p = 2 / 32 = ${pVal.toFixed(4)}  (> 0.05 -> misses cutoff!)`,
              0,
              355,
              40,
              ROLE.fail,
              'mono',
            )
              .glow(9, ROLE.fail)
              .opacity(dOp * pOp),
          );
        }
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'one-fix', showQ93, 1, { duration: 0.4 });
  tweenCue(s, c, 'sort-pairs', sortT, 1, { duration: 1.25 });
  tweenCue(s, c, 'shared-cases', dimShared, 1, { duration: 0.45 });
  tweenCue(s, c, 'library-tie', showTie, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'paired-null', showNull, 1, { duration: 0.45 });
  tweenCue(s, c, 'coin-null', showCoin, 1, { duration: 0.45, after: true });
  c.on('new-ten', () => {
    s.play(actDist.to(1, { duration: 0.5 }));
    s.play(distMode.to(0, { duration: 0.05 }));
  });
  tweenCue(s, c, 'two-tails', tailHi0, 1, { duration: 0.45 });
  tweenCue(s, c, 'tail-count', showTailMass, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'nine-one-result', showP0, 1, { duration: 0.45, after: true });
  c.on('new-four', () => {
    s.play(distMode.to(1, { duration: 0.05 }));
  });
  tweenCue(s, c, 'four-tails', tailHi1, 1, { duration: 0.45 });
  tweenCue(s, c, 'three-one-result', showP1, 1, { duration: 0.45, after: true });
  c.on('new-five', () => {
    s.play(distMode.to(2, { duration: 0.05 }));
  });
  tweenCue(s, c, 'five-ask', showAsk5, 1, { duration: 0.4 });
  tweenCue(s, c, 'five-tails', tailHi2, 1, { duration: 0.45 });
  tweenCue(s, c, 'five-result', showP2, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'broken-file', showBrokenReturn, 1, { duration: 0.55 });
}
