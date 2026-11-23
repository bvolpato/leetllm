export const V = {
  bank: [0.5, 0.5],
  river: [0.1, 1],
  water: [0.2, 0.9],
  money: [1, 0.1],
};
export const RIVER = V.bank.map((x, i) => 0.5 * x + 0.4 * V.river[i] + 0.1 * V.water[i]);
export const FINANCE = V.bank.map((x, i) => 0.5 * x + 0.5 * V.money[i]);
export const LIMITS_CUES = {
  // Measured limits narration: "Adding" at 399.867s, "Centering" at 414.279s.
  shiftStart: 4.9 / 19.2,
  shiftEnd: 6.4875 / 19.2,
  centerStart: 0.1125 / 19.152,
  centerEnd: 2.6125 / 19.152,
};
export const CORPUS = [
  'The river bank is quiet',
  'Water reaches the river bank',
  'She keeps money in the bank',
  'Deposit money at the bank',
];
export const CONTEXT_WORDS = ['river', 'water', 'money', 'deposit'];
export const CONTEXT_COUNTS = CONTEXT_WORDS.map((word) =>
  CORPUS.reduce((total, sentence) => {
    const words = sentence.toLowerCase().split(/\s+/),
      center = words.indexOf('bank');
    return total + words.filter((token, i) => token === word && Math.abs(i - center) <= 4).length;
  }, 0),
);
export const CONTEXT_EVENTS = CORPUS.flatMap((sentence, sentenceIndex) => {
  const words = sentence.toLowerCase().split(/\s+/),
    center = words.indexOf('bank');
  return words.flatMap((word, token) =>
    CONTEXT_WORDS.includes(word) && Math.abs(token - center) <= 4
      ? [
          {
            sentenceIndex,
            token,
            word,
            column: CONTEXT_WORDS.indexOf(word),
            center,
          },
        ]
      : [],
  );
});
export const EMBEDDING_COUNTS = [
  [8, 6, 0, 0],
  [7, 6, 0, 0],
  [0, 0, 8, 5],
  [0, 0, 7, 6],
];
export const NEGATIVE_OUTPUTS = [
  [1.2, 0.1],
  [-0.9, -0.2],
  [-1.1, 0],
];
