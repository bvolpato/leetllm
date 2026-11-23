export function drawNonlinear(ctx, scene, state, api, s) {
  const { C, components: c } = api,
    b = state.beat ?? 0,
    fresh = s.fresh;
  const T = (value, x, y, size = 32, color = C.ink, align = 'center') =>
    api.text(ctx, String(value), x, y, size, color, align);
  const M = (value, x, y, size = 42, color = C.ink) =>
    api.math(ctx, value, x, y, size, color, 'center');
  const F = (id, fn) => api.focus.target(fresh ? 'transfer-network' : id, fn);
  const card = (value, x, y, w = 260, color = C.blue, h = 95) =>
    c.card({
      label: value,
      x,
      y,
      width: w,
      height: h,
      fontSize: 32,
      fill: C.panel,
      stroke: color,
      textColor: color,
    });
  const fmt = (v) => Number(v.toFixed(3));
  const weights = s.updated ? s.nextWeights : s.weights,
    biases = s.updated ? s.nextBiases : s.biases,
    out = s.updated ? s.nextOut : s.outWeights,
    ob = s.updated ? s.nextOutBias : s.outBias,
    z = s.recomputed ? s.nextZ : s.z,
    h = s.recomputed ? s.nextHidden : s.hidden;
  T(
    fresh
      ? 'Fresh request · reset original network · x = 3 · target = 7 · η = 0.025'
      : 'Two-layer toy · same request x = 2 · target = 6',
    960,
    285,
    32,
    C.muted,
  );
  F('network-forward', () => {
    card('x = ' + s.x, 110, 535, 190, C.cyan, 100);
    for (let i = 0; i < 2; i++) {
      const y = 400 + i * 250;
      api.arrow(ctx, 325, 585, 475, y + 47, C.cyan, 4);
    }
  });
  F('network-hidden', () => {
    for (let i = 0; i < 2; i++) {
      const y = 400 + i * 250;
      card(
        (s.updated && !s.recomputed ? 'saved z' : 'z') +
          (i + 1) +
          ' = ' +
          (s.forward ? fmt(z[i]) : '?'),
        500,
        y,
        260,
        C.blue,
      );
    }
  });
  F('network-gates', () => {
    for (let i = 0; i < 2; i++) {
      const y = 400 + i * 250,
        open = s.z[i] > 0;
      api.arrow(ctx, 785, y + 47, 870, y + 47, s.activation && open ? C.green : C.muted, 4);
      card(
        (s.updated && !s.recomputed ? 'saved h' + (i + 1) + ' = ' : 'ReLU · ') +
          (s.activation ? fmt(h[i]) : '?'),
        895,
        y,
        260,
        s.activation && open ? C.green : C.muted,
      );
      if (s.activation && !open) {
        api.line(ctx, 813, y + 18, 843, y + 76, C.pink, 5);
        api.line(ctx, 843, y + 18, 813, y + 76, C.pink, 5);
      }
      api.arrow(
        ctx,
        1180,
        y + 47,
        1380,
        580 + (i ? 30 : -30),
        s.activation && open ? C.green : C.muted,
        4,
      );
    }
  });
  F('network-output', () => {
    const prediction = s.updated
      ? s.payoff
        ? fmt(s.nextPrediction)
        : '?'
      : s.initialPrediction
        ? s.prediction
        : '?';
    card('ŷ = ' + prediction, 1410, 535, 330, C.green, 100);
    T('target y = ' + s.target, 1575, 405, 35, C.pink);
    if (s.lossReady) M('L=' + fmt(s.nextLoss), 1575, 860, 47, C.green);
    else if (!s.updated && s.initialPrediction) M('L=' + s.loss, 1575, 860, 47, C.yellow);
    else if (s.updated) T('Recompute loss', 1575, 860, 30, C.muted);
  });
  F('network-parameters', () => {
    for (let i = 0; i < 2; i++) {
      const y = 400 + i * 250;
      T('w' + (i + 1) + ' = ' + fmt(weights[i]), 370, i ? 835 : y - 45, 31, C.blue);
      T('b' + (i + 1) + ' = ' + fmt(biases[i]), 620, y - 45, 31, C.blue);
      T('v' + (i + 1) + ' = ' + fmt(out[i]), 1245, i ? 835 : 375, 31, C.blue);
    }
    T('output bias c = ' + fmt(ob), 1575, 710, 31, C.blue);
    if (s.updated && !fresh)
      T(
        'All parameter changes use the original saved gradients · η = ' + s.rate,
        960,
        1005,
        29,
        C.yellow,
      );
  });
  F('network-backward', () => {
    if (s.backward && !s.updated) {
      for (let i = 0; i < 2; i++) {
        const y = 400 + i * 250,
          open = s.z[i] > 0;
        api.arrow(ctx, 870, y + 115, 785, y + 115, open ? C.yellow : C.muted, 4);
        M(
          'g_{z_' + (i + 1) + '}=' + (s.gradientsReady ? s.gradZ[i] : '?'),
          830,
          y + 170,
          30,
          open ? C.yellow : C.muted,
        );
      }
      if (s.gradientsReady) {
        M(
          'g_w=[' + s.gradWeights.join(', ') + '] \\quad g_b=[' + s.gradBiases.join(', ') + ']',
          570,
          950,
          31,
          C.yellow,
        );
        M(
          'g_v=[' + s.gradOut.join(', ') + '] \\quad g_c=' + s.gradOutBias,
          1410,
          950,
          31,
          C.yellow,
        );
      }
    }
  });
  F('network-update', () => {
    if (s.updated)
      T(
        s.recomputed
          ? 'Fresh forward values'
          : 'Parameters updated · forward recomputation pending',
        960,
        920,
        31,
        C.muted,
      );
  });
  if (fresh) {
    api.focus.target('transfer-prediction', () => {
      if (b === 0)
        T(
          'Use the old forward state · predict the next output before reveal',
          960,
          1005,
          31,
          C.yellow,
        );
    });
    api.focus.target('transfer-result', () => {
      if (b > 0)
        T(
          s.payoff
            ? 'Checked prediction ' + fmt(s.nextPrediction) + ' · target remains ' + s.target
            : 'New prediction pending · retain the saved forward state',
          960,
          1005,
          31,
          s.payoff ? C.green : C.muted,
        );
    });
  }
  if (!fresh && !s.backward && !s.updated)
    T('Save z and h from this exact forward pass for the reverse sweep', 960, 1005, 29, C.muted);
}
