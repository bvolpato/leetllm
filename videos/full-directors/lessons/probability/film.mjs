import { prepareCaptions } from './captions.mjs';
import { painter } from './press.mjs';
import { check as checkExamples } from './examples.mjs';
import {
  checkTicketPositions,
  opening,
  populationView,
  indicator,
  feed,
  windowView,
  bayes,
  shift,
  independent,
  copied,
} from './audit.mjs';
import { posteriorFunction, candidate, calibration, distributions } from './inference.mjs';
import { softmax, chain, targetLoss } from './tokens.mjs';
import { samplingError, rateGap, policy, staff } from './decisions.mjs';

const scenes = [
  opening,
  populationView,
  indicator,
  feed,
  windowView,
  bayes,
  shift,
  independent,
  copied,
  posteriorFunction,
  candidate,
  calibration,
  distributions,
  softmax,
  chain,
  targetLoss,
  samplingError,
  rateGap,
  (p) => policy(p),
  (p) => policy(p, true),
  staff,
];

const captionStarts = {
  "c03-b03": ["but it turns up"],
  "c03-b04": ["the variance is p times"],
  "c04-b01": ["and five percent inside"],
  "c06-b01": ["by the selected world"],
  "c06-b02": ["abuse prior times"],
  "c07-b01": ["in a batch of the same size"],
  "c08-b03": ["from ninety-nine percent to zero"],
  "c09-b03": ["multiply the two rates for that class"],
  "c09-b04": ["how often they both flag"],
  "c10-b06": ["to the log of its flag rate"],
  "c11-b03": ["if the rate is two thirds"],
  "c11-b04": ["as the one-fifth candidate"],
  "c11-b05": ["while the maximizing rate remains"],
  "c12-b04": ["The one-percent forecast"],
  "c13-b02": ["giving n times p times one minus p"],
  "c13-b04": ["a Normal model may be", "gives the probability of landing"],
  "c14-b05": ["Our first point lands on result", "This one lands on None"],
  "c15-b03": ["so this multiplication", "when earlier words strongly influence later ones"],
  "c15-b07": ["a perplexity of about four point six four"],
  "c16-b01": ["A target probability point nine", "costs about point one zero five nats", "At point zero one it costs"],
  "c16-b02": ["a mean loss of point six one nine nats", "for a mean of one point three eight six", "For the fourth it gives just point zero zero one"],
  "c16-b03": ["That fourth bar reaches", "Each of the first three costs", "The mean comes to", "the highest of the three models"],
  "c17-b01": ["on fresh sets of fifty cases"],
  "c17-b03": ["that standard error is about point zero five seven"],
  "c17-b04": ["use an interval suited to binomial counts"],
  "c17-b05": ["do not estimate the all-signup prior"],
  "c18-b02": ["and take the square root"],
  "c18-b05": ["takes about three thousand two hundred cases per model"],
  "c19-b01": ["as three hundred ninety-six clean signups leave the queue"],
  "c19-b03": ["is the detector's precision"],
  "c19-b04": ["or a detector that sends a different mix"],
  "c20-b01": ["how many more abusive signups", "does it catch overall"],
  "c20-b02": ["that strict review caught", "still gives ninety-nine clean flags"],
  "c20-b03": ["because we counted every source", "whenever the evidence or the population changes"],
  "c21-b01": ["and two percent of clean ones"],
  "c21-b02": ["and nineteen thousand four hundred clean"],
  "c21-b03": ["Together that's eight hundred sixty-eight expected reviews"],
};

// Keep the picture cue on the final word of an answer without breaking its caption.
const pictureOnly = new Set([
  'scores tie',
  'result. Here the sample',
  'None. Both draws',
  'eight nats',
  'one zero nats',
  'four nats per token',
]);

function draw(ctx, clock) {
  for (const phrase of captionStarts[clock.beat.id] ?? []) {
    clock.reveal(phrase, 0, { captionStart: phrase });
  }
  ctx.save();
  try {
    ctx.scale(1.6, 1.6);
    scenes[clock.beat.chapterIndex](painter(ctx, {
      ...clock,
      reveal(phrase, duration, options) {
        return clock.reveal(phrase, duration, pictureOnly.has(phrase) ? { captionStart: false } : options);
      },
    }));
  } finally {
    ctx.restore();
  }
}

function check() {
  checkExamples();
  checkTicketPositions();
}

export default { title: 'Would You Trust This Flag?', draw, check, preparePicture: prepareCaptions };
