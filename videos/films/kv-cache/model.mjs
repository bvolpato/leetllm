import assert from 'node:assert/strict';
const KIB = 1024,
  MIB = 1024 ** 2,
  GIB = 1024 ** 3;
const fmt = (value) => value.toLocaleString('en-US');
const blocksFor = (tokens, blockSize) => Math.ceil(tokens / blockSize);
const bytesPerToken = ({ layers, heads, width = 128, bytes = 2 }) =>
  2 * layers * heads * width * bytes;
// The first model shape, Llama 3 8B.
const LAYERS = 32,
  HEADS = 8,
  HEAD_SIZE = 128,
  BYTES = 2,
  QUERY_HEADS = 32;
const PER_TOKEN = bytesPerToken({
  layers: LAYERS,
  heads: HEADS,
});
assert.equal(PER_TOKEN, 131072);
assert.equal(PER_TOKEN / KIB, 128);
const CONVERSATION = PER_TOKEN * 4096;
assert.equal(CONVERSATION / MIB, 512);
const EIGHTY = (40 * GIB) / CONVERSATION;
assert.equal(EIGHTY, 80);
assert.equal(QUERY_HEADS % HEADS, 0);
// The viewer's first calculation, Llama 3 70B.
const BIG_LAYERS = 80,
  BIG_QUERY_HEADS = 64;
const BIG_PER_TOKEN = bytesPerToken({
  layers: BIG_LAYERS,
  heads: HEADS,
});
assert.equal(BIG_PER_TOKEN / KIB, 320);
assert.equal((BIG_PER_TOKEN * 4096) / GIB, 1.25);
assert.equal((128 * BIG_PER_TOKEN * 4096) / GIB, 160);
// The triangle of repeated work.
const STEPS = 6;
assert.equal((STEPS * (STEPS + 1)) / 2, 21);
// Three kinds of waste. The hole sizes are made up, and the screen says so.
const RESERVED = 4096,
  USED = 300,
  TRAPPED = RESERVED - USED;
assert.equal(TRAPPED, 3796);
const HOLES = [12, 14, 10],
  NEEDED = 20;
assert.equal(
  HOLES.reduce((a, b) => a + b),
  36,
);
assert.ok(Math.max(...HOLES) < NEEDED && HOLES.reduce((a, b) => a + b) > NEEDED);
// Paged lookup. Our example blocks hold four positions.
const SLOTS = 4;
assert.deepEqual([Math.floor(5 / SLOTS), 5 % SLOTS], [1, 1]);
assert.equal(16 - 1, 15);
// Reading through a table gives the same attention as a continuous buffer. The numbers are made up.
const TABLE = [7, 2],
  QUERY = [1, 0.5];
const PAIRS = [
  [
    [1, 0],
    [2, 1],
  ],
  [
    [0, 1],
    [0, 3],
  ],
  [
    [1, 1],
    [4, 2],
  ],
  [
    [0.5, 0.5],
    [1, 1],
  ],
  [
    [0.2, 0.8],
    [3, 0],
  ],
  [
    [0.8, 0.2],
    [0, 2],
  ],
];
const SENTINEL = [
  [1000, 1000],
  [999, 999],
];
const storage = new Map(
  TABLE.map((block) => [
    block,
    Array.from(
      {
        length: SLOTS,
      },
      () => SENTINEL,
    ),
  ]),
);
PAIRS.forEach((pair, position) => {
  storage.get(TABLE[Math.floor(position / SLOTS)])[position % SLOTS] = pair;
});
const readThrough = (length) =>
  Array.from(
    {
      length,
    },
    (_, position) => storage.get(TABLE[Math.floor(position / SLOTS)])[position % SLOTS],
  );
const attend = (query, pairs) => {
  const scores = pairs.map(([key]) => (query[0] * key[0] + query[1] * key[1]) / Math.SQRT2),
    top = Math.max(...scores);
  const weights = scores.map((score) => Math.exp(score - top)),
    total = weights.reduce((a, b) => a + b);
  return [0, 1].map(
    (axis) => pairs.reduce((sum, pair, i) => sum + weights[i] * pair[1][axis], 0) / total,
  );
};
const showPair = ([x, y]) => `(${x.toFixed(2)}, ${y.toFixed(2)})`;
const PAGED_READ = attend(QUERY, readThrough(PAIRS.length));
assert.deepEqual(PAGED_READ, attend(QUERY, PAIRS));
const PAST_THE_END = attend(QUERY, readThrough(PAIRS.length + 1));
assert.ok(PAST_THE_END[0] > 900 && PAGED_READ[0] < 10);
// Blocks as requests finish and join.
assert.equal(200 - 20, 180);
assert.deepEqual([blocksFor(64, 16), blocksFor(10, 16), blocksFor(20, 16)], [4, 1, 2]);
assert.equal(blocksFor(64, 16) + blocksFor(10, 16), 5);
assert.equal(blocksFor(10, 16) + blocksFor(20, 16), 3);
// Sharing a prompt across branches and across requests.
assert.equal((4 * CONVERSATION) / GIB, 2);
const PROMPT_TOKENS = 500,
  PREFIX_BLOCK = 16,
  REQUESTS = 200;
const FULL_BLOCKS = Math.floor((PROMPT_TOKENS - 1) / PREFIX_BLOCK),
  TAIL_TOKENS = PROMPT_TOKENS - FULL_BLOCKS * PREFIX_BLOCK;
assert.deepEqual([FULL_BLOCKS, FULL_BLOCKS * PREFIX_BLOCK, TAIL_TOKENS], [31, 496, 4]);
const NO_SHARING = REQUESTS * (FULL_BLOCKS + 1),
  WARM = FULL_BLOCKS + REQUESTS;
assert.deepEqual([NO_SHARING, WARM], [6400, 231]);
assert.equal(Math.round(100 * (1 - WARM / NO_SHARING)), 96);
const hashOf = (value) => {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 4);
};
// The levers on bytes per token.
const billFor = (heads) =>
  bytesPerToken({
    layers: BIG_LAYERS,
    heads,
  }) / KIB;
assert.deepEqual([billFor(BIG_QUERY_HEADS), billFor(8), billFor(1)], [2560, 320, 40]);
assert.equal(
  bytesPerToken({
    layers: BIG_LAYERS,
    heads: 8,
    bytes: 1,
  }) / KIB,
  160,
);
assert.equal((131072 * BIG_PER_TOKEN) / GIB, 40);
// The viewer's last calculation.
assert.deepEqual(
  [blocksFor(100, 32), blocksFor(100, 32) * 32 - 100, blocksFor(32, 32), blocksFor(70, 32)],
  [4, 28, 1, 3],
);
assert.equal(blocksFor(100, 32) + blocksFor(32, 32), 5);
assert.equal(blocksFor(32, 32) + blocksFor(70, 32), 4);
assert.deepEqual([Math.floor(40 / 32), 40 % 32], [1, 8]);
const C_TABLE = [5, 11, 2];
assert.equal(C_TABLE[Math.floor(40 / 32)], 11);
const human = (bytes) =>
  bytes >= MIB ? `${Math.round(bytes / MIB)} MiB` : `${Math.round(bytes / KIB)} KiB`;
export {
  KIB,
  MIB,
  GIB,
  fmt,
  blocksFor,
  bytesPerToken,
  LAYERS,
  HEADS,
  HEAD_SIZE,
  BYTES,
  QUERY_HEADS,
  PER_TOKEN,
  CONVERSATION,
  EIGHTY,
  BIG_LAYERS,
  BIG_QUERY_HEADS,
  BIG_PER_TOKEN,
  STEPS,
  RESERVED,
  USED,
  TRAPPED,
  HOLES,
  NEEDED,
  SLOTS,
  TABLE,
  QUERY,
  PAIRS,
  SENTINEL,
  storage,
  readThrough,
  attend,
  showPair,
  PAGED_READ,
  PAST_THE_END,
  PROMPT_TOKENS,
  PREFIX_BLOCK,
  REQUESTS,
  FULL_BLOCKS,
  TAIL_TOKENS,
  NO_SHARING,
  WARM,
  hashOf,
  billFor,
  C_TABLE,
  human,
};
