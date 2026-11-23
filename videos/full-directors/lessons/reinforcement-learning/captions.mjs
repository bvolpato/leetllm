const phraseStarts = {
  'c02-b02': [
    "The first reward counts",
    "The next counts at",
    "then point seven two",
    "The beacon reward is",
    "rewards separate it from",
    "Add the four contributions",
    "eleven point eight seven.",
  ],
  'c03-b01': [
    "When the rover chooses",
    "intended move happens eighty",
    "Ten percent of the",
    "and ten percent in",
    "At this cliff-edge cell,",
    "Choosing Right no longer",
  ],
  'c05-b04': [
    "Then each square chooses",
    "plus continuation.",
    "On this deterministic map,",
    "In the windy map,",
    "The same algorithm changes",
    "With gamma below one,",
    "between two value tables",
    "Repeating the backups brings",
  ],
  'c07-b02': [
    "The sample target is",
    "or fourteen point three.",
    "The current estimate for",
    "The difference between target",
    "temporal-difference error.",
  ],
  'c08-b05': [
    "A collector stopping after",
    "underlying task may still",
    "If the last reward",
    "the truncated target remains",
    "Dropping it to minus",
    "If a deadline really",
    "and end the task",
  ],
  'c09-b03': [
    "Put an eight-point entry",
    "Entering it now earns",
    "Starting one cell left,",
    "a three-move trip to",
    "earns seven, minus one,",
    "a discounted return of",
  ],
  'c09-b04': [
    "collecting seven, minus one,",
    "Its discounted return is",
    "thirty-two point one one,",
    "The rover is optimizing",
    "The bonus accidentally made",
    "the beacon.",
  ],
  'c10-b02': [
    "Suppose we sample Up.",
    "The gradient of its",
    "three quarters for Up",
    "and minus one quarter",
    "A positive return multiplier",
    "raises the Up logit",
    "A negative multiplier reverses",
  ],
  'c10-b05': [
    "For estimated action returns",
    "the equal-probability policy has",
    "Its exact softmax gradient",
    "three point six two",
    "minus seven point eight",
    "and one point six",
    "Finite differences agree: increasing",
    "Down hurts.",
  ],
  'c11-b03': [
    "old probability.",
    "If a positively advantaged",
    "point two eight, the",
    "With an upper clip",
    "the clipped objective gets",
    "Clipping limits the incentive;",
    "probability itself.",
  ],
};

export function prepareCaptionReflow(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
