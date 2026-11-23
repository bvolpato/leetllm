const starts = {
  'c02-b02': ['The whole chain becomes', 'that changes this affine structure'],
  'c03-b02': ['what happens to the right end'],
  'c04-b01': ['and queue wait a weight'],
  'c04-b03': ['scores only point one five four'],
  'c05-b01': ['Six tenths minus five tenths'],
  'c05-b03': ['then add the bias', 'The logit is', 'Sigmoid gives about'],
  'c06-b03': ['and their weighted parts cancel'],
  'c07-b01': ['and watch each curve'],
  'c07-b02': ['by this local slope'],
  'c08-b01': ['and this path blocks'],
  'c08-b02': ['evaluate the resulting network'],
  'c09-b05': ['by the standard Gaussian cumulative probability there'],
  'c09-b06': ['supplies the multiplier for each coordinate'],
  'c10-b02': ['then add the number'],
  'c11-b02': ['Each first-layer unit gets', 'all seven hundred eighty-four pixels'],
  'c11-b03': ['from connecting every pixel'],
  'c12-b01': ['evaluates each neuron'],
  'c12-b02': ['and sigmoid gives one score'],
  'c15-b01': ['multiply the residual by the hidden value'],
  'c16-b01': ['and contributes one binary cross-entropy loss'],
  'c16-b02': ['The first box gives'],
  'c16-b03': ['and the logit gradients are'],
  'c16-b05': ['and that becomes minus one point five'],
  'c17-b01': ['The output-weight gradient sums', 'times its saved hidden activations', 'times its original input features', 'and each bias gradient sums'],
  'c17-b02': ['from matching inputs and parameter state', 'and reruns omitted forward work', 'can change the gradients'],
  'c19-b01': ['with two-sided finite differences', 'so the active branches', 'to compare manual gradients'],
  'c19-b02': ['samples one negative and one positive side', 'so there is no single derivative'],
  'c19-b03': ['and the secant follows the same straight line'],
  'c20-b02': ['which of its two input weights'],
  'c20-b03': ['The hidden sensitivity is'],
  'c20-b05': ['the negative prompt feature', 'and the positive queue feature', 'and raises the queue weight'],
  'c21-b02': ['and training standard deviation of two'],
  'c21-b03': ['The standardized queue value', 'Its contribution is', 'and divide by two hundred', 'The token contribution is'],
  'c21-b04': ['would leak information into the evaluation'],
  'c22-b02': ['so taking its logarithm'],
  'c22-b03': ['for our wrong prediction', 'so the loss still has'],
  'c23-b04': ['keeping the feature order', 'model and policy versions fixed'],
  'c24-b01': ['to bring the response'],
  'c24-b02': ['and add their weighted responses'],
  'c24-b03': ['everywhere on this interval'],
  'c25-b01': ['for a continuous target', 'a linear output'],
  'c25-b02': ['and the error we can tolerate'],
  'c25-b04': ['however wide this single hidden layer is'],
  'c25-b06': ['and the optimizer can still get stuck'],
  'c26-b05': ['Which reading would you take', 'to tell these explanations apart'],
  'c26-b06': ['so testing another corner', 'and chosen an input'],
};

const changed = {
  'c07-b01': { 'into the tails': false },
  'c02-b02': { 'six times the input': 'The whole chain becomes' },
  'c04-b01': { 'four point two': 'Six times point seven', 'two point four': 'Eight times point three', 'six point six': 'Together they reach' },
  'c05-b01': { 'one tenth': 'Six tenths minus five tenths' },
  'c05-b02': { 'three point two': 'Their sum is' },
  'c05-b03': { 'minus point one four': 'The logit is', 'point four six five': 'Sigmoid gives about' },
  'c09-b03': {
    'its signal stops': 'so its signal stops',
    'its signal reverses sign': 'so its signal reverses sign',
    'its signal stays positive': 'so its signal stays positive',
  },
  'c15-b04': { 'zero for both': 'The first unit gets' },
  'c16-b02': { 'minus one half': 'The first box gives', 'plus one half': 'The next gives' },
  'c16-b03': { 'minus or plus one twelfth': 'and the logit gradients are' },
  'c17-b01': { 'sums each request': 'The output-weight gradient sums' },
  'c17-b02': { 'reruns omitted forward work': 'and reruns omitted forward work' },
  'c18-b02': { 'point four nine eight': 'The mean loss falls' },
  'c20-b03': { 'about minus point': 'The hidden sensitivity is' },
  'c21-b03': { 'one and a half': 'The standardized queue value', 'point four five': 'Its contribution is', 'point six': 'The token contribution is' },
  'c25-b05': { 'one half': 'The straight line gives', 'one and a half': 'The bowed curve gives' },
  'c26-b02': { 'one point three': 'The hinges give', 'point seven': 'That puts the lamp' },
  'c26-b05': { 'point three. Put the two predictions': 'Their gap is' },
};

export function captionClock(clock) {
  const id = clock.beat.id;
  for (const phrase of starts[id] ?? []) clock.reveal(phrase, 0, { captionStart: phrase });
  const overrides = changed[id];
  if (!overrides) return clock;
  return {
    ...clock,
    reveal(phrase, duration, options) {
      const anchor = options?.captionStart ?? phrase;
      const captionStart = overrides[anchor];
      return clock.reveal(phrase, duration, captionStart === undefined ? options : { ...options, captionStart });
    },
  };
}
