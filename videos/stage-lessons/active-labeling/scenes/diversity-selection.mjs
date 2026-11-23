import { assertEqual, column, fade, indicate, line, place, rect, row } from 'vizmatic/stage';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { selectionItems } from '../../../films/active-labeling/fixtures.mjs';
import { hybridSteps } from '../../../films/active-labeling/model.mjs';
import { euclidean } from '../../../films/active-labeling/arithmetic.mjs';
import { embeddingPool, footer, picture, sourceBand } from '../parts.mjs';

export default function diversitySelection(s, c) {
  const budget = 4;
  const weight = 0.6;
  const steps = hybridSteps(budget, weight);
  const baseline = hybridSteps(budget, 1).at(-1).selected;
  const hybrid = steps.at(-1).selected;
  const [mapArea, board] = picture.columns([1, 1.2], 'loose');
  const pool = embeddingPool(mapArea);
  const ordered = selectionItems.filter((p) => p !== hybrid[0]);
  const domainCount = (items) => new Set(items.map((p) => p.domain)).size;
  const [head, body] = board.rows([1, 6], 'normal');
  const bodyRows = body.rows(selectionItems.length, 'tight');
  const intro = selectionItems.map((p, i) => {
    const [name, score] = bodyRows[i].inset('normal', 0).columns([1, 1], 'normal');
    return [
      place(label(p.id, { size: 38 }), name, 'left'),
      place(mono(p.uncertainty.toFixed(2), { size: 37, color: 'blue' }), score, 'right'),
    ];
  });
  const title = (words) => place(label(words, { size: 39 }), head, 'left');
  const introTitle = title('Uncertainty for each record');
  const context = place(
    note('Six eligible records  ·  supplied coordinates and uncertainties'),
    sourceBand,
    'left',
  );
  const batchRow = (name, items, color, region) => {
    const [tag, records] = region.columns([1.15, 4], 'normal');
    return [
      place(note(name, { color }), tag, 'left'),
      ...items.map((item, i) =>
        place(chip(item.id, { color }), records.columns(budget, 'normal')[i]),
      ),
    ];
  };
  const baselineRow = batchRow('Uncertainty only', baseline, 'blue', footer);
  const hybridRow = batchRow('With distance', hybrid, 'cyan', footer);
  const seedSlot = hybridRow.slice(0, 2);
  const slotCount = (n) =>
    place(
      note('Hybrid queue  ·  ' + n + ' of 4 places filled', { color: 'cyan' }),
      sourceBand,
      'right',
    );
  const counts = [1, 2, 3, 4].map(slotCount);
  const halo = (p) => {
    const [x, y] = pool.pos(p.xy);
    return rect(36, 36, { radius: 18, stroke: 'yellow', width: 4 }).moveTo([x, y]);
  };
  const selectedMarks = hybrid.map(halo);
  const baseMarks = baseline.map(halo);
  const linksFrom = (selected) =>
    selectionItems
      .filter((p) => !selected.includes(p))
      .map((p) => {
        const nearest = selected.reduce((a, b) =>
          euclidean(p.xy, a.xy) <= euclidean(p.xy, b.xy) ? a : b,
        );
        return line(pool.pos(nearest.xy), pool.pos(p.xy), { stroke: 'cyan', width: 3 }).zIndex(
          -0.5,
        );
      });
  const links = steps.map((step) => linksFrom(step.selected));
  const bars = ordered.map((item, i) => {
    const [name, bar, value] = body
      .rows(ordered.length, 'normal')
      [i].columns([1.4, 3.3, 1.15], 'normal');
    const labelName = place(note(item.id, { size: 34 }), name, 'left');
    const [operands, track] = bar.rows([1.2, 1], 'tight');
    const center = track.point('center')[1];
    const segment = (from, to, color) =>
      line([bar.left + from * bar.width, center], [bar.left + to * bar.width, center], {
        stroke: color,
        width: 22,
      });
    const rail = segment(0, 1, 'grid').zIndex(-1);
    const u = item.uncertainty * weight;
    return {
      item,
      labelName,
      rail,
      uncertainty: segment(0, u, 'blue'),
      value,
      operands,
      distance: (n) => segment(u, n, 'cyan'),
    };
  });
  const ledger = steps.slice(1).map((step) =>
    bars.map((bar) => {
      const match = step.ranked.find((candidate) => candidate.item === bar.item);
      if (!match) return null;
      const max = Math.max(...step.ranked.map((cand) => cand.distance));
      assertEqual(
        Math.abs(
          match.score - (bar.item.uncertainty * weight + ((1 - weight) * match.distance) / max),
        ) < 1e-12,
        true,
        'stacked length equals acquisition score',
      );
      return {
        distance: bar.distance(match.score),
        parts: place(
          mono(
            (weight * bar.item.uncertainty).toFixed(3) +
              ' + ' +
              (((1 - weight) * match.distance) / max).toFixed(3),
            { size: 29 },
          ),
          bar.operands,
          'left',
        ),
        total: place(mono(match.score.toFixed(3), { size: 32, color: 'ink' }), bar.value, 'right'),
      };
    }),
  );
  const allLive = (round, field) => ledger[round].filter(Boolean).map((entry) => entry[field]);
  const idIndex = (p) => ordered.indexOf(p);
  const barAt = (p) => bars[idIndex(p)];
  const active = (n) => [barAt(hybrid[n]).rail, barAt(hybrid[n]).uncertainty];
  const pick = (n) =>
    place(chip('Selected', { color: 'yellow', size: 27 }), barAt(hybrid[n]).value);
  const stamps = [1, 2].map(pick);
  const legend = place(
    row(
      [
        note('0.6 × uncertainty', { color: 'blue' }),
        note('+'),
        note('0.4 × distance / max', { color: 'cyan' }),
      ],
      { gap: 'tight' },
    ),
    head,
    'left',
  );
  const currentMax = (round) => Math.max(...steps[round].ranked.map((v) => v.distance));
  const scaleNote = (round) =>
    place(
      note('Distance scale for this comparison   ' + currentMax(round).toFixed(3) + ' units', {
        color: 'cyan',
      }),
      sourceBand,
      'left',
    );
  const scales = [1, 2, 3].map(scaleNote);
  const verdict = place(label('Named domains in each batch'), head, 'left');
  const summaryArea = body.rows(2, 'wide');
  const summary = (name, items, i, color) =>
    place(
      column(
        [note(name), label(items.map((item) => item.id).join('   ·   '), { size: 35, color })],
        { gap: 'normal' },
      ),
      summaryArea[i],
      'left',
    );
  const summaryRows = [
    summary('Uncertainty only', baseline, 0, 'blue'),
    summary('With distance', hybrid, 1, 'cyan'),
  ];
  const domains = place(
    label(
      domainCount(baseline) +
        ' domains  →  ' +
        domainCount(hybrid) +
        ' domains     ·     4 reviews each',
      { color: 'yellow' },
    ),
    footer,
  );

  const chapter = heading(c.title);
  s.add(chapter, context, pool.nodes, introTitle, intro);
  c.on('uncertainties', () => s.play(indicate(introTitle, { scale: 1 })));
  c.on('cluster', () => s.play(indicate(pool.marks.slice(0, 3), { color: 'yellow', scale: 1.3 })));
  c.show('top-four', [baselineRow, baseMarks], { after: true });
  c.hide('new-queue', [baselineRow, baseMarks]);
  c.show('seed', [selectedMarks[0], seedSlot, counts[0]]);
  c.show('measure', links[0]);
  c.swap('scale-length', context, scales[0]);
  c.swap('uncertainty-term', [introTitle, intro], [
    legend,
    bars.map((b) => [b.labelName, b.rail, b.uncertainty]),
  ]);
  c.show('distance-term', [allLive(0, 'distance'), allLive(0, 'parts')]);
  const finalists = steps[1].ranked.slice(0, 2).map(({ item }) => item);
  const otherRows = bars.filter((bar) => !finalists.includes(bar.item));
  const backgroundBars = otherRows.flatMap((bar) => [bar.labelName, bar.rail, bar.uncertainty]);
  const backgroundScores = otherRows.flatMap((bar) => {
    const score = ledger[0][idIndex(bar.item)];
    return [score.parts, score.distance];
  });
  c.on('compare-finalists', () =>
    s.play(fade([...backgroundBars, ...backgroundScores], 0.32, { duration: 0.35 })),
  );
  // Keep the rule in view during the prediction. The question occupies the free end of the queue.
  const prompt = place(
    note('Who gets slot 2?', { color: 'yellow' }),
    footer.columns([1.15, 4], 'normal')[1].columns(budget, 'normal')[1],
  );
  c.show('ask-slot', prompt);
  c.on('ask-slot', () =>
    s.play(
      indicate([barAt(hybrid[1]).labelName, barAt(steps[1].ranked[1].item).labelName], {
        color: 'yellow',
        scale: 1,
      }),
    ),
  );
  const contender = steps[1].ranked[1].item;
  c.hide('winning-bar', prompt);
  c.after('winning-bar', () =>
    s.play(indicate(barAt(hybrid[1]).labelName, { color: 'yellow', scale: 1 })),
  );
  c.show('winning-total', ledger[0][idIndex(hybrid[1])].total, { after: true });
  c.show('runner-total', ledger[0][idIndex(contender)].total, { after: true });
  c.swap('take-handoff', counts[0], [hybridRow[2], counts[1], selectedMarks[1]], { after: true });
  c.on('rescore', () => s.play(fade(backgroundBars, 1, { duration: 0.25 })));
  c.swap(
    'rescore',
    [
      links[0],
      scales[0],
      allLive(0, 'distance'),
      allLive(0, 'parts'),
      active(1),
      ledger[0][idIndex(hybrid[1])].total,
      ledger[0][idIndex(contender)].total,
    ],
    [
      links[1],
      scales[1],
      allLive(1, 'distance'),
      allLive(1, 'parts'),
      allLive(1, 'total'),
      stamps[0],
    ],
  );
  c.swap('take-injection', counts[1], [counts[2], hybridRow[3], selectedMarks[2]], { after: true });
  c.swap(
    'rescore-last',
    [
      links[1],
      scales[1],
      allLive(1, 'distance'),
      allLive(1, 'parts'),
      allLive(1, 'total'),
      active(2),
    ],
    [
      links[2],
      scales[2],
      allLive(2, 'distance'),
      allLive(2, 'parts'),
      allLive(2, 'total'),
      stamps[1],
    ],
  );
  c.swap('take-keyboard', counts[2], [counts[3], hybridRow[4], selectedMarks[3]], { after: true });
  c.swapAll('compare-batches', [verdict, summaryRows], {
    keep: [chapter, pool.nodes, selectedMarks, counts[3]],
  });
  c.hide('domain-count', counts[3]);
  c.show('domain-count', domains, { after: true });
}
