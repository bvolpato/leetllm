export const observed = Array.from(
  {
    length: 10,
  },
  (_, i) => ({
    id: i + 1,
    pass: i < 8,
  }),
);
export const family = {
  easy: {
    a: 74,
    b: 10,
    passes: 72,
    total: 80,
  },
  hard: {
    a: 10,
    b: 14,
    passes: 8,
    total: 20,
  },
};
export function buildValidationOutcomes() {
  const laterResults = Array.from(
    {
      length: 100,
    },
    (_, i) => i < 72,
  );
  let seed = 20261029;
  for (let i = laterResults.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [laterResults[i], laterResults[j]] = [laterResults[j], laterResults[i]];
  }
  const validationOutcomes = laterResults.map((pass, i) => ({
    id: 'V' + (i + 1),
    pass,
    forecast: 10 / 14,
  }));
  return {
    validationOutcomes,
  };
}
export const { validationOutcomes } = buildValidationOutcomes();

export const releasePolicy = { rateCutoff: 0.7, requiredMass: 0.95 };
export const lastEvaluation = { passes: 18, failures: 2, priorA: 2, priorB: 2 };
