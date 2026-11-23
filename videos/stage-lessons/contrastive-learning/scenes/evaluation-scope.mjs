import {
  assertEqual,
  barChart,
  indicate,
  place,
  column,
  namedBox,
  rect,
  arrow,
  boxOf,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function evaluationScope(s, c) {
  const [top, body, foot] = area.rows([1, 5, 1], 'normal');
  const categories = [
    ['retrieval', 15],
    ['classify', 12],
    ['cluster', 11],
    ['STS', 10],
    ['rerank', 4],
    ['pair', 3],
    ['bitext', 2],
    ['summary', 1],
  ];
  const total = categories.reduce((sum, [, n]) => sum + n, 0);
  assertEqual(total, 58, 'original MTEB datasets');
  const title = place(label('human relatedness ≠ operational relevance', { color: 'cyan' }), top);
  const [chartHead, chartBody] = body.rows([1, 7], 'normal');
  const snapshot = place(note('Original MTEB: datasets by category'), chartHead);
  const chart = place(
    barChart(
      categories.map(([name, n]) => ({
        label: name,
        value: n,
        color: name === 'retrieval' ? 'green' : 'blue',
      })),
      {
        width: chartBody.width - 40,
        height: chartBody.height - 100,
        max: 15,
        labelSize: 34,
        showValues: true,
      },
    ),
    chartBody,
  );
  const old = place(
    mono(`original MTEB: 33 models · ${total} datasets · ${categories.length} categories`),
    foot,
  );
  const expanded = place(
    label('MMTEB 2025: >500 tasks · >250 languages', { color: 'yellow' }),
    foot,
  );
  const cut = place(label('truncated evidence never reaches the encoder', { color: 'red' }), foot);
  const [passage, encoderRegion] = body.rows([3, 2], 'loose');
  const [kept, lost] = passage.columns([2, 1], 'loose');
  const inputBoundary = place(
    rect(kept.width, kept.height, { fill: null, stroke: 'yellow', width: 3 }),
    kept,
  );
  const retained = place(
    column(
      [
        note('Within the illustrated input cutoff'),
        label('Rotate API key', { color: 'cyan' }),
        label('Restart workers', { color: 'cyan' }),
      ],
      { gap: 'normal', align: 'center' },
    ),
    kept,
  );
  const omitted = place(
    column(
      [
        note('Beyond cutoff'),
        label('Revoke old key', { color: 'red' }),
        note('required evidence is lost', { color: 'red' }),
      ],
      { gap: 'normal', align: 'center' },
    ),
    lost,
  );
  const encoder = place(
    namedBox('encode retained text → pool states', { width: 950, height: 100, color: 'cyan' }),
    encoderRegion,
  );
  const flow = arrow(boxOf(inputBoundary).point('bottom'), boxOf(encoder).point('top'), {
    stroke: 'cyan',
    width: 4,
    pad: 6,
  });
  s.add(heading(c.title), title, snapshot, chart);
  c.on('cl-evaluation-scope-sts', () => s.play(indicate(chart.bar(3), { scale: 1 })));
  c.show('cl-evaluation-scope-mteb', old, { after: true });
  c.on('cl-evaluation-scope-categories', () => s.play(indicate(chart.bar(0), { scale: 1 })));
  c.swap('cl-evaluation-scope-languages', old, expanded, { after: true });
  c.swap(
    'cl-evaluation-scope-truncate',
    [chart, snapshot, expanded],
    [inputBoundary, retained, omitted, encoder, flow, cut],
  );
}
