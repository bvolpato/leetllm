import assert from 'node:assert/strict';
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function rational(n, d = 1) {
  if (d === 0) throw new Error('division by zero');
  const sign = d < 0 ? -1 : 1,
    g = gcd(n, d);
  return {
    n: (sign * n) / g,
    d: (sign * d) / g,
  };
}
export const numberValue = (value) => rational(value, 1);
export function combine(a, b, op) {
  if (op === '+') return rational(a.n * b.d + b.n * a.d, a.d * b.d);
  if (op === '-') return rational(a.n * b.d - b.n * a.d, a.d * b.d);
  if (op === '×') return rational(a.n * b.n, a.d * b.d);
  if (op === '÷' && b.n !== 0) return rational(a.n * b.d, a.d * b.n);
  return null;
}
export function valueLabel(value) {
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
}
export function initialItems(inputs) {
  return inputs.map((value) => ({
    value: numberValue(value),
    tree: {
      leaf: value,
    },
    expr: String(value),
  }));
}
export function stateKey(items) {
  return items
    .map((item) => `${item.value.n}/${item.value.d}`)
    .sort()
    .join('|');
}
export function stateValues(items) {
  return items.map((item) =>
    item.value.d === 1 ? item.value.n : Number((item.value.n / item.value.d).toFixed(3)),
  );
}
export function stateLabel(items) {
  return '[' + items.map((item) => valueLabel(item.value)).join(', ') + ']';
}
export function successorStates(items) {
  const children = [],
    local = new Set();
  for (let i = 0; i < items.length; i += 1)
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i],
        b = items[j],
        rest = items.filter((_, k) => k !== i && k !== j);
      const operations = [
        ['+', a, b],
        ['×', a, b],
        ['-', a, b],
        ['-', b, a],
        ['÷', a, b],
        ['÷', b, a],
      ];
      for (const [op, left, right] of operations) {
        const value = combine(left.value, right.value, op);
        if (!value) continue;
        const next = [
          ...rest,
          {
            value,
            tree: {
              op,
              left: left.tree,
              right: right.tree,
            },
            expr: `(${left.expr} ${op} ${right.expr})`,
          },
        ];
        const key = stateKey(next);
        if (local.has(key)) continue;
        local.add(key);
        children.push(next);
      }
    }
  return children;
}
export function searchValues(inputs, maxStates = Infinity) {
  if (!(maxStates === Infinity || (Number.isInteger(maxStates) && maxStates > 0)))
    throw new Error('state cap must be a positive integer');
  const frontier = [initialItems(inputs)],
    discovered = new Set([stateKey(frontier[0])]);
  let visited = 0;
  while (frontier.length > 0 && visited < maxStates) {
    const items = frontier.shift();
    visited += 1;
    if (items.length === 1 && items[0].value.n === 24 * items[0].value.d) {
      return {
        solution: items[0],
        visited,
        status: 'solved',
        frontier,
        discovered: discovered.size,
      };
    }
    for (const next of successorStates(items)) {
      const key = stateKey(next);
      if (discovered.has(key)) continue;
      discovered.add(key);
      frontier.push(next);
    }
  }
  return {
    solution: null,
    visited,
    status: frontier.length > 0 ? 'budget-exhausted' : 'no-solution',
    frontier,
    discovered: discovered.size,
  };
}
export function evaluateTree(tree) {
  if (Object.hasOwn(tree, 'leaf'))
    return {
      value: numberValue(tree.leaf),
      leaves: [tree.leaf],
    };
  const left = evaluateTree(tree.left),
    right = evaluateTree(tree.right);
  if (!left || !right) return null;
  const value = combine(left.value, right.value, tree.op);
  return value
    ? {
        value,
        leaves: [...left.leaves, ...right.leaves],
      }
    : null;
}
export function checkExpression(tree, inputs = [4, 5, 6, 7]) {
  const evaluated = evaluateTree(tree);
  if (!evaluated)
    return {
      valid: false,
      reason: 'invalid-operation',
    };
  const actual = [...evaluated.leaves].sort((a, b) => a - b);
  const expected = [...inputs].sort((a, b) => a - b);
  const allInputsUsed =
    actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  const reachesGoal = evaluated.value.n === 24 * evaluated.value.d;
  return {
    valid: allInputsUsed && reachesGoal,
    allInputsUsed,
    reachesGoal,
    result: valueLabel(evaluated.value),
    leaves: actual,
  };
}
export function branchFixture() {
  const all = searchValues([4, 5, 6, 7]);
  const deadEnd = searchValues([24, 5, 7]);
  const children = successorStates(initialItems([4, 5, 6, 7]));
  const childFor = (values) =>
    children.find((child) => stateKey(child) === stateKey(initialItems(values)));
  const branchAState = childFor([24, 5, 7]),
    branchBState = childFor([12, 4, 6]);
  assert(branchAState && branchBState, 'branch fixtures must come from legal first moves');
  const branchA = {
    label: 'A · 6 × 4 = 24',
    remaining: stateValues(branchAState),
    items: branchAState,
    heuristic: 0.95,
    completion: deadEnd.status,
  };
  const branchB = {
    label: 'B · 5 + 7 = 12',
    remaining: stateValues(branchBState),
    items: branchBState,
    heuristic: 0.4,
    completion: searchValues([12, 4, 6]).status,
  };
  return {
    all,
    deadEnd,
    branchA,
    branchB,
  };
}
export function frontierControlFixture() {
  const root = initialItems([4, 5, 6, 7]);
  const generated = successorStates(root);
  const firstTwo = generated.slice(0, 2).map((items) => {
    const changed = items.find((item) => !Object.hasOwn(item.tree, 'leaf'));
    return {
      items,
      label: stateLabel(items),
      move: changed.expr,
    };
  });
  assert.equal(firstTwo.length, 2, 'frontier trace needs two generated legal children');
  return {
    root: stateLabel(root),
    children: firstTwo,
    generatedCount: generated.length,
    queue: firstTwo,
    stack: [...firstTwo].reverse(),
    beam: beamResult(1),
  };
}
export function beamWidthAt(beat, beatP) {
  if (beat < 2) return 1;
  return beatP < 0.5 ? 1 : 2;
}
export const unitPhase = (p, start, end) => Math.max(0, Math.min(1, (p - start) / (end - start)));
export function beamResult(width) {
  const { branchA, branchB } = branchFixture();
  const kept = [branchA, branchB].sort((a, b) => b.heuristic - a.heuristic).slice(0, width);
  const solvable = kept.find((branch) => branch.completion === 'solved');
  return {
    width,
    kept,
    result: solvable ? 'solved' : 'no-solution-in-retained-frontier',
    solution: solvable ? searchValues(solvable.remaining).solution : null,
  };
}
export function voteFixture() {
  const samples = [
    {
      answer: '24',
      tree: {
        op: '×',
        left: {
          leaf: 6,
        },
        right: {
          leaf: 4,
        },
      },
    },
    {
      answer: '24',
      tree: {
        op: '×',
        left: {
          leaf: 6,
        },
        right: {
          leaf: 4,
        },
      },
    },
    {
      answer: '24',
      tree: {
        op: '×',
        left: {
          leaf: 6,
        },
        right: {
          leaf: 4,
        },
      },
    },
  ];
  const counts = new Map();
  samples.forEach((sample) => counts.set(sample.answer, (counts.get(sample.answer) ?? 0) + 1));
  const winner = [...counts].sort((a, b) => b[1] - a[1])[0];
  return {
    samples,
    winner: winner[0],
    votes: winner[1],
    checked: samples.map((sample) => checkExpression(sample.tree)),
  };
}
export function introductoryMove(beat, progress) {
  const movement =
    beat === 0 ? 0 : beat > 1 ? 1 : Math.max(0, Math.min(1, (progress - 0.44) / 0.26));
  const consumed = movement === 1;
  const tree = {
    op: '×',
    left: {
      leaf: 6,
    },
    right: {
      leaf: 4,
    },
  };
  return {
    movement,
    consumed,
    remaining: consumed ? [24, 5, 7] : [4, 5, 6, 7],
    check: checkExpression(tree),
  };
}
export function reasoningDecision(checks) {
  const keys = ['tests_passed', 'security_scan_clear', 'reviewer_approved'];
  if (keys.some((k) => typeof checks[k] !== 'boolean'))
    throw new TypeError('Trusted policy inputs must be actual booleans');
  return keys.every((k) => checks[k]) ? 'merge_release' : 'manual_review';
}
export function reasoningRecordScore(
  candidate,
  trusted = {
    tests_passed: true,
    security_scan_clear: true,
    reviewer_approved: true,
  },
) {
  const keys = Object.keys(trusted),
    given = candidate.checks ?? {};
  return {
    coverage: keys.filter((k) => Object.hasOwn(given, k)).length / keys.length,
    valuesMatch:
      Object.keys(given).length === keys.length &&
      keys.every((k) => Object.hasOwn(given, k) && given[k] === trusted[k]),
    actionMatches: candidate.final_action === reasoningDecision(trusted),
  };
}
export function chooseReasoningStrategy(rows, floor = 0.9, cap = 900) {
  return (
    rows
      .filter(
        (r) =>
          r &&
          typeof r.strategy === 'string' &&
          r.strategy.trim() &&
          typeof r.accuracy === 'number' &&
          Number.isFinite(r.accuracy) &&
          r.accuracy >= floor &&
          r.accuracy <= 1 &&
          typeof r.p95_ms === 'number' &&
          Number.isFinite(r.p95_ms) &&
          r.p95_ms > 0 &&
          r.p95_ms <= cap &&
          Number.isInteger(r.calls) &&
          r.calls > 0,
      )
      .sort((a, b) => a.calls - b.calls || a.p95_ms - b.p95_ms)[0] ?? null
  );
}
