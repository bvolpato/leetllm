import {
  data,
  fitted,
  predict,
  rowsFor,
  baseline,
  meanY,
  total,
  trainingR2,
  increments,
  nextIncrement,
  nextTime,
  four,
  sum,
  lineAt,
  optimum,
} from './replay.mjs';
import {
  C,
  frame,
  screen,
  text,
  mono,
  serif,
  line,
  poly,
  dot,
  rect,
  pulse,
  scale,
  axisPlot,
  trace,
  square,
  readout,
  mix,
  fmt,
  signed,
  cue,
} from './marks.mjs';

export function arrivals(g, c) {
  const b = c.beat.beatIndex,
    X = scale(100, 230, 415, 1765);
  const landing = b === 0 ? cue(c, 'Watch where', 0.7) : 1;
  const spread = b === 0 ? cue(c, 'Now add', 0.55) : 1;
  const rowSweep = b === 0 ? cue(c, 'Now add', 3.15) : 1;
  const delta = b === 0 ? cue(c, 'but the gaps shrink', 0.35) : 1;
  const next = b === 2 ? cue(c, 'That puts the forecast') : 0;
  frame(
    g,
    spread === 0 ? 'Catch the first reply' : 'Where will the sixth reply land?',
    'Request replay  /  assistant latency',
  );
  screen(g, 80, 246, 1760, 660);
  text(g, 'Context', 134, 310, 30, C.soft);
  text(g, 'Time after sending  (ms)', 414, 306, 30, C.white);
  text(g, 'Constructed example', 1765, 306, 35, C.soft, 'right');
  for (let ms = 100; ms <= 230; ms += 5) {
    const xx = X(ms),
      major = ms % 10 === 0;
    line(g, xx, 365, xx, 820, major ? C.grid : '#224347', major ? 2 : 1);
    if (major) mono(g, ms, xx, 350, 24, C.soft, 'center');
  }
  for (let i = 0; i < 6; i++) {
    const forecast = i === 5;
    if (i > 0 && spread < 1) continue;
    const y = mix(605, 420, spread) + i * 75;
    mono(g, `${(i + 1) * 100} tokens`, 136, y, 30, forecast ? C.lilac : C.white);
    line(g, X(100), y, X(230), y, C.grid, 2, forecast ? [6, 9] : []);
    if (i === 0 && landing < 1) {
      const travel = cue(c, "Here's", 3.02);
      const signal = mix(X(100), X(data[0].y), travel);
      line(g, X(100), y, signal, y, C.gold, 4);
      dot(g, signal, y, 12, C.gold);
    }
    const visible = i === 0
      ? Number(landing === 1)
      : Math.max(0, Math.min(1, rowSweep * 5 - i));
    if (!forecast && visible > 0) {
      const mt = data[i].y,
        xx = X(mt);
      g.save();
      g.globalAlpha = visible;
      line(g, X(100), y, xx - 22, y, '#b59a64', 2);
      const gain = i === 0 ? mix(2.7, 1, spread) : 1;
      pulse(g, xx, y, C.gold, gain);
      // In this recording “lands” starts 0.825 seconds after “Watch.”
      if (i !== 0 || b !== 0 || cue(c, 'Watch where', 0.825) === 1) {
        mono(
          g,
          spread === 0 ? `${mt} ms` : `${mt}`,
          xx + 36 * gain,
          y - 24 * gain,
          Math.round(mix(30, 39, spread) * gain),
          C.gold,
        );
      }
      g.restore();
      if (i && delta) {
        const a = X(data[i - 1].y),
          yy = y + 21;
        g.save();
        g.globalAlpha = delta;
        line(g, a, yy, xx, yy, C.soft, 2);
        line(g, a, yy - 5, a, yy + 5, C.soft);
        line(g, xx, yy - 5, xx, yy + 5, C.soft);
        mono(g, '+' + increments[i - 1], (xx + a) / 2, yy + 19, 36, C.white, 'center');
        g.restore();
      }
    }
    if (forecast && next > 0) {
      g.save();
      g.globalAlpha = next;
      dot(g, X(nextTime), y, 11, null, C.lilac, 4);
      mono(g, `${nextTime} ms`, X(nextTime) + 22, y - 20, 30, C.lilac);
      g.restore();
    }
  }
  if (b === 2)
    serif(
      g,
      next > 0
        ? `198 + ${nextIncrement} = ${nextTime} ms   ·   forecast`
        : 'How much smaller is each new gap?',
      1456,
      174,
      46,
      C.ink,
      'center',
    );
}

export function coefficients(g, c) {
  const i = c.beat.beatIndex,
    b = i === 0 ? 85 + 15 * cue(c, 'Raise the intercept', 1.4) : 100;
  const m = i === 0 ? 10 : i === 1 ? 10 + 10 * cue(c, 'increase the slope', 1.6) : 20;
  const row = data[2],
    fn = lineAt(b, m),
    val = fn(row.x);
  frame(g, 'Shift the line. Then turn it.', 'Line calibration  /  one unit is 100 tokens');
  screen(g, 80, 252, 1125, 675);
  const p = axisPlot(g, {
    right: 1110,
    top: 355,
    bottom: 800,
    yd: [70, 230],
    yt: [80, 100, 130, 160, 190, 220],
  });
  trace(g, p, fn);
  for (const r of data) dot(g, p.X(r.x), p.Y(r.y), 8, C.gold);
  const offset = i === 2 ? cue(c, 'back to zero') : 0;
  const sixth = i === 2 && cue(c, 'At six hundred tokens') > 0;
  const focus = sixth ? 6 : offset === 1 ? 0 : 3;
  line(g, p.X(focus), p.bottom, p.X(focus), p.Y(fn(focus)), C.soft, 2, [6, 8]);
  dot(g, p.X(focus), p.Y(fn(focus)), 14, null, C.cyan, 3);
  readout(g, 'Intercept  (ms)', fmt(b), 1275, 325);
  readout(g, 'Slope  (ms / 100 tokens)', fmt(m), 1275, 486);
  line(g, 1275, 629, 1818, 629, C.rule, 2);
  const x = focus;
  text(
    g,
    x === 0
      ? 'Zero context · extrapolation'
      : x === 6
        ? '600 tokens · extrapolation'
        : '300-token request',
    1275,
    688,
    32,
    C.subtle,
  );
  mono(g, `${fmt(b)} + ${x} × ${fmt(m)}`, 1275, 750, 39, C.ink);
  mono(g, `= ${fmt(fn(x))} ms`, 1275, 830, 55, C.teal);
  if (i === 1 && m === 20)
    text(g, `Pulse at ${row.y} ms   ·   miss ${signed(row.y - val)} ms`, 1275, 920, 31, C.ochre);
}

export function residuals(g, c) {
  const i = c.beat.beatIndex;
  const shift = i === 1 ? cue(c, 'Try lifting', 1.3) - cue(c, 'Bring the line back', 1.2) : 0;
  const lift = Math.round(60 * shift) / 10;
  const fit = lineAt(optimum.intercept + lift, optimum.slope);
  const rows = rowsFor(fit);
  const align = i === 0 ? cue(c, 'Align the prediction', 1.3) : 1;
  const others = i === 1 ? cue(c, 'Bring over the other requests', 1.3) : Number(i > 1);
  const answer = 'The two milliseconds left over';
  if (i === 0) c.reveal(answer, 0, { captionStart: answer });
  const showResidual = i > 0 || c.elapsed >= c.wordCue(answer).end;
  frame(
    g,
    'Read the distance from the prediction',
    'Residual microscope  /  observed minus predicted',
  );
  text(g, 'Context  (100 tokens)', 91, 221, 35, C.ink);
  screen(g, 75, 251, 1770, 669);
  const columns = { left: 223, right: 1299, xd: [0.65, 5.35] };
  const latency = axisPlot(g, {
    ...columns,
    top: 343,
    bottom: 506,
    xt: [],
    yd: [110, 210],
    yt: [120, 160, 200],
    xName: '',
  });
  const mid = rows[2];
  const guide = latency.X(mid.x);
  line(g, guide, latency.top, guide, latency.bottom, C.soft, 2, [5, 7]);
  if (lift > 0) {
    line(
      g,
      latency.left,
      latency.Y(predict(latency.xd[0])),
      latency.right,
      latency.Y(predict(latency.xd[1])),
      C.soft,
      3,
      [7, 7],
    );
  }
  trace(g, latency, fit, C.cyan, 5);
  rows.forEach((r) => dot(g, latency.X(r.x), latency.Y(r.y), 8, C.gold));
  dot(g, guide, latency.Y(mid.y), 15, null, C.gold, 2);
  const bracket = guide + 34;
  const observedY = latency.Y(mid.y);
  const predictedY = latency.Y(mid.fit);
  poly(
    g,
    [[guide + 18, observedY], [bracket, observedY], [bracket, predictedY], [guide + 18, predictedY]],
    C.gold,
    2,
  );

  if (align > 0) {
    g.save();
    g.globalAlpha = align;
    const residual = axisPlot(g, {
      ...columns,
      top: 590,
      bottom: 818,
      xt: rows.map((r) => r.x),
      yd: [-8.8, 3.8],
      yt: [-8, -4, 0, 2],
      yName: 'Residual  (ms)  ·  enlarged scale',
      xName: '',
      xTickOffset: 15,
    });
    const zero = residual.Y(0);
    line(g, guide, latency.bottom, guide, residual.bottom, C.soft, 2, [5, 7]);
    line(g, residual.left, zero, residual.right, zero, C.cyan, 3);
    rows.forEach((r, index) => {
      const focus = r === mid;
      if (!focus && others === 0) return;
      const x = residual.X(r.x);
      const observed = residual.Y(r.miss);
      g.save();
      g.globalAlpha *= focus ? 1 : others;
      if (lift > 0) dot(g, x, residual.Y(fitted[index].miss), 8, null, C.soft, 2);
      const tip = mix(zero, observed, align);
      line(g, x, zero, x, tip, C.gold, focus ? 6 : 4);
      dot(g, x, tip, focus ? 11 : 8, C.gold);
      if (align === 1) mono(g, signed(r.miss), x + 24, observed, 32, C.gold);
      g.restore();
    });
    g.restore();
  }

  line(g, 1365, 312, 1365, 857, C.grid, 2);
  text(g, `${mid.x * 100}-token request`, 1411, 334, 34, C.white);
  text(g, 'Observed', 1411, 415, 32, C.gold);
  mono(g, `${mid.y} ms`, 1785, 415, 34, C.gold, 'right');
  text(g, 'Predicted', 1411, 486, 32, C.cyan);
  mono(g, `− ${fmt(mid.fit)} ms`, 1785, 486, 34, C.cyan, 'right');
  line(g, 1411, 528, 1785, 528, C.grid, 2);
  if (showResidual) {
    text(g, 'Residual', 1411, 576, 33, C.white);
    mono(g, `${signed(mid.miss)} ms`, 1411, 638, 58, C.gold);
  }
  if (lift > 0) {
    text(g, 'Intercept shift', 1411, 750, 30, C.soft);
    mono(g, `${signed(lift)} ms`, 1785, 750, 32, C.cyan, 'right');
    dot(g, 1420, 822, 8, null, C.soft, 2);
    text(g, 'Residuals before the lift', 1442, 822, 27, C.soft);
  }
}
function baselineTrial(g, c) {
  const last = data.at(-1),
    model = four.intercept + four.slope * last.x,
    open = cue(c, 'Now uncover', 0.7);
  frame(
    g,
    'Refit on four. Revisit the fifth.',
    'Retrospective holdout  /  fifth reply already inspected',
  );
  screen(g, 80, 256, 1760, 615);
  const X = scale(140, 212, 480, 1735);
  for (let ms = 140; ms <= 210; ms += 10) {
    line(g, X(ms), 400, X(ms), 745, C.grid, 2);
    mono(g, ms, X(ms), 369, 27, C.soft, 'center');
  }
  text(g, '500-token request  (ms)', 480, 313, 29, C.white);
  const show = cue(c, 'Their mean', 0.55);
  for (const [idx, label, val, col] of [
    [0, 'Line forecast', model, C.cyan],
    [1, 'Training mean', four.mean, C.green],
  ]) {
    const y = 493 + idx * 148;
    text(g, label, 142, y, 37, col);
    line(g, X(140), y, X(212), y, C.grid, 2);
    if (!idx || show) {
      dot(g, X(val), y, 12, col);
      mono(g, fmt(val), X(val), y - 42, 34, col, 'center');
    }
    if (open > 0) {
      line(g, X(val), y + 28, X(last.y), y + 28, col, 4);
      mono(
        g,
        `${fmt(Math.abs(val - last.y))} ms`,
        (X(val) + X(last.y)) / 2,
        y + 63,
        30,
        col,
        'center',
      );
    }
  }
  if (open > 0) {
    line(g, X(last.y), 410, X(last.y), 739, C.gold, 3, [6, 9]);
    pulse(g, X(last.y), 759);
    mono(g, `Reply  ${last.y} ms`, X(last.y), 811, 32, C.gold, 'center');
  }
  mono(g, `Four-row fit   ŷ = ${four.intercept} + ${four.slope}x`, 142, 810, 39, C.white);
}
export function loss(g, c) {
  const id = c.beat.id;
  if (id === 'c04-baseline') {
    baselineTrial(g, c);
    return;
  }
  const comparing = id === 'c04-chord',
    lifting = id === 'c04-chord-result',
    chord = comparing || lifting,
    mean = id === 'c04-b03',
    score = id === 'c04-b04';
  let mid = 100;
  if (comparing) mid = 100 - Math.round(20 * cue(c, 'Lower the line', 1.3)) / 10;
  if (lifting) mid = 98 + Math.round(20 * cue(c, 'Lift that line', 1.3)) / 10;
  const rows = mean ? baseline : rowsFor(lineAt(mid, 20));
  frame(
    g,
    mean
      ? 'What did knowing the length buy us?'
      : score
        ? 'How much can one score hide?'
        : lifting && mid > 98
          ? 'Lift the line back to its fit'
          : chord
            ? 'Which square gains the most area?'
            : 'Each miss cuts its own square',
    'Error measurement  /  five requests',
  );
  screen(g, 80, 249, 1760, 640);
  if (mean || score) {
    const p = axisPlot(g, {
      left: 210,
      right: 1070,
      top: 347,
      bottom: 748,
      xd: [1, 5],
      xt: [1, 2, 3, 4, 5],
      yd: mean ? [110, 210] : [-3, 3],
      yt: mean ? [120, 140, 160, 180, 200] : [-2, 0, 2],
      yName: mean ? 'Reply time  (ms)' : 'Residual  (ms)',
    });
    if (mean) {
      trace(g, p, () => meanY, C.green);
      rows.forEach((r) => {
        line(g, p.X(r.x), p.Y(r.fit), p.X(r.x), p.Y(r.y), C.gold, 4);
        dot(g, p.X(r.x), p.Y(r.y), 9, C.gold);
      });
    } else {
      trace(g, p, () => 0, C.cyan, 3);
      fitted.forEach((r) => {
        line(g, p.X(r.x), p.Y(0), p.X(r.x), p.Y(r.miss), C.gold, 4);
        dot(g, p.X(r.x), p.Y(r.miss), 10, C.gold);
      });
    }
    text(g, mean ? 'Always predict the mean' : 'Squared error left', 1200, 375, 32, C.soft);
    mono(g, mean ? `${meanY} ms` : '14 / 4014', 1200, 452, 60, mean ? C.green : C.gold);
    if (!mean || cue(c, 'mean squared error') > 0) {
      text(g, mean ? 'Mean squared error' : 'Training R²', 1200, 596, 32, C.soft);
      mono(g, mean ? `${total(rows) / 5} ms²` : fmt(trainingR2, 4), 1200, 681, 56, C.white);
    }
    return;
  }
  const revealSquares = id !== 'c04-b01' || cue(c, 'as the side of a square') > 0;
  const unit = 58;
  rows.forEach((r, i) => {
    const x = 285 + i * 335;
    mono(g, `${r.x * 100} tokens`, x, 337, 30, C.soft, 'center');
    mono(g, `${signed(r.miss)} ms`, x, 404, 38, C.white, 'center');
    line(g, x - 125, 706, x + 125, 706, C.grid, 2);
    if (revealSquares) {
      square(g, x, 705, Math.abs(r.miss), unit);
      if (chord) {
        const w = Math.abs(fitted[i].miss) * unit;
        g.save();
        g.setLineDash([10, 7]);
        for (const [color, width] of [
          [C.dark, 6],
          [C.white, 2.5],
        ]) {
          g.strokeStyle = color;
          g.lineWidth = width;
          g.strokeRect(x - w / 2, 705 - w, w, w);
        }
        g.restore();
      }
      mono(g, `${fmt(r.area, 2)} ms²`, x, 771, 35, C.gold, 'center');
    } else {
      line(g, x, 620, x, 620 - r.miss * 25, C.gold, 5);
      dot(g, x, 620 - r.miss * 25, 9, C.gold);
    }
  });
  if (id === 'c04-b01')
    mono(g, `Σ residuals = ${sum(rows.map((r) => r.miss))} ms`, 100, 221, 40, C.ink);
  if (chord) {
    text(g, 'Dashed outline = original square', 960, 838, 29, C.soft, 'center');
    const name = mid === 98 ? 'Endpoint line' : mid === 100 ? 'Fitted line' : 'Moving line';
    mono(g, `${name}   ŷ = ${fmt(mid, 2)} + 20x`, 100, 221, 40, C.teal);
    if (lifting && cue(c, 'Add the two') > 0)
      mono(g, `Total   ${fmt(total(rows), 2)} ms²`, 1818, 221, 40, C.ink, 'right');
  }
  if (id === 'c04-b02') {
    mono(g, `MSE   ${total(rows)} / 5 = ${total(rows) / 5} ms²`, 100, 221, 40, C.teal);
    if (cue(c, 'Taking the square root'))
      mono(
        g,
        `RMSE   √2.8 ≈ ${fmt(Math.sqrt(total(rows) / 5), 2)} ms`,
        1815,
        221,
        39,
        C.ink,
        'right',
      );
  }
}
