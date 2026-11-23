const phraseStarts = {
  "c08-b03": [
    "Abuse and clean",
    "Learning abuse makes",
    "changing its probability",
    "so those two"
  ],
  "c10-empty-answer": [
    "Clean signups also",
    "Add the two",
    "The conditional fraction",
    "That probability is",
    "Report the empty"
  ],
  "c11-b05": [
    "three sequences qualify.",
    "The count probability",
    "That factor changes",
    "while the maximizing"
  ],
  "c12-b01": [
    "If those scores",
    "we'd expect abuse",
    "across a large",
    "Uncover the six",
    "What fraction in"
  ],
  "c13-b03": [
    "There's no fixed",
    "If alerts arrive",
    "a Poisson model",
    "both a mean",
    "Even a quiet"
  ],
  "c16-b02": [
    "The moderate model",
    "The unsure model",
    "for a mean",
    "The confident model",
    "For the fourth",
    "What does that",
    "Where will this"
  ],
  "c17-b03": [
    "that standard error",
    "A band extending",
    "reaches about eleven",
    "below and above",
    "That's how much"
  ],
  "c18-b03": [
    "Stack their marks",
    "Suppose both pass",
    "only the old",
    "Set aside the"
  ],
  "c18-b05": [
    "making two standard",
    "takes about three",
    "To clear that",
    "under a true",
    "needs more cases"
  ],
  "c20-b01": [
    "and ninety-nine hundred",
    "Suppose a new",
    "and one percent",
    "Compared with strict",
    "how many more",
    "How many tickets"
  ],
  "c21-b03": [
    "There's room for",
    "Six hundred were",
    "That leaves one",
    "For a reviewer",
    "four hundred eighty",
    "gives a risk"
  ],
  "c08-b02": [
    "and join the",
    "Twenty abusive signups",
    "That's twenty out",
    "When knowing one",
    "unchanged, the events",
    "This detector creates"
  ],
  "c10-b02": [
    "the fraction caught",
    "Add the false-flag",
    "Dividing the red"
  ],
  "c11-b04": [
    "to just two",
    "one fifth and",
    "Multiply each prior",
    "then normalize the",
    "The four-fifths candidate",
    "as the one-fifth"
  ],
  "c12-b02": [
    "Mark that on",
    "The gap here",
    "Checking observed frequencies",
    "in groups like"
  ],
  "c12-b04": [
    "The one-percent forecast",
    "the observed frequency",
    "but it gives",
    "to put one"
  ],
  "c14-b02": [
    "This is a",
    "and the operation"
  ],
  "c15-b07": [
    "a perplexity of",
    "To compare models",
    "use comparable data,",
    "The model is",
    "Their probability tells"
  ],
  "c16-b04": [
    "To check calibration",
    "Look what happens",
    "to a loss",
    "PyTorch CrossEntropyLoss expects",
    "It normalizes them"
  ],
  "c17-b05": [
    "More labels from",
    "do not estimate",
    "Sampling noise, population",
    "and distribution shift"
  ],
  "c19-b04": [
    "With these two",
    "leaves twenty abusive",
    "If the cost",
    "or a detector"
  ]
}
;

// Group names, counts, and their units in the same cue.
export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
