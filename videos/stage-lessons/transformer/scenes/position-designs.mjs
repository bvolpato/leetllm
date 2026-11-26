// Scene 11: position-designs: "Give order a declared mechanism"
// View 1 (Beat 0): Permutation equivariance: shuffling [function, returns, the] -> [the, function, returns]
//         moves unmasked self-attention outputs identically with each row.
// View 2 (Beat 1): Learned position table rows 0, 1, 2 hits a hard boundary at position 3.
// View 3 (Beat 2): Dual luminous RoPE phase rotors rotating query (pos 4->6) & key (pos 1->3)
//         while preserving relative angle 0.3 rad and dot product cos(0.3) = 0.955.
import { arrow, circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  INPUT,
  ROLE,
  TOK_COLORS,
  WORDS,
  cinemaAtmosphere,
  fmt,
  glowVector,
  playCue,
  position,
  swapVis,
  unmaskedRead,
  vectorRow,
} from '../parts.mjs';

export default function positionDesigns(s, c) {
  const title = heroTitle(['Position encoding:', 'how models know order'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.pos,
  });

  const vPerm = s.value(1);
  const vTable = s.value(0);
  const vRope = s.value(0);

  const permProg = s.value(0); // 0 -> 1 moves row 2 ("the") to top
  const tableBound = s.value(0); // Beat 1: highlights missing position 3
  const ropePair = s.value(0); // Beat 2: shows pos 4 & pos 1 dot product 0.955
  const ropeShift = s.value(0); // Beat 2: shifts both positions +2 -> pos 6 & pos 3

  const unmaskedOut = unmaskedRead(INPUT);
  const destIdx = [1, 2, 0]; // function->1, returns->2, the->0

  // VIEW 1: Permutation equivariance (unmasked attention: stationary left rows -> curved glowing ribbons -> permuted right outputs!)
  const permLayer = guardedDynamic(vPerm, (alpha) => {
    const pp = permProg.value;
    const baseYs = [-145, 30, 205];
    const nodes = [
      txt(
        'Unmasked self-attention: shuffle inputs -> outputs follow intact',
        0,
        -275,
        28,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      txt('input rows (Q = K = V)', -410, -215, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        pp > 0.5 ? 'permuted outputs (same values!)' : 'unmasked outputs',
        455,
        -215,
        26,
        pp > 0.5 ? ROLE.query : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    WORDS.forEach((word, i) => {
      const yLeft = baseYs[i];
      const yRight = baseYs[destIdx[i]];
      const col = TOK_COLORS[i];

      // Stationary input rows on left
      nodes.push(
        vectorRow({
          cx: -410,
          cy: yLeft,
          values: INPUT[i],
          cellW: 118,
          cellH: 68,
          gap: 10,
          color: col,
          digits: 2,
          fontSize: 26,
          label: word,
          opacity: alpha,
        }),
      );

      // Curved glowing permutation ribbons tracing cleanly between left and right columns
      const p0 = [-135, yLeft];
      const p1 = [175, pp > 0.05 ? yRight : yLeft];
      const lift = i === 2 ? -65 : 35;
      const midX = (p0[0] + p1[0]) / 2;
      const midY = (p0[1] + p1[1]) / 2 + lift * pp;
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const t = k / 24;
        const u = 1 - t;
        pts.push([
          u * u * p0[0] + 2 * u * t * midX + t * t * p1[0],
          u * u * p0[1] + 2 * u * t * midY + t * t * p1[1],
        ]);
      }
      const cnt = Math.max(2, Math.round(pts.length * Math.max(0.15, pp)));
      nodes.push(
        glowingTrail(pts.slice(0, cnt), {
          color: col,
          width: i === 2 ? 4.8 : 3.2,
          glow: i === 2 ? 12 : 6,
          opacity: (0.45 + 0.55 * pp) * alpha,
        }),
      );

      // Clean sequential fade-out of original order (0..0.42), fade-in of permuted order (0.58..1.0)
      if (pp < 0.45) {
        const op = (1 - pp / 0.45) * alpha;
        nodes.push(
          vectorRow({
            cx: 455,
            cy: yLeft,
            values: unmaskedOut[i],
            cellW: 118,
            cellH: 68,
            gap: 10,
            color: col,
            digits: 2,
            fontSize: 26,
            opacity: op,
          }),
        );
      } else if (pp > 0.55) {
        const op = ((pp - 0.55) / 0.45) * alpha;
        nodes.push(
          vectorRow({
            cx: 455,
            cy: yRight,
            values: unmaskedOut[i],
            cellW: 118,
            cellH: 68,
            gap: 10,
            color: col,
            digits: 2,
            fontSize: 26,
            opacity: op,
          }),
        );
      }
    });

    nodes.push(
      txt(
        'Without order signals, unmasked attention is permutation equivariant  ·  causal mask breaks symmetry',
        0,
        380,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Learned absolute position table boundary
  const tableLayer = guardedDynamic(vTable, (alpha) => {
    const tb = tableBound.value;
    const nodes = [
      txt(
        'Learned absolute position table (T_max = 3)',
        0,
        -265,
        32,
        ROLE.pos,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    [0, 1, 2, 3].forEach((posIdx) => {
      const y = -160 + posIdx * 120;
      const missing = posIdx === 3;
      const col = missing ? ROLE.mask : ROLE.stream;
      nodes.push(
        vectorRow({
          cx: 0,
          cy: y,
          values: missing ? ['?', '?', '?', '?'] : position(posIdx),
          cellW: 155,
          cellH: 72,
          gap: 16,
          color: col,
          digits: 2,
          label: `position ${posIdx}`,
          opacity: missing ? (0.35 + 0.65 * tb) * alpha : alpha,
        }),
      );
      if (missing && tb > 0.35) {
        nodes.push(
          txt('no stored row!', 430, y, 30, ROLE.mask, 'mono', 'left')
            .glow(8, ROLE.mask)
            .opacity(tb * alpha),
        );
      }
    });

    nodes.push(
      txt(
        'Extending beyond T_max requires adding table rows and evaluating longer context',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: RoPE rotary phase circles preserving relative angle 0.3 rad
  const ropeEq = glowTex('R_m^\\top R_n = R_{n - m}', {
    x: 495,
    y: -385,
    size: 40,
    color: ROLE.pos,
  });

  const ropeLayer = guardedDynamic(vRope, (alpha) => {
    const rp = ropePair.value;
    const sh = ropeShift.value;
    const shift = 2 * sh;
    const m = 4 + shift;
    const n = 1 + shift;
    const radM = m * 0.1;
    const radN = n * 0.1;
    const radius = 178;
    const centers = [-430, 430];
    const angles = [radM, radN];
    const positions = [m, n];
    const names = ['Query q', 'Key k'];
    const cols = [ROLE.attn, ROLE.pos];
    const nodes = [
      ropeEq.opacity(alpha),
      txt(
        'Start at [1, 0]  ·  rotate by 0.1 rad per position',
        0,
        -270,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    [0, 1].forEach((i) => {
      const cx = centers[i];
      const cy = 20;
      const ang = angles[i];
      const tipX = cx + radius * Math.cos(ang);
      const tipY = cy - radius * Math.sin(ang);

      // Arc showing rotation angle from 0 -> ang
      const arcPtsList = [];
      for (let k = 0; k <= 16; k++) {
        const a = (ang * k) / 16;
        arcPtsList.push([cx + 76 * Math.cos(a), cy - 76 * Math.sin(a)]);
      }

      nodes.push(
        circle(radius, { fill: ROLE.surface, stroke: '#3c4e7c', width: 2.2 })
          .at(cx, cy)
          .opacity(0.65 * alpha),
        line([cx - radius, cy], [cx + radius, cy], { stroke: '#334269', width: 1.6 }).opacity(
          alpha,
        ),
        line([cx, cy - radius], [cx, cy + radius], { stroke: '#334269', width: 1.6 }).opacity(
          alpha,
        ),
        glowingTrail(arcPtsList, {
          color: ROLE.query,
          width: 3.5,
          glow: 8,
          core: false,
          opacity: alpha,
        }),
        glowVector([cx, cy], [tipX, tipY], {
          color: cols[i],
          width: 5.5,
          glow: 12,
          opacity: alpha,
        }),
        txt(`${names[i]}  ·  pos ${fmt(positions[i], 0)}`, cx, -205, 32, cols[i], 'mono', 'center')
          .glow(6, cols[i])
          .opacity(alpha),
        txt(`angle = ${fmt(ang, 1)} rad`, cx, 248, 30, cols[i], 'mono', 'center').opacity(alpha),
      );
    });

    // Center relative invariant readout
    const dotVal = Math.cos(radM - radN); // exact cos(0.3) ≈ 0.955
    nodes.push(
      txt(
        rp > 0.35 ? `relative angle = 0.3 rad` : 'relative angle = ?',
        0,
        -25,
        30,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(rp > 0.35 ? 8 : 0, ROLE.query)
        .opacity(alpha),
      txt(
        rp > 0.35 ? `q · k = cos(0.3) = ${fmt(dotVal, 3)}` : 'q · k = ?',
        0,
        35,
        32,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(rp > 0.35 ? 9 : 0, ROLE.valid)
        .opacity(alpha),
      txt(
        sh > 0.5
          ? 'Both shifted +2  ->  relative angle & dot product stay identical'
          : 'T5 alternative: add learned relative-position bias directly to scores',
        0,
        370,
        28,
        sh > 0.5 ? ROLE.valid : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.pos, ROLE.attn), title, permLayer, tableLayer, ropeLayer);

  // Beat 0: permutation equivariance
  playCue(s, c, 'tr-position-designs-voice-0', (d) => s.play(permProg.to(1, { duration: d })), {
    dur: 1.5,
  });

  // Beat 1: learned position table & boundary
  playCue(
    s,
    c,
    'tr-position-designs-voice-1',
    (d) => s.play(swapVis(vPerm, vTable, Math.min(0.65, d * 0.4))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-position-designs-learned', (d) => s.play(tableBound.to(1, { duration: d })), {
    dur: 0.75,
  });

  // Beat 2: RoPE rotation + shift invariance
  playCue(
    s,
    c,
    'tr-position-designs-voice-2',
    (d) => s.play(swapVis(vTable, vRope, Math.min(0.65, d * 0.4))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-position-designs-rope', (d) => s.play(ropePair.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'tr-position-designs-rope-shift', (d) => s.play(ropeShift.to(1, { duration: d })), {
    dur: 1.0,
  });
}
