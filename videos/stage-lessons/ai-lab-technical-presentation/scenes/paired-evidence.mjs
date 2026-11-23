import { assertEqual, indicate, line, place, to } from 'vizmatic/stage';
import { namedBox } from '../../kit-narrated.mjs';
import { DNS_QUERY, PAIRED, addTitle, caption, pairedBench, readout, work } from '../parts.mjs';

export default function pairedEvidence(s, c) {
  addTitle(s, c);
  const [field, foot] = work.rows([4, 1], 'normal');
  const p = pairedBench(field);
  const { baseline, candidate, runbook: target } = DNS_QUERY;
  const sample = p.piles.flat().find(({ record }) => record.id === DNS_QUERY.id);
  const cutoff = 5;
  const hit = (ranking) => ranking.slice(0, cutoff).includes(target);
  assertEqual(hit(baseline), sample.record.baseline, 'the old ranking matches the query record');
  assertEqual(hit(candidate), sample.record.candidate, 'the new ranking matches the query record');
  const [key, ranks, upper, lower] = field.rows([0.65, 0.65, 1, 1], 'normal');
  const places = (r) => r.columns([1.65, 1, 1, 1, 1, 1, 1], 'normal');
  const columns = places(ranks);
  const shelf = [upper, lower].map((r) => places(r));
  const boundaryX = (columns[cutoff].right + columns[cutoff + 1].left) / 2;
  const border = line([boundaryX, ranks.bottom], [boundaryX, lower.bottom], {
    stroke: 'dim',
    width: 4,
  });
  const top = caption(key, sample.record.id + '   ·   labeled runbook: ' + target, 'ink', 47);
  const headings = baseline.map((_, i) => caption(columns[i + 1], 'Rank ' + (i + 1), 'dim', 34));
  const doc = (name, slot) =>
    place(
      namedBox(name, {
        width: slot.width * 0.93,
        height: 84,
        color: name === target ? 'yellow' : 'dim',
        size: 37,
      }),
      slot,
    );
  const old = baseline.map((name, i) => doc(name, shelf[0][i + 1]));
  const next = baseline.map((name, i) => doc(name, shelf[1][i + 1]));
  const [oldName, newName] = shelf.map((slots, i) =>
    caption(slots[0], i ? 'Candidate' : 'Baseline', i ? 'cyan' : 'blue', 43),
  );
  const fifth = baseline.indexOf(target) + 1;
  const sixth = candidate.indexOf(target) + 1;
  const prompt = caption(foot, 'Does this query still count as a top-five hit?', 'yellow', 48);
  const lost = caption(
    foot,
    'Baseline: rank ' + fifth + ' (hit)     Candidate: rank ' + sixth + ' (miss)',
    'pink',
    46,
  );
  s.add(top, headings, border, oldName, old);
  c.on('old-rank', () => s.play(indicate(old[fifth - 1], { scale: 1.06 })));
  c.show('compare', [newName, next]);
  c.on('swap', () => {
    const moving = next[fifth - 1];
    const displaced = next[sixth - 1];
    const [x1, y] = shelf[1][fifth].point('center');
    const [x2] = shelf[1][sixth].point('center');
    s.play(
      to(moving, (n) => n.shift(0, -54)),
      to(displaced, (n) => n.shift(0, 54)),
      { duration: 0.24 },
    );
    s.play(
      to(moving, (n) => n.moveTo([x2, y - 54])),
      to(displaced, (n) => n.moveTo([x1, y + 54])),
      { duration: 0.5 },
    );
    s.play(
      to(moving, (n) => n.moveTo([x2, y])),
      to(displaced, (n) => n.moveTo([x1, y])),
      { duration: 0.24 },
    );
  });
  c.show('ask', prompt);
  c.swap('miss', prompt, lost, { after: true });

  const [population, witness, net] = p.input.rows([1, 1, 1.25], 'normal');
  const title = caption(population, PAIRED.n + ' frozen queries', 'ink', 46);
  const receipt = readout(witness, sample.record.id, 'baseline hit  /  candidate miss', 'pink');
  const totals = readout(
    net,
    PAIRED.counts.candidateOnly +
      ' − ' +
      PAIRED.counts.baselineOnly +
      ' = ' +
      (PAIRED.candidateHits - PAIRED.baselineHits),
    'net additional hits',
    'yellow',
  );
  const counts = p.labels.map((_, k) => p.counted(k));
  const tally = caption(foot, 'One mark per query in the same two runs', 'dim', 40);
  const rates = caption(
    foot,
    PAIRED.baselineHits +
      ' / ' +
      PAIRED.n +
      ' = ' +
      100 * PAIRED.baselineRate +
      '%     →     ' +
      PAIRED.candidateHits +
      ' / ' +
      PAIRED.n +
      ' = ' +
      100 * PAIRED.candidateRate +
      '%',
    'ink',
    49,
  );
  const groups = p.piles.map((pile) => pile.map(({ mark }) => mark));
  c.swap(
    'population',
    [top, headings, border, oldName, newName, old, next, lost],
    [p.frames, p.labels, title, receipt, sample.mark, tally],
  );
  for (const [cue, k] of [
    ['regress', 1],
    ['improved', 2],
    ['both', 0],
    ['neither', 3],
  ]) {
    c.swap(cue, p.labels[k], [counts[k], groups[k].filter((mark) => mark !== sample.mark)], {
      after: true,
    });
  }
  c.show('net', totals, { after: true });
  c.swap('rates', tally, rates, { after: true });
}
