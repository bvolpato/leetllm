import { arrow, card, line, panel } from '../defaults.mjs';
export function drawFeatureClocks(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    if (currentBeat === 0) {
      const plot = teaching.axes({
        x: 260,
        y: 370,
        width: 1160,
        height: 400,
        xDomain: [9, 14],
        yDomain: [9, 14],
        xTicks: [10, 11, 12, 13],
        yTicks: [10, 11, 12, 13],
        xLabel: 'observed hour',
        yLabel: 'available hour',
        fontSize: 26,
      });
      const pts = [
        {
          id: 'A',
          x: 10,
          y: 11,
          value: 9,
        },
        {
          id: 'B',
          x: 11.5,
          y: 12.5,
          value: 99,
        },
        {
          id: 'C',
          x: 13,
          y: 13.0167,
          value: 100,
        },
      ];
      line(ctx, api, 956, 370, 956, 770, themeColors.yellow, 3);
      line(ctx, api, 260, 530, 1420, 530, themeColors.yellow, 3);
      teaching.scatter({
        plot,
        points: pts.map((v) => ({
          ...v,
          color: v.id === 'A' ? themeColors.green : themeColors.pink,
          radius: 14,
        })),
      });
      drawText('Request eval-1 · cutoff 12:00', 960, 280, 33, themeColors.yellow, 'center');
      drawText('A: 10:00 / 11:00 → 9', 1510, 450, 29, themeColors.green, 'center');
      drawText('B: arrives 12:30', 1530, 610, 29, themeColors.pink, 'center');
      drawText('C: observed 13:00', 1530, 760, 29, themeColors.pink, 'center');
      if (resultComplete('feature-selected'))
        card(ctx, api, 'Retain delay 9', 720, 915, 500, 80, themeColors.green, 33);
    } else if (currentBeat === 1) {
      paper(
        'Same instant · same entity',
        ['10:00:00Z', '10:00:00+00:00', 'Normalize to UTC → duplicate'],
        130,
        330,
        760,
        themeColors.pink,
      );
      paper(
        'One request, one outcome',
        ['request E1 → outcome E1', 'second outcome E1 → REJECT', 'missing scan → missing feature'],
        1030,
        330,
        760,
        themeColors.blue,
      );
      drawText(
        'No hidden multiplication of evaluation rows',
        960,
        870,
        39,
        themeColors.yellow,
        'center',
      );
    } else {
      const xs = [180, 460, 800, 1180, 1510, 1760],
        labels = ['May 20', 'May 22', 'May 25', 'May 28', 'May 30', 'May 31'];
      line(ctx, api, xs[0], 500, xs.at(-1), 500, themeColors.muted, 4);
      xs.forEach((x, i) => {
        api.circle(ctx, x, 500, 10, i < 3 ? themeColors.blue : themeColors.cyan);
        drawText(labels[i], x, 570, 27, themeColors.muted, 'center');
      });
      drawText('TRAIN request → label → cutoff', 490, 380, 34, themeColors.blue, 'center');
      drawText('EVAL request → label → snapshot', 1480, 380, 32, themeColors.cyan, 'center');
      arrow(ctx, api, 200, 740, 750, 740, themeColors.blue);
      arrow(ctx, api, 1190, 740, 1740, 740, themeColors.cyan);
      drawText(
        'Labels admit fitting/scoring; they do not become request features',
        960,
        900,
        35,
        themeColors.yellow,
        'center',
      );
    }
    footer('Synthetic clocks; as-of feature admission needs both clocks and the entity identity');
  }
  return;
}
export default {
  id: 'feature-clocks',
  draw: drawFeatureClocks,
  cues: [
    'feature-clocks-b1',
    'feature-clocks-selected',
    'pipe-result-feature-selected',
    'feature-clocks-b2',
    'feature-clocks-b3',
  ],
};
