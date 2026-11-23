export const observations = [28, 30, 32, 86, 90, 94];
export const initialModel = {
  weights: [0.5, 0.5],
  means: [25, 95],
  variances: [900, 900],
};
export const VAE_COMPARISON_ROUTES = Object.freeze([
  Object.freeze({
    posterior: 'exact',
    posteriorLabel: 'exact component posterior',
    update: 'm-step',
    updateLabel: 'Weighted M-step',
    color: 'blue',
  }),
  Object.freeze({
    posterior: 'encoder',
    posteriorLabel: 'Learned encoder posterior',
    update: 'elbo-gradient',
    updateLabel: 'Joint ELBO gradients',
    color: 'pink',
  }),
]);
