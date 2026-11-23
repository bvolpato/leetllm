export const weighted = (r, w) => w * r[0] + (1 - w) * r[1];
export const inverse = (p) => {
  if (!(p > 0 && p < 1)) throw new Error('Both assignments need positive support');
  return 1 / p;
};
