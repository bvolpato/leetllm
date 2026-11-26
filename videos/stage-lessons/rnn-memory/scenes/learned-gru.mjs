// Scene 16: learned-gru: "Would the same GRU weights work in both implementations?"
// View 1: Side-by-side luminous signal pipelines (Reset first vs PyTorch) on Identity W = I
//         (agreement) then Mixing W = [[1, 2], [3, 4]] (opposite signs in coord 2: -0.323 vs +0.347).
// View 2: PyTorch recurrent bias scaling under reproduction (r=0.10) vs rollback (r=0.50).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  IDENTITY_GRU,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  sigmoid,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

const numStr = (v, digits) => v.toFixed(digits).replace('-', '−');
const pairStr = (v, digits) => `[${v.map((x) => numStr(x, digits)).join(', ')}]`;

export default function learnedGru(s, c) {
  const mixed = MODEL.gru;
  const idGru = IDENTITY_GRU;
  const row2 = mixed.recurrent[1];

  const vMain = s.value(1);
  const vBias = s.value(0);

  // View 1 state
  const showKeep = s.value(0);
  const showReset = s.value(0);
  // phase: 0=setup, 1=identity, 2=id-top, 3=id-both, 4=mix-header, 5=mix-step1..8, 9=candidates, 10=blend-axes
  const phase = s.value(0);
  const origBar = s.value(0);
  const torchBar = s.value(0);

  // View 2 state (recurrent bias scaling)
  const showRepro = s.value(0);
  const showRoll = s.value(0);
  const showHalf = s.value(0);

  const mainView = guardedDynamic(vMain, (alpha) => {
    const p = Math.round(phase.value);
    const nodes = [
      heroTitle(['Would the same GRU weights', 'work in both implementations?'], {
        x: -850,
        y: -435,
        size: 40,
        lineHeight: 48,
        accent: ROLE.gate,
      }).opacity(alpha),
      txt(
        `reproduction [0, 1, 0]   |   old h = ${pairStr(mixed.hidden, 1)}`,
        450,
        -395,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    // Gate pills row
    if (showKeep.value > 0.02) {
      nodes.push(
        tokenPill(`keep z = ${pairStr(mixed.z, 2)}`, -340, -255, ROLE.cell, {
          w: 390,
          h: 50,
          size: 27,
          font: 'mono',
          opacity: showKeep.value * alpha,
        }),
      );
    }
    if (showReset.value > 0.02) {
      nodes.push(
        tokenPill(`reset r = ${pairStr(mixed.reset, 2)}`, 290, -255, ROLE.grad, {
          w: 390,
          h: 50,
          size: 27,
          font: 'mono',
          opacity: showReset.value * alpha,
        }),
      );
    }

    // Active matrix header banner (identity vs mixing)
    if (p >= 1 && p <= 3) {
      nodes.push(
        txt(
          'Identity matrix   W = [[1, 0], [0, 1]]   (biases & input cand = 0)',
          0,
          -165,
          30,
          ROLE.gold,
          'mono',
          'center',
        ).opacity(alpha),
      );
    } else if (p >= 4) {
      nodes.push(
        txt(
          'Mixing matrix   W = [[1, 2], [3, 4]]   ->   Follow row 2: [3, 4]',
          0,
          -165,
          30,
          ROLE.gold,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Two parallel comparison lanes: Top = Reset first (rose), Bottom = PyTorch (cyan)
    const yTop = -25;
    const yBot = 160;
    nodes.push(
      txt('Reset first', -760, yTop - 10, 32, ROLE.grad, 'serif', 'left').opacity(alpha),
      txt('W(r ⊙ h)', -760, yTop + 28, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('PyTorch', -760, yBot - 10, 32, ROLE.state, 'serif', 'left').opacity(alpha),
      txt('r ⊙ (Wh)', -760, yBot + 28, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    );

    // Persistent architectural guide tracks for both pipelines (always visible -> zero empty space!)
    if (p < 2 || p === 4) {
      nodes.push(
        lumBar(-235, yTop, 420, 68, {
          color: ROLE.grad,
          fillOpacity: 0.08,
          glow: 3,
          dash: [8, 6],
          opacity: alpha,
        }),
        txt('Step 1: scale h by r', -235, yTop, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        lumBar(335, yTop, 490, 68, {
          color: ROLE.grad,
          fillOpacity: 0.08,
          glow: 3,
          dash: [8, 6],
          opacity: alpha,
        }),
        txt('Step 2: multiply by W', 335, yTop, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        lumBar(-235, yBot, 420, 68, {
          color: ROLE.state,
          fillOpacity: 0.08,
          glow: 3,
          dash: [8, 6],
          opacity: alpha,
        }),
        txt('Step 1: multiply by W', -235, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        lumBar(335, yBot, 490, 68, {
          color: ROLE.state,
          fillOpacity: 0.08,
          glow: 3,
          dash: [8, 6],
          opacity: alpha,
        }),
        txt('Step 2: scale by r', 335, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    }

    // Stage content inside lanes (mutually exclusive -> zero overlap)
    if (p >= 2 && p <= 3) {
      nodes.push(
        lumBar(-235, yTop, 430, 68, {
          color: ROLE.grad,
          fillOpacity: 0.2,
          glow: 6,
          opacity: alpha,
        }),
        txt(
          `reset -> ${pairStr(idGru.resetHidden, 2)}`,
          -235,
          yTop,
          26,
          ROLE.grad,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(335, yTop, 460, 68, {
          color: ROLE.grad,
          fillOpacity: 0.28,
          glow: 8,
          opacity: alpha,
        }),
        txt(
          `copy -> ${pairStr(idGru.before, 2)}`,
          335,
          yTop,
          28,
          ROLE.grad,
          'mono',
          'center',
        ).opacity(alpha),
      );
      if (p >= 3) {
        nodes.push(
          lumBar(-235, yBot, 430, 68, {
            color: ROLE.state,
            fillOpacity: 0.2,
            glow: 6,
            opacity: alpha,
          }),
          txt(
            `copy -> ${pairStr(idGru.projected, 2)}`,
            -235,
            yBot,
            26,
            ROLE.state,
            'mono',
            'center',
          ).opacity(alpha),
          lumBar(335, yBot, 460, 68, {
            color: ROLE.state,
            fillOpacity: 0.28,
            glow: 8,
            opacity: alpha,
          }),
          txt(
            `reset -> ${pairStr(idGru.after, 2)}`,
            335,
            yBot,
            28,
            ROLE.state,
            'mono',
            'center',
          ).opacity(alpha),
          txt(
            'Same pair on identity! What if W mixes coordinates?',
            0,
            345,
            32,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(-235, yBot, 430, 68, {
            color: ROLE.state,
            fillOpacity: 0.08,
            glow: 2,
            dash: [8, 6],
            opacity: alpha,
          }),
          txt('Step 1: multiply by I', -235, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(
            alpha,
          ),
          lumBar(335, yBot, 460, 68, {
            color: ROLE.state,
            fillOpacity: 0.08,
            glow: 2,
            dash: [8, 6],
            opacity: alpha,
          }),
          txt('Step 2: scale by r', 335, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        );
      }
    } else if (p >= 5 && p <= 8) {
      // Mixing matrix row 2 step-by-step
      const mixFormula = (vals, res) =>
        `${row2[0]}(${numStr(vals[0], 2)}) + ${row2[1]}(${numStr(vals[1], 2)}) = ${numStr(res, 2)}`;
      if (p >= 5) {
        nodes.push(
          lumBar(-245, yTop, 435, 68, {
            color: ROLE.grad,
            fillOpacity: 0.22,
            glow: 7,
            opacity: alpha,
          }),
          txt(
            `reset -> ${pairStr(mixed.resetHidden, 2)}`,
            -245,
            yTop,
            26,
            ROLE.grad,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
      if (p >= 6) {
        nodes.push(
          lumBar(335, yTop, 540, 68, {
            color: ROLE.grad,
            fillOpacity: 0.3,
            glow: 9,
            opacity: alpha,
          }),
          txt(
            mixFormula(mixed.resetHidden, mixed.before[1]),
            335,
            yTop,
            26,
            ROLE.grad,
            'mono',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(335, yTop, 540, 68, {
            color: ROLE.grad,
            fillOpacity: 0.08,
            glow: 2,
            dash: [8, 6],
            opacity: alpha,
          }),
          txt('row 2: 3(·) + 4(·)', 335, yTop, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        );
      }
      if (p >= 7) {
        nodes.push(
          lumBar(-215, yBot, 495, 68, {
            color: ROLE.state,
            fillOpacity: 0.22,
            glow: 7,
            opacity: alpha,
          }),
          txt(
            mixFormula(mixed.hidden, mixed.projected[1]),
            -215,
            yBot,
            26,
            ROLE.state,
            'mono',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(-215, yBot, 495, 68, {
            color: ROLE.state,
            fillOpacity: 0.08,
            glow: 2,
            dash: [8, 6],
            opacity: alpha,
          }),
          txt('Step 1: row 2 × old h', -215, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
      if (p >= 8) {
        nodes.push(
          lumBar(365, yBot, 460, 68, {
            color: ROLE.state,
            fillOpacity: 0.3,
            glow: 9,
            opacity: alpha,
          }),
          txt(
            `0.9 × ${numStr(mixed.projected[1], 2)} = +${numStr(mixed.after[1], 2)}`,
            365,
            yBot,
            28,
            ROLE.state,
            'mono',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(365, yBot, 460, 68, {
            color: ROLE.state,
            fillOpacity: 0.08,
            glow: 2,
            dash: [8, 6],
            opacity: alpha,
          }),
          txt('Step 2: × r₂ (0.9)', 365, yBot, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        );
      }
    } else if (p >= 9) {
      // Candidates + Opposite-sign final h_2 signed gauges!
      const cands = [mixed.beforeCandidate[1], mixed.afterCandidate[1]];
      const pre = [mixed.before[1], mixed.after[1]];
      const finals = [mixed.beforeHidden[1], mixed.afterHidden[1]];
      const bars = [origBar.value, torchBar.value];
      const cols = [ROLE.grad, ROLE.state];
      const ys = [yTop, yBot];

      ys.forEach((y, i) => {
        nodes.push(
          lumBar(-235, y, 420, 68, { color: cols[i], fillOpacity: 0.22, glow: 7, opacity: alpha }),
          txt(
            `tanh(${numStr(pre[i], 2)}) ≈ ${numStr(cands[i], 3)}`,
            -235,
            y,
            27,
            cols[i],
            'mono',
            'center',
          ).opacity(alpha),
        );

        if (p >= 10) {
          const gCenter = 395;
          const gHalf = 260;
          const tipX = gCenter + finals[i] * gHalf * 1.45 * bars[i];
          nodes.push(
            line([gCenter - gHalf, y], [gCenter + gHalf, y], {
              stroke: '#3c4d73',
              width: 4,
            }).opacity(alpha),
            line([gCenter, y - 16], [gCenter, y + 16], { stroke: '#6e83b7', width: 3 }).opacity(
              alpha,
            ),
            txt('0', gCenter, y + 38, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
          );
          if (bars[i] > 0.05) {
            nodes.push(
              glowingTrail(
                [
                  [gCenter, y],
                  [tipX, y],
                ],
                { color: cols[i], width: 10, glow: 11, opacity: alpha },
              ),
              glowDot(tipX, y, { radius: 8.5, color: cols[i], glow: 12, opacity: alpha }),
              txt(
                (finals[i] > 0 ? '+' : '') + numStr(finals[i], 3),
                tipX,
                y - 40,
                34,
                cols[i],
                'mono',
                'center',
              )
                .glow(8, cols[i])
                .opacity(bars[i] * alpha),
            );
          }
        }
      });

      if (p >= 10) {
        const blendCaption =
          torchBar.value > 0.5
            ? 'h₂ = 0.5 × (−0.20) + 0.5 × candidate₂   ->   Opposite signs!'
            : 'h₂ = 0.5 × (−0.20) + 0.5 × candidate₂';
        nodes.push(txt(blendCaption, 0, 355, 32, ROLE.gold, 'mono', 'center').opacity(alpha));
      }
    }

    return nodes;
  });

  // VIEW 2: PyTorch candidate recurrent bias scaled by reset gate r_t
  const biasView = guardedDynamic(vBias, (alpha) => {
    const rRepro = mixed.reset[0]; // 0.10
    const rRoll = sigmoid(0); // 0.50
    const barLeft = 10;
    const barMax = 560;
    const y1 = -40;
    const y2 = 130;
    const nodes = [
      heroTitle(['PyTorch candidate bias:', 'scaled by the reset gate'], {
        x: -850,
        y: -435,
        size: 44,
        lineHeight: 52,
        accent: ROLE.state,
      }).opacity(alpha),
      txt(
        'Recurrent bias b = 1.0   ->   effective shift = r₁ × 1.0',
        0,
        -210,
        34,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      // Persistent scale ruler & dashed meter tracks from t=0 of biasView (zero empty space)
      txt('Event', -760, -125, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Reset gate r₁', -460, -125, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(
        'Effective bias shift (0.0 to 1.0)',
        barLeft + barMax / 2,
        -125,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(barLeft + barMax / 2, y1, barMax, 54, {
        color: '#4e6396',
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 0,
        dash: [8, 6],
        opacity: alpha,
      }),
      lumBar(barLeft + barMax / 2, y2, barMax, 54, {
        color: '#4e6396',
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 0,
        dash: [8, 6],
        opacity: alpha,
      }),
      line([barLeft, 212], [barLeft + barMax, 212], { stroke: '#4e6396', width: 2 }).opacity(alpha),
      txt('0.0', barLeft, 244, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('0.5', barLeft + barMax * 0.5, 244, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('1.0', barLeft + barMax, 244, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    ];

    if (showRepro.value > 0.02) {
      const w1 = rRepro * barMax * showRepro.value;
      nodes.push(
        txt('reproduction', -760, y1, 32, ROLE.grad, 'serif', 'left').opacity(
          showRepro.value * alpha,
        ),
        txt(`r₁ = σ(−ln 9) = ${fmt(rRepro, 2)}`, -460, y1, 30, ROLE.grad, 'mono', 'left').opacity(
          showRepro.value * alpha,
        ),
        lumBar(barLeft + w1 / 2, y1, Math.max(12, w1), 46, {
          color: ROLE.grad,
          fillOpacity: 0.5,
          glow: 9,
          opacity: showRepro.value * alpha,
        }),
        txt('+0.10', barLeft + barMax + 28, y1, 34, ROLE.grad, 'mono', 'left').opacity(
          showRepro.value * alpha,
        ),
      );
    }

    if (showRoll.value > 0.02) {
      nodes.push(
        txt('rollback', -760, y2, 32, ROLE.state, 'serif', 'left').opacity(showRoll.value * alpha),
        txt(
          showHalf.value > 0.5 ? `r₁ = σ(0) = ${fmt(rRoll, 2)}` : 'r₁ = σ(0)',
          -460,
          y2,
          30,
          ROLE.state,
          'mono',
          'left',
        ).opacity(showRoll.value * alpha),
      );
      if (showHalf.value > 0.02) {
        const w2 = rRoll * barMax * showHalf.value;
        nodes.push(
          lumBar(barLeft + w2 / 2, y2, Math.max(12, w2), 46, {
            color: ROLE.state,
            fillOpacity: 0.5,
            glow: 10,
            opacity: showHalf.value * alpha,
          }),
          txt('+0.50', barLeft + barMax + 28, y2, 34, ROLE.state, 'mono', 'left').opacity(
            showHalf.value * alpha,
          ),
        );
      }
    }

    nodes.push(
      txt(
        'When porting GRU weights: match gate order, keep convention, and both bias placements',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.grad, ROLE.state), mainView, biasView);

  playCue(s, c, 'gru-keep-result', (d) => s.play(showKeep.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gru-reset-result', (d) => s.play(showReset.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gru-identity', () => phase.set(1), { dur: 0.25 });
  playCue(s, c, 'gru-first-operations', () => phase.set(2), { dur: 0.25 });
  playCue(s, c, 'gru-agreement', () => phase.set(3), { dur: 0.25 });

  playCue(s, c, 'learned-gru-1', () => phase.set(4), { dur: 0.25 });
  playCue(s, c, 'gru-mix', () => phase.set(5), { dur: 0.25 });
  playCue(s, c, 'gru-mix-result', () => phase.set(6), { dur: 0.25 });
  playCue(s, c, 'gru-mix-before-reset', () => phase.set(7), { dur: 0.25 });
  playCue(s, c, 'gru-scale-mixed', () => phase.set(8), { dur: 0.25 });

  playCue(s, c, 'gru-candidates', () => phase.set(9), { dur: 0.25 });
  playCue(s, c, 'gru-blend', () => phase.set(10), { dur: 0.25 });
  playCue(s, c, 'gru-original-blend', (d) => s.play(origBar.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'gru-pytorch-blend', (d) => s.play(torchBar.to(1, { duration: d })), { dur: 0.55 });

  playCue(s, c, 'gru-bias', (d) => s.play(swapVis(vMain, vBias, d)), { dur: 0.65 });
  playCue(s, c, 'gru-bias-repro', (d) => s.play(showRepro.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gru-bias-rollback', (d) => s.play(showRoll.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gru-bias-half', (d) => s.play(showHalf.to(1, { duration: d })), { dur: 0.45 });
}
