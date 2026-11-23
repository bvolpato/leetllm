import {
  acceptedTaskCost,
  contextTierPrice,
  historyUsage,
  reservationTransition,
} from './arithmetic.mjs';
import {
  actualDailyMicro,
  coldEvaluationMicro,
  coldNightExtraMicro,
  coldMicro,
  conciseMicro,
  dailyTotalMicro,
  evaluationMicro,
  forecastWithColdNights,
  growthMonthlyMicro,
  headroomMicro,
  monthlyMicro,
  optimizedDailyMicro,
  prefixMicro,
  qualityRate,
  reviewedHits,
  semanticHits,
  unsafeHits,
  verboseMicro,
} from './fixtures.mjs';
import {
  budgetSnapshot,
  payoffConstruction,
  retryCostFrame,
  reuseConstruction,
  teachingFrame,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const prefix = reuseConstruction({
    beat: 2,
    beatP: 1,
  });
  assert.equal(prefix.cached + prefix.ordinary, 1800);
  assert.equal(prefix.generated, 180);
  assert.equal(prefix.storedGenerated, 0);
  assert.equal(prefix.prefixCharge, 4320);
  assert.equal(prefix.storedCharge, 0);
  assert.equal(
    reuseConstruction({
      beat: 2,
      beatP: 1,
      cues: {
        'prefix-new-output': {
          phase: 'before',
        },
      },
    }).generated,
    0,
  );
  const payoff = payoffConstruction({
    beat: 2,
    beatP: 1,
  });
  assert.equal(payoff.perAttempt, 4570);
  assert.equal(payoff.current.accepted, 2);
  assert.equal(payoff.current.costPerAccepted, 6855);
  assert.equal(payoff.current.spend - payoff.baseline.spend, 1870);
  const repeated = acceptedTaskCost([
    {
      task: 'A',
      accepted: true,
      costMicro: 5,
    },
    {
      task: 'A',
      accepted: true,
      costMicro: 5,
    },
    {
      task: 'B',
      accepted: false,
      costMicro: 3,
    },
  ]);
  assert.equal(repeated.accepted, 1);
  assert.equal(repeated.spend, 13);
  const noSuccess = acceptedTaskCost([
    {
      task: 'B',
      accepted: false,
      costMicro: 3,
    },
  ]);
  assert.equal(noSuccess.accepted, 0);
  assert.equal(noSuccess.costPerAccepted, null);
  const retry = retryCostFrame({
    cues: {
      'retry-receipts': {
        phase: 'after',
        progress: 1,
      },
    },
  });
  assert.equal(retry.current.attempts, 3);
  assert.equal(retry.current.accepted, 2);
  assert.equal(retry.current.spend, 13710);
  assert.equal(retry.current.costPerAccepted, 6855);
  assert.equal(retry.baseline.costPerAccepted, 5920);
  assert(retry.current.costPerAccepted > retry.baseline.costPerAccepted);
  assert.equal(coldMicro, 7200);
  assert.equal(prefixMicro, 4320);
  assert.equal(prefixMicro / 1_000_000, 0.00432);
  assert.equal(coldMicro - prefixMicro, 2880);
  assert.equal(verboseMicro - conciseMicro, 1350);
  assert.equal((semanticHits * prefixMicro) / 1_000_000, 13.824);
  assert.equal(actualDailyMicro, 21_761_000);
  assert.equal(optimizedDailyMicro, 21_086_000);
  assert.equal(evaluationMicro, 2_820_000);
  assert.equal(coldEvaluationMicro, 5_700_000);
  assert.equal(coldNightExtraMicro, 2_880_000);
  assert.equal(forecastWithColdNights(11), 748_860_000);
  assert.equal(forecastWithColdNights(12), 751_740_000);
  assert.equal(forecastWithColdNights(30), 803_580_000);
  assert.equal(monthlyMicro / 1_000_000, 717.18);
  assert.equal(headroomMicro / 1_000_000, 32.82);
  assert.equal(Math.round(growthMonthlyMicro / 10_000) / 100, 780.44);
  assert.equal(qualityRate, 0.997);
  assert.equal(dailyTotalMicro / 1_000_000, 23.906);
  assert.equal(headroomMicro / 1_000_000, 32.82);
  assert.equal(reviewedHits, 1200);
  assert.equal(unsafeHits, 0);
  for (const beat of [0, 1, 2])
    for (let step = 0; step <= 100; step++) {
      const frame = teachingFrame({
        beat,
        beatP: step / 100,
      });
      assert.ok(Math.abs(frame.daily * 30 - frame.monthly) < 1e-10);
      assert.equal(frame.monthly, 717.18);
      assert.equal(frame.headroom, 32.82);
      if (beat > 0) assert.equal(frame.candidateOpacities[2], 1);
    }
  assert.equal(
    teachingFrame({
      beat: 0,
      beatP: 7.1 / 12.024,
    }).candidateOpacities[2],
    0,
  );
  assert.equal(
    teachingFrame({
      beat: 0,
      beatP: 7.525 / 12.024,
    }).candidateOpacities[2],
    1,
  );
  const namedSmallest = teachingFrame({
    beat: 0,
    beatP: 8.125 / 12.024,
  });
  assert.equal(namedSmallest.candidateOpacities[2], 1);
  assert.equal(namedSmallest.candidateOpacities[1], 0);
  assert.ok(
    teachingFrame({
      beat: 1,
      beatP: 0.5,
    }).candidateOpacities[1] > 0,
  );
  assert.equal(
    budgetSnapshot({
      beat: 0,
      t: 7.9,
    }).monthly,
    717.18,
  );
  const moving = budgetSnapshot({
    beat: 0,
    t: 10.3125,
  });
  assert(moving.monthly > 717.18 && moving.monthly < growthMonthlyMicro / 1_000_000);
  assert.equal(moving.headroom, 750 - moving.monthly);
  assert.equal(
    budgetSnapshot({
      beat: 0,
      t: 12.725,
    }).monthly,
    growthMonthlyMicro / 1_000_000,
  );
  assert.equal(
    budgetSnapshot({
      beat: 1,
      beatP: 0.12,
    }).monthly,
    growthMonthlyMicro / 1_000_000,
  );
  validateChapterModels();
  return true;
}
export function validateChapterModels() {
  assert.equal(contextTierPrice(272000).cost, 0.68);
  assert.equal(contextTierPrice(272001).cost, 1.360005);
  assert.equal(contextTierPrice(300000, 1000).cost, 1.5225);
  assert.equal(contextTierPrice(280000, 200, 80000).cost, 1.0445);
  assert.equal(historyUsage().cost, 0.065);
  assert.equal(historyUsage(true).cost, 0.0335);
  assert.equal(historyUsage(true).cached, 14000);
  const one = reservationTransition(17000, 10000);
  assert.equal(one.free, 7000);
  assert(!reservationTransition(one.free, 10000).admitted);
  assert.equal(reservationTransition(17000, 10000, 'timeout').held, 10000);
  assert.equal(reservationTransition(17000, 10000, 'settled', 6000).free, 11000);
  assert.equal(1 - Math.pow(0.05, 1 / 1200) > 0, true);
  return true;
}
