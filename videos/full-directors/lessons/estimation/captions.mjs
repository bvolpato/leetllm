const phraseStarts = {
  "c01-b01": [
    "Turn over the",
    "One needs a",
    "Put that share",
    "Twenty percent, right",
    "If you had"
  ],
  "c02-b02": [
    "Its hundred messages",
    "as every other",
    "Change which messages",
    "That spread is"
  ],
  "c02-b03": [
    "Watch the second",
    "Four times the",
    "the typical movement",
    "Extra labels buy"
  ],
  "c03-b01": [
    "Multiply the sample",
    "then take the",
    "This estimated standard",
    "The quick Wald",
    "on each side",
    "Its width comes"
  ],
  "c03-b02": [
    "At twenty percent",
    "with a standard",
    "We saw sixteen.",
    "That's one standard"
  ],
  "c03-b03": [
    "keep the candidates",
    "one point nine",
    "Include both endpoints.",
    "Each candidate supplies",
    "Where does the"
  ],
  "c03-b04": [
    "The accepted rates",
    "That is the",
    "It crosses our",
    "so this sample",
    "We still have"
  ],
  "c04-b03": [
    "Look halfway between",
    "The Wilson midpoint",
    "We gave every",
    "In a real"
  ],
  "c05-b02": [
    "Wilson still accepts",
    "With zero positives,",
    "the upper end",
    "has a shortcut.",
    "One point nine",
    "Keep the square"
  ],
  "c05-b05": [
    "Keep the same",
    "The upper end",
    "A population rate",
    "is still compatible"
  ],
  "c05-b06": [
    "Now suppose all",
    "Flip the interval",
    "Rates from about",
    "fit these ten"
  ],
  "c05-b08": [
    "Ninety-five percent describes",
    "across repeated samples.",
    "Actual coverage depends",
    "To predict the",
    "you'd also have"
  ],
  "c06-b01": [
    "Seven hundred are",
    "The rest concern",
    "Select only routine",
    "without replacement. More",
    "More routine labels",
    "around the same",
    "The blue whisker"
  ],
  "c06-b02": [
    "finite-population correction would",
    "Even reviewing every",
    "about the other"
  ],
  "c06-b03": [
    "Twelve percent of",
    "contribute eighty-four expected",
    "At twenty-five percent",
    "At forty-two percent"
  ],
  "c06-b05": [
    "Sample across the",
    "Every message can",
    "Follow ten message",
    "Or draw a",
    "Take three messages",
    "Each tray now",
    "Weight each lane's",
    "Routine supplies seventy",
    "billing twenty, and",
    "Carry uncertainty from"
  ],
  "c07-b02": [
    "Repeat the whole",
    "Each completed resample",
    "Their spread approximates",
    "using our observed",
    "Take the two",
    "for a percentile",
    "Extra repetitions refine",
    "while the original"
  ],
  "c08-b04": [
    "Sixteen needed a",
    "Keep the same",
    "posterior peaks at",
    "about sixteen point",
    "Compare the two"
  ],
  "c08-b06": [
    "This is a",
    "Choose one score",
    "Every message in",
    "Draw one hundred"
  ],
  "c08-b07": [
    "Is that four-point"
  ],
  "c08-b08": [
    "across the forecast",
    "Twenty percent still",
    "The observed gap",
    "A larger random",
    "We'd need held-out",
    "to assess those"
  ],
  "c09-b03": [
    "Sixteen pink cases",
    "Sixty-four blue ones",
    "Twenty envelopes are",
    "If you want",
    "where would you"
  ],
  "c09-b05": [
    "Thirty-six out of",
    "Those bounds describe",
    "To estimate the",
    "which hundred messages"
  ],
  "c09-b06": [
    "dropping them can",
    "Report how many",
    "and how many",
    "Look at this",
    "The customer got"
  ],
  "c09-b08": [
    "One chose routine.",
    "The other chose",
    "Record that disagreement.",
    "Put their answers",
    "Read across each",
    "On how many"
  ],
  "c09-b09": [
    "Divide by all",
    "That's seventy-five percent",
    "Save both original",
    "Now send the",
    "The final label",
    "and we'll still"
  ],
  "c10-b01": [
    "then reviewed every",
    "Pull one signup",
    "Now pull its",
    "They came in",
    "In this example"
  ],
  "c10-b03": [
    "Two were positive",
    "Try drawing whole",
    "Here's the same",
    "Each copy brings",
    "We could instead"
  ],
  "c10-b05": [
    "The two and",
    "are twelve and",
    "Now draw whole",
    "Those percentiles reach",
    "Each pink draw"
  ],
  "c10-b06": [
    "divided by the",
    "Using a hundred"
  ],
  "c10-b07": [
    "Look at the",
    "If you changed",
    "the abusive count",
    "Could a whole-campaign",
    "Swap one negative",
    "All ten signups",
    "Thirty abusive signups",
    "With only ten",
    "limit how closely"
  ],
  "c10-b08": [
    "keep each signup",
    "campaign of twenty",
    "These two draws"
  ],
  "c11-b01": [
    "Imagine a population",
    "Make ten thousand",
    "sampling with replacement.",
    "Individual estimates vary",
    "Their expected average",
    "Follow the gap"
  ],
  "c11-b02": [
    "That's why the",
    "even as the",
    "That persistent gap",
    "Mean squared error"
  ],
  "c11-b03": [
    "With a Beta",
    "one success in",
    "Its mode, the",
    "Its mean lies",
    "For this prior,",
    "adds two to"
  ],
  "c11-b04": [
    "Say which summary",
    "Wilson's adjusted midpoint"
  ],
  "c11-b06": [
    "For an ambiguous",
    "If a new",
    "You may hear",
    "and lack of"
  ],
  "c13-b02": [
    "for the binomial",
    "Across all four",
    "The dot is",
    "Look at the",
    "The pink mark"
  ],
  "c13-b03": [
    "for us to"
  ],
  "c13-b05": [
    "and reviewed them",
    "How much of"
  ],
  "c13-b06": [
    "Fill the regular",
    "Two thousand places",
    "In sampling and",
    "we'll choose a",
    "and draw whole",
    "How often would"
  ]
}
;

// Keep the statistical quantities and spoken instructions together.
export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
