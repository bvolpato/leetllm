// Act 4 (Scenes 17-21): Sampling Error Swarm, Paired vs Unpaired Rate Gap,
// Staffing Decisions (Strict vs Broad), Improved Detector Payoff, and Fresh Batch Transfer Test.
import { circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  REPEATED_200,
  REPEATED_50,
  ROLE,
  changedQueue,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  freshCapacity,
  freshQueue,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  mix,
  neonCurve,
  queuePackets,
  rule,
  scaleTrack,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 17. sampling-error: The rate changes even when the system does not
// Cues: repeat-evaluations, sample-size
// ---------------------------------------------------------------------------
export function samplingError(s, c) {
  const repP = s.value(0);
  const sizeP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 17 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#ffd16612'));

  const headline = heroTitle(['Sampling Noise', '& Sample Size'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.clean,
    eyebrow: 'FIXED TRUE RATE  p = 80%',
  });

  const live = dynamic(() => {
    const rp = repP.value;
    const sz = sizeP.value;
    const nodes = [];

    const x0 = -760;
    const x1 = 760;
    const y50 = -55;
    const y200 = 175;
    const xOf = (r) => mix(x0, x1, (r - 0.55) / 0.45);
    const se50 = Math.sqrt((0.8 * 0.2) / 50); // 0.0566
    const se200 = Math.sqrt((0.8 * 0.2) / 200); // 0.0283

    // True rate vertical reference line at 80%
    nodes.push(
      line([xOf(0.8), -170], [xOf(0.8), 295], { stroke: ROLE.posterior, width: 3, dash: [10, 8] }),
      txt('True p = 80%', xOf(0.8), -205, 28, ROLE.posterior, 'mono'),
    );

    // Row 1: n = 50 repeated evaluations (60 dots + 2-SE band ±11.3%)
    const band50L = xOf(0.8 - 2 * se50);
    const band50R = xOf(0.8 + 2 * se50);
    nodes.push(
      txt('n = 50 CASES  ·  SE = 5.7%', x0, y50 - 75, 28, ROLE.clean, 'mono', 'left'),
      txt('±2 SE ≈ ±11.3%', x1, y50 - 75, 28, ROLE.clean, 'mono', 'right'),
      rect(band50R - band50L, 64, {
        fill: '#5ce1e61e',
        stroke: ROLE.clean,
        width: 2,
        radius: 10,
      }).at((band50L + band50R) / 2, y50),
      line([x0, y50], [x1, y50], { stroke: '#3c4e7a', width: 2 }),
    );
    const count50 = Math.max(4, Math.round(60 * Math.max(0.25, rp)));
    for (let i = 0; i < count50; i++) {
      const rate = REPEATED_50[i];
      const jitter = ((i % 5) - 2) * 11;
      nodes.push(
        glowDot(xOf(rate), y50 + jitter, {
          radius: 6.5,
          color: ROLE.clean,
          glow: 8,
          opacity: 0.92,
        }),
      );
    }

    // Row 2: n = 200 (4× cases -> half the standard error!)
    if (sz > 0.05) {
      const band200L = xOf(0.8 - 2 * se200);
      const band200R = xOf(0.8 + 2 * se200);
      nodes.push(
        group(
          txt('n = 200 (4×)  ·  SE = 2.8%', x0, y200 - 75, 28, ROLE.improved, 'mono', 'left'),
          txt('Half the spread', x1, y200 - 75, 28, ROLE.improved, 'mono', 'right'),
          rect(band200R - band200L, 64, {
            fill: '#6ee7b722',
            stroke: ROLE.improved,
            width: 2.2,
            radius: 10,
          }).at((band200L + band200R) / 2, y200),
          line([x0, y200], [x1, y200], { stroke: '#3c4e7a', width: 2 }),
          ...REPEATED_200.map((rate, i) =>
            glowDot(xOf(rate), y200 + ((i % 5) - 2) * 10, {
              radius: 6,
              color: ROLE.improved,
              glow: 8,
            }),
          ),
        ).opacity(sz),
      );
    }

    // Axis ticks & formula
    [0.6, 0.7, 0.8, 0.9, 1.0].forEach((tick) => {
      nodes.push(txt(`${Math.round(tick * 100)}%`, xOf(tick), 335, 26, COSMOS.muted, 'mono'));
    });
    nodes.push(
      glowTex('\\mathrm{SE} = \\sqrt{\\frac{p(1 - p)}{n}}', {
        x: 540,
        y: -355,
        size: 46,
        color: ROLE.posterior,
      }),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'repeat-evaluations', repP, 1, { dur: 1.1 });
  cueTo(s, c, 'sample-size', sizeP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 18. rate-gap: The comparison has its own sampling noise
// Cues: gap-noise, paired-cases, paired-new, paired-old, paired-fail, paired-cancel,
//       planning-first, planning-count
// ---------------------------------------------------------------------------
export function rateGap(s, c) {
  const gapP = s.value(0);
  const pairP = s.value(0);
  const newP = s.value(0);
  const oldP = s.value(0);
  const failP = s.value(0);
  const cancelP = s.value(0);
  const plan1P = s.value(0);
  const plan2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.likelihood, seed: 18 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1e', '#5ce1e614'));

  const headline = heroTitle(['Comparing Two', 'Models Fairly'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.likelihood,
    eyebrow: 'INDEPENDENT VS PAIRED EVALUATIONS',
  });

  // View 1: Independent sets (42/50 vs 40/50 -> +4pp ± 15pp)
  const view1 = guardedDynamic(
    () => fadeOut(pairP.value),
    (vis) => {
      const gp = gapP.value;
      const nodes = [];
      const x0 = -760;
      const barW = 1100;

      nodes.push(
        txt(
          'SEPARATE 50-CASE SETS:  42/50 (84%)  vs  40/50 (80%)',
          x0,
          -200,
          28,
          ROLE.clean,
          'mono',
          'left',
        ),
        txt('New model: 84%', x0, -105, 30, ROLE.improved, 'mono', 'left'),
        scaleTrack(x0 + 320, -105, barW, 44, { stroke: ROLE.improved }),
        glowBar(x0 + 320, -105, barW * 0.84, 44, ROLE.improved, { glow: 9 }),

        txt('Old model: 80%', x0, -15, 30, ROLE.clean, 'mono', 'left'),
        scaleTrack(x0 + 320, -15, barW, 44, { stroke: ROLE.clean }),
        glowBar(x0 + 320, -15, barW * 0.8, 44, ROLE.clean, { glow: 9 }),
      );

      const cx = 0;
      const cy = 175;
      const pxPerPt = 24;
      const halfW = 15.3 * pxPerPt * Math.max(0.25, gp);
      nodes.push(
        group(
          txt(
            gp > 0.1
              ? 'INDEPENDENT DIFFERENCE:  +4.0%   (±2 SE ≈ ±15.3%)'
              : 'DIFFERENCE AXIS  (NEW − OLD,  50 INDEPENDENT CASES)',
            x0,
            95,
            28,
            gp > 0.1 ? ROLE.warning : COSMOS.dim,
            'mono',
            'left',
          ),
          line([-460, cy], [460, cy], { stroke: '#3c4e7a', width: 2.5 }),
          line([0, cy - 34], [0, cy + 34], { stroke: ROLE.abuse, width: 3, dash: [6, 5] }),
          txt('0% (tie)', 0, cy + 64, 26, ROLE.abuse, 'mono'),
          rect(halfW * 2, 24, {
            fill: '#fb923c33',
            stroke: ROLE.warning,
            width: 2.2,
            radius: 12,
          }).at(4 * pxPerPt, cy),
          glowDot(4 * pxPerPt, cy, { radius: 12, color: ROLE.posterior, glow: 14 }),
          txt('+4%', 4 * pxPerPt, cy - 42, 28, ROLE.posterior, 'mono'),
          txt(
            gp > 0.1
              ? 'Zero sits deep inside the noise band'
              : 'Is +4% real signal or sampling noise?',
            0,
            295,
            32,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(mix(0.45, 1, gp)),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Matched 50 paired outcomes (39 agree pass, 7 agree fail, 3 new-only, 1 old-only)
  const view2 = guardedDynamic(
    () => fadeIn(pairP.value) * fadeOut(plan1P.value),
    (vis) => {
      const nw = newP.value;
      const ol = oldP.value;
      const fl = failP.value;
      const cn = cancelP.value;
      const nodes = [];

      nodes.push(
        txt('SAME 50 CASES PAIRED SIDE BY SIDE', -855, -210, 28, ROLE.likelihood, 'mono', 'left'),
      );

      const groups = [
        {
          label: 'Both pass',
          count: 39,
          x: -620,
          col: COSMOS.dim,
          fade: cn > 0.2 ? 0.22 : 1,
          show: 1,
        },
        { label: 'Only New', count: 3, x: -160, col: ROLE.improved, fade: 1, show: nw },
        { label: 'Only Old', count: 1, x: 220, col: ROLE.abuse, fade: 1, show: ol },
        {
          label: 'Both fail',
          count: 7,
          x: 600,
          col: COSMOS.dim,
          fade: cn > 0.2 ? 0.22 : 1,
          show: fl,
        },
      ];

      groups.forEach((g) => {
        const r = Math.max(46, Math.sqrt(g.count) * 26);
        if (g.show < 0.05) {
          nodes.push(
            circle(r, { fill: '#0b1222', stroke: '#2c3d64', width: 2, dash: [8, 6] })
              .at(g.x, 10)
              .opacity(0.5),
            txt(g.label, g.x, 195, 28, COSMOS.dim, 'sans').opacity(0.6),
          );
          return;
        }
        nodes.push(
          group(
            circle(r, { fill: '#12192e', stroke: g.col, width: 3.2 }).at(g.x, 10).glow(8, g.col),
            txt(String(g.count), g.x, 10, 48, g.col, 'mono'),
            txt(g.label, g.x, 195, 28, g.col, 'sans'),
          ).opacity(g.show * g.fade),
        );
      });

      if (cn > 0.1) {
        nodes.push(
          txt(
            '46 agreeing pairs cancel · Only 3 vs 1 discordant cases swing the +4% gap',
            0,
            295,
            32,
            ROLE.posterior,
            'serif',
          )
            .glow(6, ROLE.posterior)
            .opacity(cn),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 3: Planning curve n ∝ 1 / delta^2 (2pp -> 3,200; 1pp -> 12,800)
  const view3 = guardedDynamic(
    () => fadeIn(plan1P.value),
    (vis) => {
      const p2 = plan2P.value;
      const nodes = [];
      const x0 = -740;
      const y0 = 240;

      nodes.push(
        txt(
          'SAMPLE-SIZE PLANNING  (2 SE ≤ TARGET GAP Δ, NEAR p = 80%)',
          x0,
          -205,
          28,
          ROLE.posterior,
          'mono',
          'left',
        ),
        txt('Target gap Δ = 2%  →  3,200 cases / model', x0, -90, 34, ROLE.clean, 'mono', 'left'),
        scaleTrack(x0, -25, 1440, 46, { stroke: ROLE.clean }),
        glowBar(x0, -25, 1440 * 0.25, 46, ROLE.clean, { glow: 10 }),
      );

      nodes.push(
        group(
          txt(
            p2 > 0.05
              ? 'Target gap Δ = 1% (half)  →  12,800 cases / model (4×)'
              : 'Target gap Δ = 1% (half)  →  ? cases / model',
            x0,
            85,
            34,
            p2 > 0.05 ? ROLE.warning : COSMOS.dim,
            'mono',
            'left',
          ),
          scaleTrack(x0, 150, 1440, 46, { stroke: p2 > 0.05 ? ROLE.warning : '#2b3b60' }),
          glowBar(x0, 150, 1440 * Math.max(0.25, p2), 46, p2 > 0.05 ? ROLE.warning : '#2b3b60', {
            glow: p2 > 0.05 ? 11 : 0,
          }),
          glowTex('n \\propto \\frac{1}{\\Delta^2}', {
            x: 560,
            y: 280,
            size: 52,
            color: p2 > 0.05 ? ROLE.posterior : COSMOS.dim,
          }),
        ).opacity(mix(0.48, 1, p2)),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'gap-noise', gapP, 1, { dur: 0.8 });
  cueTo(s, c, 'paired-cases', pairP, 1, { dur: 0.85 });
  cueTo(s, c, 'paired-new', newP, 1, { dur: 0.6 });
  cueTo(s, c, 'paired-old', oldP, 1, { dur: 0.6 });
  cueTo(s, c, 'paired-fail', failP, 1, { dur: 0.6 });
  cueTo(s, c, 'paired-cancel', cancelP, 1, { dur: 0.75 });
  cueTo(s, c, 'planning-first', plan1P, 1, { dur: 0.85 });
  cueTo(s, c, 'planning-count', plan2P, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 19. decisions: Which threshold can the team staff?
// Cues: strict-removal, policy-prediction, policy-choice*
// ---------------------------------------------------------------------------
export function decisions(s, c) {
  const remP = s.value(0);
  const predP = s.value(0);
  const choiceP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warning, seed: 19 }));
  s.add(decorAura(-220, 40, 520, '#fb923c1e', '#ff6b8b14'));

  const headline = heroTitle(['Precision, Recall', '& Review Capacity'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warning,
    eyebrow: 'STAFFING LIMIT:  200 REVIEW SLOTS',
  });

  const live = dynamic(() => {
    const rm = remP.value;
    const pr = predP.value;
    const ch = choiceP.value;
    const nodes = [];

    const rx = -810;
    const ry = -35;
    const rw = 1620;
    const rh = 90;
    const capX = rx + (200 / 590) * rw;

    // 200-slot capacity vertical laser
    nodes.push(
      line([capX, ry - 110], [capX, ry + 135], {
        stroke: ROLE.warning,
        width: 3.5,
        dash: [10, 7],
      }).glow(9, ROLE.warning),
      txt('200-slot capacity', capX + 18, ry - 115, 28, ROLE.warning, 'mono', 'left'),
      scaleTrack(rx, ry, rw, rh, { stroke: '#3a4d78', radius: 12 }),
    );

    // Packets: kept packets stay in tray (80 abuse + 99 clean = 179); removed packets drop down
    let keptCursor = rx;
    let dropCursor = rx + 260;
    for (const pkt of queuePackets) {
      const w = (pkt.count / 590) * rw;
      const col = pkt.abusive ? ROLE.abuse : ROLE.clean;
      if (pkt.kept) {
        nodes.push(
          rect(Math.max(8, w - 4), rh - 12, { fill: col, stroke: '#070910', width: 2, radius: 7 })
            .at(keptCursor + w / 2, ry)
            .glow(7, col),
        );
        keptCursor += w;
      } else {
        const tx = mix(keptCursor + w / 2, dropCursor + w / 2, rm);
        const ty = mix(ry, ry + 200, rm);
        nodes.push(
          rect(Math.max(8, w - 4), rh - 18, { fill: col, stroke: '#070910', width: 2, radius: 7 })
            .at(tx, ty)
            .opacity(Math.max(0.32, 1 - rm * 0.55)),
        );
        keptCursor += w * (1 - rm);
        dropCursor += w;
      }
    }

    if (rm > 0.3) {
      nodes.push(
        txt(
          'Released outside review: 396 clean + 15 abusive',
          rx + 260,
          ry + 265,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    const activeTotal = Math.round(mix(590, 179, rm));
    const activeAbuse = Math.round(mix(95, 80, rm));
    const activePrec = ((activeAbuse / activeTotal) * 100).toFixed(1);
    nodes.push(
      txt(
        `Active queue: ${activeTotal} signups (${activeAbuse} abusive · ${activePrec}% precision)`,
        rx,
        ry - 175,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
    );

    if (ch > 0.05) {
      nodes.push(
        group(
          txt('STRICT QUEUE FITS (179 ≤ 200)', rx, 325, 38, ROLE.improved, 'mono', 'left').glow(
            10,
            ROLE.improved,
          ),
          txt(
            'Tradeoff: 20 abusive signups missed (5 + 15)',
            rx + 760,
            325,
            30,
            ROLE.abuse,
            'sans',
            'left',
          ),
        ).opacity(ch),
      );
    } else if (pr > 0.1) {
      nodes.push(
        txt(
          'Which queue fits 200 slots, and how many abuses are missed?',
          rx,
          325,
          32,
          ROLE.posterior,
          'serif',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'strict-removal', remP, 1, { dur: 1.15 });
  cueTo(s, c, 'policy-prediction', predP, 1, { dur: 0.65 });
  cueTo(s, c, 'policy-choice', choiceP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 20. payoff: One more detector for the original batch
// Cues: improved-prediction, improved-recovery, improved-result*
// ---------------------------------------------------------------------------
export function payoff(s, c) {
  const predP = s.value(0);
  const recP = s.value(0);
  const resP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.improved, seed: 20 }));
  s.add(decorAura(0, 20, 560, '#6ee7b722', '#ffd16612'));

  const headline = heroTitle(['A Better Detector', 'Beats the Tradeoff'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.improved,
    eyebrow: 'KEEP 1% FPR  ·  RESTORE 95% RECALL',
  });

  const live = dynamic(() => {
    const pr = predP.value;
    const rc = recP.value;
    const rs = resP.value;
    const nodes = [];

    const rx = -780;
    const ry = 0;
    const rw = 1500; // scale = 250 slots
    const rh = 96;
    const capX = rx + (200 / 250) * rw;

    const w80 = (80 / 250) * rw;
    const w99 = (99 / 250) * rw;
    const w15 = (15 / 250) * rw;

    nodes.push(
      txt(
        'STRICT QUEUE: 80 ABUSE + 99 CLEAN = 179',
        rx,
        ry - 155,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ),
      line([capX, ry - 105], [capX, ry + 130], {
        stroke: ROLE.warning,
        width: 3.5,
        dash: [10, 7],
      }).glow(9, ROLE.warning),
      txt('200-slot limit', capX + 18, ry - 105, 28, ROLE.warning, 'mono', 'left'),
      scaleTrack(rx, ry, rw, rh, { stroke: '#3a4e7c', radius: 14 }),
      // 80 kept abusive
      glowBar(rx, ry, w80, rh - 10, ROLE.abuse, { glow: 9, radius: 10 }),
      txt('80', rx + w80 / 2, ry, 32, '#070910', 'mono'),
      // 99 kept clean (shifts right smoothly as +15 abusive return)
      glowBar(rx + w80 + 4 + w15 * rc, ry, w99, rh - 10, ROLE.clean, { glow: 8, radius: 10 }),
      txt('99 clean', rx + w80 + 4 + w15 * rc + w99 / 2, ry, 30, '#070910', 'mono'),
    );

    // 15 recovered abusive rows flying back from missed pool into queue!
    const recX = mix(rx + 260, rx + w80 + 2 + w15 / 2, rc);
    const recY = mix(ry + 185, ry, rc);
    nodes.push(
      rect(w15 - 4, rh - 14, { fill: ROLE.improved, stroke: '#070910', width: 2, radius: 8 })
        .at(recX, recY)
        .glow(12, ROLE.improved),
      txt('+15', recX, recY, 28, '#070910', 'mono'),
    );

    if (rs > 0.05) {
      nodes.push(
        group(
          txt(
            'IMPROVED DETECTOR:  194 REVIEWS ≤ 200 SLOTS',
            rx,
            235,
            40,
            ROLE.improved,
            'mono',
            'left',
          ).glow(12, ROLE.improved),
          txt(
            '95 abusive caught · only 5 missed · 49% queue precision',
            rx,
            305,
            30,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(rs),
      );
    } else if (pr > 0.1) {
      nodes.push(
        txt(
          'Can it fit 200 slots and recover all 15 lost abusive signups?',
          rx,
          275,
          34,
          ROLE.posterior,
          'serif',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'improved-prediction', predP, 1, { dur: 0.65 });
  cueTo(s, c, 'improved-recovery', recP, 1, { dur: 1.05 });
  cueTo(s, c, 'improved-result', resP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 21. new-batch: Would you staff this queue? (FINALE TRANSFER TEST)
// Cues: fresh-rates, fresh-population, fresh-true*, fresh-false*, fresh-total*,
//       fresh-slots*, fresh-misses*, fresh-risk*, fresh-rate-change, fresh-extra,
//       fresh-addition*, fresh-fill-spare*, fresh-over*
// ---------------------------------------------------------------------------
export function newBatch(s, c) {
  const ratesP = s.value(0);
  const popP = s.value(0);
  const trueP = s.value(0);
  const falseP = s.value(0);
  const totalP = s.value(0);
  const slotsP = s.value(0);
  const missesP = s.value(0);
  const riskP = s.value(0);
  const changeP = s.value(0);
  const extraP = s.value(0);
  const addP = s.value(0);
  const fillP = s.value(0);
  const overP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 21 }));
  s.add(decorAura(0, 20, 580, '#ffd1661c', '#ff6b8b14'));

  const headline = heroTitle(['Your Turn:', 'Staffing 20,000 Signups'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.posterior,
    eyebrow: '3% ABUSE · 80% RECALL · 900 REVIEW SLOTS',
  });

  const live = dynamic(() => {
    const rt = ratesP.value;
    const pp = popP.value;
    const tr = trueP.value;
    const fl = falseP.value;
    const tot = totalP.value;
    const sl = slotsP.value;
    const ms = missesP.value;
    const rk = riskP.value;
    const ch = changeP.value;
    const ex = extraP.value;
    const ad = addP.value;
    const fi = fillP.value;
    const ov = overP.value;
    const nodes = [];

    const rx = -810;
    const rw = 1620; // scale = 1,050 slots
    const maxScale = 1050;
    const capX = rx + (freshCapacity / maxScale) * rw;

    // Top premises bar (always truthful to current state)
    const fprLabel = ch > 0.3 ? '2.5% FPR (+0.5pp)' : '2.0% FPR';
    nodes.push(
      txt(
        pp > 0.3
          ? `600 abusive · 19,400 clean · 80% recall · ${fprLabel}`
          : `20,000 signups · 3% abuse · 80% recall · ${fprLabel}`,
        rx,
        -215,
        28,
        ch > 0.3 ? ROLE.warning : COSMOS.cyan,
        'mono',
        'left',
      ),
    );

    // 900-slot staffing beam
    const y1 = -40;
    const y2 = 115;
    nodes.push(
      line([capX, -155], [capX, 200], { stroke: ROLE.warning, width: 3.8, dash: [10, 7] }).glow(
        10,
        ROLE.warning,
      ),
      txt('900 slots', capX + 16, -155, 28, ROLE.warning, 'mono', 'left'),
    );

    // Queue 1 (2.0% FPR): 480 red + 388 blue = 868 (32 spare)
    nodes.push(
      txt('QUEUE A  (2.0% CLEAN FPR)', rx, y1 - 68, 26, COSMOS.muted, 'mono', 'left'),
      scaleTrack(rx, y1, rw, 76, { stroke: '#3a4e7c', radius: 12 }),
    );
    const w480 = (freshQueue.tp / maxScale) * rw;
    const w388 = (freshQueue.fp / maxScale) * rw;
    if (tr > 0.05) {
      nodes.push(
        glowBar(rx, y1, w480 * tr, 68, ROLE.abuse, { glow: 10, radius: 10 }),
        txt('480 true flags', rx + w480 / 2, y1, 28, '#070910', 'mono').opacity(tr),
      );
    }
    if (fl > 0.05) {
      nodes.push(
        glowBar(rx + w480 + 3, y1, w388 * fl, 68, ROLE.clean, { glow: 9, radius: 10 }),
        txt('388 false flags', rx + w480 + w388 / 2, y1, 28, '#070910', 'mono').opacity(fl),
      );
    }

    // Readouts for Queue A (each strictly withheld; P5 fadeOut before Queue B rises!)
    const summaryParts = [];
    if (tot > 0.2) summaryParts.push('868 total');
    if (sl > 0.2) summaryParts.push('32 spare');
    if (ms > 0.2) summaryParts.push('120 missed');
    if (rk > 0.2) summaryParts.push('55.3% abusive');
    const qaVis = fadeOut(ch);
    if (summaryParts.length > 0 && qaVis > 0.02) {
      nodes.push(
        txt(summaryParts.join('  ·  '), rx, y1 + 88, 32, ROLE.posterior, 'mono', 'left')
          .glow(8, ROLE.posterior)
          .opacity(qaVis),
      );
    } else if (tr < 0.05 && rt > 0.1 && qaVis > 0.02) {
      nodes.push(
        txt(
          'Does the expected queue fit 900 slots? How many abuses are missed?',
          rx,
          y1 + 110,
          32,
          ROLE.posterior,
          'serif',
          'left',
        ).opacity(qaVis),
      );
    }

    // Queue B (2.5% FPR): +97 clean flags = 965 total (fills 32 spare + spills 65 past 900!)
    const qbVis = fadeIn(ch);
    if (qbVis > 0.02) {
      const wExtra = ((changedQueue.fp - freshQueue.fp) / maxScale) * rw;
      nodes.push(
        group(
          txt('QUEUE B  (2.5% CLEAN FPR)', rx, y2 - 68, 26, ROLE.warning, 'mono', 'left'),
          scaleTrack(rx, y2, rw, 76, { stroke: ROLE.warning, radius: 12 }),
          glowBar(rx, y2, w480, 68, ROLE.abuse, { glow: 9, radius: 10 }),
          txt('480', rx + w480 / 2, y2, 28, '#070910', 'mono'),
          glowBar(rx + w480 + 3, y2, w388, 68, ROLE.clean, { glow: 8, radius: 10 }),
          txt('388', rx + w480 + w388 / 2, y2, 28, '#070910', 'mono'),
          ex > 0.05
            ? glowBar(
                rx + w480 + w388 + 6,
                y2,
                Math.max(8, wExtra * ex),
                68,
                ov > 0.2 ? ROLE.abuse : ROLE.warning,
                { glow: 12, radius: 10 },
              )
            : group(),
        ).opacity(qbVis),
      );

      const bParts = [];
      if (ad > 0.2) bParts.push('+97 clean flags');
      if (fi > 0.2) bParts.push('32 fill spare');
      if (ov > 0.2) bParts.push('+65 OVER 900 LIMIT');
      if (bParts.length > 0) {
        nodes.push(
          txt(bParts.join('  ·  '), rx, 260, 36, ROLE.warning, 'mono', 'left').glow(
            10,
            ROLE.warning,
          ),
        );
      } else if (ex < 0.1) {
        nodes.push(
          txt(
            'Will the extra half percentage point fit inside 32 spare slots?',
            rx,
            260,
            32,
            ROLE.posterior,
            'serif',
            'left',
          ),
        );
      }

      if (ov > 0.5) {
        nodes.push(
          txt(
            'Same 480 abuses caught · Add 65 slots to staff Queue B (965 total)',
            rx,
            335,
            30,
            COSMOS.ink,
            'serif',
            'left',
          ).opacity(ov),
        );
      }
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'fresh-rates', ratesP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-population', popP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-true', trueP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-false', falseP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-total', totalP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-slots', slotsP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-misses', missesP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-risk', riskP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-rate-change', changeP, 1, { dur: 0.75 });
  cueTo(s, c, 'fresh-extra', extraP, 1, { dur: 0.85 });
  cueTo(s, c, 'fresh-addition', addP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-fill-spare', fillP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fresh-over', overP, 1, { after: true, dur: 0.55 });
}
