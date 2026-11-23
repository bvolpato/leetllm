import assert from 'node:assert/strict';
import * as F from '../../../films/token-economics/fixtures.mjs';
import {
  acceptedTaskCost,
  contextTierPrice,
  historyUsage,
  rateContentDigest,
  reservationTransition,
} from '../../../films/token-economics/arithmetic.mjs';
export { F, acceptedTaskCost, contextTierPrice, historyUsage, rateContentDigest };
export const terra = { input: 2, cached: 0.2, write: 2.5, output: 12 };
export function receipt(input, reads, writes, output, rate = F.standard, reasoning = 0) {
  const counts = [input, reads, writes, output, reasoning];
  assert(
    counts.every((n) => Number.isSafeInteger(n) && n >= 0) &&
      reads + writes <= input &&
      reasoning <= output,
    'Invalid usage',
  );
  const groups = [
    ['Ordinary input', input - reads - writes, rate.input],
    ['Prefix read', reads, rate.cached],
    ['Prefix write', writes, rate.write],
    ['Output', output, rate.output],
  ];
  const rows = groups.map(([name, count, price]) => {
    assert(
      (!count && price === undefined) || (Number.isFinite(price) && price >= 0),
      'Missing or invalid rate',
    );
    return { name, count, rate: price, cost: count * (price ?? 0) };
  });
  return { rows, total: rows.reduce((s, r) => s + r.cost, 0), input, output, reasoning };
}
export const policy = (warm) => receipt(1800, warm ? 1280 : 0, 0, 180);
export const terraWorksheet = receipt(4000, 1500, 2000, 100, terra);
export const night = (warm) => receipt(1800, warm ? 1280 : 0, 0, 80, F.batch);
export function nightlyLines(warm, calls) {
  return [
    ['policy', 1280, warm ? F.batch.cached : F.batch.input],
    ['new input', 520, F.batch.input],
    ['output', 80, F.batch.output],
  ].map(([name, perCall, rate]) => ({
    name,
    tokens: perCall * calls,
    cost: perCall * calls * rate,
  }));
}
export function overnight(warm, count = 2000) {
  const r = night(warm);
  return {
    input: (r.total - r.rows[3].cost) * count,
    output: r.rows[3].cost * count,
    total: r.total * count,
    count,
  };
}
export const practice = [
  { task: 'X', id: 'X1', accepted: false, status: 'Retry needed', costMicro: 2000 },
  { task: 'X', id: 'X2', accepted: true, status: 'Accepted', costMicro: 3000 },
  { task: 'Y', id: 'Y1', accepted: false, status: 'Abandoned', costMicro: 4000 },
  { task: 'Z', id: 'Z1', accepted: true, status: 'Accepted', costMicro: 5000 },
];
export function balance(total, phase, reserve = 10000) {
  const a =
    phase === 'arrival'
      ? { free: total, held: 0, spent: 0 }
      : reservationTransition(
          total,
          reserve,
          phase === 'receipt' ? 'settled' : 'pending',
          F.conciseMicro,
        );
  return { ...a, phase, total, reserve, canB: a.free >= reserve };
}
export function month({ supportFactor = 1, coldNights = 0, coldSupport = false } = {}) {
  const policyMiss = F.dailySlices[0].requests * (policy(false).total - F.prefixMicro);
  const exceptionMiss = 500 * (receipt(2200, 0, 0, 130).total - F.conciseMicro);
  const support =
    (F.optimizedDailyMicro + (coldSupport ? policyMiss + exceptionMiss : 0)) * supportFactor;
  const evaluation =
    F.evaluationMicro + (coldNights * (F.coldEvaluationMicro - F.evaluationMicro)) / 30;
  const total = Math.round((support + evaluation) * 30);
  return {
    support,
    evaluation,
    total,
    headroom: F.budgetMicro - total,
    pass: total <= F.budgetMicro,
  };
}
export function report(unsafe = 0, n = 1200) {
  const rate = F.citedAnswersPassed / F.reviewedAnswers;
  return {
    unsafe,
    n,
    rate,
    passes: rate >= 0.995 && F.reviewedAnswers >= 2000 && n >= 1000 && unsafe === 0,
    upper: unsafe === 0 ? 3 / n : null,
  };
}
export const refundAttempts = (short) =>
  (short
    ? [
        ['A', true],
        ['B', false],
        ['B', true],
      ]
    : [
        ['A', true],
        ['B', true],
      ]
  ).map(([task, accepted]) => ({
    task,
    accepted,
    costMicro: short ? F.conciseMicro : F.verboseMicro,
  }));
export function checkLedger() {
  for (const warm of [true, false]) {
    for (const count of [1, 2000]) {
      const lines = nightlyLines(warm, count);
      assert.deepEqual(
        lines.map((line) => line.tokens),
        [1280 * count, 520 * count, 80 * count],
      );
      assert.equal(
        lines.reduce((total, line) => total + line.cost, 0),
        overnight(warm, count).total,
      );
    }
  }
  assert.equal(policy(false).total, 7200);
  assert.equal(policy(true).total, 4320);
  assert.deepEqual(overnight(true), {
    input: 1620000,
    output: 1200000,
    total: 2820000,
    count: 2000,
  });
  assert.deepEqual(overnight(false), {
    input: 4500000,
    output: 1200000,
    total: 5700000,
    count: 2000,
  });
  assert.deepEqual(
    terraWorksheet.rows.map((r) => [r.count, r.cost]),
    [
      [500, 1000],
      [1500, 300],
      [2000, 5000],
      [100, 1200],
    ],
  );
  assert.equal(terraWorksheet.total, 7500);
  assert.throws(() => receipt(true, 0, 0, 0));
  assert.throws(() => receipt(10, 9, 3, 0));
  assert.throws(() => receipt(9, 0, 4, 0));
  assert.throws(() => receipt(0, 0, 0, 2, F.standard, 3));
  assert.equal(receipt(1800, 0, 0, 1024, F.standard, 1024).total, 19860);
  assert.equal(receipt(1800, 0, 1280, 180, terra).total, 6400);
  assert.equal(receipt(1800, 1280, 0, 180, terra).total, 3456);
  assert.deepEqual(
    [272000, 272001].map((i) => contextTierPrice(i).cost),
    [0.68, 1.360005],
  );
  assert.equal(contextTierPrice(300000, 1000).cost, 1.5225);
  assert.deepEqual(
    [false, true].map((c) => historyUsage(c).cost),
    [0.065, 0.0335],
  );
  const ideal = historyUsage(true);
  assert.deepEqual(ideal.reads, [0, ...ideal.inputs.slice(0, -1)]);
  assert.deepEqual([ideal.ordinary, ideal.cached, ideal.output], [6000, 14000, 1000]);
  assert.equal(
    ideal.inputs.reduce((sum, input, i) => sum + receipt(input, ideal.reads[i], 0, 200).total, 0),
    33500,
  );
  assert.equal(acceptedTaskCost(practice).costPerAccepted, 7000);
  assert.deepEqual(
    [false, true].map((s) => acceptedTaskCost(refundAttempts(s)).costPerAccepted),
    [5920, 6855],
  );
  assert.equal(acceptedTaskCost(practice.filter((r) => !r.accepted)).costPerAccepted, null);
  assert.notEqual(rateContentDigest(15), rateContentDigest(16));
  assert.deepEqual(
    [
      {},
      { supportFactor: 1.1 },
      { coldNights: 30 },
      { coldSupport: true },
      { coldNights: 11 },
      { coldNights: 12 },
    ].map((a) => month(a).total),
    [717180000, 780438000, 803580000, 915900000, 748860000, 751740000],
  );
  assert.deepEqual(
    [11, 12].map((coldNights) => month({ coldNights }).headroom),
    [1140000, -1740000],
  );
  assert.deepEqual(
    [0, 1].map((n) => report(n).passes),
    [true, false],
  );
  assert.equal(report(0).upper, 0.0025);
  assert.deepEqual(
    [2200, 2300].map((i) => receipt(i, 0, 0, 300).total),
    [10000, 10250],
  );
  for (const total of [16000, 17000])
    for (const phase of ['arrival', 'held', 'timeout', 'receipt']) {
      const a = balance(total, phase);
      assert.equal(a.spent + a.held + a.free, total);
      if (phase === 'held' || phase === 'timeout') {
        assert.equal(a.held, 10000);
        assert.equal(a.free, total - 10000);
        assert.equal(a.canB, false);
      }
      if (phase === 'receipt') {
        assert.equal(a.held, 0);
        assert.equal(a.spent, 4570);
        assert(a.canB);
      }
    }
}
