// Scene 12: lstm: "What should a routine check change?"
// Glowing emerald LSTM cell-state highway (c_t) paired with gated cyan hidden readout (h_t),
// magnified micro-write rail, and strict prediction hold before output gate drop (0.80 -> 0.10).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cell,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  hidden,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function lstm(s, c) {
  const title = heroTitle(['What should a routine', 'check change?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.cell,
  });

  const oldC = 0.855;
  const keepGate = 0.98;
  const writeGate = 0.02;
  const candVal = 0.1;

  const retained = s.value(oldC);
  const addition = s.value(0);
  const expose = s.value(0.8);

  const showKeepFormula = s.value(0);
  const showWriteFormula = s.value(0);
  const showZoom = s.value(0);
  const showHidden = s.value(0);
  const showQuestion = s.value(0);
  const showRefLine = s.value(0);

  const railLeft = -470;
  const railW = 940;
  const cellY = -75;
  const hidY = 125;

  const layer = guardedDynamic(
    () => 1,
    () => {
      const cRet = retained.value;
      const cAdd = addition.value;
      const cTot = cRet + cAdd;
      const oVal = expose.value;
      const hVal = oVal * Math.tanh(cTot);

      const nodes = [];

      // Top gate arithmetic callouts (floating, cleanly separated horizontally)
      if (showKeepFormula.value > 0.02) {
        nodes.push(
          txt(
            `forget f = 0.98:  0.98 × 0.855 = ${fmt(oldC * keepGate, 4)}`,
            -445,
            -225,
            28,
            ROLE.cell,
            'mono',
            'center',
          ).opacity(showKeepFormula.value),
        );
      }
      if (showWriteFormula.value > 0.02) {
        nodes.push(
          txt(
            `write i = 0.02:  0.02 × 0.10 = +${fmt(writeGate * candVal, 4)}`,
            435,
            -225,
            28,
            ROLE.grad,
            'mono',
            'center',
          ).opacity(showWriteFormula.value),
        );
      }

      // LANE 1: Stored Cell State Highway (c_t)
      const retW = Math.max(8, cRet * railW);
      const addW = cAdd * railW;
      nodes.push(
        txt('Stored cell cₜ', railLeft - 36, cellY - 12, 32, ROLE.cell, 'serif', 'right'),
        txt('internal highway', railLeft - 36, cellY + 26, 26, COSMOS.muted, 'sans', 'right'),
        lumBar(railLeft + railW / 2, cellY, railW, 74, {
          color: '#2c3a5c',
          fillOpacity: 0.25,
          strokeWidth: 2,
          glow: 0,
        }),
        lumBar(railLeft + retW / 2, cellY, retW, 58, {
          color: ROLE.cell,
          fillOpacity: 0.45,
          glow: 11,
        }),
      );
      if (addW > 0.5) {
        nodes.push(
          lumBar(railLeft + retW + Math.max(4, addW / 2), cellY, Math.max(8, addW), 58, {
            color: ROLE.grad,
            fillOpacity: 0.72,
            glow: 12,
          }),
        );
      }
      nodes.push(
        txt(fmt(cTot, 4), railLeft + railW + 38, cellY, 44, ROLE.cell, 'mono', 'left').glow(
          8,
          ROLE.cell,
        ),
      );

      // LANE 2: Exposed Hidden State (h_t = o_t * tanh(c_t))
      nodes.push(
        txt('Hidden state hₜ', railLeft - 36, hidY - 12, 32, ROLE.state, 'serif', 'right'),
        txt(
          showHidden.value > 0.5 ? `output gate o = ${oVal.toFixed(2)}` : 'exposed readout',
          railLeft - 36,
          hidY + 26,
          26,
          COSMOS.muted,
          'mono',
          'right',
        ),
        lumBar(railLeft + railW / 2, hidY, railW, 74, {
          color: '#2c3a5c',
          fillOpacity: 0.25,
          strokeWidth: 2,
          glow: 0,
        }),
      );

      if (showHidden.value > 0.02) {
        const hA = showHidden.value;
        const hW = Math.max(10, hVal * railW);
        nodes.push(
          lumBar(railLeft + hW / 2, hidY, hW, 58, {
            color: ROLE.state,
            fillOpacity: 0.46,
            glow: 11,
            opacity: hA,
          }),
          txt(fmt(hVal, 4), railLeft + railW + 38, hidY, 44, ROLE.state, 'mono', 'left')
            .glow(8, ROLE.state)
            .opacity(hA),
        );
      }

      if (showRefLine.value > 0.02) {
        const refX = railLeft + hidden * railW;
        nodes.push(
          line([refX, hidY - 54], [refX, hidY + 54], {
            stroke: ROLE.gold,
            width: 3,
            dash: [8, 6],
          }).opacity(showRefLine.value),
          txt('o = 0.80', refX, hidY - 84, 26, ROLE.gold, 'mono', 'center').opacity(
            showRefLine.value,
          ),
        );
      }

      // Lower band: 3 mutually-exclusive states (Zoom Microscope -> Expose Formula -> Prediction Question)
      if (showZoom.value > 0.02) {
        const zA = showZoom.value;
        const zLeft = -320;
        const zRight = 580;
        const zY = 315;
        const zMin = 0.835;
        const zMax = 0.845;
        const xAt = (v) => zLeft + ((v - zMin) / (zMax - zMin)) * (zRight - zLeft);
        const xRet = xAt(Math.max(zMin, Math.min(zMax, cRet)));
        const xTot = xAt(Math.max(zMin, Math.min(zMax, cTot)));
        nodes.push(
          txt('Magnified cell tip:', -570, zY, 28, COSMOS.ink, 'serif', 'center').opacity(zA),
          line([zLeft, zY], [zRight, zY], { stroke: '#4e6396', width: 4 }).opacity(zA),
          ...[0.835, 0.84, 0.845].flatMap((tick) => {
            const tx = xAt(tick);
            return [
              line([tx, zY - 14], [tx, zY + 14], { stroke: '#6e83b7', width: 2.6 }).opacity(zA),
              txt(tick.toFixed(3), tx, zY + 42, 26, COSMOS.muted, 'mono', 'center').opacity(zA),
            ];
          }),
          glowingTrail(
            [
              [zLeft, zY],
              [xRet, zY],
            ],
            { color: ROLE.cell, width: 10, glow: 9, opacity: zA },
          ),
        );
        if (xTot > xRet + 2) {
          nodes.push(
            glowingTrail(
              [
                [xRet, zY],
                [xTot, zY],
              ],
              { color: ROLE.grad, width: 10, glow: 11, opacity: zA },
            ),
            glowDot(xTot, zY, { radius: 8, color: ROLE.gold, glow: 12, opacity: zA }),
          );
        }
      } else if (showQuestion.value > 0.02) {
        nodes.push(
          glowRing(-440, 325, 22, ROLE.gold, { width: 3, glow: 9, opacity: showQuestion.value }),
          txt('?', -440, 325, 28, ROLE.gold, 'mono', 'center').opacity(showQuestion.value),
          txt(
            'Turn output gate o down to 0.10. Which bar should move?',
            40,
            325,
            34,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showQuestion.value),
        );
      } else if (showHidden.value > 0.02) {
        nodes.push(
          glowTex(`h_t = ${oVal.toFixed(2)} \\times \\tanh(${fmt(cell, 4)}) = ${fmt(hVal, 4)}`, {
            x: 0,
            y: 325,
            size: 40,
            color: ROLE.state,
            glow: 7,
          }).opacity(showHidden.value),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.cell, ROLE.state), title, layer);

  playCue(s, c, 'forget-gate-b1-1', (d) => s.play(showKeepFormula.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'lstm-retained-term',
    (d) => s.play(retained.to(oldC * keepGate, { duration: d })),
    {
      dur: 0.75,
    },
  );
  playCue(
    s,
    c,
    'input-gate-b1-2',
    (d) => s.play(showWriteFormula.to(1, { duration: d }), showZoom.to(1, { duration: d })),
    { dur: 0.45 },
  );
  playCue(
    s,
    c,
    'next-cell-b2-1',
    (d) => s.play(addition.to(writeGate * candVal, { duration: d })),
    { dur: 0.65 },
  );
  playCue(
    s,
    c,
    'lstm-expose',
    (d) => s.play(showZoom.to(0, { duration: d * 0.4 }), showHidden.to(1, { duration: d * 0.6 })),
    { dur: 0.6 },
  );
  playCue(s, c, 'gate-question', (d) => s.play(showQuestion.to(1, { duration: d })), { dur: 0.45 });
  playCue(
    s,
    c,
    'exposed-hidden-state-b3-1',
    (d) =>
      s.play(
        showQuestion.to(0, { duration: 0.25 }),
        showRefLine.to(1, { duration: 0.3 }),
        expose.to(0.1, { duration: d }),
      ),
    { dur: 1.35 },
  );
}
