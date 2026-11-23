export const fixture = [
  { id: 101, expected: 'approved', prediction: 'approved' },
  { id: 102, expected: 'blocked', prediction: ' ESCALATED ' },
  { id: 103, expected: 'restored', prediction: 'restored' },
];
export const normalize = (label) => label.trim().toLowerCase();
export const score = (rows) => [
  rows.filter((row) => normalize(row.prediction) === normalize(row.expected)).length,
  rows.length,
];
export const shortened = fixture.filter((row) => row.id !== 102);
export const corrected = fixture.map((row) =>
  row.id === 102 ? { ...row, prediction: row.expected } : row,
);
export const lines = [
  ['slip', 'Watch request one oh two.', 0.42],
  ['perfect', 'The score just went from two out of three to two out of two.', 0.32],
  ['question', 'Which prediction got better?', 1.8],
  ['none', 'Look at the two that stayed. Both were right the first time.', 0.6],
  ['return', 'Here’s the request that slipped out.', 0.3],
  ['expected', 'The expected answer was blocked.', 0.25],
  ['saved', 'The model saved escalated, in capitals, with a space at either end.', 0.55],
  ['trim', 'Python strips the spaces and folds the letters to lowercase.', 0.35],
  ['look', 'Look at those two words.', 1.25],
  ['miss', 'Escalated. Blocked. That’s a miss.', 0.65],
  ['replay', 'Put that same slip back and score the three original requests again.', 0.35],
  ['honest', 'Two right. One wrong. Two out of three.', 0.85],
  ['second', 'Now let the model answer the middle request again.', 0.35],
  ['changed', 'This time it says blocked.', 0.45],
  ['three', 'Three slips came in. Three matches came out.', 0.65],
  ['test', 'Suppose both runs report a hundred percent. Which one fixed the prediction?', 1.7],
  ['show', 'Open the two receipts.', 0.45],
  ['lost', 'One has two matches and a hole where request one oh two belongs.', 0.5],
  ['fixed', 'The other has its answer for all three requests.', 0.55],
  ['close', 'Before you compare scores, line up the request IDs.', 1.35],
];
