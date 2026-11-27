// Scene 12: wide-arithmetic: "Run the dot product in two widths"
// Hardware register cinema: glowing 16-bit byte registers where narrow INT8 shears off
// the high bytes (0x7E, 0x7D), flipping 32258 > 32004 into 2 < 4, and widening operands
// BEFORE multiplying recovers exact INT32 scores.
import { arrow, dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  dotProd,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
} from '../parts.mjs';

export default function wideArithmetic(s, c) {
  const q = [127, 127];
  const rows = [
    [127, 127],
    [126, 126],
  ];
  const exact = rows.map((v) => dotProd(q, v)); // [32258, 32004]
  const wrap8 = (v) => ((v + 128) % 256) - 128; // [2, 4]
  const wrapped = exact.map(wrap8);
  const bound = 1536 * 127 * 127; // 24,774,144

  const showCorrect = s.value(0);
  const wrapDrop = s.value(0);
  const showWrapScore = s.value(0);
  const showLate = s.value(0);
  const showWiden = s.value(0);
  const showBound = s.value(0);

  const title = heroTitle(['Run the dot product', 'in two widths'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
    eyebrow: 'INT8 OVERFLOW  vs  INT32 ACCUMULATOR',
  });

  // Top input operands + 4-stage pipeline columns (NO boxy tables!)
  const mainLayer = dynamic(() => {
    const cOp = showCorrect.value;
    const wDrop = wrapDrop.value;
    const wScore = showWrapScore.value;
    const lOp = showLate.value;
    const widOp = showWiden.value;

    const nodes = [
      txt(
        'q = [127, 127]     ·     A = [127, 127]     ·     B = [126, 126]',
        855,
        -395,
        30,
        ROLE.query,
        'mono',
        'right',
      ),
      // Four floating column headers across the frame
      txt('EXACT 16-BIT BYTES', -635, -245, 26, ROLE.code, 'mono'),
      txt('INT8 WRAP', -170, -245, 26, ROLE.danger, 'mono'),
      txt('CAST AFTER', 240, -245, 26, ROLE.warn, 'mono'),
      txt('WIDEN FIRST (INT32)', 645, -245, 26, ROLE.A, 'mono'),
    ];

    const rowYs = [-128, 108];
    const ids = ['A', 'B'];
    const cols = [ROLE.A, ROLE.B];

    exact.forEach((val, i) => {
      const ry = rowYs[i];
      const hiHex = '0x' + (val >> 8).toString(16).toUpperCase().padStart(2, '0');
      const loHex = '0x' + (val & 255).toString(16).toUpperCase().padStart(2, '0');
      const col = cols[i];

      // High byte drops smoothly 38px during wrap (clear of label & row B), restores on widen
      const effectiveDrop = wDrop * (1 - widOp);
      const hiY = ry + effectiveDrop * 38;
      const hiOp = Math.max(0.15, 1 - effectiveDrop * 0.82);

      nodes.push(
        txt(ids[i], -845, ry, 40, col, 'mono', 'left').glow(6, col),
        // High byte register cell
        lumBar(-710, hiY, 136, 74, {
          color: effectiveDrop > 0.2 ? ROLE.danger : col,
          fillAlpha: 0.22,
          strokeWidth: 2.4,
          glow: effectiveDrop > 0.2 ? 9 : 6,
          opacity: hiOp,
        }),
        txt(
          cOp > 0.5 ? hiHex : 'high',
          -710,
          hiY,
          32,
          effectiveDrop > 0.2 ? ROLE.danger : col,
          'mono',
        ).opacity(hiOp),
        // Low byte register cell
        lumBar(-555, ry, 136, 74, {
          color: col,
          fillAlpha: 0.24,
          strokeWidth: 2.4,
          glow: 7,
        }),
        txt(cOp > 0.5 ? loHex : 'low', -555, ry, 32, col, 'mono'),
        // Subtle target register outlines visible from t=0 (keeps right half balanced)
        lumBar(-170, ry, 210, 74, {
          color: '#32446d',
          fillAlpha: 0.06,
          strokeWidth: 1.4,
          dash: [6, 6],
          glow: 0,
        }),
        lumBar(240, ry, 210, 74, {
          color: '#32446d',
          fillAlpha: 0.06,
          strokeWidth: 1.4,
          dash: [6, 6],
          glow: 0,
        }),
        lumBar(665, ry, 260, 78, {
          color: '#32446d',
          fillAlpha: 0.06,
          strokeWidth: 1.4,
          dash: [6, 6],
          glow: 0,
        }),
      );

      // Exact decimal value above registers
      if (cOp > 0.02) {
        nodes.push(
          txt(`= ${val.toLocaleString('en-US')}`, -635, ry - 66, 28, COSMOS.ink, 'mono').opacity(
            cOp,
          ),
        );
      }

      // Sheared-byte warning tag positioned cleanly below dropped box (bottom = ry + 75 -> text at ry + 106)
      if (effectiveDrop > 0.65 && widOp < 0.2) {
        nodes.push(
          txt('high byte lost', -710, ry + 108, 26, ROLE.danger, 'mono').opacity(
            Math.min(1, (effectiveDrop - 0.65) / 0.35) * (1 - widOp * 5),
          ),
        );
      }

      // Column 2: INT8 wrapped result
      if (wScore > 0.02) {
        const isFlippedWinner = i === 1;
        nodes.push(
          arrow([-470, ry], [-295, ry], { stroke: ROLE.danger, width: 3, tip: 12 }).opacity(wScore),
          lumBar(-170, ry, 210, 74, {
            color: ROLE.danger,
            fillAlpha: isFlippedWinner ? 0.28 : 0.16,
            strokeWidth: isFlippedWinner ? 3 : 2,
            glow: isFlippedWinner ? 10 : 5,
            opacity: wScore,
          }),
          txt(`${wrapped[i]}  (${loHex})`, -170, ry, 34, ROLE.danger, 'mono').opacity(wScore),
        );
        if (isFlippedWinner) {
          nodes.push(
            txt('B wrongly wins!', -170, ry + 66, 26, ROLE.danger, 'mono').opacity(wScore),
          );
        }
      }

      // Column 3: Cast afterward (still 2 and 4!)
      if (lOp > 0.02) {
        nodes.push(
          arrow([-52, ry], [115, ry], { stroke: ROLE.warn, width: 3, tip: 12 }).opacity(lOp),
          lumBar(240, ry, 210, 74, {
            color: ROLE.warn,
            fillAlpha: 0.18,
            strokeWidth: 2.2,
            glow: 6,
            opacity: lOp,
          }),
          txt(`still ${wrapped[i]}`, 240, ry, 34, ROLE.warn, 'mono').opacity(lOp),
        );
      }

      // Column 4: Widen operands BEFORE multiply -> exact INT32!
      if (widOp > 0.02) {
        const isWinner = i === 0;
        nodes.push(
          arrow([360, ry], [515, ry], { stroke: ROLE.A, width: 3, tip: 12 }).opacity(widOp),
          lumBar(665, ry, 260, 78, {
            color: col,
            fillAlpha: isWinner ? 0.3 : 0.2,
            strokeWidth: isWinner ? 3 : 2.2,
            glow: isWinner ? 11 : 6,
            opacity: widOp,
          }),
          txt(val.toLocaleString('en-US'), 665, ry, 38, col, 'mono')
            .glow(isWinner ? 7 : 0, col)
            .opacity(widOp),
        );
        if (isWinner) {
          nodes.push(txt('A wins (exact)', 665, ry - 66, 26, ROLE.A, 'mono').opacity(widOp));
        }
      }
    });

    nodes.push(
      rule(-850, 255, 850, 255, COSMOS.rule, 1.8).opacity(0.6),
      txt(
        'SYMMETRIC INT8 ACCUMULATOR CAPACITY (d = 1,536)',
        -845,
        302,
        26,
        COSMOS.dim,
        'mono',
        'left',
      ),
      lumBar(-365, 412, 960, 16, { color: '#334670', fillAlpha: 0.14, strokeWidth: 1.4, glow: 0 }),
    );
    return group(...nodes);
  });

  // Bottom: INT32 worst-case accumulator bound bar
  const boundLayer = guardedDynamic(showBound, (a) =>
    group(
      txt(
        `1,536 × 127² = ${bound.toLocaleString('en-US')}   ≪   2,147,483,647 (INT32 max)`,
        -845,
        358,
        36,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(8, ROLE.gold)
        .opacity(a),
      lumBar(-815, 412, 60, 16, { color: ROLE.A, fillAlpha: 0.55, glow: 8, opacity: a }),
      glowDot(-785, 412, { radius: 6, color: ROLE.gold, glow: 9, opacity: a }),
      txt('~1.15% of signed 32-bit range', 148, 412, 26, COSMOS.muted, 'sans', 'left').opacity(a),
    ),
  );

  s.add(cinemaAtmosphere(ROLE.warn, ROLE.A), title, mainLayer, boundLayer);

  playCue(s, c, 'correct', (d) => s.play(showCorrect.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'wrap', (d) => s.play(wrapDrop.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'wrap', (d) => s.play(showWrapScore.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'late', (d) => s.play(showLate.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'widen', (d) => s.play(showWiden.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'bound', (d) => s.play(showBound.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
