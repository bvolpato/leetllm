export const rows = [
  {
    x: [1, 0],
    y: 2,
  },
  {
    x: [0, 1],
    y: -1,
  },
  {
    x: [1, 1],
    y: 1,
  },
  {
    x: [2, 1],
    y: 3,
  },
];
export function regression(p) {
  const pred = rows.map((r) => r.x[0] * p[0] + r.x[1] * p[1] + p[2]),
    error = pred.map((v, i) => v - rows[i].y),
    gradient = [0, 0, 0];
  error.forEach((e, i) => {
    gradient[0] += (2 * e * rows[i].x[0]) / 4;
    gradient[1] += (2 * e * rows[i].x[1]) / 4;
    gradient[2] += (2 * e) / 4;
  });
  return {
    pred,
    error,
    gradient,
    loss: error.reduce((a, e) => a + e * e, 0) / 4,
  };
}
export function buildRegressionHistory() {
  const history = [
    {
      p: [0, 0, 0],
      ...regression([0, 0, 0]),
    },
  ];
  for (let i = 0; i < 80; i++) {
    const prev = history.at(-1),
      p = prev.p.map((v, j) => v - 0.05 * prev.gradient[j]);
    history.push({
      p,
      ...regression(p),
    });
  }
  return {
    history,
  };
}
export const { history } = buildRegressionHistory();
export const REGRESSION_ROWS = rows;
export const JAX_KEY_FIXTURE = Object.freeze({
  root: [0, 7],
  next: [3625411723, 1954958720],
  A: [195045567, 4062205631],
  B: [966301609, 1948237315],
  sampleA: [0.4541335105895996, 0.9391627907752991, -0.2689431309700012, -0.19085364043712616],
  sampleB: [-0.8203861713409424, -0.648158073425293, -1.799384355545044, 2.0385255813598633],
  scalarSequence: [1.114, 0.4541, -0.8204],
  vectorSequence: [0.4512, 1.9535, -0.5162],
});
