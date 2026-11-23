export const clamp = (value) => Math.max(0, Math.min(1, value));
export const GiB = 2 ** 30;
export const fullPairs = (n) => (n * (n + 1)) / 2;
export const localPairs = (n, width) =>
  Array.from(
    {
      length: n,
    },
    (_, i) => Math.min(i + 1, width),
  ).reduce((a, b) => a + b, 0);
export const cachePayload = ({ layers, heads, width, tokens, bytes = 2 }) =>
  2 * layers * heads * width * tokens * bytes;
