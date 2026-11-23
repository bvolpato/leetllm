import { barChart, beside, column, graph, indicate, place, row, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { enumByteTrace } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS, WORDS } from '../parts.mjs';

export default function grammarBytes(s, c) {
  const [header, machineRegion, chartRegion, footer] = area.rows([1, 2.2, 2.5, 1], 'wide');
  const prefix = place(mono('JSON prefix: {"first_step":"', { size: 34 }), header, 'left');
  const bytes = place(
    tokens(['c', 'r', 'e', 'a', 't', 'e', '"', '}'], { size: 34, minWidth: 54 }),
    header,
    'right',
  );
  const makeMachine = () =>
    place(
      graph(
        [
          { id: 'value', label: 'enum string', width: 330, height: 100 },
          { id: 'quote', label: 'quote closed', width: 330, height: 100 },
          { id: 'accept', label: 'object complete', width: 360, height: 100 },
        ],
        [
          { from: 'value', to: 'quote' },
          { from: 'quote', to: 'accept' },
        ],
        {
          direction: 'LR',
          width: machineRegion.width * 0.92,
          fit: true,
          labelSize: 34,
          edgeLabelSize: 34,
          token: 'value',
        },
      ),
      machineRegion,
    );
  const machine = makeMachine(),
    partialMachine = makeMachine();
  const byteCaption = beside(note('One candidate token · bytes'), bytes, 'above', 'tight');
  const logits = [3, 4, 2, 6];
  const chart = place(
    barChart(
      WORDS.map((label, i) => ({ label, value: logits[i], color: COLORS[i] })),
      {
        width: chartRegion.width * 0.9,
        height: chartRegion.height * 0.55,
        max: 7,
        labelSize: 40,
        showValues: true,
        format: (v) => v.toFixed(0),
        states: true,
      },
    ),
    chartRegion,
  );
  const guide = place(note('Guide: create → deploy → revoke'), footer, 'left');
  const eosNo = place(label('EOS forbidden', { color: 'dim', size: 34 }), footer, 'right');
  const eosYes = place(label('EOS allowed', { color: 'yellow', size: 34 }), footer, 'right');
  const eosNoAgain = place(label('EOS forbidden', { color: 'dim', size: 34 }), footer, 'right');
  const unfinished = place(
    label('Length limit: unfinished prefix', { color: 'red', size: 34 }),
    footer,
    'right',
  );
  const partial = place(tokens(['c', 'r', 'e'], { size: 34, minWidth: 54 }), header, 'right');
  const trace = enumByteTrace('create"}');
  if (!trace.complete || !trace.eosAllowed)
    throw new Error('Expected the supplied JSON byte path to accept.');
  s.add(heading(c.title), [prefix, byteCaption, bytes, machine, chart, guide, eosNo]);
  c.on('grammar-bytes-build-0', () => {
    for (let i = 0; i < 6; i++) s.play(bytes.mark(i, 'generated', { duration: 0.22 }));
    s.play(bytes.mark(6, 'generated', { duration: 0.5 }), machine.go('quote', { duration: 0.5 }));
    s.play(bytes.mark(7, 'generated', { duration: 0.5 }), machine.go('accept', { duration: 0.5 }));
  });
  c.swap('grammar-bytes-build-0', eosNo, eosYes, { after: true });
  c.after('grammar-enum-mask', () => s.play(chart.mark(3, 'masked', { duration: 0.8 })));
  c.after('grammar-bytes-build-1', () =>
    s.play(
      chart.mark(0, 'chosen', { duration: 0.8 }),
      chart.mark([1, 2], 'masked', { duration: 0.8 }),
    ),
  );
  c.swap('grammar-bytes-build-2', eosNoAgain, unfinished, { after: true });
  c.swap(2, bytes, partial);
  c.swap(2, eosYes, eosNoAgain);
  c.swap(2, machine, partialMachine);
}
