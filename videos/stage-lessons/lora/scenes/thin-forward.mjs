// Scene 09: What does this input send through the adapter?: Exact 2x2 forward(2,[2,1]) then null-space prediction on [1,1].
import {
  COSMOS,
  EXAMPLE,
  FWD_EQUAL,
  FWD_SCALE2,
  arrow,
  aura,
  circle,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function thinForward(s, c) {
  const phase = s.value(0);
  const showBase = s.value(0);
  const showDiff = s.value(0);
  const showScale = s.value(0);
  const slideAdd = s.value(0);
  const showSum = s.value(0);
  const isEqualInput = s.value(0); // switches input from [2,1] to [1,1]
  const revealZero = s.value(0); // withheld until after forward-zero!
  const revealUnchanged = s.value(0); // withheld until after forward-unchanged!

  const bgAura = aura(240, 20, 620, '#60a5fa22', '#ffd16618');
  const title = heroTitle(['Trace One Input', 'Through Two Paths'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'THIN FORWARD PASS · NULL-SPACE TEST',
  });

  const eq = glowTex(String.raw`h = W_0 x + 2 B(Ax)`, {
    x: 560,
    y: -380,
    size: 40,
    color: COSMOS.gold,
  });

  const rulerX0 = -160;
  const rulerX1 = 800;
  const mapVal = (v) => rulerX0 + (v / 14) * (rulerX1 - rulerX0);

  const live = guardedDynamic(1, () => {
    const sb = showBase.value;
    const sd = showDiff.value;
    const ss = showScale.value;
    const sa = slideAdd.value;
    const su = showSum.value;
    const eqMode = isEqualInput.value > 0.5;
    const rz = revealZero.value > 0.5;
    const ru = revealUnchanged.value > 0.5;

    const activeX = eqMode ? [1, 1] : EXAMPLE.x;
    const activeFwd = eqMode ? FWD_EQUAL : FWD_SCALE2;

    const yR1 = -85;
    const yR2 = 135;

    const nodes = [
      // Left column: input & factor arithmetic
      glassCell(-555, -162, 595, 116, eqMode ? COSMOS.gold : COSMOS.cyan, {
        fill: eqMode ? '#241e11' : '#101d35',
        glow: 9,
      }),
      txt('ACTIVE INPUT VECTOR x', -825, -194, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        `x = [${activeX[0]}, ${activeX[1]}] · scale = 2`,
        -825,
        -138,
        28,
        eqMode ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ).glow(6, eqMode ? COSMOS.gold : COSMOS.cyan),

      glassCell(-555, -8, 595, 140, COSMOS.blue, { fill: '#101930', glow: 6 }),
      txt('FROZEN BASE  W_0 = [[1,2],[3,4]]', -825, -48, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        `W_0 x = [${activeFwd.base[0]}, ${activeFwd.base[1]}]`,
        -825,
        14,
        36,
        COSMOS.blue,
        'mono',
        'left',
      ).glow(sb > 0.2 ? 6 : 0, COSMOS.blue),

      glassCell(-555, 166, 595, 152, COSMOS.gold, { fill: '#1c1810', glow: 7 }),
      txt('NARROW PATH  A=[1,-1]  B=[0.5, 1]ᵀ', -825, 122, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        eqMode
          ? rz
            ? 'Ax = 0  ->  B(0) = [0, 0]'
            : 'Ax = 1−1 = ? -> shift = ?'
          : sd > 0.2
            ? ss > 0.2
              ? 'Ax = 1 -> 2B(1) = [+1, +2]'
              : 'Ax = 2 − 1 = 1'
            : 'Waiting for thin path...',
        -825,
        184,
        26,
        eqMode && !rz ? COSMOS.muted : COSMOS.gold,
        'mono',
        'left',
      ),

      // Right side: two output coordinate rulers
      txt('COORDINATE 1 RULER', rulerX0, yR1 - 74, 26, COSMOS.cyan, 'mono', 'left'),
      line([rulerX0, yR1], [rulerX1, yR1], { stroke: '#3a4c78', width: 3.2 }),
      txt('COORDINATE 2 RULER', rulerX0, yR2 - 74, 26, COSMOS.cyan, 'mono', 'left'),
      line([rulerX0, yR2], [rulerX1, yR2], { stroke: '#3a4c78', width: 3.2 }),
    ];

    // Ruler ticks 0..14
    for (let tick = 0; tick <= 14; tick += 2) {
      const tx = mapVal(tick);
      nodes.push(
        line([tx, yR1 - 12], [tx, yR1 + 12], { stroke: '#5d6e96', width: 2 }),
        txt(String(tick), tx, yR1 + 36, 26, COSMOS.muted, 'mono'),
        line([tx, yR2 - 12], [tx, yR2 + 12], { stroke: '#5d6e96', width: 2 }),
        txt(String(tick), tx, yR2 + 36, 26, COSMOS.muted, 'mono'),
      );
    }

    // Blue base markers (always shown once sb > 0.2 or in eqMode)
    if (sb > 0.1 || eqMode) {
      const bx1 = mapVal(activeFwd.base[0]);
      const bx2 = mapVal(activeFwd.base[1]);
      const stayMode = eqMode && ru;
      nodes.push(
        circle(11, stayMode ? COSMOS.emerald : COSMOS.blue)
          .at(bx1, yR1)
          .glow(10, stayMode ? COSMOS.emerald : COSMOS.blue),
        txt(
          stayMode ? `stays ${activeFwd.base[0]}` : `base ${activeFwd.base[0]}`,
          bx1,
          yR1 - 38,
          26,
          stayMode ? COSMOS.emerald : COSMOS.blue,
          'mono',
        ),
        circle(11, stayMode ? COSMOS.emerald : COSMOS.blue)
          .at(bx2, yR2)
          .glow(10, stayMode ? COSMOS.emerald : COSMOS.blue),
        txt(
          stayMode ? `stays ${activeFwd.base[1]}` : `base ${activeFwd.base[1]}`,
          bx2,
          yR2 - 38,
          26,
          stayMode ? COSMOS.emerald : COSMOS.blue,
          'mono',
        ),
      );

      // In [2,1] mode: slide yellow correction +1 and +2
      if (!eqMode && sa > 0.05) {
        const ax1 = mapVal(activeFwd.base[0] + activeFwd.correction[0] * sa);
        const ax2 = mapVal(activeFwd.base[1] + activeFwd.correction[1] * sa);
        nodes.push(
          arrow([bx1, yR1], [ax1, yR1], { stroke: COSMOS.gold, width: 6, tip: 14 }).glow(
            10,
            COSMOS.gold,
          ),
          glowDot(ax1, yR1, { radius: 9, color: COSMOS.gold }),
          arrow([bx2, yR2], [ax2, yR2], { stroke: COSMOS.gold, width: 6, tip: 14 }).glow(
            10,
            COSMOS.gold,
          ),
          glowDot(ax2, yR2, { radius: 9, color: COSMOS.gold }),
        );
        if (su > 0.3) {
          nodes.push(
            txt('5', ax1 + 28, yR1 - 38, 30, COSMOS.gold, 'mono').glow(7, COSMOS.gold),
            txt('12', ax2 + 34, yR2 - 38, 30, COSMOS.gold, 'mono').glow(7, COSMOS.gold),
          );
        }
      }
    }

    // Bottom result strip (strictly withholds [3, 7] during prediction pause!)
    let verdictText = 'Adapted output: computing...';
    let verdictCol = COSMOS.muted;
    if (!eqMode && su > 0.3) {
      verdictText = `Adapted output = [${FWD_SCALE2.output[0]}, ${FWD_SCALE2.output[1]}]  (matches merged matrix)`;
      verdictCol = COSMOS.emerald;
    } else if (eqMode && rz && !ru) {
      verdictText = 'Ax = 0 -> B(0) = [0, 0]  (zero adapter shift)';
      verdictCol = COSMOS.cyan;
    } else if (eqMode && !ru) {
      verdictText = 'Input [1, 1]: how far will the adapter move either mark?';
      verdictCol = COSMOS.gold;
    } else if (eqMode && ru) {
      verdictText = `Ax = 0 -> adapter shift = [0, 0]  ·  output stays [${FWD_EQUAL.output[0]}, ${FWD_EQUAL.output[1]}]`;
      verdictCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 355, 1660, 114, verdictCol, { fill: '#10182b', glow: 9 }),
      txt(verdictText, 0, 355, 32, verdictCol, 'mono').glow(6, verdictCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('forward-base', () => s.play(showBase.to(1, { duration: 0.4 })));
  c.on('forward-difference', () => s.play(showDiff.to(1, { duration: 0.4 })));
  c.on('forward-scale', () => s.play(showScale.to(1, { duration: 0.4 })));
  c.on('forward-add', () => s.play(slideAdd.to(1, { duration: 0.65 })));
  c.on('forward-sum', () => s.play(showSum.to(1, { duration: 0.4 })));
  c.on('forward-new-input', () => s.play(isEqualInput.to(1, { duration: 0.45 })));
  c.after('forward-zero', () => s.play(revealZero.to(1, { duration: 0.3 })));
  c.after('forward-unchanged', () =>
    s.play(revealUnchanged.to(1, { duration: remainDuration(c, 'forward-unchanged', 0.35) })),
  );
}
