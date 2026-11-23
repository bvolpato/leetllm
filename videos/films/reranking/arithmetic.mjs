export const clamp = (x) => Math.max(0, Math.min(1, x));
export const ramp = (p, a, z) => clamp((p - a) / (z - a));
export function pairLengthWork(queryTokens, passageTokens, candidates = 3) {
  for (const count of [queryTokens, passageTokens, candidates])
    if (!Number.isInteger(count) || count < 0)
      throw new RangeError('supplied token and candidate counts must be nonnegative integers');
  const sequence = queryTokens + passageTokens;
  return {
    queryTokens,
    passageTokens,
    candidates,
    sequence,
    entries: sequence ** 2,
    totalEntries: candidates * sequence ** 2,
  };
}
