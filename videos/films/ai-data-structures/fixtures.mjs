export const MESSAGES = Object.freeze([
  {
    id: 0,
    text: 'My card was charged twice. I checked the statement twice.',
    short: 'Card charged twice',
    topic: 'Billing',
  },
  {
    id: 1,
    text: 'I cannot sign in.',
    short: 'Cannot sign in',
    topic: 'Access',
  },
  {
    id: 2,
    text: 'I was charged twice after changing plans.',
    short: 'Charge after plan change',
    topic: 'Billing',
  },
  {
    id: 3,
    text: 'The account was charged once.',
    short: 'Account charged once',
    topic: 'Billing',
  },
]);
export const QUERY = 'charged twice';
export const FRESH_QUERY = 'sign charged';
export const PERMITTED_NOTE_IDS = Object.freeze([2, 3]);
export const NEXT_CALLER_IDS = Object.freeze([1, ...PERMITTED_NOTE_IDS]);
export const UPDATED_MESSAGES = Object.freeze(
  MESSAGES.map((r) =>
    r.id === 2
      ? {
          ...r,
          text: 'I can sign in after changing plans.',
          short: 'Sign-in after plan change',
          topic: 'Access',
        }
      : r,
  ),
);
export const LINKS = Object.freeze({
  0: [2, 3],
  1: [],
  2: [3],
  3: [0],
});
