export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const lookupAccuracy = (known, held) =>
  mean(
    held.map((user) =>
      (known.find((row) => row.id === user.id)?.label ?? 0) === user.label ? 1 : 0,
    ),
  );
export const confusion = (data, t) =>
  data.reduce(
    (c, r) => {
      c[r.p >= t ? (r.y ? 'tp' : 'fp') : r.y ? 'fn' : 'tn']++;
      return c;
    },
    {
      tp: 0,
      fp: 0,
      tn: 0,
      fn: 0,
    },
  );
export const f1 = (c) => (2 * c.tp) / (2 * c.tp + c.fp + c.fn);
