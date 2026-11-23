export const standard = {
  input: 2.5,
  cached: 0.25,
  output: 15,
};
export const batch = {
  input: 1.25,
  cached: 0.125,
  output: 7.5,
};
export const priceMicroDollars = (input, cached, output, rates = standard) =>
  (input - cached) * rates.input + cached * rates.cached + output * rates.output;
export const coldMicro = priceMicroDollars(1800, 0, 180);
export const prefixMicro = priceMicroDollars(1800, 1280, 180);
export const conciseMicro = priceMicroDollars(2200, 1280, 130);
export const verboseMicro = priceMicroDollars(2200, 1280, 220);
export const semanticHits = 3200;
export const dailySlices = [
  {
    name: 'policy · prefix read',
    requests: 1800,
    cost: prefixMicro,
  },
  {
    name: 'live order · fresh data',
    requests: 3000,
    cost: priceMicroDollars(900, 0, 95),
  },
  {
    name: 'access exception · verbose',
    requests: 500,
    cost: verboseMicro,
  },
];
export const actualDailyMicro = dailySlices.reduce((sum, row) => sum + row.requests * row.cost, 0);
export const optimizedDailyMicro = actualDailyMicro - 500 * (verboseMicro - conciseMicro);
export const nightlyCalls = 2000;
export const evaluationMicro = nightlyCalls * priceMicroDollars(1800, 1280, 80, batch);
export const coldEvaluationMicro = nightlyCalls * priceMicroDollars(1800, 0, 80, batch);
export const coldNightExtraMicro = coldEvaluationMicro - evaluationMicro;
export const monthlyMicro = (optimizedDailyMicro + evaluationMicro) * 30;
export const forecastWithColdNights = (nights) => monthlyMicro + nights * coldNightExtraMicro;
export const budgetMicro = 750_000_000;
export const headroomMicro = budgetMicro - monthlyMicro;
export const growthMonthlyMicro = Math.round(optimizedDailyMicro * 1.1 + evaluationMicro) * 30;
export const dailyTotalMicro = optimizedDailyMicro + evaluationMicro;
export const reviewedAnswers = 2000;
export const citedAnswersPassed = 1994;
export const reviewedHits = 1200;
export const unsafeHits = 0;
export const qualityRate = citedAnswersPassed / reviewedAnswers;
export const USAGE_RECEIPT = Object.freeze({
  request: 'policy-answer-42',
  model: 'GPT-5.4',
  tier: 'standard',
  region: 'us-east',
  outcome: 'accepted',
  priceEffectiveDate: '2026-09-21',
  ordinaryInput: 1800,
  cachedInput: 0,
  output: 180,
});
