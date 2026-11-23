import { indicate, numberLine, place } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { stablePolicy } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS, LOGITS, WORDS } from '../parts.mjs';
import { massStrip, rankPin } from '../ruler.mjs';

export default function logitShift(s, c) {
  const model = stablePolicy();
  const [table, strip] = area.inset('normal').rows([4.4, 1.55], 'wide');
  const rows = table.rows(5, 'tight').map((r) => r.columns([1.45, 1, 1, 1, 1], 'normal'));
  const words = WORDS.map((word, i) =>
    place(label(word, { color: COLORS[i], size: 46 }), rows[0][i + 1]),
  );
  const stages = [
    ['Raw score', LOGITS, 1],
    ['Subtract 3', model.shifted, 1],
    ['Exponentiate', model.weights, 3],
    [`÷ total (≈ ${model.total.toFixed(2)})`, model.probabilities, 3],
  ].map(([name, values, digits], step) => ({
    name: place(label(name, { size: 38 }), rows[step + 1][0], 'left'),
    values: values.map((v, i) =>
      place(mono(v.toFixed(digits), { size: 44, color: COLORS[i] }), rows[step + 1][i + 1]),
    ),
  }));
  const [raw, shifted, weights, normalized] = stages;
  const ruler = place(
    numberLine({
      length: table.width * 0.89,
      range: [-1.3, 3.3],
      ticks: [-1, 0, 1, 2, 3],
      size: 38,
      labelSize: 36,
      points: LOGITS.map((value, i) => ({ name: WORDS[i], value, color: COLORS[i] })),
    }),
    area.rows([1.2, 1], 'normal')[1],
  );
  const bar = strip.inset('wide');
  const parts = massStrip(bar, model.probabilities, COLORS);
  const pin = rankPin(bar, 0.75, 'draw 0.75');
  s.add(heading(c.title), words, raw.name, raw.values, ruler);
  c.on('logit-shift-build-0', () => s.play(indicate(raw.name, { scale: 1, color: 'yellow' })));
  c.after('logit-shift-build-1', () =>
    s.play(indicate(raw.values[0], { scale: 1, color: 'yellow' })),
  );
  c.show('logit-shift-subtract', shifted.name);
  c.show('shift-result', shifted.values);
  c.swap('logit-shift-exponentiate', ruler, [weights.name, weights.values]);
  c.show('logit-shift-normalize', normalized.name);
  c.show('normalize-result', [normalized.values, parts]);
  c.show('logit-shift-build-2', pin);
}
