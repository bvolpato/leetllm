import { group, rect } from 'vizmatic/stage';
import { area, begin, featureProducts, FIT_ROWS, forecastWeights, fridayFeatures, number, WEEK, words } from '../parts.mjs';

export default function fit(s, c) {
  const title = begin(s, c);
  const [training, features, product, sum, convention] = area.rows([1, 2, 2, 2, 1], 'normal');
  const cols = features.columns([1,1,1,1,1,1,1,2,2], 'tight');
  const names = [...WEEK, 'Weeks', 'Campaign'];
  s.add(words(training, FIT_ROWS.length + ' mature days   ×   9 feature columns', 'dim', 36));
  const headers = cols.map((r, i) => words(r.rows(2, 'tight')[0], names[i], 'dim', 32));
  c.show('design', headers);
  const objective = words(product, 'Choose weights that minimize the sum of squared errors', 'ink', 40);
  c.show('least-squares', [objective, words(features.rows(2, 'tight')[1], 'One active weekday in every row', 'dim', 32)]);
  const rank = words(sum, 'Rank 9 of 9   ·   an extra intercept would repeat the sum of the weekdays', 'green', 36);
  c.show('rank', rank);
  const row = cols.map((r, i) => number(r.rows(2, 'tight')[1], i === 7 ? '67/7' : fridayFeatures[i], fridayFeatures[i] ? 'cyan' : 'dim', 40));
  const sumRule = words(convention, 'Friday weight  +  (67/7 weeks × weekly trend)  +  campaign weight', 'ink', 42);
  const t = featureProducts();
  const panes = product.columns(3, 'wide');
  const factors = ['Friday', 'Elapsed weeks', 'Campaign'].map((name, i) =>
    words(panes[i].rows(3, 'tight')[0], name, 'dim', 33));
  c.swapAll('friday', [...row, ...factors, sumRule, words(training, 'Fri Feb 6   ·   feature row at the Feb 1 issue', 'cyan', 39)], { keep: [title, ...headers] });
  const pieces = [4, 7, 8].map((j, i) => {
    const [, bottom, value] = panes[i].rows(3, 'tight');
    return group(number(bottom, (j === 7 ? '67/7' : '1') + ' × ' + forecastWeights[j].toFixed(j === 7 ? 6 : 3), 'ink', 39),
      number(value, '≈ ' + t.terms[j].toFixed(3) + ' parcels', ['cyan','blue','green'][i], 35));
  });
  const y = sum.cy, left = sum.left + 70, scale = (sum.width - 140) / 177;
  let running = 0;
  for (const [i, j] of [4, 7, 8].entries()) {
    const value = t.terms[j], w = value * scale;
    const block = rect(w, 42, { fill: ['cyan','blue','green'][i], stroke: null }).moveTo([left + running * scale + w / 2, y]);
    running += value;
    c.show(['offset','trend','campaign'][i], [pieces[i], block]);
  }
  const total = number(convention, 'Full-precision sum   →   ' + t.forecast.toFixed(3) + ' parcels', 'cyan', 43);
  c.swap('point', sumRule, total, { after: true });
  c.swap('historical', total, words(convention, 'Training plan cutoff = earlier of fit time and start of target day', 'dim', 33));
}
