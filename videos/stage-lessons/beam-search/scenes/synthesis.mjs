import { assertEqual, dynamic, group, place, row } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { conditionalEdgeExperiment } from '../../../films/beam-search/construction.mjs';
import { massStrip } from '../ruler.mjs';

export default function synthesis(s, c) {
  const start = conditionalEdgeExperiment(0);
  const end = conditionalEdgeExperiment(1);
  const [head, work, frontier, finish] = area.inset('normal').rows([0.7, 3.5, 1.2, 2.4], 'normal');
  const cols = work.columns(2, 'loose');
  const progress = s.value(0);
  const families = ['opened', 'looked'].map((parent, i) => {
    const [parentRow, band, children] = cols[i].rows([1, 1, 2.5], 'tight');
    const p = start.run.history[0].active.find((x) => x.text === parent).probability;
    const from = start.run.history[1].expansions.filter((x) => x.parent === parent);
    const to = end.run.history[1].expansions.filter((x) => x.parent === parent);
    const color = ['cyan', 'blue', 'dim'];
    const parts = children.rows(3, 'tight');
    const makeFamily = (t) => {
      const values = from.map(
        (x, k) =>
          x.conditionalProbability + (to[k].conditionalProbability - x.conditionalProbability) * t,
      );
      const leaves = values.map((value, k) => {
        const path = from[k];
        const text = path.completed
          ? `EOS   ${value.toFixed(2)}    → finished`
          : `${path.token}    ${p.toFixed(2)} × ${value.toFixed(2)}`;
        return place(mono(text, { size: 34, color: color[k] }), parts[k], 'left');
      });
      return group(...massStrip(band, values, color, 49), ...leaves);
    };
    return [
      place(label(`Mia ${parent}    ${p.toFixed(2)}`, { size: 43 }), parentRow, 'left'),
      i === 0 ? dynamic(() => makeFamily(progress.value)) : makeFamily(0),
    ];
  });
  const rules = place(
    note('Width 2     •     EOS finishes a path     •     4 generated tokens'),
    head,
  );
  const retained = (model) =>
    place(
      row(
        model.run.history[1].active.map((candidate) =>
          chip(`${candidate.text}    ${candidate.probability.toFixed(4)}`, { color: 'yellow' }),
        ),
        { gap: 'wide' },
      ),
      frontier,
    );
  const old = retained(start);
  const updated = retained(end);
  const which = place(label('Which two unfinished prefixes survive?', { size: 43 }), frontier);
  const parts = finish.rows(2, 'normal');
  const path = place(
    row(
      ['Mia', ...end.raw.tokens].map((word) => chip(word)),
      { gap: 'normal' },
    ),
    parts[0],
  );
  const factors = end.raw.tokens.map((_, i) => {
    const prefix = end.raw.tokens.slice(0, i + 1).join(' ');
    return end.run.history[i].expansions.find((x) => x.tokens.join(' ') === prefix)
      .conditionalProbability;
  });
  const scores = parts[1].columns([1.4, 1], 'wide');
  const raw = place(
    mono(`${factors.map((x) => x.toFixed(2)).join(' × ')} = ${end.raw.probability.toFixed(4)}`, {
      size: 36,
      color: 'cyan',
    }),
    scores[0],
  );
  const mean = place(
    mono(
      `ln(${end.raw.probability.toFixed(4)}) / ${end.raw.tokens.length} = ${end.normalized.meanLogProbability.toFixed(3)}`,
      { size: 36, color: 'blue' },
    ),
    scores[1],
  );
  assertEqual(end.raw.text, end.normalized.text, 'both objectives select the displayed completion');
  assertEqual(factors.reduce((a, b) => a * b, 1).toFixed(4), '0.1701', 'changed four-edge path');
  s.add(heading(c.title), rules, families);
  c.show('base-frontier', old, { after: true });
  c.hide('transfer-mass', old);
  c.after('transfer-mass', () => s.play(progress.to(1, { duration: 1.25 })));
  c.show('new-frontier-question', which);
  c.swap('new-frontier', which, updated, { after: true });
  c.show('finish-path', path);
  c.show('raw-product', raw, { after: true });
  c.show('mean-log', mean, { after: true });
}
