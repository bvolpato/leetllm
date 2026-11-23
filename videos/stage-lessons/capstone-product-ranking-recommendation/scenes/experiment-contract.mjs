import { place, row } from 'vizmatic/stage';
import { chip, label, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function experiment(s, c) {
  const [header, ...lanes] = open(s, c).rows([1, 2, 2, 1, 1], 'normal');
  const [left, middle, right] = header.columns([2, 3, 2], 'wide');
  s.add(place(note('Assignment unit'), left), place(note('Repeated searches'), middle), place(note('Experiment arm'), right));
  const units = [], searches = [], arms = [];
  for (const [i, arm] of ['Control', 'Treatment'].entries()) {
    const color = i === 0 ? 'blue' : 'cyan';
    const [a, b, d] = lanes[i].columns([2, 3, 2], 'wide');
    units.push(place(chip('Shopper ' + (i + 1), { color }), a));
    searches.push(place(row(['1','2','3'].map(n => chip(n, {color})), {gap:'normal'}), b));
    arms.push(place(chip(arm, {color}), d));
  }
  s.add(units);
  c.show('assignment-hash', arms);
  c.show('assignment-stable', searches);
  const unit = place(label('Six searches come from two assigned shoppers.'), lanes[2]);
  const counts = place(note('Compare observed arm counts with the planned 50/50 split.'), lanes[3]);
  c.show('assignment-unit', unit);
  c.show('assignment-srm', counts);
  c.swap('experiment-stop', [unit, counts], place(label('A prohibited display stops the experiment.', {color:'red'}), lanes[2]));
  c.show('experiment-recovery', place(note('Rollback needs compatible features, traffic control, and a fresh eligibility check.'), lanes[3]));
}
