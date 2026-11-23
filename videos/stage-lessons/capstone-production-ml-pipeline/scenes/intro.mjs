import { column, group, line, linear, place, polygon, rect, to } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, HAND_FAIL, OFFLINE_POLICY, open, pipelineOffline } from '../parts.mjs';

function parcel(record) {
  const face = { fill: 'surface', stroke: 'cyan', width: 4 };
  const tape = { fill: 'yellow', stroke: null };
  return group(
    rect(480, 196, face),
    polygon(
      [
        [-240, -98],
        [-164, -149],
        [316, -149],
        [240, -98],
      ],
      { ...face, fill: 'grid' },
    ),
    polygon(
      [
        [240, -98],
        [316, -149],
        [316, 47],
        [240, 98],
      ],
      { ...face, fill: 'surface' },
    ),
    polygon(
      [
        [-153, -98],
        [-77, -149],
        [-18, -149],
        [-94, -98],
      ],
      tape,
    ),
    rect(59, 54, tape).at(-123.5, -71),
    rect(182, 73, { fill: 'ink', stroke: null, radius: 4 }).at(81, -38),
    mono(record.id, { size: 39, color: 'bg' }).moveTo([81, -38]),
    label('Critical · late', { size: 52, color: 'yellow' }).moveTo([0, 42]),
  );
}

export default function intro(s, c) {
  const [dock, evidence, footer] = BODY.rows([3.6, 1.65, 0.85], 'wide');
  const critical = HAND_FAIL.filter((record) => record.critical && record.gold);
  const measures = pipelineOffline(HAND_FAIL);
  const floor = OFFLINE_POLICY.recallFloor * 100;
  const [platform, logs] = dock.rows([3.4, 1], 'tight');
  const bays = platform.columns(critical.length, 'loose');
  const logRooms = logs.columns(critical.length, 'loose');
  const parcels = critical.map((record, i) => {
    const end = [bays[i].point('center')[0] - 38, bays[i].bottom - 100];
    const box = parcel(record).at(end[0] - 125, end[1]);
    return { box, end };
  });
  const belt = line([platform.left, platform.bottom], [platform.right, platform.bottom], {
    stroke: 'dim',
    width: 4,
  });
  const logsForParcels = critical.map((record, i) =>
    place(
      label(record.pred ? 'Warning sent' : 'No warning', {
        size: 46,
        color: record.pred ? 'cyan' : 'pink',
      }),
      logRooms[i],
    ),
  );
  const [costRoom, recallRoom] = evidence.columns(2, 'loose');
  const cost = place(
    column(
      [
        note('Test cost · all four deliveries'),
        mono('Trial  ' + HAND_FAIL.length + ' × ' + HAND_FAIL[0].cost + ' = ' + measures.cost, {
          size: 41,
        }),
        mono('Base   ' + HAND_FAIL.length + ' × ' + HAND_FAIL[0].baseline + ' = ' + measures.base, {
          size: 41,
        }),
      ],
      { align: 'center', gap: 'tight' },
    ),
    costRoom,
  );
  const target = place(
    column(
      [
        note('Warning target'),
        label('At least ' + floor + '% of late critical deliveries', { size: 43 }),
      ],
      { align: 'center', gap: 'tight' },
    ),
    recallRoom,
  );
  const recall = place(
    column(
      [
        note('Required for a canary'),
        label('Cost ≤ baseline     ·     critical recall ≥ ' + floor + '%', { size: 39 }),
      ],
      { align: 'center', gap: 'tight' },
    ),
    recallRoom,
  );
  const counted = place(
    label(
      measures.hits +
        ' of ' +
        measures.positives +
        ' warned     ·     ' +
        measures.recall * 100 +
        '% recall     ·     ' +
        floor +
        '% required',
      { size: 40, color: 'yellow' },
    ),
    recallRoom,
  );
  const saving = Math.round(-100 * measures.delta);
  const saved = place(
    column(
      [
        note('Cost check passes', { color: 'green' }),
        mono(measures.cost + ' / ' + measures.base + ' − 1 = −' + saving + '%', { size: 41 }),
      ],
      { align: 'center', gap: 'tight' },
    ),
    costRoom,
  );
  const question = heading(c.title);
  const verdict = heading('Keep the trial offline');
  const canary = place(note('Canary = a small share of live requests'), footer);
  const production = place(label('Production stays on v0', { size: 37, color: 'blue' }), footer);
  const first = s.root.children.length;
  open(s, c, question);
  s.add(belt, ...parcels.map(({ box }) => box), cost, target);
  for (const node of s.root.children.slice(first)) node.track('opacity').step(0, 1);
  s.play(...parcels.map(({ box, end }) => to(box, (b) => b.at(...end))), {
    duration: 1.4,
    ease: linear,
  });
  c.show('intro-sent', logsForParcels[0], { after: true, lead: 0 });
  c.show('intro-miss', logsForParcels[1], { after: true, lead: 0 });
  c.swap('intro-policy', target, recall, { lead: 0 });
  c.show('intro-question', canary, { lead: 0 });
  c.swap('intro-hold', [question, canary], [verdict, production], { after: true, lead: 0 });
  c.swap('intro-recall', recall, counted, { after: true, lead: 0 });
  c.swap('intro-total', cost, saved, { after: true, lead: 0 });
  c.swap(
    'intro-record',
    logsForParcels[1],
    place(label('No warning · saved on failed receipt', { size: 40, color: 'pink' }), logRooms[1]),
  );
}
