import { column, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { probeRelease } from './parts.mjs';

// The switch selects a retained computation. A new probe has to travel down the selected branch.
export function probeSwitch(s, room, { release, id, delay }) {
  const [intake, fork, bundles, outputs] = room.columns([2.3, 1.8, 3.2, 3.4], 'wide');
  const versions = ['v0', 'v1'];
  const modelRows = bundles.rows(2, 'wide');
  const results = outputs.rows(2, 'wide');
  const probes = versions.map((v) => probeRelease(v, delay));
  const candidate = s.value(release === 'v1' ? 1 : 0);
  const traveling = s.value(0);
  const displayed = s.value(-1);
  const actionShown = s.value(0);
  const source = place(
    column(
      [
        note('Replay input', { color: 'cyan' }),
        mono(id, { size: 42, color: 'cyan' }),
        label(delay + ' min delay', { size: 36 }),
      ],
      { gap: 'tight' },
    ),
    intake,
  );
  const pivot = fork.point('left');
  const ends = modelRows.map((r) => [fork.right, r.point('center')[1]]);
  const labelRooms = fork.rows([1, 3], 'none');
  const name = place(note('Production', { color: 'yellow' }), labelRooms[0]);
  const route = group(...ends.map((end) => line(pivot, end, { stroke: 'grid', width: 4 })));
  const contact = dynamic(() => {
    const y = ends[0][1] + candidate.value * (ends[1][1] - ends[0][1]);
    const tip = [fork.right, y];
    return [
      line(pivot, tip, { stroke: 'yellow', width: 7 }),
      dot(11, 'yellow').moveTo(pivot),
      dot(9, 'yellow').moveTo(tip),
    ];
  });
  const packets = versions.map((v, i) => {
    const p = probes[i];
    const color = i ? 'green' : 'blue';
    return place(
      column(
        [
          label(v + (i ? '   fitted package' : '   retained package'), { size: 36, color }),
          mono(
            p.model.intercept.toFixed(1) +
              ' + ' +
              p.model.slope.toFixed(1) +
              ' × ' +
              p.transformed.toFixed(1),
            { size: 33 },
          ),
        ],
        { gap: 'tight' },
      ),
      modelRows[i],
    );
  });
  const signals = dynamic(() => {
    const t = traveling.value;
    if (t <= 0 || t >= 1) return [];
    const end = ends[candidate.value < 0.5 ? 0 : 1];
    return dot(14, 'cyan').moveTo([
      pivot[0] + (end[0] - pivot[0]) * t,
      pivot[1] + (end[1] - pivot[1]) * t,
    ]);
  });
  const readout = dynamic(() => {
    if (displayed.value < 0) return [];
    const i = displayed.value;
    const p = probes[i];
    return place(
      column(
        [
          mono(p.score.toFixed(2) + (p.warning ? ' ≥ ' : ' < ') + p.model.threshold.toFixed(2), {
            size: 39,
          }),
          label(p.warning ? 'Warning' : 'No warning', {
            size: 46,
            color: p.warning ? 'green' : 'blue',
          }).opacity(actionShown.value),
        ],
        { gap: 'tight' },
      ),
      results[i],
    ).nodes;
  });
  function send() {
    displayed.set(-1);
    actionShown.set(0);
    traveling.set(0);
    s.play(traveling.to(1, { duration: 0.85 }));
  }
  function select(v) {
    displayed.set(-1);
    s.play(candidate.to(versions.indexOf(v), { duration: 0.8 }));
  }
  return {
    nodes: [source, route, contact, name, packets, signals, readout],
    send,
    select,
    score: (v) => displayed.set(versions.indexOf(v)),
    report(v) {
      displayed.set(versions.indexOf(v));
      actionShown.set(1);
    },
  };
}
