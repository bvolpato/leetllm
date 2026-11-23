import { TokenBudget, deadlineLedger } from './tokens.mjs';
import { coverage, puctWorksheet } from './arithmetic.mjs';
import { branches, complete, invalid, scores, track } from './fixtures.mjs';
import { sentence } from './construction.mjs';
import assert from 'node:assert/strict';
export function search(maxDepth = 2) {
  let frontier = [
      {
        name: 'start',
        path: ['start'],
        score: 0,
      },
    ],
    completed = [],
    rounds = [];
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next = [],
      pruned = [];
    for (const node of frontier)
      for (const name of branches[node.name] ?? []) {
        const child = {
          name,
          path: [...node.path, name],
          score: scores[name],
        };
        if (invalid[name] || child.score < 0.35) pruned.push(name);
        else if (complete.has(name)) completed.push(child);
        else next.push(child);
      }
    frontier = next.sort((a, b) => b.score - a.score).slice(0, 2);
    rounds.push({
      depth,
      frontier: [...frontier],
      completed: [...completed],
      pruned,
    });
  }
  return {
    rounds,
    completed,
    winner: [...completed].sort((a, b) => b.score - a.score)[0] ?? null,
  };
}
export function inspect(rows) {
  const checked = [];
  for (const row of rows) {
    if (
      typeof row.exact !== 'boolean' ||
      typeof row.score !== 'number' ||
      !Number.isFinite(row.score) ||
      row.score < 0 ||
      row.score > 1
    )
      throw new Error('Malformed verifier record');
    checked.push(row);
    if (!row.exact || row.score < 0.35)
      return {
        checked,
        decision: 'PRUNE',
      };
  }
  return {
    checked,
    decision: 'NEEDS FINAL CHECK',
  };
}
export function budgetTrace() {
  const ledger = new TokenBudget(4000);
  ledger.reserve('A', 1500);
  ledger.reserve('B', 1500);
  assert.equal(ledger.reserve('C', 1500), false);
  const waiting = ledger.snapshot('C waits for capacity');
  ledger.settle('A', 900);
  const settled = ledger.snapshot('A settled');
  assert.equal(ledger.reserve('C', 1500), true);
  return [waiting, settled, ledger.snapshot('C admitted')];
}
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  return {
    b,
    p,
    q: b ? 1 : p,
    n: b ? 5 : 1 + Math.floor(4 * p),
    depth: b ? 2 : p > 0.18 ? 1 : 0,
    inspected: b ? 3 : 1 + Math.floor(2 * p),
    latency: b ? 300 : 240,
  };
}
export function freshDeadline(state) {
  const id = 'fresh-deadline',
    p = (b, n) => sentence(state, id, b, n),
    settled = p(1, 1) === 1,
    deadline = p(1, 2) === 1;
  const rows = deadlineLedger();
  const received = state.cues
    ? state.cues['deadline-receipt']?.phase === 'after'
    : state.beat === 1 && state.beatP >= 0.24;
  const row = settled ? rows.admitted : received ? rows.receipt : rows.initial;
  return {
    ...row,
    reveal: p(1, 0) === 1,
    settled,
    deadline,
    returnC: p(1, 4) === 1,
  };
}
export function constructionModel(id, state) {
  const p = (b, n) => sentence(state, id, b, n),
    done = (b, n) => p(b, n) === 1,
    b = state.beat ?? 0;
  if (id === 'fresh-deadline') return freshDeadline(state);
  if (id === 'puct-allocation')
    return {
      ...puctWorksheet(b === 2 && done(2, 1)),
      result: b === 1 ? done(1, 2) : b === 2 && done(2, 2),
      backed: b === 2 && done(2, 1),
    };
  if (id === 'coverage-operation')
    return {
      failures: Math.min(5, Math.floor(p(0, 1) * 5 + 1e-8)),
      result: done(0, 2),
      tiny: done(1, 2),
      mass: 0.7 ** 5,
      coverage: coverage(0.3, 5),
    };
  if (id === 'reservation-reconcile')
    return {
      row: budgetTrace()[b === 0 ? (done(0, 3) ? 2 : done(0, 2) ? 1 : 0) : 2],
      duplicate: done(1, 1),
      overuse: done(1, 2),
      deadline: done(2, 0),
    };
  if (id === 'prefix-lease') {
    const pruned = done(1, 1),
      copied = done(1, 2),
      released = done(2, 0);
    return {
      pruned,
      copied,
      released,
      refs: copied ? 1 : pruned ? 2 : 4,
      reader: released ? 0 : 1,
    };
  }
  if (id === 'incomplete-advisory')
    return {
      completed: b > 0 && done(1, 0),
      usage: 700,
      cases: [
        {
          status: 'incomplete',
          eligible: true,
          text: 'Hold',
          pass: false,
        },
        {
          status: 'completed',
          eligible: false,
          text: 'Hold',
          pass: false,
        },
        {
          status: 'completed',
          eligible: true,
          text: 'Hold',
          pass: true,
        },
      ],
    };
  return {
    beat: b,
    p,
    done,
  };
}
