import assert from 'node:assert/strict';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const mix = (a, b, p) => a + (b - a) * p;
export function binomialMasses(n, q = 0.5) {
  if (!Number.isInteger(n) || n < 0 || n > 1000 || !(q > 0 && q < 1))
    throw new RangeError('Valid independent count and win probability required');
  let c = 1;
  return Array.from(
    {
      length: n + 1,
    },
    (_, k) => {
      if (k) c *= (n - k + 1) / k;
      return c * q ** k * (1 - q) ** (n - k);
    },
  );
}
export function exactRightTail(w, n, q = 0.5) {
  if (!Number.isInteger(w) || w < 0 || w > n)
    throw new RangeError('Win count outside disagreements');
  return binomialMasses(n, q)
    .slice(w)
    .reduce((a, b) => a + b, 0);
}
export function exactSignPower(n, alternative = 0.65, alpha = 0.05) {
  const critical =
    Array.from(
      {
        length: n + 1,
      },
      (_, i) => i,
    ).find((i) => exactRightTail(i, n) <= alpha) ?? n + 1;
  return {
    critical,
    size: critical > n ? 0 : exactRightTail(critical, n),
    power: critical > n ? 0 : exactRightTail(critical, n, alternative),
  };
}
export function random(seed) {
  let v = seed >>> 0;
  return () => {
    v = (Math.imul(1664525, v) + 1013904223) >>> 0;
    return v / 2 ** 32;
  };
}
export function repeatedStudies(n, q, seed, count = 200) {
  const rng = random(seed),
    critical = exactSignPower(n).critical;
  return Array.from(
    {
      length: count,
    },
    (_, i) => {
      const signs = Array.from(
          {
            length: n,
          },
          () => Number(rng() < q),
        ),
        wins = signs.reduce((a, b) => a + b, 0);
      return {
        id: i + 1,
        signs,
        wins,
        rejects: wins >= critical,
      };
    },
  );
}
export function bootstrap(rows, count = 8000, seed = 271828) {
  const rng = random(seed),
    means = [],
    first = [];
  for (let r = 0; r < count; r++) {
    let sum = 0;
    for (let j = 0; j < rows.length; j++) {
      const i = Math.floor(rng() * rows.length);
      sum += rows[i].difference;
      if (!r) first.push(i);
    }
    means.push(sum / rows.length);
  }
  const sorted = [...means].sort((a, b) => a - b),
    quantile = (p) => {
      const h = (sorted.length - 1) * p,
        i = Math.floor(h);
      return mix(sorted[i], sorted[Math.ceil(h)], h - i);
    };
  return {
    first,
    means,
    interval: [quantile(0.025), quantile(0.975)],
  };
}
export const BOOTSTRAP_BIN_EDGES = Array.from(
  {
    length: 16,
  },
  (_, i) => (i - 6) / 20,
);
export function bootstrapBins(means) {
  const a = Array(BOOTSTRAP_BIN_EDGES.length - 1).fill(0);
  for (const mean of means) {
    const index = BOOTSTRAP_BIN_EDGES.findIndex(
      (lower, i) => mean >= lower && mean < BOOTSTRAP_BIN_EDGES[i + 1],
    );
    assert(index >= 0, 'Every bootstrap mean must fit its plotted bin edges');
    a[index]++;
  }
  return a;
}
export function subsets(n, k) {
  const out = [];
  function visit(a, lo) {
    if (a.length === k) {
      out.push(a);
      return;
    }
    for (let i = lo; i <= n - (k - a.length); i++) visit([...a, i], i + 1);
  }
  visit([], 0);
  return out;
}
export function passAtK(c, n, k) {
  if (![c, n, k].every(Number.isInteger) || n <= 0 || c < 0 || c > n || k < 1 || k > n)
    throw new RangeError('Valid candidate counts and budget required');
  let f = 1;
  for (let i = 0; i < k; i++) f *= (n - c - i) / (n - i);
  return n - c < k ? 1 : 1 - f;
}
export function peekSequence(seed) {
  const rng = random(seed);
  let w = 0;
  return Array.from(
    {
      length: 64,
    },
    (_, i) => {
      w += Number(rng() < 0.5);
      return {
        n: i + 1,
        wins: w,
        p: exactRightTail(w, i + 1),
      };
    },
  );
}
export function jointDifferenceMoments(both = 0.45, n = 40) {
  if (!Number.isFinite(both) || both < 0 || both > 0.5 || !Number.isInteger(n) || n <= 0)
    throw new RangeError('Valid joint probability and positive sample count required');
  const rows = [
      {
        a: 1,
        b: 1,
        p: both,
      },
      {
        a: 1,
        b: 0,
        p: 0.5 - both,
      },
      {
        a: 0,
        b: 1,
        p: 0.5 - both,
      },
      {
        a: 0,
        b: 0,
        p: both,
      },
    ],
    ma = rows.reduce((v, r) => v + r.p * r.a, 0),
    mb = rows.reduce((v, r) => v + r.p * r.b, 0),
    product = rows.reduce((v, r) => v + r.p * r.a * r.b, 0),
    va = ma * (1 - ma),
    vb = mb * (1 - mb),
    cov = product - ma * mb,
    paired = (va + vb - 2 * cov) / n,
    independent = (va + vb) / n;
  return {
    rows,
    ma,
    mb,
    product,
    va,
    vb,
    cov,
    paired,
    independent,
    pairedSE: Math.sqrt(paired),
    independentSE: Math.sqrt(independent),
  };
}
export function waldMeanDifference(values) {
  if (!values.length || values.some((v) => !Number.isFinite(v)))
    throw new RangeError('Finite observed differences required');
  const n = values.length,
    mean = values.reduce((a, v) => a + v, 0) / n,
    variance = n > 1 ? values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : null,
    se = variance === null ? null : Math.sqrt(variance / n);
  return {
    n,
    mean,
    variance,
    se,
    interval: se === null ? null : [mean - 1.96 * se, mean + 1.96 * se],
  };
}
export function estimatorFactors(c, n, k) {
  passAtK(c, n, k);
  if (n - c < k)
    return {
      forced: true,
      factors: [],
      failure: 0,
      success: 1,
    };
  const factors = Array.from(
      {
        length: c,
      },
      (_, j) => ({
        i: n - c + 1 + j,
        value: 1 - k / (n - c + 1 + j),
      }),
    ),
    failure = factors.reduce((v, r) => v * r.value, 1);
  return {
    forced: false,
    factors,
    failure,
    success: 1 - failure,
  };
}
export function estimatorExpectation(p, n, k) {
  const mass = binomialMasses(n, p),
    target = 1 - (1 - p) ** k,
    plugin = mass.reduce((v, q, c) => v + q * (1 - (1 - c / n) ** k), 0),
    combinatorial = mass.reduce((v, q, c) => v + q * passAtK(c, n, k), 0);
  return {
    mass,
    target,
    plugin,
    combinatorial,
  };
}
export function orderedTaskResamples(scores) {
  if (!scores.length || scores.length > 6 || scores.some((v) => !Number.isFinite(v)))
    throw new RangeError('One to six finite task scores required');
  const out = [];
  function visit(ids) {
    if (ids.length === scores.length) {
      out.push({
        ids,
        mean: ids.reduce((v, i) => v + scores[i], 0) / scores.length,
      });
      return;
    }
    for (let i = 0; i < scores.length; i++) visit([...ids, i]);
  }
  visit([]);
  return out;
}
export function percentileInterval(values) {
  if (!values.length || values.some((v) => !Number.isFinite(v)))
    throw new RangeError('Finite percentile values required');
  const a = [...values].sort((a, b) => a - b),
    at = (p) => {
      const h = p * (a.length - 1),
        i = Math.floor(h);
      return mix(a[i], a[Math.ceil(h)], h - i);
    };
  return [at(0.025), at(0.975)];
}
export function usefulLiftDecision(interval, minimum = 0.02) {
  const [lo, hi] = interval;
  if (interval.length !== 2 || ![lo, hi, minimum].every(Number.isFinite) || lo > hi || minimum < 0)
    throw new RangeError('Ordered interval and nonnegative useful lift required');
  return lo > minimum
    ? 'clears-useful-lift'
    : lo > 0
      ? 'positive-size-unestablished'
      : hi < 0
        ? 'regression'
        : 'inconclusive';
}
