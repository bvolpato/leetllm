import { place, row, column, dynamic, segmentedBar, assertEqual } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { BODY } from './parts.mjs';
import { lifetimePlans } from '../../films/bitter-lesson-compute-over-heuristics/arithmetic.mjs';

export const plans = lifetimePlans();
const zetta = 1e21;
const billion = 1e9;
export const forwardWork = (plan, billions) => (2 * plan.parameters * billions * billion) / zetta;
const trainingWork = (plan) => plan.train / zetta;
export const lifetimeWork = (plan, billions) => trainingWork(plan) + forwardWork(plan, billions);

export function workChart(s, initialVolume = 0) {
  const [premise, largeBand, smallBand, axis, foot] = BODY.rows(
    [0.8, 1.65, 1.65, 0.4, 1.3],
    'normal',
  );
  const columns = (band) => band.columns([1, 3], 'wide');
  const planRow = (plan, band) => {
    const [identity, work] = columns(band);
    const [numbers, barRegion] = work.rows([1, 1], 'tight');
    const n = plan.parameters / billion;
    const d = plan.tokens / billion;
    const train = trainingWork(plan);
    const q = s.value(initialVolume);
    const name = place(
      column(
        [label(n + 'B parameters', { size: 48 }), note(d + 'B training tokens', { size: 35 })],
        { align: 'left', gap: 'tight' },
      ),
      identity,
      'left',
    );
    const barWidth = barRegion.width - 24;
    const bar = place(
      segmentedBar(
        [
          { name: 'training', value: train, color: 'blue' },
          { name: 'serving', value: forwardWork(plan, initialVolume), color: 'green' },
        ],
        { width: barWidth, height: 58, max: 10, labels: false, readout: false },
      ),
      barRegion,
    );
    const receipt = dynamic(() => {
      const volume = Math.round(q.value * 10) / 10;
      const amount = forwardWork(plan, volume);
      return [
        ...place(
          row(
            [
              mono(train.toFixed(2), { size: 43, color: 'blue' }),
              note('+', { size: 38 }),
              mono(amount.toFixed(2), { size: 43, color: 'green' }),
              mono('= ' + (train + amount).toFixed(2), { size: 43 }),
            ],
            { gap: 14 },
          ),
          numbers,
          'left',
        ).nodes,
        place(
          note(volume.toLocaleString('en-US') + 'B serving tokens', { size: 35 }),
          numbers,
          'right',
        ),
      ];
    });
    const advance = (volume, duration) => [
      q.to(volume, { duration }),
      bar.resize('serving', forwardWork(plan, volume), { duration }),
    ];
    return { nodes: [name, receipt, bar], advance };
  };
  const large = planRow(plans.large, largeBand);
  const small = planRow(plans.small, smallBand);
  const [units, ticks] = columns(axis);
  const scale = [
    place(note('ZettaFLOPs', { size: 33 }), units, 'left'),
    ...[0, 2, 4, 6, 8, 10].map((value) =>
      mono(String(value), { size: 30, color: 'dim' }).moveTo([
        ticks.left + 12 + ((ticks.width - 24) * value) / 10,
        ticks.point('center')[1],
      ]),
    ),
  ];
  const legend = place(
    row(
      [
        label('Training work', { color: 'blue', size: 40 }),
        label('+', { size: 38 }),
        label('Serving work', { color: 'green', size: 40 }),
        label('= lifetime work', { size: 40 }),
      ],
      { gap: 'normal' },
    ),
    premise,
  );
  return { large, small, scale, legend, foot };
}

export function checkWork(plan, volume, expected) {
  assertEqual(lifetimeWork(plan, volume).toFixed(2), expected, 'lifetime work in zettaFLOPs');
}
