export function buildCat(eyes, blinkStep) {
  const W = 52,
    H = 46;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const outline = '#38283c',
    red = '#af4a3d',
    orange = '#ed8550',
    gold = '#ffb76b';
  const cream = '#ffdf9b',
    pink = '#e17f81',
    white = '#fff1c5',
    teal = '#459b9a';
  function rect(x, y, w, h, c) {
    for (let r = y; r < y + h; r++) for (let i = x; i < x + w; i++) grid[r][i] = c;
  }
  function poly(c, points) {
    for (let row = 0; row < H; row++) {
      const y = row + 0.5,
        hits = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i],
          [x2, y2] = points[(i + 1) % points.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
          hits.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i < hits.length; i += 2) {
        const start = Math.ceil(hits[i] - 0.5);
        rect(start, row, Math.ceil(hits[i + 1] - 0.5) - start, 1, c);
      }
    }
  }
  const head = [
    [4, 2],
    [8, 2],
    [18, 10],
    [22, 9],
    [24, 7],
    [25, 9],
    [29, 7],
    [29, 9],
    [34, 10],
    [44, 1],
    [48, 1],
    [48, 11],
    [46, 18],
    [47, 21],
    [49, 23],
    [48, 24],
    [51, 27],
    [48, 28],
    [50, 30],
    [46, 31],
    [47, 33],
    [42, 36],
    [39, 38],
    [32, 40],
    [29, 41],
    [21, 41],
    [15, 39],
    [10, 37],
    [5, 34],
    [7, 32],
    [2, 31],
    [4, 28],
    [1, 27],
    [4, 24],
    [3, 23],
    [6, 19],
    [4, 14],
  ];
  poly(outline, head);
  poly(orange, [
    [6, 4],
    [8, 4],
    [17, 12],
    [21, 11],
    [24, 9],
    [24, 11],
    [28, 9],
    [28, 11],
    [35, 12],
    [45, 3],
    [46, 3],
    [46, 12],
    [44, 18],
    [46, 22],
    [45, 24],
    [49, 26],
    [46, 27],
    [47, 30],
    [43, 30],
    [45, 33],
    [40, 35],
    [36, 38],
    [28, 39],
    [21, 39],
    [14, 37],
    [7, 33],
    [9, 31],
    [4, 30],
    [6, 27],
    [3, 26],
    [7, 24],
    [6, 22],
    [8, 19],
  ]);
  poly(red, [
    [7, 5],
    [15, 13],
    [9, 18],
    [8, 13],
  ]);
  poly(pink, [
    [8, 7],
    [14, 13],
    [10, 15],
  ]);
  poly(red, [
    [37, 12],
    [45, 4],
    [44, 15],
    [42, 18],
  ]);
  poly(pink, [
    [39, 12],
    [44, 7],
    [43, 15],
  ]);
  poly(gold, [
    [9, 20],
    [17, 13],
    [23, 12],
    [33, 13],
    [42, 20],
    [40, 29],
    [34, 35],
    [25, 38],
    [14, 34],
    [9, 29],
  ]);
  // Three forehead stripes and the sweep of fur beneath each ear.
  poly(red, [
    [17, 12],
    [20, 11],
    [22, 16],
    [20, 16],
  ]);
  poly(red, [
    [23, 11],
    [28, 10],
    [26, 18],
    [24, 16],
  ]);
  poly(red, [
    [30, 12],
    [34, 12],
    [31, 16],
    [29, 17],
  ]);
  for (const flip of [false, true]) {
    const xx = (x) => (flip ? 52 - x : x);
    poly(
      red,
      [
        [7, 20],
        [12, 19],
        [10, 21],
        [7, 22],
      ].map(([x, y]) => [xx(x), y]),
    );
    poly(
      red,
      [
        [5, 24],
        [11, 23],
        [8, 26],
        [5, 26],
      ].map(([x, y]) => [xx(x), y]),
    );
    poly(
      cream,
      [
        [11, 30],
        [18, 29],
        [23, 26],
        [26, 28],
        [26, 36],
        [20, 38],
        [14, 36],
        [8, 32],
      ].map(([x, y]) => [xx(x), y]),
    );
  }
  for (const [i, x] of [12, 31].entries()) {
    const closed = eyes[i] === 'closed' ? blinkStep : 0;
    if (closed < 2) {
      const top = closed === 1 ? 24 : 21;
      const h = 29 - top;
      rect(x + 1, top - 1, 7, h + 1, outline);
      rect(x, top, 9, h - 1, outline);
      rect(x + 1, top + 1, 7, h - 2, teal);
      rect(x + 5, top + 1, 2, h - 2, '#91c6ad');
      rect(x + 3, top, 3, h - 1, outline);
      rect(x + 2, top, 2, closed === 1 ? 1 : 2, white);
      rect(x + 6, 26, 1, 1, white);
    } else {
      rect(x - 1, 25, 2, 2, outline);
      rect(x + 1, 24, 2, 2, outline);
      rect(x + 3, 23, 4, 2, outline);
      rect(x + 7, 24, 2, 2, outline);
      rect(x + 9, 25, 1, 2, outline);
      rect(x + 2, 27, 5, 1, pink);
    }
  }
  rect(23, 29, 6, 2, outline);
  rect(24, 29, 4, 1, pink);
  rect(24, 31, 4, 1, outline);
  rect(25, 32, 2, 2, outline);
  rect(22, 34, 3, 1, outline);
  rect(27, 34, 3, 1, outline);
  rect(20, 33, 2, 1, outline);
  rect(30, 33, 2, 1, outline);
  for (const [x, y] of [
    [10, 29],
    [12, 31],
    [15, 30],
    [37, 30],
    [40, 29],
    [39, 31],
  ])
    rect(x, y, 1, 1, red);
  rect(0, 28, 6, 1, outline);
  rect(4, 29, 4, 1, outline);
  rect(44, 29, 4, 1, outline);
  rect(47, 28, 5, 1, outline);
  rect(2, 34, 4, 1, outline);
  rect(6, 33, 5, 1, outline);
  rect(41, 33, 5, 1, outline);
  rect(46, 34, 4, 1, outline);
  const colors = new Map();
  for (const [y, row] of grid.entries()) {
    for (let x = 0; x < W;) {
      const color = row[x],
        start = x++;
      while (x < W && row[x] === color) x++;
      if (!color) continue;
      if (!colors.has(color)) colors.set(color, []);
      colors.get(color).push([start, y, x - start]);
    }
  }
  return colors;
}
