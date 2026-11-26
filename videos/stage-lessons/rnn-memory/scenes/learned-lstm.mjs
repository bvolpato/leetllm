// Scene 13: learned-lstm: "Where do the gate settings come from?"
// Clean luminous LSTM gate circuit: 5-pin input bus at top, active computation lane,
// persistent 4-valve bank (forget, write, candidate, expose), and additive cell/hidden update.
import {
  COSMOS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function learnedLstm(s, c) {
  const m = MODEL.lstm;
  const title = heroTitle(['Where do the gate', 'settings come from?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.cell,
  });

  // Discrete stages so active calculation lane NEVER collides
  const showEventPins = s.value(0);
  // workMode: 0=none, 1=forget weights, 2=forget dot products, 3=write proj, 4=cand proj, 5=out proj, 6=new cell sums
  const workMode = s.value(0);
  const gatesLit = s.value(0); // 0 -> 1(f) -> 2(i) -> 3(cand) -> 4(o)
  // bottomMode: 0=old cell, 1=products formula, 2=kept+written terms, 3=exposed hidden output
  const bottomMode = s.value(0);

  const pinNames = ['old h₁', 'old h₂', 'error', 'repro', 'rollback'];
  const pinXs = [-580, -290, 0, 290, 580];
  const valveCols = [
    { name: 'forget f', vals: m.f, col: ROLE.cell },
    { name: 'write i', vals: m.i, col: ROLE.grad },
    { name: 'cand c̃', vals: m.candidate, col: ROLE.gate },
    { name: 'expose o', vals: m.o, col: ROLE.state },
  ];
  const valveXs = [-345, -75, 195, 465];

  const layer = guardedDynamic(
    () => 1,
    () => {
      const wm = Math.round(workMode.value);
      const gl = Math.round(gatesLit.value);
      const bm = Math.round(bottomMode.value);
      const nodes = [];

      // Row 1: 5-pin concatenated input bus [h_{t-1}, x_t]
      pinNames.forEach((name, j) => {
        if (j < 2 || showEventPins.value > 0.5) {
          const isActive = m.joined[j] !== 0;
          const col = j < 2 ? ROLE.state : j === 3 ? ROLE.gold : ROLE.input;
          nodes.push(
            tokenPill(`${name}: ${m.joined[j]}`, pinXs[j], -248, isActive ? col : COSMOS.dim, {
              w: 248,
              h: 52,
              size: 27,
              font: 'mono',
              glow: isActive ? 8 : 2,
            }),
          );
        }
      });

      // Row 2: Active gate computation stage (mutually exclusive modes -> zero collisions)
      const wY1 = -132;
      const wY2 = -70;
      if (wm === 1) {
        nodes.push(
          txt(
            `f₁ weights:   [ ${m.forgetMatrix[0].join('   ')} ]`,
            0,
            wY1,
            32,
            ROLE.cell,
            'mono',
            'center',
          ),
          txt(
            `f₂ weights:   [ ${m.forgetMatrix[1].join('   ')} ]`,
            0,
            wY2,
            32,
            ROLE.cell,
            'mono',
            'center',
          ),
        );
      } else if (wm === 2) {
        nodes.push(
          txt('f₁ = σ(1×0.4 + 0.6×1) = σ(1.0)', 0, wY1, 32, ROLE.cell, 'mono', 'center'),
          txt('f₂ = σ(−0.5×1) = σ(−0.5)', 0, wY2, 32, ROLE.cell, 'mono', 'center'),
        );
      } else if (wm === 3) {
        nodes.push(
          txt('write₁ = σ(−1 × reproduction) = σ(−1)', 0, wY1, 32, ROLE.grad, 'mono', 'center'),
          txt(
            'write₂ = σ(0 × reproduction) = σ(0) = 0.500',
            0,
            wY2,
            32,
            ROLE.grad,
            'mono',
            'center',
          ),
        );
      } else if (wm === 4) {
        nodes.push(
          txt(
            'cand₁ = tanh(0.5 × reproduction) = tanh(0.5)',
            0,
            wY1,
            32,
            ROLE.gate,
            'mono',
            'center',
          ),
          txt(
            'cand₂ = tanh(0) = 0.000   (nothing to write)',
            0,
            wY2,
            32,
            ROLE.gold,
            'mono',
            'center',
          ),
        );
      } else if (wm === 5) {
        nodes.push(
          txt('expose₁ = σ(ln 4) = 0.800', 0, wY1, 32, ROLE.state, 'mono', 'center'),
          txt('expose₂ = σ(0) = 0.500', 0, wY2, 32, ROLE.state, 'mono', 'center'),
        );
      } else if (wm === 6) {
        nodes.push(
          glowTex(`c_1 = ${fmt(m.nextCell[0], 6)}`, {
            x: -290,
            y: -102,
            size: 42,
            color: ROLE.cell,
            glow: 9,
          }),
          glowTex(`c_2 = ${fmt(m.nextCell[1], 6)}`, {
            x: 290,
            y: -102,
            size: 42,
            color: ROLE.cell,
            glow: 9,
          }),
        );
      }

      // Row 3: Persistent 4-valve bank across coord 1 and coord 2
      const rowY1 = 92;
      const rowY2 = 176;
      nodes.push(
        txt('coord 1', -640, rowY1, 28, COSMOS.muted, 'mono', 'center'),
        txt('coord 2', -640, rowY2, 28, COSMOS.muted, 'mono', 'center'),
      );
      valveCols.forEach(({ name, vals, col }, idx) => {
        const vx = valveXs[idx];
        const isLit = gl > idx;
        nodes.push(txt(name, vx, 22, 30, col, 'serif', 'center'));
        [rowY1, rowY2].forEach((ry, r) => {
          nodes.push(
            lumBar(vx, ry, 210, 62, {
              color: isLit ? col : COSMOS.dim,
              fillOpacity: isLit ? 0.24 : 0.08,
              glow: isLit ? 8 : 0,
              dash: isLit ? undefined : [6, 6],
            }),
          );
          if (isLit) {
            nodes.push(txt(fmt(vals[r], 3), vx, ry, 34, col, 'mono', 'center'));
          }
        });
      });

      // Row 4: Bottom cell update & exposed hidden state lane
      const bY1 = 296;
      const bY2 = 368;
      if (bm === 0) {
        nodes.push(
          txt(`old cell 1 = ${fmt(m.cOld[0], 3)}`, -280, bY1 + 24, 34, ROLE.cell, 'mono', 'center'),
          txt(`old cell 2 = ${fmt(m.cOld[1], 3)}`, 280, bY1 + 24, 34, ROLE.cell, 'mono', 'center'),
        );
      } else if (bm === 1) {
        nodes.push(
          txt(
            `c₁ ≈ ${fmt(m.f[0], 3)}×${fmt(m.cOld[0], 3)} + ${fmt(m.i[0], 3)}×${fmt(m.candidate[0], 3)}`,
            0,
            bY1,
            32,
            COSMOS.ink,
            'mono',
            'center',
          ),
          txt(
            `c₂ ≈ ${fmt(m.f[1], 3)}×${fmt(m.cOld[1], 3)} + ${fmt(m.i[1], 3)}×${fmt(m.candidate[1], 3)}`,
            0,
            bY2,
            32,
            ROLE.gold,
            'mono',
            'center',
          ),
        );
      } else if (bm === 2) {
        nodes.push(
          txt(
            `c₁:  ${fmt(m.retained[0], 6)} kept  +  ${fmt(m.written[0], 6)} written`,
            0,
            bY1,
            32,
            ROLE.cell,
            'mono',
            'center',
          ),
          txt(
            `c₂:  ${fmt(m.retained[1], 6)} kept  +  ${fmt(m.written[1], 6)} written (old cell only)`,
            0,
            bY2,
            32,
            ROLE.gold,
            'mono',
            'center',
          ),
        );
      } else if (bm === 3) {
        nodes.push(
          txt(
            `h₁ = ${m.o[0].toFixed(1)} × tanh(${fmt(m.nextCell[0], 6)}) = ${fmt(m.nextHidden[0], 6)}`,
            0,
            bY1,
            32,
            ROLE.state,
            'mono',
            'center',
          ),
          txt(
            `h₂ = ${m.o[1].toFixed(1)} × tanh(${fmt(m.nextCell[1], 6)}) = ${fmt(m.nextHidden[1], 6)}`,
            0,
            bY2,
            32,
            ROLE.state,
            'mono',
            'center',
          ),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.cell, ROLE.gate), title, layer);

  playCue(s, c, 'learned-lstm-0', () => showEventPins.set(1), { dur: 0.25 });
  playCue(s, c, 'lstm-concat', () => workMode.set(1), { dur: 0.25 });
  playCue(s, c, 'learned-lstm-1', () => workMode.set(2), { dur: 0.25 });
  playCue(s, c, 'lstm-forget-result', () => gatesLit.set(1), { dur: 0.25 });

  playCue(s, c, 'lstm-input-gate', () => workMode.set(3), { dur: 0.25 });
  playCue(s, c, 'lstm-input-result', () => gatesLit.set(2), { dur: 0.25 });

  playCue(s, c, 'lstm-candidate-gate', () => workMode.set(4), { dur: 0.25 });
  playCue(s, c, 'lstm-candidate-result', () => gatesLit.set(3), { dur: 0.25 });

  playCue(s, c, 'lstm-output-gate', () => workMode.set(5), { dur: 0.25 });
  playCue(s, c, 'lstm-output-result', () => gatesLit.set(4), { dur: 0.25 });

  playCue(s, c, 'lstm-products', () => bottomMode.set(1), { dur: 0.25 });
  playCue(s, c, 'lstm-cell-join', () => bottomMode.set(2), { dur: 0.25 });
  playCue(s, c, 'lstm-cell-result', () => workMode.set(6), { dur: 0.25 });
  playCue(s, c, 'lstm-hidden-result', () => bottomMode.set(3), { dur: 0.25 });
}
