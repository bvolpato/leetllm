// Scene 10: heads: "One token read by several heads"
// View 1: 4-dim state splits into Head 1 ([1.42, 1.58]) & Head 2 (withheld prediction -> 2nd coord [0.33, 0.67])
//         -> Concat -> W_O -> + residual x.
// View 2: 1 wide head (d=512) vs 8 narrow heads (d=64) over T=8 tokens: same FLOPs, 8× score memory (64 vs 512).
// View 3: Two example heads tracing reader rows (garden -> sing) + counterfactual test ("At dawn birds sing").
import { arrow } from 'vizmatic/stage';
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  HEAD2_OUTPUT,
  HEAD2_WEIGHTS,
  OUTPUT,
  ROLE,
  WEIGHTS,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  swapVis,
  vecStr,
} from '../parts.mjs';

export default function heads(s, c) {
  const title = heroTitle(['Multi-head attention:', 'parallel readings'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.head,
  });

  // Three sequential full-bleed views
  const vSplit = s.value(1);
  const vMem = s.value(0);
  const vPatterns = s.value(0);

  // View 1 state
  const head1Lit = s.value(0.3);
  const head2Lit = s.value(0.2);
  const head2Vals = s.value(0);
  const head2Shares = s.value(0);
  const head2Q = s.value(0); // question prompt
  const head2Ans = s.value(0); // STRICTLY after larger-coordinate / lands-two!
  const concatLit = s.value(0);
  const outMatLit = s.value(0);
  const residLit = s.value(0);

  // View 2 state (1×512 vs 8×64)
  const memPair = s.value(0);
  const memEight = s.value(0);
  const memTotals = s.value(0);

  // View 3 state (example head heatmaps)
  const patRow = s.value(0); // 0 = garden (row 3), 1 = sing (row 4)
  const patTest = s.value(0); // counterfactual sentence "At dawn birds sing"

  // VIEW 1: Parallel Head 1 & Head 2 -> Concat -> W_O -> + x
  const splitLayer = guardedDynamic(vSplit, (alpha) => {
    const nodes = [];
    const h1 = head1Lit.value;
    const h2 = head2Lit.value;
    const cL = concatLit.value;
    const oL = outMatLit.value;
    const rL = residLit.value;

    // Input 4-dim state on left
    const sx = -755;
    const sy = 40;
    nodes.push(
      lumBar(sx, sy, 185, 130, {
        color: COSMOS.ink,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('state x', sx, sy - 22, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('width 4', sx, sy + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Conduits splitting to Head 1 (top) and Head 2 (bottom)
    nodes.push(
      glowingTrail(arcPts([sx + 98, sy - 18], [-440, -145], -45, 22), {
        color: ROLE.sing,
        width: 3.5,
        glow: 8,
        opacity: (0.35 + 0.65 * h1) * alpha,
      }),
      glowingTrail(arcPts([sx + 98, sy + 18], [-440, 195], 45, 22), {
        color: ROLE.head,
        width: 3.5,
        glow: 8,
        opacity: (0.35 + 0.65 * h2) * alpha,
      }),
    );

    // Head 1 luminous band (top center)
    const hx = -135;
    const h1y = -145;
    nodes.push(
      lumBar(hx, h1y, 620, 175, {
        color: ROLE.sing,
        fillOpacity: 0.14 + 0.16 * h1,
        strokeWidth: 2.4,
        glow: 8 * h1,
        opacity: (0.4 + 0.6 * h1) * alpha,
      }),
      txt('Head 1  (width 2)', hx, h1y - 52, 30, ROLE.sing, 'mono', 'center').opacity(
        (0.4 + 0.6 * h1) * alpha,
      ),
      txt(
        `Birds ${pct(WEIGHTS[1][0])} · sing ${pct(WEIGHTS[1][1])}`,
        hx,
        h1y - 2,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity((0.4 + 0.6 * h1) * alpha),
      txt(`out₁ = ${vecStr(OUTPUT[1], 2)}`, hx, h1y + 48, 30, ROLE.query, 'mono', 'center').opacity(
        (0.4 + 0.6 * h1) * alpha,
      ),
    );

    // Head 2 luminous band (bottom center): withholds answer until head2Ans!
    const h2y = 195;
    nodes.push(
      lumBar(hx, h2y, 620, 225, {
        color: ROLE.head,
        fillOpacity: 0.14 + 0.18 * h2,
        strokeWidth: 2.6,
        glow: 10 * h2,
        opacity: (0.35 + 0.65 * h2) * alpha,
      }),
      txt('Head 2  (width 2)', hx, h2y - 76, 30, ROLE.head, 'mono', 'center').opacity(
        (0.35 + 0.65 * h2) * alpha,
      ),
    );
    if (head2Vals.value > 0.05) {
      nodes.push(
        txt(
          'v_Birds = [0, 1]   v_sing = [1, 0]',
          hx,
          h2y - 24,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(head2Vals.value * alpha),
      );
    }
    if (head2Shares.value > 0.05) {
      nodes.push(
        txt(
          `shares: Birds ${pct(HEAD2_WEIGHTS[0])} · sing ${pct(HEAD2_WEIGHTS[1])}`,
          hx,
          h2y + 24,
          28,
          ROLE.head,
          'mono',
          'center',
        ).opacity(head2Shares.value * alpha),
      );
    }
    if (head2Q.value > 0.05 && head2Ans.value < 0.05) {
      nodes.push(
        txt('Which coord is larger?  [?, ?]', hx, h2y + 76, 28, ROLE.query, 'mono', 'center')
          .glow(6, ROLE.query)
          .opacity(head2Q.value * alpha),
      );
    }
    if (head2Ans.value > 0.05) {
      nodes.push(
        txt(
          `2nd coord → ${vecStr(HEAD2_OUTPUT, 2)}`,
          hx,
          h2y + 76,
          30,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(8, ROLE.query)
          .opacity(head2Ans.value * alpha),
      );
    }

    // Right pipeline: Concat (4-dim) -> W_O -> + residual x
    const cx = 435;
    const ox = 720;
    nodes.push(
      glowingTrail(arcPts([hx + 318, h1y], [cx - 115, 20], 20, 20), {
        color: ROLE.sing,
        width: 3,
        glow: 6,
        opacity: (0.22 + 0.78 * cL) * alpha,
      }),
      glowingTrail(arcPts([hx + 318, h2y], [cx - 115, 60], -20, 20), {
        color: ROLE.head,
        width: 3,
        glow: 6,
        opacity: (0.22 + 0.78 * cL) * alpha,
      }),
      lumBar(cx, 40, 210, 146, {
        color: ROLE.query,
        fillOpacity: 0.14 + 0.2 * cL,
        strokeWidth: 2.4,
        glow: 8 * cL,
        opacity: (0.28 + 0.72 * cL) * alpha,
      }),
      txt('Concat', cx, 10, 32, ROLE.query, 'mono', 'center').opacity((0.28 + 0.72 * cL) * alpha),
      txt('4 numbers', cx, 62, 26, COSMOS.muted, 'mono', 'center').opacity(
        (0.28 + 0.72 * cL) * alpha,
      ),
      arrow([cx + 112, 40], [ox - 112, 40], { stroke: ROLE.value, width: 3.5, tip: 14 }).opacity(
        (0.25 + 0.75 * oL) * alpha,
      ),
      lumBar(ox, 40, 210, 146, {
        color: ROLE.value,
        fillOpacity: 0.14 + 0.24 * oL,
        strokeWidth: 2.5,
        glow: 9 * oL,
        opacity: (0.25 + 0.75 * oL) * alpha,
      }),
      txt('W_O', ox, 10, 36, ROLE.value, 'mono', 'center').opacity((0.25 + 0.75 * oL) * alpha),
      txt('mix heads', ox, 62, 26, COSMOS.muted, 'sans', 'center').opacity(
        (0.25 + 0.75 * oL) * alpha,
      ),
    );

    if (rL > 0.05) {
      nodes.push(
        txt('x  ←  x + W_O · Concat(h₁, h₂)', 510, 235, 32, ROLE.value, 'mono', 'center')
          .glow(7, ROLE.value)
          .opacity(rL * alpha),
        txt(
          'Adjusts the token state rather than replacing it',
          510,
          295,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(rL * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: 1 wide head (d=512) vs 8 narrow heads (d=64), T=8 tokens
  const memLayer = guardedDynamic(vMem, (alpha) => {
    const mp = memPair.value;
    const me = memEight.value;
    const mt = memTotals.value;
    const nodes = [];

    nodes.push(
      txt(
        'T = 8 tokens   ·   total width d_model = 512',
        200,
        -355,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      // Left: 1 wide head
      txt('1 wide head  (d_k = 512)', -450, -210, 34, ROLE.sing, 'mono', 'center').opacity(alpha),
      lumBar(-450, -100, 460, 62, {
        color: ROLE.sing,
        fillOpacity: 0.3,
        strokeWidth: 2.4,
        glow: 8,
        opacity: alpha,
      }),
      txt('512 products / pair', -450, -100, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      // 8x8 single score grid representation
      lumBar(-450, 145, 340, 230, {
        color: ROLE.sing,
        fillOpacity: 0.16,
        strokeWidth: 2.5,
        glow: 7,
        opacity: alpha,
      }),
      txt('1 grid (8×8)', -450, 112, 30, ROLE.sing, 'mono', 'center').opacity(alpha),
      txt(mt > 0.5 ? '64 scores' : '1 score / pair', -450, 175, 32, ROLE.query, 'mono', 'center')
        .glow(6, ROLE.query)
        .opacity((0.35 + 0.65 * Math.max(mp, mt)) * alpha),

      // Right: 8 narrow heads
      txt('8 narrow heads  (8 × 64)', 360, -210, 34, ROLE.head, 'mono', 'center').opacity(alpha),
    );

    // 8 stacked narrow width slices
    for (let i = 0; i < 8; i++) {
      const bx = 360 - 245 + i * 70;
      nodes.push(
        lumBar(bx, -105, 56, 60, {
          color: ROLE.head,
          fillOpacity: 0.34,
          strokeWidth: 2,
          glow: 6,
          opacity: alpha,
        }),
      );
    }
    nodes.push(
      txt(
        '8 × 64 = 512 products / pair (same FLOPs)',
        360,
        -34,
        28,
        ROLE.value,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // 8 stacked 8x8 score grids fanning in depth
    for (let i = 0; i < 8; i++) {
      const gx = 200 + i * 44;
      const gy = 178 - i * 8;
      nodes.push(
        lumBar(gx, gy, 172, 172, {
          color: i === 7 ? ROLE.mask : ROLE.head,
          fillOpacity: 0.14 + (i === 7 ? 0.18 : 0),
          strokeWidth: i === 7 ? 2.8 : 1.6,
          glow: i === 7 ? 9 : 4,
          opacity: (0.45 + 0.55 * me) * alpha,
        }),
      );
    }

    nodes.push(
      txt(
        mt > 0.5 ? '8 grids = 512 scores (8× memory!)' : '8 scores / pair (8× softmax rows)',
        360,
        325,
        32,
        ROLE.mask,
        'mono',
        'center',
      )
        .glow(7, ROLE.mask)
        .opacity((0.3 + 0.7 * Math.max(me, mt)) * alpha),
    );

    return nodes;
  });

  // VIEW 3: Two example heads ("previous word" vs "first word / subject?") + counterfactual test
  const sent5 = ['Birds', 'in', 'the', 'garden', 'sing'];
  const patLayer = guardedDynamic(vPatterns, (alpha) => {
    const pr = patRow.value; // 0 = garden (row 3), 1 = sing (row 4)
    const activeRow = pr < 0.5 ? 3 : 4;
    const pt = patTest.value;
    const nodes = [];

    const drawHeadGrid = (cx, heading, accent, pickColForRow) => {
      const cell = 76;
      const gap = 10;
      const total = 5 * cell + 4 * gap;
      const left = cx - total / 2 + cell / 2;
      const top = -135;

      nodes.push(txt(heading, cx, top - 118, 32, accent, 'serif', 'center').opacity(alpha));
      sent5.forEach((w, k) => {
        nodes.push(
          txt(w, left + k * (cell + gap), top - 66, 26, COSMOS.muted, 'sans', 'center').opacity(
            alpha,
          ),
        );
      });
      for (let r = 0; r < 5; r++) {
        const cy = top + r * (cell + gap);
        const isReader = r === activeRow;
        nodes.push(
          txt(
            sent5[r],
            left - 58,
            cy,
            26,
            isReader ? ROLE.query : COSMOS.dim,
            'sans',
            'right',
          ).opacity(alpha),
        );
        const brightCol = pickColForRow(r);
        for (let k = 0; k < 5; k++) {
          const x = left + k * (cell + gap);
          const allowed = k <= r;
          const isPeak = isReader && k === brightCol;
          const col = !allowed ? ROLE.rule : isPeak ? ROLE.query : accent;
          nodes.push(
            lumBar(x, cy, cell, cell, {
              color: col,
              fillOpacity: !allowed ? 0.06 : isPeak ? 0.58 : isReader ? 0.2 : 0.1,
              strokeWidth: isPeak ? 3.2 : 1.4,
              glow: isPeak ? 12 : 3,
              radius: 8,
              opacity: alpha,
            }),
          );
          if (isPeak) {
            nodes.push(txt('★', x, cy, 30, COSMOS.ink, 'sans', 'center').opacity(alpha));
          }
        }
      }
    };

    drawHeadGrid(-410, 'Head A: shifts to previous word', ROLE.sing, (r) => Math.max(0, r - 1));
    drawHeadGrid(410, 'Head B: stays on "Birds"', ROLE.head, () => 0);

    // Bottom status / counterfactual test banner
    const footText =
      pt > 0.5
        ? 'Test hypothesis: "At dawn birds sing"  →  compare share on "At" vs "birds"'
        : activeRow === 3
          ? 'Reader "garden": Left picks "the"  ·  Right picks "Birds"'
          : 'Reader "sing": Left shifts to "garden"  ·  Right stays on "Birds"';
    nodes.push(
      txt(footText, 0, 390, 30, pt > 0.5 ? ROLE.query : COSMOS.ink, 'mono', 'center')
        .glow(pt > 0.5 ? 7 : 0, ROLE.query)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.head, ROLE.sing), title, splitLayer, memLayer, patLayer);

  // Beat 0: Multiple heads with own learned matrices
  playCue(
    s,
    c,
    'several',
    (d) => s.play(head1Lit.to(0.8, { duration: d }), head2Lit.to(0.8, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'own-matrices', (d) => s.play(head1Lit.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'one-big', (d) => s.play(head2Lit.to(1, { duration: d })), { dur: 0.4 });

  // Beat 1: Width 4 -> two heads of width 2 -> Head 1
  playCue(
    s,
    c,
    'whole-state',
    (d) => s.play(head1Lit.to(1, { duration: d }), head2Lit.to(0.45, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'head-one', (d) => s.play(head1Lit.to(1, { duration: d })), { dur: 0.4 });

  // Beat 2: Head 2 values, 67%/33% shares, prediction question (WITHHELD!)
  playCue(
    s,
    c,
    'head-two',
    (d) => s.play(head1Lit.to(0.45, { duration: d }), head2Lit.to(1, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'its-values', (d) => s.play(head2Vals.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'sixty-seven', (d) => s.play(head2Shares.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'compare-coordinates', (d) => s.play(head2Q.to(1, { duration: d })), { dur: 0.4 });

  // Beat 3: Spoken reveal AFTER larger-coordinate & lands-two!
  playCue(
    s,
    c,
    'larger-coordinate',
    (d) => s.play(head2Q.to(0, { duration: Math.min(0.15, d) }), head2Ans.to(1, { duration: d })),
    { after: true, dur: 0.4 },
  );
  playCue(s, c, 'lands-two', (d) => s.play(head2Ans.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'different',
    (d) => s.play(head1Lit.to(1, { duration: d }), head2Lit.to(1, { duration: d })),
    {
      dur: 0.4,
    },
  );

  // Beat 4: Concat -> W_O -> + residual x
  playCue(s, c, 'side-by-side', (d) => s.play(concatLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'out-matrix', (d) => s.play(outMatLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'added', (d) => s.play(residLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'adjusts', (d) => s.play(residLit.to(1, { duration: d })), { dur: 0.3 });

  // Beat 5-6: 1×512 vs 8×64 compute vs memory (8× stored scores)
  playCue(s, c, 'core', (d) => s.play(swapVis(vSplit, vMem, d)), { dur: 0.7 });
  playCue(s, c, 'compare', (d) => s.play(memPair.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'follow-pair', (d) => s.play(memPair.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'leading', (d) => s.play(memPair.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'softmax-rows', (d) => s.play(memEight.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'eight-memory', (d) => s.play(memEight.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'count-grid', (d) => s.play(memTotals.to(1, { duration: d })), { dur: 0.5 });

  // Beat 7: Two example heads + counterfactual test
  playCue(s, c, 'what-learn', (d) => s.play(swapVis(vMem, vPatterns, d)), { dur: 0.7 });
  playCue(s, c, 'nobody', (d) => s.play(patRow.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'patterns', (d) => s.play(patRow.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'previous-word', (d) => s.play(patRow.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'first-word', (d) => s.play(patRow.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'next-row', (d) => s.play(patRow.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'left-read', (d) => s.play(patRow.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'right-read', (d) => s.play(patRow.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'hypothesis', (d) => s.play(patTest.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'test-it', (d) => s.play(patTest.to(0.8, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'move-subject', (d) => s.play(patTest.to(1, { duration: d })), { dur: 0.45 });

  void fmt;
}
