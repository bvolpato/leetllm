// Scene 04: kernel: Fixed causal convolution kernel reproducing 1.7194 -> content-dependent write breaks single kernel.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  contentWriteFixture,
  contrib,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  hs,
  lumBar,
  playCue,
  txt,
  weights,
  xs,
} from '../parts.mjs';

export default function kernel(s, c) {
  const extraWrite = s.value(0); // 0 -> 0.3 (raises x=4 coefficient 0.2 -> 0.5!)
  const showConvNote = s.value(0);
  const showLimit = s.value(0);

  const bgAura = aura(0, 0, 740, '#16365e26', '#2e1a5218');
  const title = heroTitle(['Fixed Lag Kernel', 'vs Content Selection'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.read,
  });

  const eq = glowTex(String.raw`y_t = \sum_{k=0}^{t} K_k\, x_{t-k}`, {
    x: 520,
    y: -380,
    size: 40,
    color: ROLE.delta,
    glow: 6,
  });

  const stageVis = s.value(1);
  const maxC = 1.95;
  const maxW = 720;
  const barX = -380;

  const layer = guardedDynamic(stageVis, (alpha) => {
    const ew = extraWrite.value;
    const conv = showConvNote.value;
    const lim = showLimit.value;
    const model = contentWriteFixture(xs, ew);
    const nodes = [
      txt(
        ew > 0.05 ? 'CONTENT-DEPENDENT WRITE (x > 3 → b = 0.5)' : 'FIXED CAUSAL KERNEL WEIGHTS',
        -855,
        -215,
        26,
        ew > 0.05 ? ROLE.state : ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    model.contributions.forEach((cVal, idx) => {
      const y = -125 + idx * 100;
      const lag = 3 - idx;
      const isBoosted = idx === 2 && ew > 0.05;
      const col = isBoosted ? ROLE.state : ROLE.read;
      const coeff = model.coefficients[idx];
      nodes.push(
        txt(
          `lag ${lag} · x=${xs[idx]} (b=${coeff.toFixed(2)})`,
          -855,
          y,
          28,
          isBoosted ? ROLE.state : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
        lumBar(barX, y, (cVal / maxC) * maxW, 36, col, {
          opacity: alpha,
          glow: isBoosted ? 14 : 8,
          maxTrackW: maxW,
        }),
        txt(cVal.toFixed(4), barX + maxW + 32, y, 30, col, 'mono', 'left')
          .glow(isBoosted ? 8 : 0, col)
          .opacity(alpha),
      );
    });

    // Live sum footer
    nodes.push(
      txt(
        `Sum = ${model.output.toFixed(4)}   (base fixed kernel = ${hs[3].toFixed(4)}, lag weights [${weights.map((w) => w.toFixed(3)).join(', ')}])`,
        -855,
        295,
        26,
        ew > 0.05 ? ROLE.state : ROLE.delta,
        'mono',
        'left',
      ).opacity(alpha),
    );

    if (conv > 0.05 && lim < 0.2) {
      nodes.push(
        txt(
          'S4 uses FFT convolution across full sequences and recurrence at decode time',
          -855,
          365,
          28,
          ROLE.read,
          'sans',
          'left',
        ).opacity(conv * (1 - lim * 5) * alpha),
      );
    }

    if (lim > 0.2) {
      nodes.push(
        txt(
          `Same lag, different writes: x=1 vs x=4 need different b → no single lag kernel suffices`,
          -855,
          365,
          28,
          ROLE.delta,
          'sans',
          'left',
        )
          .glow(6, ROLE.delta)
          .opacity(lim * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'fixed-kernel', (d) => s.play(showConvNote.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'content-rule', (d) => s.play(extraWrite.to(0.3, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'fixed-kernel-limit', (d) => s.play(showLimit.to(1, { duration: d })), {
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), ['lag-contributions', 'decayed-sum', 'causal-convolution']);
}
