const phraseStarts = {
  'c02-b02': ['The tree has to build a staircase', 'Each extra split'],
  'c02-b03': [
    "There's usually no need",
    "Look at a separate",
    "Its midpoint is two",
    "An unseen request at",
  ],
  'c02-b05': ['Two point eight squared is seven point eight four', 'below the new midpoint', 'Both training rows'],

  'c03-b05': [
    "Weight each class by",
    "A class with zero",
    "Entropy also falls to",
    "It reaches one bit",
    "Those different curves can",
  ],
  'c04-b01': ['half review and half routine', 'Cut A peels', 'with nine reviews in one and three in the other'],
  'c04-b06': ['with squared errors of twenty-five each', 'Across all three requests', 'the average falls to sixteen and two thirds'],
  'c05-b03': ['and a Gini impurity of point three two', "The right leaf's impurity"],
  'c06-b05': ['A hundred thirty-eight dollars', "beats the stump's two hundred forty at the same cutoff", 'A perfect training score'],
  'c07-b03': ['Averaging the leaf frequencies', 'gives the routing policy a score between zero and one', 'That average can steady'],
  'c07-b04': ['Changing which features or rows they can use', 'can shift their average prediction too', 'Check these scores'],
  'c08-b01': ['The distance between them is the residual', 'with a sign telling us which way to move'],
  'c08-b04': ['The other two predictions fall by a minute and a half', 'to twenty-eight and a half', 'Now measure the gaps again'],
  'c09-b02': ['each contribute minus a half', 'pulling it down'],
  'c09-b03': ['Each row contributes its probability', 'times one minus that probability', 'a quarter here', 'Five quarters go'],
  'c09-b05': [
    "That's one approximate Newton",
    "On the right, three",
    "Their residuals sum to",
    "Divide by three quarters",
    "the step is plus",
  ],
  'c09-b06': ['From round one through round four', 'the same split wins', 'and validation log loss falls'],
  'c10-b01': ['The observed label is at the top', 'then the leaf score', 'then what the policy did'],
  'c10-b05': ['so test the frozen choice on a fresh batch'],
  'c10-b07': ["This one permutation tests the fitted stump's", 'reliance on ambiguity on these rows'],
  'c11-b02': [
    "have a weak binary",
    "and a continuous noise",
    "Noise offers many possible",
    "just as a nearly",
  ],
  'c12-b04': ['or use the estimator’s documented missing route', 'Replay an absent value, a stored zero', 'and an ordinary value through the pinned version'],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
