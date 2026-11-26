// Act 2 (Scenes 7-11): Missingness Indicator, Categorical Geometry (3D One-Hot Simplex),
// Category Contract, Cross-Fit Target Encoding, Matured Temporal Encoding.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  encode,
  fadeIn,
  fadeOut,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  line3d,
  livingDrift,
  mix,
  numCell,
  orbitScene,
  point3d,
  rule,
  smoothed,
  targetRows,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. missingness: Keep a missing reading distinct from zero
// Cues: missingness-beat-1-focus-1, missingness-beat-2-focus-1,
//       missingness-beat-2-focus-2, missingness-beat-3-focus-1,
//       missingness-beat-3-focus-2
// ---------------------------------------------------------------------------
export function missingness(s, c) {
  const b1P = s.value(0);
  const impP = s.value(0);
  const indP = s.value(0);
  const artP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 7 }));
  s.add(decorAura(340, 20, 480, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Measured Zero vs', 'Unavailable Sensor'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'MISSINGNESS INDICATOR  ·  (VALUE, MISSING_BIT)',
  });

  const live = dynamic(() => {
    const ind = indP.value;
    const art = artP.value;
    const nodes = [];

    // Left: Two rows separating once missing_bit turns on
    const lx = -800;
    nodes.push(
      txt('MEASURED EMPTY QUEUE', lx, -185, 28, ROLE.good, 'mono', 'left'),
      numCell('0', lx + 60, -100, { stroke: ROLE.good, textColor: ROLE.good, glow: 8 }),
      numCell(ind > 0.15 ? '0' : '?', lx + 205, -100, {
        stroke: ind > 0.15 ? ROLE.good : '#2b3b60',
        textColor: ind > 0.15 ? ROLE.good : COSMOS.dim,
        glow: ind > 0.15 ? 8 : 0,
      }),
      txt('→  (0, 0)', lx + 305, -100, 32, ROLE.good, 'mono', 'left').opacity(mix(0.35, 1, ind)),

      txt('BLANK SENSOR OUTAGE', lx, 40, 28, ROLE.leak, 'mono', 'left'),
      numCell('0', lx + 60, 125, { stroke: ROLE.leak, textColor: ROLE.leak, glow: 8 }),
      numCell(ind > 0.15 ? '1' : '?', lx + 205, 125, {
        stroke: ind > 0.15 ? ROLE.leak : '#2b3b60',
        textColor: ind > 0.15 ? ROLE.leak : COSMOS.dim,
        glow: ind > 0.15 ? 10 : 0,
      }),
      txt('→  (0, 1)', lx + 305, 125, 32, ROLE.leak, 'mono', 'left').opacity(mix(0.35, 1, ind)),
    );

    // Right: 2D coordinate separation plane (backlog vs missing_bit)
    const gx0 = 210;
    const gx1 = 780;
    const gy0 = 205;
    const gy1 = -175;
    const yBlank = mix(gy0, gy1 + 55, ind);

    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 3),
      rule(gx0, gy0, gx0, gy1, '#3b4e78', 3),
      txt('backlog value', (gx0 + gx1) / 2, gy0 + 48, 26, COSMOS.muted, 'mono'),
      txt('miss = 1', gx0 - 20, gy1 + 55, 26, ROLE.leak, 'mono', 'right'),
      txt('miss = 0', gx0 - 20, gy0, 26, ROLE.good, 'mono', 'right'),
      // Measured empty stays at (0, 0)
      glowDot(gx0 + 95, gy0, { radius: 14, color: ROLE.good, glow: 12 }),
      txt('Measured (0, 0)', gx0 + 130, gy0 - 44, 28, ROLE.good, 'mono', 'left'),
      // Sensor outage lifts vertically from (0, 0) to (0, 1)
      line([gx0 + 95, gy0], [gx0 + 95, yBlank], {
        stroke: ROLE.leak,
        width: 3,
        dash: [7, 6],
      }).opacity(ind),
      glowDot(gx0 + 95, yBlank, { radius: 14, color: ROLE.leak, glow: 13 }),
      txt(
        ind > 0.2 ? 'Blank sensor (0, 1)' : 'Collided at 0!',
        gx0 + 130,
        ind > 0.2 ? yBlank : gy0 - 94,
        28,
        ROLE.leak,
        'mono',
        'left',
      ),
    );

    nodes.push(
      txt(
        art > 0.2
          ? 'Store imputation + indicator policy in the model artifact; investigate outages separately'
          : 'Adding a binary missing bit separates distinct physical states cleanly',
        0,
        325,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'missingness-beat-1-focus-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'missingness-beat-2-focus-1', impP, 1, { dur: 0.7 });
  cueTo(s, c, 'missingness-beat-2-focus-2', indP, 1, { dur: 0.9 });
  cueTo(s, c, 'missingness-beat-3-focus-2', artP, 0.5, { dur: 0.55 });
  cueTo(s, c, 'missingness-beat-3-focus-1', artP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 8. categories: How far apart are two runner pools? (SIGNATURE 3D ONE-HOT AXES)
// Cues: pool-ruler, pool-exchange, pool-bits, pool-a100, pool-h100
// ---------------------------------------------------------------------------
export function categories(s, c) {
  const rulP = s.value(0);
  const exP = s.value(0);
  const bitP = s.value(0);
  const a100P = s.value(0);
  const h100P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.vector, seed: 8 }));
  s.add(decorAura(340, 10, 480, '#a78bfa22', '#5ce1e614'));

  const headline = heroTitle(['Arbitrary Codes vs', 'Equidistant One-Hot Axes'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.vector,
    eyebrow: 'CATEGORICAL GEOMETRY  ·  A100 · H100 · L4',
  });

  // View 1: Arbitrary ordinal number line 0, 1, 2 swapping H100 <-> L4
  const view1 = guardedDynamic(
    () => fadeOut(bitP.value),
    (vis) => {
      const ex = exP.value;
      const x0 = -560;
      const x1 = 0;
      const x2 = 560;
      const y = 10;
      const xH100 = mix(x1, x2, ex);
      const xL4 = mix(x2, x1, ex);
      const arcH = -Math.sin(ex * Math.PI) * 38;
      const arcL = Math.sin(ex * Math.PI) * 38;

      return group(
        txt('ORDINAL INTEGER CODEBOOK  (INVENTS FAKE DISTANCE!)', 0, -175, 28, ROLE.leak, 'mono'),
        rule(-680, y, 680, y, '#3b4e78', 3.5),
        txt('0', x0, y + 60, 30, COSMOS.muted, 'mono'),
        txt('1', x1, y + 60, 30, COSMOS.muted, 'mono'),
        txt('2', x2, y + 60, 30, COSMOS.muted, 'mono'),
        // Nearest-neighbor glowing bracket between 0 and 1
        line([x0, y - 55], [x1, y - 55], { stroke: ROLE.clock, width: 3.5 }).glow(8, ROLE.clock),
        txt('nearest neighbor (d = 1)', (x0 + x1) / 2, y - 92, 28, ROLE.clock, 'mono'),
        // Pool dots
        glowDot(x0, y, { radius: 16, color: ROLE.eligible, glow: 12 }),
        txt('A100', x0, y + 115, 34, ROLE.eligible, 'mono'),
        glowDot(xH100, y + arcH * 0.4, { radius: 16, color: ROLE.good, glow: 12 }),
        txt('H100', xH100, y + 115 + arcH, 34, ROLE.good, 'mono'),
        glowDot(xL4, y + arcL * 0.4, { radius: 16, color: ROLE.leak, glow: 12 }),
        txt('L4', xL4, y + 115 + arcL, 34, ROLE.leak, 'mono'),
        txt(
          ex > 0.4
            ? 'Swapping codes flipped A100 nearest neighbor to L4 without measuring hardware!'
            : 'Distance models treat code 0 -> 1 as closer than 0 -> 2',
          0,
          275,
          30,
          ex > 0.4 ? ROLE.leak : COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 2: Live rotating 3D-projected Orthogonal One-Hot Unit Simplex in R^3 (equidistant sqrt(2) corners!)
  const view2 = guardedDynamic(
    () => fadeIn(bitP.value),
    (vis) => {
      const a1 = a100P.value;
      const h1 = h100P.value;
      const lx = -820;
      const theta = -0.58 + drift.value * 0.75;
      const phi = 0.42;
      const cx3 = 390;
      const cy3 = 95;
      const scale = 175;
      const proj = ([x, y, z]) => {
        const xr = x * Math.cos(theta) - y * Math.sin(theta);
        const yr = x * Math.sin(theta) + y * Math.cos(theta);
        const sx = cx3 + xr * scale;
        const sy = cy3 + (yr * Math.sin(phi) - z * Math.cos(phi)) * scale;
        return [sx, sy];
      };
      const o = proj([0, 0, 0]);
      const pA = proj([1.15, 0, 0]);
      const pH = proj([0, 1.15, 0]);
      const pO = proj([0, 0, 1.15]);

      const nodes = [
        txt('ONE-HOT LAYOUT  [A100, H100, OTHER]', lx, -210, 28, ROLE.vector, 'mono', 'left'),
        // A100 row
        txt('A100', lx, -95, 32, ROLE.eligible, 'mono', 'left'),
        numCell(1, lx + 210, -95, {
          stroke: ROLE.eligible,
          textColor: ROLE.eligible,
          glow: a1 > 0.2 ? 11 : 0,
        }),
        numCell(0, lx + 335, -95),
        numCell(0, lx + 460, -95),
        // H100 row
        txt('H100', lx, 15, 32, ROLE.good, 'mono', 'left'),
        numCell(0, lx + 210, 15),
        numCell(1, lx + 335, 15, {
          stroke: ROLE.good,
          textColor: ROLE.good,
          glow: h1 > 0.2 ? 11 : 0,
        }),
        numCell(0, lx + 460, 15),
        // Unseen L4 row (strictly withheld as ?!)
        txt('L4 (new)', lx, 125, 32, ROLE.clock, 'mono', 'left'),
        numCell('?', lx + 210, 125, { stroke: ROLE.clock, textColor: ROLE.clock }),
        numCell('?', lx + 335, 125, { stroke: ROLE.clock, textColor: ROLE.clock }),
        numCell('?', lx + 460, 125, { stroke: ROLE.clock, textColor: ROLE.clock }),
        txt(
          'All pairs sit at equal √2 distance on orthogonal axes',
          lx,
          255,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ),
        txt('What should happen when L4 arrives?', lx, 315, 30, ROLE.clock, 'serif', 'left'),
        // Right: Rotating 3D orthogonal unit simplex
        txt('3D ORTHOGONAL SIMPLEX (d = √2)', cx3, -210, 26, ROLE.vector, 'mono'),
        line(o, pA, { stroke: ROLE.eligible, width: 3.6 }).glow(8, ROLE.eligible),
        line(o, pH, { stroke: ROLE.good, width: 3.6 }).glow(8, ROLE.good),
        line(o, pO, { stroke: ROLE.clock, width: 3.6 }).glow(8, ROLE.clock),
        line(pA, pH, { stroke: '#7ce8ff', width: 2.2, dash: [7, 5] }).opacity(0.65),
        line(pH, pO, { stroke: '#7ce8ff', width: 2.2, dash: [7, 5] }).opacity(0.65),
        line(pO, pA, { stroke: '#7ce8ff', width: 2.2, dash: [7, 5] }).opacity(0.65),
        glowDot(o[0], o[1], { radius: 6, color: COSMOS.muted, glow: 4 }),
        glowDot(pA[0], pA[1], { radius: 13, color: ROLE.eligible, glow: 13 }),
        glowDot(pH[0], pH[1], { radius: 13, color: ROLE.good, glow: 13 }),
        glowDot(pO[0], pO[1], { radius: 13, color: ROLE.clock, glow: 13 }),
        txt('A100 (1,0,0)', pA[0] + 24, pA[1] + 28, 26, ROLE.eligible, 'mono', 'left'),
        txt('H100 (0,1,0)', pH[0] - 24, pH[1] + 28, 26, ROLE.good, 'mono', 'right'),
        txt('Other (0,0,1)', pO[0] + 28, pO[1] - 22, 26, ROLE.clock, 'mono', 'left'),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pool-ruler', rulP, 1, { dur: 0.7 });
  cueTo(s, c, 'pool-exchange', exP, 1, { dur: 0.95 });
  cueTo(s, c, 'pool-bits', bitP, 1, { dur: 0.8 });
  cueTo(s, c, 'pool-a100', a100P, 1, { dur: 0.65 });
  cueTo(s, c, 'pool-h100', h100P, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 9. category-contract: Where does a new pool go?
// Cues: category-contract-0, feature-category-map, category-contract-1,
//       category-contract-2
// ---------------------------------------------------------------------------
export function categoryContract(s, c) {
  const mapP = s.value(0);
  const ignP = s.value(0);
  const spP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 9 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#a78bfa14'));

  const headline = heroTitle(['Unseen Categories &', 'Sparse Representation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FITTED ENCODER POLICY  ·  UNSEEN POOL "L4"',
  });

  const live = dynamic(() => {
    const mp = mapP.value;
    const ig = ignP.value;
    const sp = spP.value;
    const nodes = [];

    // Left: Reserved "other" slot encoder -> [0, 0, 1]
    const lx = -780;
    nodes.push(
      txt('RESERVED "OTHER" SLOT', lx, -205, 28, ROLE.good, 'mono', 'left'),
      txt('A100', lx + 120, -130, 26, COSMOS.muted, 'mono'),
      txt('H100', lx + 255, -130, 26, COSMOS.muted, 'mono'),
      txt('OTHER', lx + 390, -130, 26, ROLE.good, 'mono'),
      numCell(0, lx + 120, -55),
      numCell(0, lx + 255, -55),
      numCell(mp > 0.15 ? 1 : 0, lx + 390, -55, {
        stroke: mp > 0.15 ? ROLE.good : '#2b3b60',
        textColor: mp > 0.15 ? ROLE.good : COSMOS.muted,
        glow: mp > 0.15 ? 12 : 0,
      }),
      txt('L4 → [0, 0, 1]  (third bit lights up)', lx, 40, 28, ROLE.good, 'sans', 'left').opacity(
        mix(0.45, 1, mp),
      ),
    );

    nodes.push(rule(0, -210, 0, 95, '#2a3759', 2));

    // Right: handle_unknown="ignore" encoder -> [0, 0, 0]
    const rx = 80;
    nodes.push(
      txt('IGNORE UNKNOWN POLICY', rx, -205, 28, ROLE.clock, 'mono', 'left'),
      txt('A100', rx + 120, -130, 26, COSMOS.muted, 'mono'),
      txt('H100', rx + 255, -130, 26, COSMOS.muted, 'mono'),
      txt('OTHER', rx + 390, -130, 26, COSMOS.muted, 'mono'),
      numCell(0, rx + 120, -55, { stroke: ig > 0.2 ? ROLE.clock : '#2b3b60' }),
      numCell(0, rx + 255, -55, { stroke: ig > 0.2 ? ROLE.clock : '#2b3b60' }),
      numCell(0, rx + 390, -55, { stroke: ig > 0.2 ? ROLE.clock : '#2b3b60' }),
      txt('L4 → [0, 0, 0]  (all zeros)', rx, 40, 28, ROLE.clock, 'sans', 'left').opacity(
        mix(0.45, 1, ig),
      ),
    );

    // Bottom: Sparse matrix storage ribbon (1 active coordinate out of many zeros)
    const sy = 195;
    nodes.push(
      txt(
        'SPARSE STORAGE:  STORE ONLY (row, col=k, val=1)  ·  SKIP MILLIONS OF ZEROS',
        0,
        sy - 55,
        26,
        ROLE.vector,
        'mono',
      ).opacity(mix(0.5, 1, sp)),
    );
    for (let i = 0; i < 12; i += 1) {
      const cx = -660 + i * 120;
      const isOne = i === 8;
      nodes.push(
        rect(96, 52, {
          fill: isOne ? '#231942' : '#0d1424',
          stroke: isOne ? ROLE.vector : '#222f4d',
          width: isOne ? 3 : 1.6,
          radius: 8,
        })
          .at(cx, sy + 12)
          .glow(isOne && sp > 0.2 ? 12 : 0, ROLE.vector)
          .opacity(mix(0.45, 1, sp)),
        txt(isOne ? '1' : '0', cx, sy + 14, 28, isOne ? ROLE.vector : COSMOS.dim, 'mono').opacity(
          mix(0.45, 1, sp),
        ),
      );
    }

    nodes.push(
      txt(
        sp > 0.2
          ? 'Keep the exact fitted encoder in training & serving; watch dense blowup'
          : 'Slot order and unknown-category rule travel with the fitted model',
        0,
        320,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'feature-category-map', mapP, 0.75, { dur: 0.6 });
  cueTo(s, c, 'category-contract-0', mapP, 1, { dur: 0.55 });
  cueTo(s, c, 'category-contract-1', ignP, 1, { dur: 0.75 });
  cueTo(s, c, 'category-contract-2', spP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 10. crossfit-construction: What happens if T8's label flips?
// Cues: feature-target-prior, feature-target-full, fold-split,
//       feature-fitting-prior, feature-target-held, feature-target-flip*,
//       fold-recompute*, fold-weight
// ---------------------------------------------------------------------------
export function crossfitConstruction(s, c) {
  const fullP = s.value(0);
  const splitP = s.value(0);
  const heldP = s.value(0);
  const flipP = s.value(0);
  const wgtP = s.value(0);
  const drift = s.value(0);

  const flippedRows = targetRows.map((r, i) => (i === 7 ? { ...r, missed: 0 } : r));
  const fullFlipped = encode(flippedRows, [], 7); // 5/12 = 0.4167
  const heldVal = encode(targetRows, [1, 3, 5, 7], 7); // 3/4 = 0.75

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 10 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1a', '#6ee7b714'));

  const headline = heroTitle(['Target Encoding &', 'Cross-Fit Isolation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.leak,
    eyebrow: 'SMOOTHING WEIGHT m = 5  ·  FLIPPING T8 LABEL',
  });

  const eqTex = glowTex('\\hat{e}_c = \\frac{k_c + m \\cdot p}{n_c + m}', {
    size: 42,
    color: ROLE.clock,
    glow: 10,
  }).at(560, -395);

  const live = dynamic(() => {
    const fl = fullP.value;
    const sp = splitP.value;
    const hl = heldP.value;
    const fp = flipP.value;
    const wg = wgtP.value;
    const nodes = [];

    // Top row: 8 jobs T1..T8 with fold separation curtain
    nodes.push(
      txt(
        sp > 0.2
          ? 'FITTING FOLD (T1, T3, T5, T7: 3/4 MISSED)   |   HELD-OUT FOLD (INCLUDES T8)'
          : 'ALL 8 FINISHED JOBS  (5 OF 8 MISSED  ·  T8 IS THE ONLY L4 JOB)',
        0,
        -215,
        26,
        sp > 0.2 ? ROLE.good : ROLE.eligible,
        'mono',
      ),
    );

    const fittingIdx = [0, 2, 4, 6];
    const order = sp > 0.2 ? [0, 2, 4, 6, 1, 3, 5, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
    order.forEach((idx, pos) => {
      const row = targetRows[idx];
      const isT8 = idx === 7;
      const isFit = fittingIdx.includes(idx);
      const missed = isT8 ? (fp > 0.2 ? 0 : 1) : row.missed;
      const cx = -700 + pos * 200 + (sp > 0.2 && pos >= 4 ? 40 : 0);
      const cy = -110;
      const col = isT8 ? (fp > 0.2 ? ROLE.clock : ROLE.leak) : isFit ? ROLE.good : COSMOS.muted;
      nodes.push(
        numCell(`T${idx + 1}:${missed}`, cx, cy, {
          w: 152,
          h: 64,
          stroke: col,
          textColor: col,
          glow: isT8 ? 12 : 0,
        }),
        txt(
          row.pool.replace('-pool', '').toUpperCase(),
          cx,
          cy + 56,
          26,
          isT8 ? ROLE.clock : COSMOS.muted,
          'mono',
        ),
      );
    });

    if (sp > 0.2) {
      nodes.push(
        line([20, -165], [20, -20], { stroke: ROLE.clock, width: 3.2, dash: [8, 6] }).opacity(sp),
      );
    }

    // Bottom left: Full-data target encoding (LEAKS T8 twice!)
    const fullNow = mix(smoothed, fullFlipped, fp);
    const barW = 540;
    nodes.push(
      txt('FULL-DATA ENCODING (LEAKS T8)', -760, 65, 28, ROLE.leak, 'mono', 'left'),
      rule(-760, 145, -760 + barW, 145, '#2b3b60', 2),
      glowBar(-760, 145, fullNow * barW, 34, ROLE.leak, { glow: 10 }),
      txt(
        fp > 0.2
          ? `T8 flipped 1→0:  falls to ${fullNow.toFixed(3)} (5/12)!`
          : `11/16 = ${smoothed.toFixed(4)}  (uses T8 in pool & prior)`,
        -760,
        210,
        28,
        ROLE.leak,
        'mono',
        'left',
      ).opacity(mix(0.45, 1, fl)),
    );

    // Bottom right: Cross-fit held-out encoding (IMMUNE to T8 flip!)
    nodes.push(
      txt('CROSS-FIT HELD-OUT (FITTING 4 ONLY)', 80, 65, 28, ROLE.good, 'mono', 'left'),
      rule(80, 145, 80 + barW, 145, '#2b3b60', 2),
      glowBar(80, 145, heldVal * barW, 34, ROLE.good, {
        glow: 10,
        opacity: mix(0.4, 1, hl),
      }),
      txt(
        hl > 0.2
          ? fp > 0.2
            ? 'STAYS AT 3/4 = 0.750  (ZERO LEAKAGE!)'
            : 'No L4 in fitting fold → prior 3/4 = 0.750'
          : 'Hold out T8 fold → compute prior from other 4',
        80,
        210,
        28,
        hl > 0.2 ? ROLE.good : COSMOS.dim,
        'mono',
        'left',
      ),
    );

    nodes.push(
      txt(
        wg > 0.2
          ? 'm > 0 pulls unseen pools to the allowed prior; fit on full training set for serving'
          : fp > 0.2
            ? 'Flipping T8 moves the leaky estimate (−0.27) while cross-fit stays locked!'
            : 'If we flip T8 from missed to on-time, which estimate moves?',
        0,
        320,
        30,
        fp > 0.2 ? ROLE.good : ROLE.clock,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, eqTex, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'feature-target-prior', fullP, 0.45, { dur: 0.6 });
  cueTo(s, c, 'feature-target-full', fullP, 1, { dur: 0.75 });
  cueTo(s, c, 'fold-split', splitP, 1, { dur: 0.8 });
  cueTo(s, c, 'feature-fitting-prior', heldP, 0.45, { dur: 0.6 });
  cueTo(s, c, 'feature-target-held', heldP, 1, { dur: 0.75 });
  cueTo(s, c, 'feature-target-flip', flipP, 0.55, { dur: 0.6, after: true });
  cueTo(s, c, 'fold-recompute', flipP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'fold-weight', wgtP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 11. matured-encoding: Which outcomes can enter the pool average?
// Cues: mature-first, feature-label-seven, feature-label-nine,
//       mature-denominator*, mature-rate*, mature-save, mature-advance,
//       feature-label-ten*, feature-splitter-requirement
// ---------------------------------------------------------------------------
export function maturedEncoding(s, c) {
  const firstP = s.value(0);
  const sevP = s.value(0);
  const nineP = s.value(0);
  const rateP = s.value(0);
  const saveP = s.value(0);
  const advP = s.value(0);
  const tenP = s.value(0);
  const splP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clock, seed: 11 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Label Maturity &', 'Pinned Encoder Versions'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clock,
    eyebrow: 'TEMPORAL TARGET ENCODING  ·  06:00 TO 10:00',
  });

  const live = dynamic(() => {
    const sev = sevP.value;
    const nine = nineP.value;
    const rt = rateP.value;
    const sv = saveP.value;
    const ad = advP.value;
    const ten = tenP.value;
    const spl = splP.value;
    const nodes = [];

    const x0 = -720;
    const x1 = 720;
    const xOf = (h) => mix(x0, x1, (h - 6) / 4); // 06:00 to 10:00
    const clockH = 7 + 2 * nine + 1 * ad; // 7 -> 9 -> 10

    // Clock timeline
    nodes.push(rule(x0, -20, x1, -20, '#3b4e78', 3));
    [6, 7, 8, 9, 10].forEach((h) => {
      const tx = xOf(h);
      nodes.push(
        line([tx, -30], [tx, -10], { stroke: COSMOS.muted, width: 2 }),
        txt(`0${h}:00`.replace('010', '10'), tx, 22, 26, COSMOS.muted, 'mono'),
      );
    });

    // Job 1 interval: scored 06:00 -> outcome 08:00 (label 0 = on time)
    nodes.push(
      line([xOf(6), -145], [xOf(8), -145], { stroke: ROLE.good, width: 6 }).glow(8, ROLE.good),
      glowDot(xOf(6), -145, { radius: 10, color: ROLE.eligible, glow: 8 }),
      glowDot(xOf(8), -145, { radius: 12, color: ROLE.good, glow: 10 }),
      txt('Job 1 (y=0)', xOf(6) + 18, -188, 26, ROLE.good, 'mono', 'left'),
    );

    // Job 2 interval: scored 07:00 -> outcome 10:00 (label 1 = missed)
    nodes.push(
      line([xOf(7), -62], [xOf(10), -62], { stroke: ROLE.leak, width: 6 }).glow(8, ROLE.leak),
      glowDot(xOf(7), -62, { radius: 10, color: ROLE.eligible, glow: 8 }),
      glowDot(xOf(10), -62, { radius: 12, color: ROLE.leak, glow: 10 }),
      txt('Job 2 (y=1)', xOf(6) + 18, -62, 26, ROLE.leak, 'mono', 'left'),
    );

    // Moving cutoff line (ends at axis y=-16 so tick labels at y=22 are never crossed)
    const cx = xOf(clockH);
    nodes.push(
      line([cx, -212], [cx, -16], { stroke: ROLE.clock, width: 3.8 }).glow(10, ROLE.clock),
      txt(`CUTOFF ${Math.round(clockH)}:00`, cx, -242, 28, ROLE.clock, 'mono'),
    );

    // Bottom readouts: Pinned 09:00 artifact vs Updating 10:00 encoder
    nodes.push(
      txt('PINNED 09:00 ARTIFACT', -740, 125, 28, ROLE.good, 'mono', 'left'),
      txt(
        rt > 0.2
          ? '1 matured job:  0 / 1 = 0.00  (stays pinned!)'
          : sev > 0.2 && nine < 0.2
            ? 'At 07:00:  0 outcomes arrived (waiting...)'
            : 'How many outcomes count at 09:00?  ?',
        -740,
        185,
        30,
        rt > 0.2 ? ROLE.good : COSMOS.muted,
        'mono',
        'left',
      ).glow(sv > 0.2 ? 8 : 0, ROLE.good),

      txt('UPDATING ENCODER AT 10:00', 80, 125, 28, ROLE.leak, 'mono', 'left').opacity(
        mix(0.45, 1, ad),
      ),
      txt(
        ten > 0.2 ? '2 matured jobs:  1 / 2 = 0.50' : 'Waits for 10:00 outcome arrival',
        80,
        185,
        30,
        ten > 0.2 ? ROLE.leak : COSMOS.dim,
        'mono',
        'left',
      ).opacity(mix(0.45, 1, ad)),
    );

    nodes.push(
      txt(
        spl > 0.2
          ? 'Forward encoders need a warm-up rule for the first row (no prior outcomes yet)'
          : 'Reproducibility requires keeping the fitting cutoff & version used per decision',
        0,
        315,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'mature-first', firstP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-label-seven', sevP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-label-nine', nineP, 1, { dur: 0.9 });
  cueTo(s, c, 'mature-denominator', rateP, 0.5, { dur: 0.5, after: true });
  cueTo(s, c, 'mature-rate', rateP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'mature-save', saveP, 1, { dur: 0.65 });
  cueTo(s, c, 'mature-advance', advP, 1, { dur: 0.9 });
  cueTo(s, c, 'feature-label-ten', tenP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'feature-splitter-requirement', splP, 1, { dur: 0.75 });
}
