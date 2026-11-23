import { dot, place, to } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function guardrails(s, c) {
  const [top, head, field, rate, rule, decision] = open(s, c).rows([0.7, 0.65, 4.1, 0.9, 0.65, 0.75], 'normal');
  const searches = 100;
  const arms = [
    { name: 'Control', purchases: 4, returns: 0, color: 'blue' },
    { name: 'Treatment', purchases: 6, returns: 1, color: 'cyan' },
  ];
  const others = [], purchases = [], targets = [], conversion = [], returnRates = [];
  s.add(place(note('Synthetic worksheet · 100 searches per arm'), top, 'left'));
  arms.forEach((arm, i) => {
    const region = field.columns(2, 'loose')[i];
    const results = rate.columns(2, 'loose')[i];
    s.add(place(label(arm.name, { color: arm.color }), head.columns(2, 'loose')[i]));
    const xs = region.columns(10, 0), ys = region.rows(10, 0);
    const order = region.columns(8, 0);
    const marks = [];
    for (let j = 0; j < searches; j++) {
      const at = [xs[j % 10].cx, ys[Math.floor(j / 10)].cy];
      if (j < arm.purchases) {
        marks.push(dot(13, arm.color).moveTo(at));
        targets.push([order[j + 1].cx, region.cy]);
      } else others.push(dot(6, 'dim').moveTo(at));
    }
    purchases.push(marks);
    conversion.push(place(mono(arm.purchases + ' / 100 searches = ' + arm.purchases + '%', { size: 37 }), results));
    returnRates.push(place(mono(arm.returns + ' / ' + arm.purchases + ' purchases = ' +
      (100 * arm.returns / arm.purchases).toFixed(1) + '%', { size: 37 }), results));
  });
  s.add(others, purchases);
  c.show('return-convert', conversion, { after: true });
  const ruleText = place(label('Stop if treatment exceeds control by more than 1 percentage point.', { size: 38 }), rule);
  c.show('return-rule', ruleText);
  c.hide('return-denominator', [others, ...conversion], { fade: 0.35 });
  c.on('return-denominator', () => s.play(...purchases.flat().map((mark, i) =>
    to(mark, n => n.moveTo(targets[i]).scale(1.5), { duration: 0.8 }))));
  const ring = dot(29, 'red').moveTo(targets[arms[0].purchases]);
  const returned = dot(10, 'cyan').moveTo(targets[arms[0].purchases]);
  c.show('return-one', [ring, returned]);
  const prompt = place(label('Does the return rule stop treatment?', { color: 'yellow' }), decision);
  c.show('return-question', prompt);
  c.show('return-rate', returnRates, { after: true });
  const stop = place(label('Stop treatment    ·    16.7% > 0% + 1 pp', { color: 'red' }), decision);
  c.swap('return-stop', prompt, stop, { after: true });
  const empty = place(note('0 purchases'), field.columns(2, 'loose')[0]);
  c.swap('return-empty', [purchases[0], returnRates[0], stop], empty);
  c.show('return-undefined', place(mono('0 / 0 = undefined', { color: 'yellow' }), rate.columns(2, 'loose')[0]));
  const hold = place(label('Hold the return comparison', { color: 'yellow' }), decision);
  c.show('return-hold', hold, { after: true });
}
