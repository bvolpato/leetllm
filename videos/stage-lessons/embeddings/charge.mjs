import { assertEqual } from 'vizmatic/stage';
import { cosine, mix } from './parts.mjs';

export const charge = [0.8, 0.2];
export const tickets = [
  { excerpt: 'charge on the invoice', guide: 'Invoice guide', clue: [0.2, 1], color: 'cyan' },
  { excerpt: 'charge the phone', guide: 'Phone guide', clue: [1, 0.1], color: 'green' },
];

export const occurrence = (ticket, share) => mix(charge, ticket.clue, share);
export const guideScores = (state) => tickets.map(({ clue }) => cosine(state, clue));
export const firstGuide = (scores) => tickets[scores.indexOf(Math.max(...scores))].guide;

const rounds = (values) => values.map((value) => Number(value.toFixed(3)));
assertEqual(rounds(guideScores(charge)), [0.428, 0.989], 'two static ticket scores');
assertEqual(
  rounds(guideScores(occurrence(tickets[0], 0.5))),
  [0.879, 0.713],
  'invoice ticket scores',
);
assertEqual(
  rounds(guideScores(occurrence(tickets[1], 0.5))),
  [0.355, 0.998],
  'phone ticket scores',
);
