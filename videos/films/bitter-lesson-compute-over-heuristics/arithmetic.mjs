export function fixedBudgetPlans() {
  const budget = 6 * 7e9 * 140e9;
  return [7e9, 14e9].map((parameters) => ({
    parameters,
    tokens: budget / (6 * parameters),
    flops: 6 * parameters * (budget / (6 * parameters)),
  }));
}
export function lifetimePlans() {
  const large = {
    name: '7B · 140B tokens',
    parameters: 7e9,
    tokens: 140e9,
  };
  const small = {
    name: '3B · 400B tokens',
    parameters: 3e9,
    tokens: 400e9,
  };
  large.train = 6 * large.parameters * large.tokens;
  small.train = 6 * small.parameters * small.tokens;
  const savedPerServingToken = 2 * (large.parameters - small.parameters);
  const breakEven = (small.train - large.train) / savedPerServingToken;
  return {
    large,
    small,
    savedPerServingToken,
    breakEven,
  };
}
