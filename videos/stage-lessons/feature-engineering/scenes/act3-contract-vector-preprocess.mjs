// Act 3 (Scenes 12-15): Feature Contract Units, Row Validation,
// Ordered Vector Construction & Slot Swap, Preprocessing Cap Edit (Sigmoid Threshold Crossing).
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cueTo,
  decorAura,
  featureSum,
  featureVector,
  featureWeights,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  heroTitle,
  mix,
  numCell,
  rule,
  scoreForCap,
  sigmoid,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 12. contract: Two writers, one heartbeat
// Cues: contract-compare, contract-unit-name*, contract-convert, contract-order
// ---------------------------------------------------------------------------
export function contract(s, c) {
  const cmpP = s.value(0);
  const unitP = s.value(0);
  const convP = s.value(0);
  const ordP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clock, seed: 12 }));
  s.add(decorAura(0, 20, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Units & Schema', 'Feature Contracts'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clock,
    eyebrow: 'SAME 08:30 HEARTBEAT  ·  TWO WRITERS AT 09:00',
  });

  const live = dynamic(() => {
    const un = unitP.value;
    const cv = convP.value;
    const od = ordP.value;
    const aVal = mix(30, 0.5, cv);
    const nodes = [];

    // Left: Writer A (minutes -> divided by 60 -> hours)
    nodes.push(
      txt('WRITER A', -620, -195, 28, cv > 0.5 ? ROLE.good : ROLE.leak, 'mono'),
      numCell(cv > 0.5 ? '0.50' : aVal.toFixed(cv > 0.05 ? 1 : 0), -620, -90, {
        w: 200,
        h: 82,
        size: 40,
        stroke: cv > 0.5 ? ROLE.good : ROLE.leak,
        textColor: cv > 0.5 ? ROLE.good : ROLE.leak,
        glow: 10,
      }),
      txt(
        cv > 0.5 ? '30 min ÷ 60 = 0.5 h  (FIXED)' : 'elapsed MINUTES (raw 30)',
        -620,
        2,
        26,
        cv > 0.5 ? ROLE.good : ROLE.leak,
        'mono',
      ),
    );

    // Center: Model input slot contract
    nodes.push(
      txt('MODEL SLOT CONTRACT', 0, -195, 28, ROLE.clock, 'mono'),
      rect(340, 120, {
        fill: '#1b1a10',
        stroke: ROLE.clock,
        width: 3.4,
        radius: 14,
      })
        .at(0, -85)
        .glow(11, ROLE.clock),
      txt('heartbeat_age', 0, -108, 28, COSMOS.ink, 'mono'),
      txt('UNIT: HOURS', 0, -60, 32, ROLE.clock, 'mono'),
      txt(
        un > 0.2 ? 'Writer B matches directly!' : 'Which writer fits directly?  ?',
        0,
        25,
        28,
        un > 0.2 ? ROLE.good : ROLE.clock,
        'serif',
      ),
    );

    // Right: Writer B (hours)
    nodes.push(
      txt('WRITER B', 620, -195, 28, ROLE.good, 'mono'),
      numCell('0.50', 620, -90, {
        w: 200,
        h: 82,
        size: 40,
        stroke: ROLE.good,
        textColor: ROLE.good,
        glow: un > 0.2 ? 12 : 6,
      }),
      txt('elapsed HOURS (0.5)', 620, 2, 26, ROLE.good, 'mono'),
    );

    // Bottom: Contract scope + slot-order warning
    nodes.push(
      rule(-780, 115, 780, 115, '#2a3759', 2),
      txt(
        od > 0.2
          ? 'SILENT BUG: swapping queued_min & heartbeat_h keeps vector length 8!'
          : 'Contract locks: unit · type · cutoff · missing rule · categories · clipping',
        0,
        185,
        30,
        od > 0.2 ? ROLE.leak : ROLE.eligible,
        'mono',
      ).glow(od > 0.2 ? 9 : 0, ROLE.leak),
      txt(
        'Validate named fields first, before converting to an unnamed numeric vector',
        0,
        280,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'contract-compare', cmpP, 1, { dur: 0.7 });
  cueTo(s, c, 'contract-unit-name', unitP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'contract-convert', convP, 1, { dur: 0.9 });
  cueTo(s, c, 'contract-order', ordP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 13. row-validation: What passes the row builder?
// Cues: validation-offset, validation-naive, validation-fields,
//       validation-blank, validation-zero
// ---------------------------------------------------------------------------
export function rowValidation(s, c) {
  const offP = s.value(0);
  const naiP = s.value(0);
  const fldP = s.value(0);
  const blkP = s.value(0);
  const zerP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 13 }));
  s.add(decorAura(0, 30, 540, '#5ce1e61a', '#6ee7b714'));

  const headline = heroTitle(['Named Row Builder', '& Schema Gate'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'TIMEZONE NORMALIZATION  ·  6 ALLOWED INPUT FIELDS',
  });

  const live = dynamic(() => {
    const na = naiP.value;
    const fl = fldP.value;
    const bl = blkP.value;
    const zr = zerP.value;
    const isBlankMode = bl > 0.2 && zr < 0.3;
    const isZeroMode = zr > 0.2;
    const nodes = [];

    // Top strip: Timezone offset normalization vs naive rejection
    nodes.push(
      txt(
        '04:30 -04:00  ≡  08:30 UTC  →  0.5 h  (PASS)',
        -800,
        -195,
        28,
        ROLE.good,
        'mono',
        'left',
      ),
      txt(
        na > 0.2
          ? '08:30 (NO TZ) / FUTURE / ABSENT  →  REJECT!'
          : 'Timezone-aware instants required',
        800,
        -195,
        28,
        na > 0.2 ? ROLE.leak : COSMOS.muted,
        'mono',
        'right',
      ),
      rule(-810, -148, 810, -148, '#2a3759', 2),
    );

    // Middle: 6 allowed fields of J-204 passing into vectorizer
    const fields = [
      { k: 'pool', v: '"a100-pool"', rule: 'trim + fold', col: ROLE.eligible },
      { k: 'queued', v: '42', rule: 'finite ≥ 0', col: ROLE.eligible },
      { k: 'heartbeat', v: '0.5 h', rule: 'cap ≤ 180 h', col: ROLE.eligible },
      {
        k: 'backlog',
        v: isBlankMode ? 'null → 0' : isZeroMode ? '0' : '18',
        rule: 'finite ≥ 0',
        col: isBlankMode ? ROLE.leak : isZeroMode ? ROLE.good : ROLE.eligible,
      },
      {
        k: 'missing_bit',
        v: isBlankMode ? '1' : '0',
        rule: 'derived',
        col: isBlankMode ? ROLE.leak : ROLE.good,
      },
      { k: 'priority', v: 'False', rule: 'strict bool', col: ROLE.vector },
    ];

    fields.forEach((f, i) => {
      const colIdx = i % 3;
      const rowIdx = Math.floor(i / 3);
      const cx = -540 + colIdx * 540;
      const cy = -45 + rowIdx * 145;
      const hi = fl > 0.15 || (i >= 3 && (isBlankMode || isZeroMode));
      nodes.push(
        txt(f.k, cx, cy - 54, 26, COSMOS.muted, 'mono'),
        numCell(f.v, cx, cy + 8, {
          w: 250,
          h: 64,
          size: 30,
          stroke: hi ? f.col : '#2b3b60',
          textColor: hi ? f.col : COSMOS.ink,
          glow: (i === 3 || i === 4) && (isBlankMode || isZeroMode) ? 10 : 0,
        }),
        txt(f.rule, cx, cy + 68, 26, COSMOS.dim, 'mono'),
      );
    });

    // Bottom: Excluded post-decision columns
    nodes.push(
      txt(
        isBlankMode
          ? 'Blank backlog → numeric 0, missing_bit = 1  (valid row)'
          : isZeroMode
            ? 'Measured zero → numeric 0, missing_bit = 0  (distinct state!)'
            : 'EXCLUDED FROM VECTORIZER:  finished_at  ·  escalation_flag',
        0,
        310,
        30,
        isBlankMode ? ROLE.leak : isZeroMode ? ROLE.good : ROLE.clock,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'validation-offset', offP, 1, { dur: 0.7 });
  cueTo(s, c, 'validation-naive', naiP, 1, { dur: 0.7 });
  cueTo(s, c, 'validation-fields', fldP, 1, { dur: 0.8 });
  cueTo(s, c, 'validation-blank', blkP, 1, { dur: 0.75 });
  cueTo(s, c, 'validation-zero', zerP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 14. vector-construction: Which weight will forty-two meet?
// Cues: vector-construction-0, feature-vector-build, vector-construction-1,
//       feature-vector-products, feature-vector-result, feature-product-queued,
//       feature-product-heartbeat, feature-product-backlog,
//       vector-construction-2, feature-layout-swap, feature-layout-restore
// ---------------------------------------------------------------------------
export function vectorConstruction(s, c) {
  const bldP = s.value(0);
  const prdP = s.value(0);
  const resP = s.value(0);
  const swapP = s.value(0);
  const restP = s.value(0);

  const ordered = featureVector({
    pool: 'a100-pool',
    queued: 42,
    heartbeat: 0.5,
    backlog: 18,
    priority: false,
  });

  s.add(cinemaGrid({ accent: ROLE.vector, seed: 14 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1c', '#ff6b8b14'));

  const headline = heroTitle(['Ordered Vector &', 'Positional Weight Swap'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.vector,
    eyebrow: '8-SLOT FEATURE VECTOR  ·  FIXED MODEL WEIGHTS',
  });

  const shortNames = ['A100', 'H100', 'Other', 'Queue', 'HB(h)', 'Backlog', 'Miss', 'Prio'];

  const live = dynamic(() => {
    const pr = prdP.value;
    const rs = resP.value;
    const sw = swapP.value * (1 - restP.value); // 0 -> 1 (swapped) -> 0 (restored)
    const nodes = [];

    const xOf = (i) => -735 + i * 210;
    const isSwapped = sw > 0.5;
    const activeVals = [...ordered];
    if (isSwapped) {
      [activeVals[3], activeVals[4]] = [activeVals[4], activeVals[3]];
    }
    const total = featureSum(activeVals).total[0];

    // Row 1: Slot headers + vector cells (slots 3 and 4 physically slide past each other!)
    shortNames.forEach((name, i) => {
      const cx = xOf(i);
      const active = featureWeights[i] > 0;
      nodes.push(txt(name, cx, -242, 26, active ? ROLE.clock : COSMOS.muted, 'mono'));

      // Physical x position for sliding cells 3 and 4 (generous arc clears each other & headers)
      let drawX = cx;
      let drawY = -112;
      if (i === 3) {
        drawX = mix(xOf(3), xOf(4), sw);
        drawY = -112 - Math.sin(sw * Math.PI) * 44;
      } else if (i === 4) {
        drawX = mix(xOf(4), xOf(3), sw);
        drawY = -112 + Math.sin(sw * Math.PI) * 44;
      }

      const val = ordered[i];
      const cellCol =
        i === 3 ? ROLE.leak : i === 4 ? ROLE.eligible : i === 5 ? ROLE.good : '#2b3b60';
      nodes.push(
        numCell(val, drawX, drawY, {
          w: 168,
          h: 66,
          size: 32,
          stroke: cellCol,
          textColor: active ? cellCol : COSMOS.ink,
          glow: (i === 3 || i === 4) && sw > 0.1 ? 12 : active ? 6 : 0,
        }),
      );
    });

    // Row 2: Fixed weights w_i (NEVER move!)
    nodes.push(txt('FIXED WEIGHTS  w', -820, 28, 26, COSMOS.muted, 'mono', 'left'));
    featureWeights.forEach((w, i) => {
      const cx = xOf(i);
      const active = w > 0;
      nodes.push(
        numCell(w === 0 ? '0' : w.toFixed(2), cx, 95, {
          w: 168,
          h: 58,
          size: 28,
          stroke: active ? ROLE.clock : '#222f4d',
          textColor: active ? ROLE.clock : COSMOS.dim,
        }),
      );
      // Contribution term below each active weight
      if (active && pr > 0.15) {
        const contrib = activeVals[i] * w;
        const cCol = isSwapped && i === 4 ? ROLE.leak : ROLE.good;
        nodes.push(
          txt(`+${contrib.toFixed(3)}`, cx, 178, 28, cCol, 'mono').glow(
            isSwapped && i === 4 ? 10 : 0,
            ROLE.leak,
          ),
        );
      }
    });

    // Bottom: Dot product score comparison
    nodes.push(
      txt(
        rs > 0.2
          ? isSwapped
            ? `SWAPPED SCORE:  0.005 + 0.840 + 0.180 = ${total.toFixed(3)}   (42 hit 2× weight!)`
            : restP.value > 0.5
              ? `RESTORED LAYOUT:  0.42 + 0.01 + 0.18 = ${total.toFixed(2)}   (exact match!)`
              : `DECLARED LAYOUT:  0.42 + 0.01 + 0.18 = ${total.toFixed(2)}`
          : 'Multiply each slot by its fixed weight to score J-204',
        0,
        295,
        34,
        isSwapped ? ROLE.leak : rs > 0.2 ? ROLE.good : COSMOS.muted,
        'mono',
      ).glow(rs > 0.2 ? 9 : 0, isSwapped ? ROLE.leak : ROLE.good),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'vector-construction-0', bldP, 0.45, { dur: 0.6 });
  cueTo(s, c, 'feature-vector-build', bldP, 1, { dur: 0.7 });
  cueTo(s, c, 'vector-construction-1', prdP, 0.2, { dur: 0.5 });
  cueTo(s, c, 'feature-vector-products', prdP, 0.45, { dur: 0.5 });
  cueTo(s, c, 'feature-product-queued', prdP, 0.65, { dur: 0.4 });
  cueTo(s, c, 'feature-product-heartbeat', prdP, 0.82, { dur: 0.4 });
  cueTo(s, c, 'feature-product-backlog', prdP, 1, { dur: 0.4 });
  cueTo(s, c, 'feature-vector-result', resP, 1, { dur: 0.7 });
  cueTo(s, c, 'vector-construction-2', swapP, 0.55, { dur: 0.6 });
  cueTo(s, c, 'feature-swapped-queued', swapP, 0.7, { dur: 0.4 });
  cueTo(s, c, 'feature-swapped-heartbeat', swapP, 0.85, { dur: 0.4 });
  cueTo(s, c, 'feature-swapped-backlog', swapP, 0.95, { dur: 0.4 });
  cueTo(s, c, 'feature-layout-swap', swapP, 1, { dur: 0.5 });
  cueTo(s, c, 'feature-layout-restore', restP, 1, { dur: 0.95 });
}

// ---------------------------------------------------------------------------
// 15. preprocessing-change: See how a preprocessing edit moves a score
// Cues: preprocessing-change-beat-1-focus-1, feature-cap-change,
//       feature-preprocess-score-pair, feature-preprocess-fresh
// ---------------------------------------------------------------------------
export function preprocessingChange(s, c) {
  const capP = s.value(0);
  const pairP = s.value(0);
  const freshP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 15 }));
  s.add(decorAura(240, 20, 520, '#ff6b8b1c', '#5ce1e614'));

  const headline = heroTitle(['Serving Cap Edit', 'Crosses Decision Threshold'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.leak,
    eyebrow: 'FIXED WEIGHTS  ·  RAW HEARTBEAT 200 H  ·  CAP 180 → 360',
  });

  const eqTex = glowTex('p = \\sigma(0.02\\,h_{\\text{cap}} + 0.01\\cdot 18 - 4)', {
    size: 38,
    color: ROLE.clock,
    glow: 10,
  }).at(480, -395);

  const live = dynamic(() => {
    const cp = capP.value;
    const pr = pairP.value;
    const fr = freshP.value;
    const capNow = mix(180, 360, cp);
    const ageNow = Math.min(200, capNow);
    const scoreNow = scoreForCap(capNow);
    const crossed = scoreNow >= 0.5;
    const nodes = [];

    // Right: Sigmoid probability curve over heartbeat age h in [0, 260]
    const gx0 = -160;
    const gx1 = 760;
    const gy0 = 230;
    const gy1 = -195;
    const xOf = (h) => mix(gx0, gx1, h / 260);
    const yOf = (p) => mix(gy0, gy1, p);

    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 3),
      rule(gx0, gy0, gx0, gy1, '#3b4e78', 3),
      txt('clipped heartbeat age (h)', (gx0 + gx1) / 2, gy0 + 48, 26, COSMOS.muted, 'mono'),
      txt('p = 1.0', gx0 - 24, gy1 + 8, 26, COSMOS.muted, 'mono', 'right'),
      txt('p = 0.5', gx0 - 24, yOf(0.5), 26, ROLE.clock, 'mono', 'right'),
      txt('p = 0.0', gx0 - 24, gy0, 26, COSMOS.muted, 'mono', 'right'),
      // Action threshold p = 0.50 (label placed on clear left half above curve)
      line([gx0, yOf(0.5)], [gx1, yOf(0.5)], { stroke: ROLE.clock, width: 2.8, dash: [9, 6] }),
      txt('0.50 ACTION THRESHOLD', gx0 + 18, yOf(0.5) - 32, 26, ROLE.clock, 'mono', 'left'),
    );

    // Sigmoid curve polyline
    const curvePts = [];
    for (let i = 0; i <= 52; i += 1) {
      const h = (i / 52) * 260;
      curvePts.push([xOf(h), yOf(sigmoid(0.02 * h + 0.18 - 4))]);
    }
    nodes.push(glowingTrail(curvePts, { color: ROLE.eligible, width: 4.2, glow: 10 }));

    // Moving J-188 dot (180h -> 200h); label cleanly below/right so it never crosses threshold text
    const jx = xOf(ageNow);
    const jy = yOf(scoreNow);
    const jCol = crossed ? ROLE.leak : ROLE.good;
    nodes.push(
      line([jx, gy0], [jx, jy], { stroke: jCol, width: 2.5, dash: [6, 5] }),
      glowDot(jx, jy, { radius: 14, color: jCol, glow: 14 }),
      txt(
        `J-188: ${ageNow.toFixed(0)}h → ${scoreNow.toFixed(3)}`,
        jx + 18,
        jy + 56,
        26,
        jCol,
        'mono',
        'left',
      ),
    );

    // Fresh 0.5h job dot (unchanged under both caps!)
    const freshScore = sigmoid(0.02 * 0.5 + 0.18 - 4);
    nodes.push(
      glowDot(xOf(0.5), yOf(freshScore), {
        radius: 12,
        color: ROLE.good,
        glow: 10,
        opacity: mix(0.4, 1, fr),
      }),
      txt('0.5h job: unchanged', xOf(16), yOf(0.32), 26, ROLE.good, 'mono', 'left').opacity(
        mix(0.4, 1, fr),
      ),
    );

    // Left: Crisp numeric readout stack (no cards!)
    const lx = -820;
    nodes.push(
      txt('JOB J-188  (RAW = 200 H)', lx, -185, 28, ROLE.eligible, 'mono', 'left'),
      txt(`ACTIVE CAP:  ${capNow.toFixed(0)} h`, lx, -110, 34, ROLE.clock, 'mono', 'left'),
      txt(`MODEL INPUT: ${ageNow.toFixed(0)} h`, lx, -40, 34, COSMOS.ink, 'mono', 'left'),
      txt(`SCORE:  ${scoreNow.toFixed(3)}`, lx, 45, 44, jCol, 'mono', 'left').glow(11, jCol),
      glowBadge(crossed ? 'ALERT' : 'SAFE', lx + 140, 130, jCol, {
        w: 280,
        h: 56,
        size: 28,
      }),
      txt(
        fr > 0.2
          ? '0.5h heartbeat fits under both caps → score identical'
          : pr > 0.2
            ? '0.445 → 0.545 with ZERO weight change!'
            : 'Training clipped at 180 h; serving raised cap to 360 h',
        lx,
        255,
        28,
        COSMOS.ink,
        'serif',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, eqTex, live);
  cueTo(s, c, 'preprocessing-change-beat-1-focus-1', capP, 0.08, { dur: 0.45 });
  cueTo(s, c, 'feature-cap-change', capP, 1, { dur: 1.0 });
  cueTo(s, c, 'preprocessing-change-beat-2-focus-2', pairP, 0.35, { dur: 0.5 });
  cueTo(s, c, 'preprocessing-change-beat-2-focus-1', pairP, 0.7, { dur: 0.5 });
  cueTo(s, c, 'feature-preprocess-score-pair', pairP, 1, { dur: 0.7 });
  cueTo(s, c, 'preprocessing-change-beat-3-focus-1', freshP, 0.4, { dur: 0.5 });
  cueTo(s, c, 'preprocessing-change-beat-3-focus-2', freshP, 0.75, { dur: 0.5 });
  cueTo(s, c, 'feature-preprocess-fresh', freshP, 1, { dur: 0.75 });
}
