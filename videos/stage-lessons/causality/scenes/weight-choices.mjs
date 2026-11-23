import { captions, diff, nfmt, pct } from '../parts.mjs';
import { riskBoard } from '../risk-board.mjs';
import { weightedTicketFixture } from '../../../films/causality/model.mjs';

export default function weightChoices(s, c) {
  const raw = weightedTicketFixture();
  const half = weightedTicketFixture({ stabilize: 0.5 });
  const capped = weightedTicketFixture({ clip: 5 });
  const board = riskBoard(s, c.title, { mix: [0.5, 0.5] });
  const split = (arms) => board.equations(arms.map(({ groups: [easy, hard] }) =>
    nfmt(easy.mass) + ' easy + ' + nfmt(hard.mass) + ' hard'));
  const ratios = (arms, digits = 0) => board.readings(arms.map(({ successMass, mass, rate }) =>
    nfmt(successMass) + ' / ' + nfmt(mass) + (digits ? ' ≈ ' : ' = ') + pct(rate, digits)));
  const apply = (arms) => board.move(
    arms.map((a) => a.groups[0].mass / a.mass),
    arms.map((a, i) => a.mass / raw[i].mass),
  );
  const change = (cue, result, arms, old, digits) => {
    c.hide(cue, old, { fade: 0.15, lead: 0 });
    c.on(cue, () => apply(arms));
    const next = [...split(arms), ...ratios(arms, digits)];
    c.show(result, next, { after: true, lead: 0 });
    return next;
  };
  const originalMass = split(raw);
  const originalRates = ratios(raw);
  const weightLabel = (w) => Math.abs(w - 10 / 9) < 1e-9 ? '10/9' : nfmt(w);
  const factors = (arms) => board.equations(arms.map((arm) =>
    arm.groups.map((g) => g.count + ' × ' + weightLabel(g.weight)).join(' + ')));
  const originalFactors = factors(raw);
  s.add(originalMass, originalRates);
  c.swap('concentration', originalMass, originalFactors);
  const stabilized = change('halve', 'same', half, [...originalFactors, ...originalRates]);
  const reset = change('reset', 'original', raw, stabilized);
  const capInputs = factors(capped);
  c.swap('cap', reset, capInputs);
  c.hide('apply-cap', capInputs);
  c.after('cap-answer', () => apply(capped));
  c.show('mass', split(capped), { after: true, lead: 0 });
  const green = board.readings(capped.map((arm) => nfmt(arm.successMass) + ' / ' + nfmt(arm.mass)));
  ['assistant-green', 'control-green'].forEach((cue, i) =>
    c.show(cue, green[i], { after: true, lead: 0 }));
  c.swap('rates', green, ratios(capped, 1), { after: true, lead: 0 });
  captions(s, c, 'Each arm has 100 actual tickets. Tile area measures weight. Green area is resolved weight.', [
    ['concentration', 'Each term is a count of actual tickets multiplied by the weight of one ticket.'],
    ['ess', 'Effective size from weights: 200² / [10 × 10² + 90 × (10/9)²] = ' + nfmt(raw[0].ess) + ' per arm.', true],
    ['halve', 'Stabilize: multiply every ticket weight by the arm probability, ½.'],
    ['same', 'Same green fraction. Same effective sample size: ' + nfmt(half[0].ess) + ' per arm.', true],
    ['reset', 'Return to the original weights. A full tray holds 200 weight units.'],
    ['cap', 'After the cap of 5, which workflow has more weight on hard tickets?'],
    ['mass', 'Each arm has 150 weight units. Compare how much of each tray is green.', true],
    ['contrast', 'Using the unrounded fractions, assistant minus control is about ' + diff(capped[0].rate - capped[1].rate, 1) + '.', true],
  ]);
}
