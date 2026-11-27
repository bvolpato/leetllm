// Scene 16: Turn the edge sideways: 1x5 A x 5x2 B finale! Strict prediction hold -> 3 panels -> loads 4, -2, 0 -> sums 7, 5, 9!
import {
  BOTTOM_SAFE,
  COSMOS,
  ROLE,
  aura,
  bottomEdge,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const qFocus = s.value(0);
  const revPanels = s.value(0); // 2 full + 1 tail
  const revLoads = s.value(0); // B[1,1]=4 and B[3,1]=-2
  const revTailZero = s.value(0); // zero-fill tail
  const revP1Prod = s.value(0); // -1 + 8
  const revP1Sum = s.value(0); // 7
  const revP2Prod = s.value(0); // 0 - 2
  const revP2Sum = s.value(0); // 5
  const revP3Sum = s.value(0); // 9

  const bgAura = aura(0, 10, 640, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['Turn the Edge', 'Sideways'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'FINALE TRANSFER · 1 × 5 A × 5 × 2 B',
  });

  const aRow = bottomEdge.a[0]; // [1, 2, 0, 1, 1]
  const bCol1 = bottomEdge.b.map((r) => r[1]); // [-1, 4, 0, -2, 4]
  const panelSums = BOTTOM_SAFE.panels.map((p) => p.sum); // [7, 5, 9]
  const maskedLoads = BOTTOM_SAFE.panels.map((p) => p.right[1][1]); // [4, -2, 0]

  const live = guardedDynamic(1, () => {
    const rp = revPanels.value;
    const rl = revLoads.value;
    const tz = revTailZero.value;
    const p1p = revP1Prod.value;
    const p1s = revP1Sum.value;
    const p2p = revP2Prod.value;
    const p2s = revP2Sum.value;
    const p3s = revP3Sum.value;

    const nodes = [
      txt('5 INNER POSITIONS (k = 0..4) FOR TOP-RIGHT C[0, 1]', 0, -256, 28, COSMOS.cyan, 'mono'),
      txt('A[0, k]', -765, -90, 26, ROLE.a, 'mono'),
      txt('B[k, 1]', -765, 22, 26, ROLE.b, 'mono'),
    ];

    const colXs = [-520, -290, -20, 210, 480];
    // Panel brackets appear ONLY after fresh-panels cue!
    if (rp > 0.02) {
      const brackets = [
        { cx: -405, w: 422, label: 'PANEL 0 (k=0,1)', col: ROLE.c },
        { cx: 95, w: 422, label: 'PANEL 1 (k=2,3)', col: COSMOS.violet },
        { cx: 590, w: 404, label: 'TAIL (k=4, pad)', col: COSMOS.gold },
      ];
      for (const br of brackets) {
        nodes.push(
          rect(br.w, 266, { fill: null, stroke: br.col, width: 2.6, radius: 14, dash: [10, 6] })
            .at(br.cx, -50)
            .opacity(0.8 * rp),
          txt(br.label, br.cx, -214, 26, br.col, 'mono').opacity(rp),
        );
      }
    }

    // 5 real pairs + 6th zero-padded tail slot
    for (let k = 0; k < 5; k++) {
      const cx = colXs[k];
      const isMaskedB = k === 1 || k === 3;
      const highlightMasked = rl > 0.5 && isMaskedB;
      nodes.push(
        txt(`k=${k}`, cx, -152, 26, COSMOS.muted, 'mono'),
        glassCell(cx, -90, 160, 66, ROLE.a, { fill: '#10203b', glow: 5 }),
        txt(String(aRow[k]), cx, -90, 36, ROLE.a, 'mono'),

        glassCell(cx, 22, 160, 66, highlightMasked ? COSMOS.gold : ROLE.b, {
          fill: highlightMasked ? '#2c2210' : '#261120',
          glow: highlightMasked ? 12 : 5,
        }),
        txt(String(bCol1[k]), cx, 22, 36, highlightMasked ? COSMOS.gold : ROLE.b, 'mono'),
      );
    }

    // 6th slot (k=5 out-of-range tail zero-filled by T(1,1))
    if (rp > 0.02) {
      const zx = 700;
      nodes.push(
        txt('k=5', zx, -152, 26, COSMOS.dim, 'mono').opacity(rp),
        glassCell(zx, -90, 148, 66, COSMOS.dim, {
          fill: '#0d111e',
          dash: [8, 6],
          glow: 0,
          opacity: rp,
        }),
        txt(tz > 0.5 ? '0' : 'pad', zx, -90, 30, COSMOS.dim, 'mono').opacity(rp),
        glassCell(zx, 22, 148, 66, tz > 0.5 ? ROLE.good : COSMOS.dim, {
          fill: tz > 0.5 ? '#0e2824' : '#0d111e',
          dash: [8, 6],
          glow: tz > 0.5 ? 9 : 0,
          opacity: rp,
        }),
        txt(
          tz > 0.5 ? String(maskedLoads[2]) : 'pad',
          zx,
          22,
          34,
          tz > 0.5 ? ROLE.good : COSMOS.dim,
          'mono',
        ).opacity(rp),
      );
    }

    // Bottom running-sum progression (strictly withheld until respective cues!)
    if (rp < 0.5) {
      nodes.push(
        txt(
          'Predict: how many 2-wide panels? Which B entries does T(1,1) load?',
          0,
          215,
          32,
          COSMOS.gold,
          'serif',
        ).glow(6, COSMOS.gold),
      );
    } else {
      const stages = [
        {
          cx: -405,
          title: 'P0',
          expr: p1p > 0.5 ? '-1 + 8' : rl > 0.5 ? `T(1,1)→${maskedLoads[0]}` : '2 slots',
          sum: p1s > 0.5 ? `sum = ${panelSums[0]}` : '?',
          col: p1s > 0.5 ? ROLE.c : COSMOS.muted,
        },
        {
          cx: 95,
          title: 'P1',
          expr: p2p > 0.5 ? '+0 - 2' : rl > 0.5 ? `T(1,1)→${maskedLoads[1]}` : '2 slots',
          sum: p2s > 0.5 ? `sum = ${panelSums[1]}` : '?',
          col: p2s > 0.5 ? COSMOS.violet : COSMOS.muted,
        },
        {
          cx: 590,
          title: 'TAIL',
          expr: p3s > 0.5 ? '1×4 = +4' : tz > 0.5 ? 'T(1,1)→0' : '1 + pad',
          sum: p3s > 0.5 ? `C[0,1] = ${panelSums[2]}` : '?',
          col: p3s > 0.5 ? ROLE.good : COSMOS.muted,
        },
      ];
      for (const st of stages) {
        nodes.push(
          glassCell(st.cx, 200, 404, 128, st.col, {
            fill: '#0e192c',
            glow: st.sum !== '?' ? 10 : 3,
          }),
          txt(`${st.title} · ${st.expr}`, st.cx, 170, 26, COSMOS.ink, 'mono'),
          txt(st.sum, st.cx, 224, 40, st.col, 'mono').glow(6, st.col),
        );
      }
      if (p3s > 0.5) {
        nodes.push(
          txt(
            'T(1,1) stayed for the loads, skipped its store → neighbor gets exact 9!',
            0,
            378,
            30,
            ROLE.good,
            'mono',
          ).glow(7, ROLE.good),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('bottom-question', () =>
    s.play(qFocus.to(1, { duration: remainDuration(c, 'bottom-question', 0.45) })),
  );
  c.after('fresh-panels', () =>
    s.play(revPanels.to(1, { duration: remainDuration(c, 'fresh-panels', 0.45) })),
  );
  c.after('keep-bottom', () =>
    s.play(revLoads.to(1, { duration: remainDuration(c, 'keep-bottom', 0.45) })),
  );
  c.on('tail-zero', () =>
    s.play(revTailZero.to(1, { duration: remainDuration(c, 'tail-zero', 0.4) })),
  );
  c.on('first-products', () =>
    s.play(revP1Prod.to(1, { duration: remainDuration(c, 'first-products', 0.35) })),
  );
  c.on('panel-one', () =>
    s.play(revP1Sum.to(1, { duration: remainDuration(c, 'panel-one', 0.35) })),
  );
  c.on('next-products', () =>
    s.play(revP2Prod.to(1, { duration: remainDuration(c, 'next-products', 0.35) })),
  );
  c.on('panel-two', () =>
    s.play(revP2Sum.to(1, { duration: remainDuration(c, 'panel-two', 0.35) })),
  );
  c.after('panel-three', () =>
    s.play(revP3Sum.to(1, { duration: remainDuration(c, 'panel-three', 0.45) })),
  );
}
