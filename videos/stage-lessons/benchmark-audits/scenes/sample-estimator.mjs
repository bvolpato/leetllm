// Scene 14 (sample-estimator): "What happens if we mix samples from different problems?"
// 2-try outcome lattice -> 100-program without-replacement pass@10 -> cross-problem pooling bug (0.500 vs 0.786).
import { delay, par, to } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  binomialChoose,
  fadeIn,
  fadeOut,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  subsetCoverage,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const N_POOL = 100;
const C_PASS = 20;
const K_DRAW = 10;
const PLUG_IN = 1 - (1 - C_PASS / N_POOL) ** K_DRAW; // 0.8926
const UNBIASED = subsetCoverage(N_POOL, C_PASS, K_DRAW); // 0.9049
const POOLED_WRONG = subsetCoverage(8, 4, 2); // 0.786
const SIX_PAIRS = binomialChoose(4, 2);
const ALL_PAIRS = binomialChoose(8, 2);

verifyInvariant(SIX_PAIRS * 2 + 16 === ALL_PAIRS, '6 + 6 + 16 = 28 pooled pairs');

export default function estimator(s, c) {
  const phase = s.value(0);
  const showPairs = s.value(0);
  const showBothMiss = s.value(0);
  const showThreePass = s.value(0);
  const showRate = s.value(0);
  const actPool = s.value(0);
  const showPlug = s.value(0);
  const showSubset = s.value(0);
  const removedCount = s.value(0); // 0 -> 1 -> 9
  const showSubEst = s.value(0);
  const actMix = s.value(0);
  const showAsk = s.value(0);
  const showOwn = s.value(0);
  const showMean = s.value(0);
  const showCross = s.value(0);
  const showBad = s.value(0);

  const bgAura = aura(180, 20, 620, '#14364836', '#331d4420');
  const title = heroTitle(['Estimate Without Replacement,', 'One Problem at a Time'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'UNBIASED PASS@K · HYPERGEOMETRIC SAMPLING',
  });

  // Glowing MathJax formulas controlled via clean opacity tweens
  const failPowTex = glowTex('(1 - p)^k', { x: 360, y: -115, size: 64, color: ROLE.focus }).opacity(
    0,
  );
  const atLeastTex = glowTex('1 - (1 - p)^k', {
    x: 360,
    y: -115,
    size: 64,
    color: ROLE.pass,
  }).opacity(0);
  const subsetTex = glowTex('1 - \\frac{\\binom{n - c}{k}}{\\binom{n}{k}}', {
    x: 380,
    y: -145,
    size: 56,
    color: ROLE.pass,
  }).opacity(0);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const pool = actPool.value;
    const mix = actMix.value;

    const act1Op = fadeOut(pool) * fadeOut(mix);
    const act2Op = fadeIn(pool) * fadeOut(mix);
    const act3Op = fadeIn(mix);
    const nodes = [];

    // ACT 1: Two independent tries (4 equally likely outcomes)
    if (act1Op > 0.02) {
      const outcomes = [
        ['Pass', 'Pass', true],
        ['Pass', 'Miss', true],
        ['Miss', 'Pass', true],
        ['Miss', 'Miss', false],
      ];
      nodes.push(
        txt('TWO INDEPENDENT TRIES (p = 0.5)', -465, -210, 28, ROLE.A, 'mono').opacity(act1Op),
        txt('TRY 1', -580, -145, 26, COSMOS.muted, 'mono').opacity(act1Op),
        txt('TRY 2', -350, -145, 26, COSMOS.muted, 'mono').opacity(act1Op),
        // Right-side probability budget ribbon visible from t=0 (fills right half cleanly)
        txt('SINGLE-ATTEMPT PROBABILITY SPLIT', 360, -210, 28, ROLE.A, 'mono').opacity(act1Op),
        lumBar(205, 295, 300, 62, {
          color: ROLE.pass,
          fillOpacity: 0.34,
          strokeWidth: 2.2,
          glow: 8,
          radius: 8,
          opacity: act1Op,
        }),
        txt('Pass: p = 0.5', 205, 295, 28, ROLE.pass, 'mono').opacity(act1Op),
        lumBar(515, 295, 300, 62, {
          color: ROLE.fail,
          fillOpacity: 0.24,
          strokeWidth: 2.2,
          glow: 7,
          radius: 8,
          opacity: act1Op,
        }),
        txt('Miss: 1 - p = 0.5', 515, 295, 28, ROLE.fail, 'mono').opacity(act1Op),
      );
      outcomes.forEach(([t1, t2, hasPass], i) => {
        const cy = -72 + i * 96;
        const isLast = i === 3;
        const rowCol =
          isLast && showBothMiss.value > 0.3 ? ROLE.fail : hasPass ? ROLE.pass : COSMOS.dim;
        nodes.push(
          lumBar(-465, cy, 480, 74, {
            color: rowCol,
            fillOpacity: isLast && showBothMiss.value > 0.3 ? 0.24 : 0.14,
            strokeWidth: isLast && showBothMiss.value > 0.3 ? 3.0 : 2.0,
            glow: isLast && showBothMiss.value > 0.3 ? 11 * pulse : 5,
            radius: 10,
            opacity: act1Op * (0.4 + 0.6 * showPairs.value),
          }),
          txt(t1, -580, cy, 34, t1 === 'Pass' ? ROLE.pass : COSMOS.muted, 'mono').opacity(
            act1Op * (0.4 + 0.6 * showPairs.value),
          ),
          txt(t2, -350, cy, 34, t2 === 'Pass' ? ROLE.pass : COSMOS.muted, 'mono').opacity(
            act1Op * (0.4 + 0.6 * showPairs.value),
          ),
        );
      });

      if (showBothMiss.value > 0.02 && showRate.value < 0.5) {
        nodes.push(
          txt('Both miss:  1 / 4', 360, -25, 42, ROLE.fail, 'mono')
            .glow(7, ROLE.fail)
            .opacity(act1Op * showBothMiss.value * fadeOut(showRate.value)),
        );
      }
      if (showThreePass.value > 0.02) {
        nodes.push(
          txt('At least one pass:  3 / 4', 360, 75, 42, ROLE.pass, 'mono')
            .glow(8, ROLE.pass)
            .opacity(act1Op * showThreePass.value),
        );
      }
      if (showRate.value > 0.02) {
        nodes.push(
          txt(
            'p = per-attempt pass probability · k independent draws',
            360,
            180,
            28,
            ROLE.A,
            'sans',
          ).opacity(act1Op * showRate.value),
        );
      }
    }

    // ACT 2: 10x10 pool (n=100, c=20, k=10) comparing plug-in vs without-replacement subset estimate
    if (act2Op > 0.02) {
      const rem = Math.round(removedCount.value);
      const gLeft = -815;
      const gTop = -165;
      const step = 54;

      nodes.push(
        txt(
          `POOL:  n = ${N_POOL} PROGRAMS  (${C_PASS} PASS, 80 FAIL)`,
          gLeft + 245,
          -225,
          26,
          ROLE.A,
          'mono',
        ).opacity(act2Op),
      );
      for (let i = 0; i < N_POOL; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const isPass = i < C_PASS;
        const isRemoved = i >= N_POOL - rem;
        const cx = gLeft + col * step + 22;
        const cy = gTop + row * step + 22;
        nodes.push(
          lumBar(cx, cy, 42, 42, {
            color: isRemoved ? COSMOS.rule : isPass ? ROLE.pass : COSMOS.dim,
            fillOpacity: isRemoved ? 0.05 : isPass ? 0.62 : 0.24,
            strokeWidth: isRemoved ? 1.2 : 1.8,
            glow: isPass ? 8 : 2,
            radius: 5,
            opacity: act2Op * (isRemoved ? 0.25 : 1),
          }),
        );
      }

      // Right readouts: Plug-in -> Without-replacement chain -> Unbiased estimate
      const plugOp = fadeOut(showSubset.value);
      const subOp = fadeIn(showSubset.value);

      if (plugOp > 0.02) {
        nodes.push(
          txt('PLUG-IN SHORTCUT  (WITH REPLACEMENT)', 380, -35, 26, ROLE.focus, 'mono').opacity(
            act2Op * plugOp,
          ),
          txt('1 - (1 - 20/100)^10', 380, 32, 42, COSMOS.ink, 'mono').opacity(act2Op * plugOp),
        );
        if (showPlug.value > 0.02) {
          nodes.push(
            txt(
              `Plug-in pass@10 = ${PLUG_IN.toFixed(4)}  (biased low)`,
              380,
              125,
              34,
              ROLE.accent,
              'mono',
            )
              .glow(8, ROLE.accent)
              .opacity(act2Op * plugOp * showPlug.value),
          );
        }
      }

      if (subOp > 0.02) {
        const chain =
          rem >= 9
            ? '80/100 × 79/99 × ... × 71/91'
            : rem >= 1
              ? '80/100 × 79/99 × ...'
              : 'P(all fail) = 80/100 × ...';
        const remNote =
          rem >= 9
            ? 'After 9 misses: 71 failures left among 91 programs'
            : rem >= 1
              ? 'After 1 miss: 79 failures left among 99 programs'
              : 'Remove each drawn index from the pool';
        nodes.push(
          txt(chain, 380, 28, 36, ROLE.A, 'mono').opacity(act2Op * subOp),
          txt(remNote, 380, 96, 26, COSMOS.muted, 'sans').opacity(act2Op * subOp),
        );
        if (showSubEst.value > 0.02) {
          nodes.push(
            txt(`Unbiased pass@10 = ${UNBIASED.toFixed(4)}`, 380, 195, 42, ROLE.pass, 'mono')
              .glow(10 * pulse, ROLE.pass)
              .opacity(act2Op * subOp * showSubEst.value),
            txt(
              `Plug-in ${PLUG_IN.toFixed(4)} vs Unbiased ${UNBIASED.toFixed(4)}`,
              380,
              258,
              26,
              COSMOS.muted,
              'mono',
            ).opacity(act2Op * subOp * showSubEst.value),
          );
        }
      }
    }

    // ACT 3: Problem X (4/4 pass) vs Problem Y (0/4 fail) -> pooling creates 16 impossible cross-problem pairs
    if (act3Op > 0.02) {
      const cross = showCross.value;
      const ownOp = fadeOut(cross);
      const crOp = fadeIn(cross);

      if (ownOp > 0.02) {
        nodes.push(
          txt('PROBLEM X (4/4 PASS)', -450, -165, 30, ROLE.pass, 'mono').opacity(act3Op * ownOp),
          txt('PROBLEM Y (0/4 FAIL)', 450, -165, 30, ROLE.fail, 'mono').opacity(act3Op * ownOp),
          lumBar(0, 175, 1460, 210, {
            color: showMean.value > 0.3 ? ROLE.pass : COSMOS.muted,
            fillOpacity: 0.09,
            strokeWidth: 2.0,
            glow: 5,
            radius: 14,
            opacity: act3Op * ownOp,
          }),
        );
        for (let i = 0; i < 4; i++) {
          nodes.push(
            lumBar(-660 + i * 140, -55, 116, 76, {
              color: ROLE.pass,
              fillOpacity: 0.28,
              strokeWidth: 2.6,
              glow: 9,
              radius: 10,
              opacity: act3Op * ownOp,
            }),
            txt(`X${i + 1} ✓`, -660 + i * 140, -55, 32, ROLE.pass, 'mono').opacity(act3Op * ownOp),
            lumBar(240 + i * 140, -55, 116, 76, {
              color: ROLE.fail,
              fillOpacity: 0.24,
              strokeWidth: 2.6,
              glow: 9,
              radius: 10,
              opacity: act3Op * ownOp,
            }),
            txt(`Y${i + 1} ×`, 240 + i * 140, -55, 32, ROLE.fail, 'mono').opacity(act3Op * ownOp),
          );
        }

        const askOp = (0.35 + 0.65 * showAsk.value) * fadeOut(showOwn.value);
        const ownRevOp = fadeIn(showOwn.value);
        if (askOp > 0.02) {
          nodes.push(
            txt(
              'Can a program written for X count on a request for Y?',
              0,
              175,
              38,
              ROLE.focus,
              'serif',
            )
              .glow(8, ROLE.focus)
              .opacity(act3Op * ownOp * askOp),
          );
        }
        if (ownRevOp > 0.02) {
          nodes.push(
            txt(
              'X: 6/6 pairs pass (1.0)     ·     Y: 0/6 pairs pass (0.0)',
              0,
              130,
              34,
              COSMOS.ink,
              'mono',
            ).opacity(act3Op * ownOp * ownRevOp),
          );
        }
        if (showMean.value > 0.02) {
          nodes.push(
            txt('Per-problem mean pass@2 = (1.0 + 0.0) / 2 = 0.500', 0, 222, 40, ROLE.pass, 'mono')
              .glow(9, ROLE.pass)
              .opacity(act3Op * ownOp * showMean.value),
          );
        }
      }

      if (crOp > 0.02) {
        nodes.push(
          txt('16 IMPOSSIBLE CROSS-PROBLEM PAIRS', -365, -210, 28, ROLE.fail, 'mono')
            .glow(7, ROLE.fail)
            .opacity(act3Op * crOp),
        );
        for (let r = 0; r < 4; r++) {
          for (let col = 0; col < 4; col++) {
            const cx = -635 + col * 180;
            const cy = -110 + r * 92;
            nodes.push(
              lumBar(cx, cy, 158, 70, {
                color: ROLE.fail,
                fillOpacity: 0.2,
                strokeWidth: 2.2,
                glow: 7,
                radius: 8,
                opacity: act3Op * crOp,
              }),
              txt(`X${r + 1} · Y${col + 1}`, cx, cy, 28, ROLE.fail, 'mono').opacity(act3Op * crOp),
            );
          }
        }

        nodes.push(
          txt('CORRECT PER-PROBLEM', 445, -100, 26, ROLE.pass, 'mono').opacity(act3Op * crOp),
          txt('0.500', 445, -35, 58, ROLE.pass, 'mono')
            .glow(8, ROLE.pass)
            .opacity(act3Op * crOp),
          txt('POOLED ESTIMATE', 445, 90, 26, ROLE.fail, 'mono').opacity(act3Op * crOp),
        );
        if (showBad.value > 0.02) {
          nodes.push(
            txt(`22 / 28 = ${POOLED_WRONG.toFixed(3)}`, 445, 165, 48, ROLE.fail, 'mono')
              .glow(10 * pulse, ROLE.fail)
              .opacity(act3Op * crOp * showBad.value),
          );
        }
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live, failPowTex, atLeastTex, subsetTex);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'two-tries', showPairs, 1, { duration: 0.4 });
  tweenCue(s, c, 'both-miss', showBothMiss, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'three-pass', showThreePass, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'true-rate', showRate, 1, { duration: 0.4 });
  c.on('all-fail', () => {
    s.play(to(failPowTex, (n) => n.opacity(1), { duration: 0.4 }));
  });
  c.on('at-least-one', () => {
    s.play(
      par(
        to(failPowTex, (n) => n.opacity(0), { duration: 0.22 }),
        delay(
          to(atLeastTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.24,
        ),
      ),
    );
  });
  c.on('observed-pool', () => {
    s.play(actPool.to(1, { duration: 0.5 }));
  });
  tweenCue(s, c, 'plug-estimate', showPlug, 1, { duration: 0.45, after: true });
  c.on('without-replacement', () => {
    s.play(
      par(
        to(atLeastTex, (n) => n.opacity(0), { duration: 0.22 }),
        delay(
          to(subsetTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.24,
        ),
        showSubset.to(1, { duration: 0.45 }),
      ),
    );
  });
  tweenCue(s, c, 'second-draw', removedCount, 1, { duration: 0.35 });
  tweenCue(s, c, 'last-draw', removedCount, 9, { duration: 0.55 });
  tweenCue(s, c, 'subset-estimate', showSubEst, 1, { duration: 0.45, after: true });
  c.on('two-problems', () => {
    s.play(
      par(
        to(subsetTex, (n) => n.opacity(0), { duration: 0.22 }),
        actMix.to(1, { duration: 0.5 }),
      ),
    );
  });
  tweenCue(s, c, 'mix-ask', showAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'own-pairs', showOwn, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'mean-score', showMean, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'pooled-pairs', showCross, 1, { duration: 0.5 });
  tweenCue(s, c, 'bad-pool', showBad, 1, { duration: 0.45, after: true });
}
