export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export const stableToolJson = (value) =>
  JSON.stringify(
    (function sort(x) {
      return x && typeof x === 'object' && !Array.isArray(x)
        ? Object.fromEntries(
            Object.keys(x)
              .sort()
              .map((k) => [k, sort(x[k])]),
          )
        : Array.isArray(x)
          ? x.map(sort)
          : x;
    })(value),
  );
export const proposalFingerprint = (call) =>
  stableToolJson({
    name: call.name,
    args: call.args,
  });
export function safeToolCosine(a, b) {
  const unit = (v) => {
    if (
      !Array.isArray(v) ||
      v.length !== 3 ||
      v.some((x) => typeof x !== 'number' || !Number.isFinite(x))
    )
      throw new Error('three finite numeric coordinates required');
    const scale = Math.max(...v.map(Math.abs));
    if (scale === 0) throw new Error('zero vector has no direction');
    const z = v.map((x) => x / scale),
      length = Math.hypot(...z);
    return z.map((x) => x / length);
  };
  const x = unit(a),
    y = unit(b);
  return Math.max(
    -1,
    Math.min(
      1,
      x.reduce((s, v, i) => s + v * y[i], 0),
    ),
  );
}
