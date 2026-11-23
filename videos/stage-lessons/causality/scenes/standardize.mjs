import { captions, cells, diff, pct, rate } from '../parts.mjs';
import { riskBoard } from '../risk-board.mjs';
import { standardizedFixture } from '../../../films/causality/model.mjs';

export default function standardize(s, c) {
  const board = riskBoard(s, c.title);
  const model = standardizedFixture();
  const easy = 70, hard = 100 - easy;
  const inputs = board.equations(cells.map(([lo, hi]) =>
    easy + ' × ' + pct(rate(lo)) + ' + ' + hard + ' × ' + pct(rate(hi))));
  const sums = board.equations(cells.map(([lo, hi]) =>
    Math.round(easy * rate(lo)) + ' easy + ' + Math.round(hard * rate(hi)) + ' hard'));
  const guides = board.guides(easy / 100);
  c.show('target', guides);
  c.show('target', inputs);
  c.hide('align', guides);
  c.on('align', () => board.move([easy / 100, easy / 100]));
  c.swap('contributions', inputs, sums, { after: true, lead: 0 });
  c.show('estimate', board.readings([model.assistant, model.control].map((v) =>
    Math.round(100 * v) + ' expected per 100')), { after: true, lead: 0 });
  captions(s, c, 'Start with the tickets each workflow actually received.', [
    ['target', 'Deployment target per 100 tickets: 70 easy and 30 hard.'],
    ['predict', 'How many more resolutions per 100 does this comparison predict?'],
    ['estimate', 'Deployment estimate: assistant minus control ' + diff(model.difference) + '.', true],
    ['small', 'Only ten observed easy assistant tickets supply the rate for seventy target tickets.'],
  ]);
}
