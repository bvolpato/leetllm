import {
  assertEqual,
  arrow,
  line,
  segmentedBar,
  dot,
  dynamic,
  group,
  indicate,
  numberLine,
  place,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  ACTIONS,
  COLORS,
  explorationEpisodes,
  explorationLedger,
  explorationEpsilon,
  explorationQ,
} from '../parts.mjs';
export default function exploration(s, c) {
  const [drawArea, binsArea, foot] = area.rows([3, 4, 1], 'loose');
  const [first, second] = drawArea.columns(2, 'loose');
  const e02 = explorationEpisodes[1];
  const u = place(
    numberLine({
      range: [0, 1],
      length: first.width - 130,
      ticks: [0, explorationEpsilon, 1],
      size: 34,
      labelSize: 34,
      format: (v) => (v === 1 / 3 ? '1/3' : v === 2 / 3 ? '2/3' : String(v)),
      thresholds: [{ at: explorationEpsilon, label: 'ε' }],
      points: [],
    }),
    first,
  );
  const v = place(
    numberLine({
      range: [0, 1],
      length: second.width - 130,
      ticks: [0, 1],
      size: 34,
      labelSize: 34,
      format: (v) => (v === 1 / 3 ? '1/3' : v === 2 / 3 ? '2/3' : String(v)),
      thresholds: [{ at: 1 / 3 }, { at: 2 / 3 }],
      points: [],
    }),
    second,
  );
  const intervals = segmentedBar(
    ACTIONS.map((name, i) => ({ name, value: 1 / 3, color: COLORS[i] })),
    {
      width: second.width - 130,
      height: 74,
      size: 34,
      max: 1,
      readout: false,
      labels: false,
    },
  ).moveTo([second.cx, v.world(0)[1] + 105]);
  const intervalLabels = ACTIONS.map((name) =>
    place(note(name + ' 1/3', { color: 'bg' }), intervals.region({ part: name })),
  );
  const cells = binsArea.columns(3, 'loose');
  const binNodes = [],
    homes = [];
  const count = COLORS.map(() => s.value(0));
  const counts = [];
  for (let i = 0; i < 3; i++) {
    const [name, score, well] = cells[i].rows([1, 1, 3], 'normal');
    binNodes.push(
      place(label(ACTIONS[i], { color: COLORS[i] }), name),
      place(mono(`Q = ${explorationQ[i]}`, { color: COLORS[i] }), score),
    );
    const box = place(
      rect(well.width - 12, well.height - 12, { stroke: COLORS[i], fill: 'surface', radius: 14 }),
      well,
    );
    binNodes.push(box);
    homes.push(well);
    const anchor = place(mono('0'), well, 'bottom');
    anchor.shift(0, -30);
    counts.push(
      dynamic(() =>
        mono(String(Math.round(count[i].value)), { color: COLORS[i] }).moveTo([
          anchor.get('x'),
          anchor.get('y'),
        ]),
      ),
    );
  }
  const drawPoint = v.world(e02.v);
  const reviewGutter = second.right - 24;
  const reviewEntry = [reviewGutter, homes[2].top + 30];
  const chosenRoute = group(
    line(drawPoint, [reviewGutter, drawPoint[1]], { stroke: 'blue', width: 3 }),
    arrow([reviewGutter, drawPoint[1]], reviewEntry, { stroke: 'blue', width: 3 }),
  );
  const noteText = place(note('Counts show proposed actions in eight simulator episodes.'), foot);
  const probability = place(
    row(
      [
        mono('P(ask) = 0.8 + 0.2 / 3', { color: 'green' }),
        mono('≈ ' + (1 - explorationEpsilon + explorationEpsilon / 3).toFixed(3), {
          color: 'green',
        }),
      ],
      { gap: 'tight' },
    ),
    foot,
  );
  assertEqual(explorationLedger(8).counts.join(','), '1,6,1', 'authored proposal counts');
  const episodes = explorationEpisodes.map((episode, i) => {
    const rank = explorationLedger(i).counts[episode.action];
    const slot = homes[episode.action].columns(3, 'tight')[2 - (rank % 3)];
    const target = [slot.cx, homes[episode.action].top + 40 + Math.floor(rank / 3) * 55];
    const chip = mono(episode.id, { color: COLORS[episode.action] }).moveTo(target);
    const gutter = cells[episode.action].left + 30;
    const arrival = dot(10, 'cyan').moveTo([gutter, drawArea.bottom]);
    return { episode, chip, arrival, target, gutter };
  });
  s.add(heading(c.title), u, v, intervals, intervalLabels, binNodes, counts, noteText);
  c.on('epsilon', () => s.play(indicate(u, { scale: 1 })));
  c.after('explore', () =>
    s.play(u.insert({ name: 'E02', value: e02.u, color: 'cyan' }, { duration: 0.5 })),
  );
  c.after('uniform', () =>
    s.play(v.insert({ name: 'E02', value: e02.v, color: 'blue' }, { duration: 0.7 })),
  );
  c.show('proposal', chosenRoute, { lead: -0.7 });
  c.hide('episodes', chosenRoute);
  c.on('gate', () => s.play(indicate(noteText, { scale: 1 })));
  c.on('episodes', () => {
    for (let i = 0; i < episodes.length; i++) {
      const { episode, chip, arrival, target, gutter } = episodes[i];
      s.at(c.cue('episodes').start + i * 0.85, () => {
        s.add(arrival);
        s.play(to(arrival, (n) => n.moveTo([gutter, target[1]]), { duration: 0.35 }));
        s.play(to(arrival, (n) => n.moveTo(target), { duration: 0.35 }));
      });
      s.at(c.cue('episodes').start + i * 0.85 + 0.7, () => {
        s.remove(arrival);
        s.add(chip);
        count.forEach((value, k) => value.set(explorationLedger(i + 1).counts[k]));
      });
    }
  });
  c.on('unsafe', () => s.play(indicate(episodes[4].chip, { scale: 1, color: 'red' })));
  c.on('convergence', () => s.play(indicate(counts, { scale: 1 })));
  c.swap('greedy-odds', noteText, probability.nodes[0]);
  c.show('probability', probability.nodes[1], { after: true });
}
