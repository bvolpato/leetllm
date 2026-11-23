import assert from 'node:assert/strict';

export const actions = ['Up', 'Right', 'Down', 'Left'];
export const arrows = ['↑', '→', '↓', '←'];
export const deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const shortRoute = [4, 5, 6, 7, 11];
export const ridgeRoute = [4, 0, 1, 2, 3, 7, 11];
export const defaultDiscount = 0.9;
export const terminal = state => state >= 8;
export const discounted = (rewards, gamma = defaultDiscount) =>
  rewards.reduce((sum, reward, t) => sum + gamma ** t * reward, 0);

export function step(state, action, cliff = -50) {
  const [dr, dc] = deltas[action];
  const row = Math.max(0, Math.min(2, Math.floor(state / 4) + dr));
  const col = Math.max(0, Math.min(3, state % 4 + dc));
  const next = row * 4 + col;
  return { next, reward: next === 11 ? 20 : terminal(next) ? cliff : -1 };
}

export function solve({ slip = 0, gamma = defaultDiscount, cliff = -50, policy, iterations = 200 } = {}) {
  let values = Array(12).fill(0);
  const sweeps = [values.slice()];
  let q;
  for (let i = 0; i < iterations; i++) {
    q = values.map((_, state) => actions.map((_, action) => {
      if (terminal(state)) return 0;
      return [[action, 1 - slip], [(action + 1) % 4, slip / 2], [(action + 3) % 4, slip / 2]]
        .reduce((sum, [move, probability]) => {
          const { next, reward } = step(state, move, cliff);
          return sum + probability * (reward + gamma * values[next]);
        }, 0);
    }));
    values = q.map((row, state) => policy ? row[policy[state] ?? 0] : Math.max(...row));
    sweeps.push(values.slice());
  }
  return { values, q, sweeps, policy: q.map(row => row.indexOf(Math.max(...row))) };
}

export const calm = solve();
export const windy = solve({ slip: 0.2 });
export const softmax = logits => {
  const e = logits.map(z => Math.exp(z - Math.max(...logits)));
  const total = e.reduce((a, b) => a + b);
  return e.map(x => x / total);
};
export const expectedActionReturns = [6, 2, -40, -2];
export function policyGradient(logits) {
  const p = softmax(logits);
  const expected = p.reduce((sum, value, i) => sum + value * expectedActionReturns[i], 0);
  return p.map((value, i) => value * (expectedActionReturns[i] - expected));
}

export function checkExamples() {
  const near = (actual, expected, precision = 1e-8) => assert.ok(
    Math.abs(actual - expected) < precision, `${actual} differs from ${expected}`,
  );
  near(discounted([-1, -1, -1, 20]), 11.87);
  near(discounted([-1, -1, -1, -1, -1, 20]), 7.7147);
  const backwardPath = shortRoute.slice(0, -1).reverse();
  backwardPath.forEach((state, i) => {
    const { next, reward } = step(state, calm.policy[state]);
    assert.equal(next, shortRoute[shortRoute.length - 1 - i]);
    const expected = [20, 17, 14.3, 11.87][i];
    near(calm.sweeps[i + 1][state], expected);
    near(reward + defaultDiscount * calm.sweeps[i][next], expected);
    assert.ok(calm.sweeps[i][state] < expected);
  });
  assert.equal(calm.policy[5], 1);
  assert.equal(windy.policy[5], 0);
  near(windy.q[5][1], 1.586, 0.001);
  near(windy.q[5][0], 6.314, 0.001);
  near(10 + 0.5 * (-1 + 0.9 * 17 - 10), 12.15);
  near(-1 + 0.9 * 9, 7.1);
  near(discounted([7, -1, 20]), 22.3);
  near((7 - 0.9) / (1 - 0.9 ** 2), 32.10526315789474);
  const potential = [3, 5, 2, 0];
  near(discounted(potential.slice(0, -1).map((phi, i) => 0.9 * potential[i + 1] - phi)), -3);
  const logits = [0, 0, 0, 0], epsilon = 1e-6;
  const objective = z => softmax(z).reduce((sum, p, i) => sum + p * expectedActionReturns[i], 0);
  policyGradient(logits).forEach((value, i) => {
    const plus = logits.slice(), minus = logits.slice();
    plus[i] += epsilon;
    minus[i] -= epsilon;
    near(value, (objective(plus) - objective(minus)) / (2 * epsilon), 1e-6);
  });
  near((0.85 / 0.25) ** 6, 1544.804416);
  near(1 - .2 + .2 / 4, .85);
  near(Math.min(.28 / .20, 1.2), 1.2);
  const scores = [0, 1, 2], mean = scores.reduce((a, b) => a + b) / scores.length;
  const std = Math.sqrt(scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length);
  assert.deepEqual(scores.map(score => score - mean), [-1, 0, 1]);
  near((scores[0] - mean) / std, -Math.sqrt(1.5));
  assert.equal(solve({ slip: .2, cliff: -5 }).policy[5], 1);
  assert.equal(solve({ slip: .2, gamma: .5 }).policy[5], 0);
  return true;
}
