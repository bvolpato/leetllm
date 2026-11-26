// Scene 14: factor-order: Inverse-Hessian update, free submatrix invert (1/4 vs 20.5), damped Cholesky R^T R = H^-1, deferred block update.
import {
  COSMOS,
  DEFERRED_EX,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function factorOrder(s, c) {
  const step = s.value(0); // 0=inv formula, 1=free submatrix 1/4, 2=cholesky, 3=deferred block

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Cholesky Factor & Block Updates:', 'Making GPTQ Fast at Scale'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.code,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = step.value;

    const nodes = [
      txt(
        'INVERSE-HESSIAN UPDATE:  dw = -(w_i - q_i) / [H^-1]_ii  ·  [H^-1]_{:,i}',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // 3 mechanism blocks
      rect(520, 225, {
        fill: st >= 0.7 && st < 1.7 ? '#162846' : '#10182d',
        stroke: st >= 0.7 && st < 1.7 ? ROLE.gold : ROLE.weight,
        width: 2.8,
        radius: 12,
      })
        .at(-585, -35)
        .opacity(alpha),
      txt('1. FREE SUBMATRIX ONLY', -585, -108, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Fix w1 -> free H_22 = 4', -585, -52, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Free inverse = 1/4 = 0.25', -585, 2, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('(NOT old full 20.5!)', -585, 48, 26, ROLE.err, 'mono', 'center').opacity(alpha),

      rect(520, 225, {
        fill: st >= 1.7 && st < 2.6 ? '#181434' : '#10182d',
        stroke: st >= 1.7 && st < 2.6 ? ROLE.code : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(0, -35)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 2))),
      txt('2. DAMPED CHOLESKY', 0, -108, 26, ROLE.code, 'mono', 'center').opacity(alpha),
      txt('H_damped = H + lambda I', 0, -52, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('R^T R = (H_damped)^-1', 0, 2, 28, ROLE.grid, 'mono', 'center').opacity(alpha),
      txt('Rows stream updates in order', 0, 48, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      rect(520, 225, {
        fill: st >= 2.6 ? '#0f2d24' : '#10182d',
        stroke: st >= 2.6 ? ROLE.ok : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(585, -35)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 3))),
      txt('3. DEFERRED BLOCK GEMM', 585, -108, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Save block errors E_B', 585, -52, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(`W_rest -= E_B · F`, 585, 2, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt(
        `After[0,0]: ${DEFERRED_EX.before[0][0].toFixed(2)} -> ${DEFERRED_EX.after[0][0].toFixed(2)}`,
        585,
        48,
        26,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      chipPill(
        st >= 2.6
          ? 'Deferred block GEMM turns thousands of tiny column edits into one dense GPU matrix multiply!'
          : 'Upper Cholesky rows give exact sequential inverse updates without re-inverting H every step',
        0,
        215,
        {
          w: 1620,
          h: 76,
          color: st >= 2.6 ? ROLE.ok : ROLE.code,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'factor-order-build-0', (d) => s.play(step.to(0.4, { duration: d })));
  playCue(s, c, 'fix-coordinate', (d) => s.play(step.to(1.0, { duration: d })));
  playCue(s, c, 'factor-order-build-1', (d) => s.play(step.to(1.2, { duration: d })));
  playCue(s, c, 'invert-free', (d) => s.play(step.to(1.5, { duration: d })));
  playCue(s, c, 'factor-order-build-2', (d) => s.play(step.to(2.2, { duration: d })));
  playCue(s, c, 'factor-order-build-3', (d) => s.play(step.to(3.0, { duration: d })));
}
