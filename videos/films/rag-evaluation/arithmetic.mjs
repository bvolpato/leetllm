export function rankPrecision(relevance) {
  let found = 0,
    sum = 0;
  relevance.forEach((v, i) => {
    if (v) {
      found++;
      sum += found / (i + 1);
    }
  });
  return found ? sum / found : 0;
}
