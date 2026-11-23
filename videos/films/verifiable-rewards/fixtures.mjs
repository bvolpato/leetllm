export const ANSWERS = Object.freeze([168, 148, 168, 170]);
export const REWARDS = Object.freeze(ANSWERS.map((value) => Number(value === 168)));
export const EVALUATION_FIXTURE = Object.freeze({
  training: Object.freeze({
    factors: Object.freeze([14, 12]),
  }),
  heldOut: Object.freeze([
    Object.freeze({
      factors: Object.freeze([13, 12]),
    }),
    Object.freeze({
      factors: Object.freeze([14, 11]),
    }),
  ]),
  initialAnswer: 167,
  workedAnswer: 168,
  unsupportedGuess: 168,
});
