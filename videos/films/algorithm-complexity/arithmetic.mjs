import assert from 'node:assert/strict';
export const hashKey = (key, buckets = 8) =>
  [...key].reduce((n, c) => n + c.codePointAt(0), 0) % buckets;
export const dot = (a, b) => {
  assert.equal(a.length, b.length);
  return a.reduce((n, v, i) => n + v * b[i], 0);
};
export const rank = (rows, field = 'score') =>
  [...rows].sort((a, b) => b[field] - a[field] || b.id.localeCompare(a.id));
export const rankLexical = (rows) =>
  rows
    .map((row, order) => ({
      row,
      order,
    }))
    .sort((a, b) => b.row.cheap - a.row.cheap || a.order - b.order)
    .map((entry) => entry.row);
export function commonPrefix(values) {
  let prefix = values[0] ?? '';
  for (const value of values.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < value.length && prefix[i] === value[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix;
}
export function radixNode(words, prefix = '') {
  const terminal = words.filter((word) => word === prefix);
  const groups = new Map();
  for (const word of words) {
    if (word.length <= prefix.length) continue;
    const first = word[prefix.length];
    if (!groups.has(first)) groups.set(first, []);
    groups.get(first).push(word);
  }
  const children = [...groups.values()].map((group) => {
    const label = commonPrefix(group.map((word) => word.slice(prefix.length)));
    return {
      label,
      node: radixNode(group, prefix + label),
    };
  });
  return {
    terminal,
    children,
  };
}
export function collectRadixWords(node) {
  return [...node.terminal, ...node.children.flatMap((edge) => collectRadixWords(edge.node))];
}
export function appendTrace(count = 8, initialCapacity = 2) {
  let capacity = initialCapacity,
    totalWrites = 0;
  return Array.from(
    {
      length: count,
    },
    (_, i) => {
      const copied = i === capacity ? capacity : 0,
        oldCapacity = capacity;
      if (copied) capacity *= 2;
      const writes = copied + 1;
      totalWrites += writes;
      return {
        arrival: i + 1,
        id: 'note-' + (i + 1),
        copied,
        writes,
        totalWrites,
        oldCapacity,
        capacity,
      };
    },
  );
}
export const copyBlocks = (blocks) =>
  blocks.map((b) => ({
    ...b,
    values: [...b.values],
  }));
export const unorderedPairs = (n) =>
  Array.from(
    {
      length: n,
    },
    (_, right) =>
      Array.from(
        {
          length: right,
        },
        (_, left) => ({
          left,
          right,
        }),
      ),
  ).flat();
export const exactDedupTrace = (values) => {
  const seen = new Set();
  return values.map((value) => {
    const duplicate = seen.has(value);
    seen.add(value);
    return {
      value,
      duplicate,
      unique: [...seen],
    };
  });
};
export const budgetFor = (n, d, k, budget = 1_000_000) => ({
  n,
  d,
  k,
  products: n * d,
  within: n * d <= budget,
  budget,
});
export function decodeCostTrace(initialKeys = 8, consumedInputs = 3, headWidth = 128) {
  if (
    !Number.isSafeInteger(initialKeys) ||
    initialKeys < 1 ||
    !Number.isSafeInteger(consumedInputs) ||
    consumedInputs < 1 ||
    !Number.isSafeInteger(headWidth) ||
    headWidth < 1
  ) {
    throw new RangeError(
      'decode history, consumed input count, and head width must be positive integers',
    );
  }
  const rows = Array.from(
    {
      length: consumedInputs,
    },
    (_, index) => ({
      step: index + 1,
      keysRead: initialKeys + index + 1,
      coordinateTerms: (initialKeys + index + 1) * headWidth,
      cacheAfter: initialKeys + index + 1,
    }),
  );
  const keyReads = rows.reduce((sum, row) => sum + row.keysRead, 0);
  return {
    initialKeys,
    consumedInputs,
    headWidth,
    rows,
    keyReads,
    coordinateTerms: keyReads * headWidth,
    cacheAfter: initialKeys + consumedInputs,
  };
}
