// Scene 16: flash: "Exact attention, with or without the grid"
// View 1: Orbiting 3D GPU HBM vs on-chip SRAM tiled streaming (cinematic3d + wireframeSlab3d)
//         paired with a live vertical SRAM <-> HBM memory-traffic conduit diagram (zero bullet cards).
// View 2: Live online softmax trace across Tile 1 ([1000, v=2]) and Tile 2 ([1001, v=1], [999, v=4]),
//         strictly withholding rescale factor (e^-1) and divisor choice (÷ mass -> 1.51) until spoken reveals.
// View 3: Exact forward/backward recompute cycle + visual miniature comparison of temporary T^2 score grid
//         (FlashAttention) vs persistent shrinking KV-cache ribbons (GQA / MQA).
import { arrow, gridPlane3d, line, seq } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  rule,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import { ROLE, TRACE, cinemaAtmosphere, fmt, lumBar, playCue, swapVis } from '../parts.mjs';

export default function flash(s, c) {
  const title = heroTitle(['FlashAttention:', 'exact attention in tiles'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.value,
  });

  // Three spacious sequential views: 1) 3D HBM/SRAM tiling, 2) Online softmax trace, 3) Exact trade & two fixes
  const vTiles = s.value(1);
  const vTrace = s.value(0);
  const vCompare = s.value(0);

  // View 1 state (naive 4 HBM trips -> FlashAttention streaming tiles)
  const tripCount = s.value(0); // 0..4 HBM round-trips
  const tileMode = s.value(0); // 0 = naive HBM grid, 1 = on-chip SRAM streaming
  const kvStreamZ = s.value(-2.2); // animates K/V tile slab streaming past resident Q slab in 3D
  const showOnlineRules = s.value(0);

  // 3D GPU SRAM/HBM tile slab rig (shown ONLY during View 1, hidden cleanly on swap)
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.05,
    distance: 15.6,
    unit: 90,
    focus: [0, 0, 0.2],
  }).at(430, -10);

  const floor3d = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.6, 2.6],
    z: -1.4,
    step: 1,
    color: '#2b3d69',
    opacity: 0.45,
  });
  const qSlab = wireframeSlab3d([-1.3, 0, 0.55], 1.15, 0.9, 0.45, {
    color: ROLE.query,
    width: 3,
    glow: 10,
  });
  const kvSlab = wireframeSlab3d(() => [1.35, kvStreamZ.value, 0.55], 1.15, 0.85, 0.45, {
    color: ROLE.sing,
    width: 3,
    glow: 10,
  });
  const hbmSlab = wireframeSlab3d([0, 0, -1.05], 2.9, 2.2, 0.25, {
    color: ROLE.mask,
    width: 2.2,
    glow: 6,
  });
  view3d.add(floor3d, ...hbmSlab, ...qSlab, ...kvSlab);

  // View 2 state (Online softmax trace: strictly gated predictions)
  const step1Vis = s.value(0);
  const tile2Vis = s.value(0);
  const carryQVis = s.value(0);
  const rescaleVis = s.value(0);
  const addNewVis = s.value(0);
  const divChoiceVis = s.value(0);
  const divChosen = s.value(0);
  const finalOutVis = s.value(0);

  // View 3 state (exactness + FlashAttention vs GQA/MQA separation)
  const exactStep = s.value(0);
  const fixTrainLit = s.value(0.35);
  const fixGenLit = s.value(0.35);

  // VIEW 1: Visual SRAM <-> HBM Conduit Diagram + Orbiting 3D Tile Rig (zero boxed bullet cards)
  const tilesLayer = guardedDynamic(vTiles, (alpha) => {
    const tc = tripCount.value;
    const tm = tileMode.value;
    const or = showOnlineRules.value;
    const nodes = [];

    const lx = -435;
    const railL = -820;
    const railR = -50;
    const sramY = -125;
    const hbmY = 175;

    nodes.push(
      txt(
        tm > 0.5 ? 'FlashAttention: stream tiles in SRAM' : 'Naive kernel: 4 HBM round-trips',
        lx,
        -255,
        32,
        tm > 0.5 ? ROLE.value : ROLE.mask,
        'mono',
        'center',
      )
        .glow(6, tm > 0.5 ? ROLE.value : ROLE.mask)
        .opacity(alpha),
      // Top glowing SRAM hardware rail
      glowingTrail(
        [
          [railL, sramY],
          [railR, sramY],
        ],
        { color: ROLE.sing, width: 4.5, glow: 10, opacity: alpha },
      ),
      txt('Fast On-Chip SRAM', railL, sramY - 36, 26, ROLE.sing, 'mono', 'left').opacity(alpha),
      // Bottom glowing HBM main memory rail
      glowingTrail(
        [
          [railL, hbmY],
          [railR, hbmY],
        ],
        { color: ROLE.mask, width: 4.5, glow: 10, opacity: alpha },
      ),
      txt(
        'Slow HBM Main Memory (T×T grid)',
        railL,
        hbmY + 42,
        26,
        ROLE.mask,
        'mono',
        'left',
      ).opacity(alpha),
    );

    if (tm < 0.5) {
      // 4 animated glowing vertical traffic conduits between SRAM & HBM
      const conduits = [
        { x: -725, dir: 'down', tag: '1. Write S', idx: 1 },
        { x: -535, dir: 'up', tag: '2. Read S', idx: 2 },
        { x: -345, dir: 'down', tag: '3. Write P', idx: 3 },
        { x: -155, dir: 'up', tag: '4. Read P', idx: 4 },
      ];
      conduits.forEach((tr) => {
        const on = tc >= tr.idx - 0.15;
        const op = (on ? 1 : 0.26) * alpha;
        // Split each vertical conduit cleanly above and below the midpoint label so no stroke crosses text
        if (tr.dir === 'down') {
          nodes.push(
            line([tr.x, sramY + 22], [tr.x, -8], { stroke: ROLE.mask, width: on ? 4.5 : 2.2 })
              .glow(on ? 9 : 0, ROLE.mask)
              .opacity(op),
            arrow([tr.x, 58], [tr.x, hbmY - 22], {
              stroke: ROLE.mask,
              width: on ? 4.5 : 2.2,
              tip: 15,
            })
              .glow(on ? 9 : 0, ROLE.mask)
              .opacity(op),
          );
        } else {
          nodes.push(
            line([tr.x, hbmY - 22], [tr.x, 58], { stroke: ROLE.mask, width: on ? 4.5 : 2.2 })
              .glow(on ? 9 : 0, ROLE.mask)
              .opacity(op),
            arrow([tr.x, -8], [tr.x, sramY + 22], {
              stroke: ROLE.mask,
              width: on ? 4.5 : 2.2,
              tip: 15,
            })
              .glow(on ? 9 : 0, ROLE.mask)
              .opacity(op),
          );
        }
        nodes.push(
          txt(tr.tag, tr.x, 25, 26, on ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(op),
        );
      });
      nodes.push(
        txt(
          'Memory traffic outweighs the arithmetic',
          lx,
          290,
          28,
          ROLE.amber,
          'sans',
          'center',
        ).opacity((tc >= 3.5 ? 1 : 0.35) * alpha),
      );
    } else {
      // Single clean on-chip SRAM loop: Q resident + K,V tiles stream in -> 3 running stats (m, l, acc)
      const qX = -675;
      const kvX = -435;
      const stX = -175;
      nodes.push(
        // Glowing single K,V read beam split cleanly around its midpoint label (zero stroke crossing text)
        line([kvX, hbmY - 22], [kvX, 78], { stroke: ROLE.value, width: 4.5 })
          .glow(9, ROLE.value)
          .opacity(alpha),
        arrow([kvX, 12], [kvX, sramY + 34], { stroke: ROLE.value, width: 4.5, tip: 15 })
          .glow(9, ROLE.value)
          .opacity(alpha),
        txt('stream K, V tiles', kvX, 45, 26, ROLE.value, 'mono', 'center').opacity(alpha),
        txt('No T×T write!', -675, 45, 26, ROLE.dim, 'mono', 'center').opacity(alpha),
        // Floating on-chip actors along SRAM rail (zero card boxes)
        glowDot(qX, sramY, { radius: 11, color: ROLE.query, glow: 14 }).opacity(alpha),
        txt('Q resident', qX, sramY + 46, 26, ROLE.query, 'mono', 'center').opacity(alpha),
        glowDot(kvX, sramY, { radius: 11, color: ROLE.sing, glow: 14 }).opacity(alpha),
        arrow([qX + 26, sramY], [kvX - 26, sramY], {
          stroke: ROLE.query,
          width: 3,
          tip: 12,
        }).opacity(alpha),
        arrow([kvX + 26, sramY], [stX - 26, sramY], {
          stroke: ROLE.value,
          width: 3,
          tip: 12,
        }).opacity(alpha),
        glowDot(stX, sramY, { radius: 11, color: ROLE.value, glow: 14 }).opacity(alpha),
        txt('m, l, acc', stX, sramY + 46, 26, ROLE.value, 'mono', 'center').opacity(alpha),
        // Floating online-softmax running-stat rule below HBM rail (no boxes!)
        txt(
          'Running stats: max m  ·  mass l  ·  weighted sum acc',
          lx,
          292,
          26,
          or >= 0.4 ? ROLE.amber : COSMOS.dim,
          'mono',
          'center',
        ).opacity((0.35 + 0.65 * Math.min(1, or / 0.5)) * alpha),
        txt(
          'New peak? Rescale old sums by  e^(m_old − m_new)',
          lx,
          350,
          28,
          or >= 0.85 ? ROLE.query : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(or >= 0.85 ? 7 : 0, ROLE.query)
          .opacity((0.28 + 0.72 * Math.max(0, (or - 0.5) * 2)) * alpha),
      );
    }

    // 3D viewport floating captions cleanly above and below the 3D slabs
    nodes.push(
      txt(
        'On-chip SRAM: Q block + streaming K,V tile',
        430,
        -345,
        28,
        ROLE.sing,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Base layer: slow HBM main memory', 430, 428, 28, ROLE.mask, 'mono', 'center').opacity(
        alpha,
      ),
    );

    return nodes;
  });

  // VIEW 2: Worked Online Softmax Trace (Tile 1 -> Tile 2 -> Rescale -> Divisor Choice -> 1.51)
  const traceLayer = guardedDynamic(vTrace, (alpha) => {
    const s1 = step1Vis.value;
    const t2 = tile2Vis.value;
    const cq = carryQVis.value;
    const rs = rescaleVis.value;
    const an = addNewVis.value;
    const dc = divChoiceVis.value;
    const ch = divChosen.value;
    const fo = finalOutVis.value;
    const nodes = [];

    const lx = -660;
    nodes.push(
      lumBar(lx, -135, 390, 148, {
        color: ROLE.birds,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('Tile 1', lx, -172, 30, ROLE.birds, 'mono', 'center').opacity(alpha),
      txt('z=1000  ·  v=2', lx, -112, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      lumBar(lx, 75, 390, 178, {
        color: ROLE.sing,
        fillOpacity: t2 > 0.3 ? 0.24 : 0.12,
        strokeWidth: t2 > 0.3 ? 2.6 : 1.8,
        glow: t2 > 0.3 ? 9 : 4,
        opacity: (0.45 + 0.55 * t2) * alpha,
      }),
      txt('Tile 2 (two pairs)', lx, 22, 30, ROLE.sing, 'mono', 'center').opacity(
        (0.45 + 0.55 * t2) * alpha,
      ),
      txt('z=1001  ·  v=1', lx, 75, 28, ROLE.query, 'mono', 'center').opacity(
        (0.45 + 0.55 * t2) * alpha,
      ),
      txt('z= 999  ·  v=4', lx, 125, 28, COSMOS.ink, 'mono', 'center').opacity(
        (0.45 + 0.55 * t2) * alpha,
      ),
    );

    const rx = 315;
    const cols = [rx - 255, rx, rx + 265];
    const lblX = -105;
    nodes.push(
      txt('peak  m', cols[0], -235, 30, ROLE.query, 'mono', 'center').opacity(alpha),
      txt('mass  l', cols[1], -235, 30, ROLE.sing, 'mono', 'center').opacity(alpha),
      txt('weighted  acc', cols[2], -235, 30, ROLE.value, 'mono', 'center').opacity(alpha),
    );

    const r1Op = (0.45 + 0.55 * s1) * alpha;
    nodes.push(
      txt('Tile 1:', lblX, -145, 26, COSMOS.muted, 'sans', 'right').opacity(r1Op),
      lumBar(cols[0], -145, 195, 72, { color: ROLE.query, fillOpacity: 0.22, opacity: r1Op }),
      txt(s1 > 0.3 ? '1000' : '?', cols[0], -145, 32, ROLE.query, 'mono', 'center').opacity(r1Op),
      lumBar(cols[1], -145, 195, 72, { color: ROLE.sing, fillOpacity: 0.22, opacity: r1Op }),
      txt(
        s1 > 0.3 ? fmt(TRACE.steps[0].sum, 2) : '?',
        cols[1],
        -145,
        32,
        ROLE.sing,
        'mono',
        'center',
      ).opacity(r1Op),
      lumBar(cols[2], -145, 220, 72, { color: ROLE.value, fillOpacity: 0.22, opacity: r1Op }),
      txt(
        s1 > 0.3 ? fmt(TRACE.steps[0].weighted, 2) : '?',
        cols[2],
        -145,
        32,
        ROLE.value,
        'mono',
        'center',
      ).opacity(r1Op),
    );

    if (cq > 0.1 && rs < 0.1) {
      nodes.push(
        txt(
          'New max 1001 (was 1000): what rescale factor on old l & acc?',
          rx,
          -15,
          28,
          ROLE.query,
          'sans',
          'center',
        )
          .glow(7, ROLE.query)
          .opacity(cq * alpha),
      );
    }
    if (rs > 0.1) {
      const rScale = TRACE.steps[1].rescale;
      nodes.push(
        txt('× e⁻¹ (0.37):', lblX, -20, 26, ROLE.amber, 'mono', 'right').opacity(rs * alpha),
        lumBar(cols[0], -20, 195, 72, {
          color: ROLE.amber,
          fillOpacity: 0.22,
          opacity: rs * alpha,
        }),
        txt('1001', cols[0], -20, 32, ROLE.amber, 'mono', 'center').opacity(rs * alpha),
        lumBar(cols[1], -20, 195, 72, { color: ROLE.sing, fillOpacity: 0.2, opacity: rs * alpha }),
        txt(fmt(rScale, 2), cols[1], -20, 32, ROLE.sing, 'mono', 'center').opacity(rs * alpha),
        lumBar(cols[2], -20, 220, 72, { color: ROLE.value, fillOpacity: 0.2, opacity: rs * alpha }),
        txt(fmt(2 * rScale, 2), cols[2], -20, 32, ROLE.value, 'mono', 'center').opacity(rs * alpha),
      );
    }

    if (an > 0.1) {
      nodes.push(
        txt('+ Tile 2:', lblX, 105, 26, ROLE.value, 'mono', 'right').opacity(an * alpha),
        lumBar(cols[0], 105, 195, 72, {
          color: ROLE.query,
          fillOpacity: 0.24,
          opacity: an * alpha,
        }),
        txt('1001', cols[0], 105, 32, ROLE.query, 'mono', 'center').opacity(an * alpha),
        lumBar(cols[1], 105, 195, 72, { color: ROLE.sing, fillOpacity: 0.26, opacity: an * alpha }),
        txt(fmt(TRACE.steps[1].sum, 3), cols[1], 105, 32, ROLE.sing, 'mono', 'center').opacity(
          an * alpha,
        ),
        lumBar(cols[2], 105, 220, 72, {
          color: ROLE.value,
          fillOpacity: 0.26,
          opacity: an * alpha,
        }),
        txt(
          fmt(TRACE.steps[1].weighted, 3),
          cols[2],
          105,
          32,
          ROLE.value,
          'mono',
          'center',
        ).opacity(an * alpha),
      );
    }

    if (dc > 0.1) {
      const massCol = ch > 0.5 ? ROLE.value : ROLE.query;
      const cntCol = ch > 0.5 ? ROLE.dim : ROLE.query;
      nodes.push(
        txt(
          `A: divide by mass (${fmt(TRACE.steps[1].sum, 3)})`,
          -250,
          275,
          30,
          massCol,
          'mono',
          'center',
        )
          .glow(ch > 0.5 ? 10 : 4, massCol)
          .opacity(dc * alpha),
        txt('B: divide by count (3)', 280, 275, 30, cntCol, 'mono', 'center').opacity(
          (ch > 0.5 ? 0.35 : 1) * dc * alpha,
        ),
      );
    }

    if (fo > 0.1) {
      nodes.push(
        txt(
          `2.277 ÷ 1.503 = ${fmt(TRACE.output, 2)}   (exact match to full-row softmax!)`,
          0,
          385,
          34,
          ROLE.value,
          'mono',
          'center',
        )
          .glow(9, ROLE.value)
          .opacity(fo * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Visual Recompute Pipeline + Side-by-Side Mechanism Diagrams (ZERO rectangular prose cards!)
  const compareLayer = guardedDynamic(vCompare, (alpha) => {
    const es = exactStep.value;
    const ft = fixTrainLit.value;
    const fg = fixGenLit.value;
    const nodes = [];

    // Top: Clean visual forward -> O(T) stats -> backward recompute pipeline (floating dots + glowing arrows)
    const pipeY = -195;
    const bwdOn = es >= 1.5;
    nodes.push(
      glowDot(-640, pipeY, { radius: 12, color: ROLE.value, glow: 14 }).opacity(alpha),
      txt('Forward tiles', -640, pipeY - 46, 26, ROLE.value, 'mono', 'center').opacity(alpha),
      txt('exact output', -640, pipeY + 46, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
      arrow([-610, pipeY], [-120, pipeY], { stroke: ROLE.value, width: 3.5, tip: 14 })
        .glow(6, ROLE.value)
        .opacity(alpha),
      txt('drop T² scores', -365, pipeY - 30, 26, ROLE.dim, 'mono', 'center').opacity(alpha),

      glowDot(-80, pipeY, { radius: 12, color: ROLE.query, glow: 14 }).opacity(alpha),
      txt('Save O(T) stats', -80, pipeY - 46, 26, ROLE.query, 'mono', 'center').opacity(alpha),
      txt('(m, l per row)', -80, pipeY + 46, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      arrow([-50, pipeY], [440, pipeY], {
        stroke: bwdOn ? ROLE.amber : ROLE.dim,
        width: 3.5,
        tip: 14,
      })
        .glow(bwdOn ? 7 : 0, ROLE.amber)
        .opacity((bwdOn ? 1 : 0.4) * alpha),
      txt(
        'extra SRAM FLOPs',
        195,
        pipeY - 30,
        26,
        bwdOn ? ROLE.amber : ROLE.dim,
        'mono',
        'center',
      ).opacity((bwdOn ? 1 : 0.4) * alpha),

      glowDot(480, pipeY, {
        radius: 12,
        color: bwdOn ? ROLE.amber : ROLE.dim,
        glow: bwdOn ? 14 : 4,
      }).opacity((bwdOn ? 1 : 0.45) * alpha),
      txt(
        'Backward recompute',
        480,
        pipeY - 46,
        26,
        bwdOn ? ROLE.amber : ROLE.dim,
        'mono',
        'center',
      ).opacity((bwdOn ? 1 : 0.45) * alpha),
      txt('fewer HBM trips', 480, pipeY + 46, 26, COSMOS.muted, 'sans', 'center').opacity(
        (bwdOn ? 1 : 0.45) * alpha,
      ),
    );

    // Subtle hairline separator between the two orthogonal fixes
    nodes.push(
      rule(-820, -68, 820, -68, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      rule(0, -15, 0, 395, COSMOS.rule, 1.8).opacity(0.55 * alpha),
    );

    // LEFT MECHANISM: FlashAttention -> temporary 4x4 T^2 score grid dissolving into O(T) output column!
    const flOp = (0.4 + 0.6 * ft) * alpha;
    const gX = -565;
    const gY = 148;
    const cs = 38;
    nodes.push(
      txt('FlashAttention', -435, -18, 38, ROLE.value, 'serif', 'center')
        .glow(ft > 0.7 ? 8 : 0, ROLE.value)
        .opacity(flOp),
    );
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        const isTile = r === 1 && k === 2;
        nodes.push(
          lumBar(gX + (k - 1.5) * (cs + 6), gY + (r - 1.5) * (cs + 6), cs, cs, {
            color: isTile ? ROLE.value : ROLE.mask,
            fillOpacity: isTile ? 0.55 : 0.14,
            strokeWidth: isTile ? 2.6 : 1.3,
            glow: isTile ? 9 : 2,
            radius: 5,
            opacity: flOp,
          }),
        );
      }
    }
    nodes.push(
      arrow([gX + 115, gY], [-290, gY], { stroke: ROLE.value, width: 3.6, tip: 13 }).opacity(flOp),
      lumBar(-235, gY, 44, 170, {
        color: ROLE.value,
        fillOpacity: 0.4,
        strokeWidth: 2.5,
        glow: 9,
        radius: 6,
        opacity: flOp,
      }),
      txt('O(T)', -235, gY - 114, 26, ROLE.value, 'mono', 'center').opacity(flOp),
      txt('T×T transient grid', gX, gY + 120, 26, ROLE.mask, 'mono', 'center').opacity(flOp),
      txt('Training & prompt prefill', -435, 322, 28, COSMOS.ink, 'sans', 'center').opacity(flOp),
      txt('Temporary score memory', -435, 372, 26, ROLE.query, 'mono', 'center').opacity(flOp),
    );

    // RIGHT MECHANISM: GQA / MQA -> persistent KV cache ribbons shrinking (64 -> 8 -> 1 KV heads)!
    const gqOp = (0.4 + 0.6 * fg) * alpha;
    nodes.push(
      txt('GQA / MQA', 435, -18, 38, ROLE.sing, 'serif', 'center')
        .glow(fg > 0.7 ? 8 : 0, ROLE.sing)
        .opacity(gqOp),
    );
    const kvRows = [
      { y: 92, w: 460, label: '64 KV', col: ROLE.mask },
      { y: 152, w: 165, label: '8 KV', col: ROLE.sing },
      { y: 212, w: 58, label: '1 KV', col: ROLE.value },
    ];
    kvRows.forEach((kr) => {
      nodes.push(
        txt(kr.label, 145, kr.y, 26, kr.col, 'mono', 'left').opacity(gqOp),
        lumBar(255 + kr.w / 2, kr.y, kr.w, 34, {
          color: kr.col,
          fillOpacity: 0.36,
          strokeWidth: 2.2,
          glow: 7,
          radius: 6,
          opacity: gqOp,
        }),
      );
    });
    nodes.push(
      txt('Autoregressive decoding', 435, 322, 28, COSMOS.ink, 'sans', 'center').opacity(gqOp),
      txt('Persistent KV cache state', 435, 372, 26, ROLE.query, 'mono', 'center').opacity(gqOp),
    );

    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.value, ROLE.sing),
    title,
    view3d,
    tilesLayer,
    traceLayer,
    compareLayer,
  );

  // Bounded 3D orbit during View 1 (before switching to View 2 at try-it)
  const tryAt = c.cue('try-it').start;
  const orbitDur = Math.max(1, tryAt - c.start - 0.8);
  c.at(0.2, () => {
    s.play(view3d.orbit({ theta: -0.22, phi: 0.96, distance: 14.2 }, { duration: orbitDur }));
  });

  // Beat 0: Naive kernel 4 HBM round-trips
  playCue(s, c, 'naive', (d) => s.play(tripCount.to(0.5, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'write-grid', (d) => s.play(tripCount.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'read-softmax', (d) => s.play(tripCount.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'write-result', (d) => s.play(tripCount.to(3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'read-mix', (d) => s.play(tripCount.to(4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'trips', (d) => s.play(tripCount.to(4, { duration: d })), { dur: 0.3 });

  // Beat 1: FlashAttention SRAM tile streaming (animate 3D K/V slab sliding past Q)
  playCue(s, c, 'simple-point', (d) => s.play(tileMode.to(0.5, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'dont-store', (d) => s.play(tileMode.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'hold-block', (d) => s.play(kvStreamZ.to(-0.8, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'stream', (d) => s.play(kvStreamZ.to(1.8, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'called-tiles', (d) => s.play(kvStreamZ.to(0.2, { duration: d })), { dur: 0.55 });

  // Beat 2: Online softmax running numbers + rescale rule
  playCue(s, c, 'need-largest', (d) => s.play(showOnlineRules.to(0.3, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'two-running', (d) => s.play(showOnlineRules.to(0.5, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'adds-one', (d) => s.play(showOnlineRules.to(0.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'rescale', (d) => s.play(showOnlineRules.to(0.9, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'shrink-carry', (d) => s.play(showOnlineRules.to(1, { duration: d })), {
    dur: 0.4,
  });

  // Beat 3: Switch cleanly from 3D tiles to View 2 (hide view3d) + Tile 1 state
  c.hide('try-it', view3d);
  playCue(s, c, 'try-it', (d) => s.play(swapVis(vTiles, vTrace, d)), { dur: 0.65 });
  playCue(s, c, 'first-tile', (d) => s.play(step1Vis.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'first-state', (d) => s.play(step1Vis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 4: Tile 2 inputs + rescale factor question (WITHHELD)
  playCue(s, c, 'next-tile', (d) => s.play(tile2Vis.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'paired-inputs', (d) => s.play(tile2Vis.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'carry-question', (d) => s.play(carryQVis.to(1, { duration: d })), { dur: 0.45 });

  // Beat 5: Reveal e^-1 AFTER rises -> add Tile 2 -> divisor choice (WITHHELD)
  playCue(
    s,
    c,
    'rises',
    (d) =>
      s.play(
        seq(
          carryQVis.to(0, { duration: Math.min(0.18, d * 0.4) }),
          rescaleVis.to(1, { duration: d * 0.6 }),
        ),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(s, c, 'high-term', (d) => s.play(addNewVis.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'low-term', (d) => s.play(addNewVis.to(0.85, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'add-new', (d) => s.play(addNewVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'choose-divisor', (d) => s.play(divChoiceVis.to(1, { duration: d })), {
    dur: 0.45,
  });

  // Beat 6: Reveal mass divisor & 1.51 exact match AFTER each clause
  playCue(s, c, 'use-mass', (d) => s.play(divChosen.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'divide-end', (d) => s.play(finalOutVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'full-row', (d) => s.play(finalOutVis.to(1, { duration: d })), { dur: 0.3 });

  // Beat 7-8: Switch to View 3 (Exactness + Backward recompute + FlashAttention vs GQA/MQA)
  playCue(s, c, 'exact', (d) => s.play(swapVis(vTrace, vCompare, d)), { dur: 0.65 });
  playCue(s, c, 'allowed-pairs', (d) => s.play(exactStep.to(0.6, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'goes-away', (d) => s.play(exactStep.to(1.0, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'row-stats', (d) => s.play(exactStep.to(1.3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'backward', (d) => s.play(exactStep.to(1.8, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'trade', (d) => s.play(exactStep.to(2.2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'measure-it', (d) => s.play(exactStep.to(2.6, { duration: d })), { dur: 0.35 });
  playCue(
    s,
    c,
    'apart',
    (d) => s.play(fixTrainLit.to(0.6, { duration: d }), fixGenLit.to(0.6, { duration: d })),
    { dur: 0.4 },
  );
  playCue(
    s,
    c,
    'fix-train',
    (d) => s.play(fixTrainLit.to(1, { duration: d }), fixGenLit.to(0.35, { duration: d })),
    { dur: 0.45 },
  );
  playCue(
    s,
    c,
    'fix-generate',
    (d) => s.play(fixTrainLit.to(0.75, { duration: d }), fixGenLit.to(1, { duration: d })),
    { dur: 0.45 },
  );

  void line;
  void glowTex;
}
