import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { releaseSliceBars } from '../../../films/context-packing/construction.mjs';

export default function releaseSlices(s, c) {
  const [title, field, foot] = area.rows([1, 4, 1], 'normal');
  const mode = s.value(0), picked = s.value(0);
  const example = releaseSliceBars(1);
  const perDepth = 100, floor = example.middleFloor;
  const positions = ['Head', 'Middle', 'Tail'];
  const rows = field.rows(4, 'tight');
  s.add(heading(c.title), dynamic(() => {
    const k = mode.value;
    const nodes = [place(label(k < 2 ? 'Move the fact at each length' : 'Hypothetical runs   ·   100 cases per depth', { size: 50 }), title)];
    if (k < 2) {
      const columns = rows[0].columns(4, 'normal');
      positions.forEach((name, i) => nodes.push(place(note(name), columns[i + 1])));
      ['Short', 'Medium', 'Long'].forEach((len, i) => {
        const [name, ...slots] = rows[i + 1].columns(4, 'normal');
        nodes.push(place(label(len), name, 'left'));
        slots.forEach((slot, j) => {
          const active = Math.round(picked.value) === i * 3 + j;
          nodes.push(rect(slot.width * 0.92, slot.height * 0.75, { fill: active ? 'yellow' : null, stroke: active ? 'yellow' : 'dim' }).moveTo(slot.point('center')));
          if (active) nodes.push(place(mono(k === 0 ? 'D1' : 'D1 + D2', { size: 34, color: 'bg' }), slot));
        });
      });
      nodes.push(place(note(k === 0 ? 'One known fact per prompt' : 'Two linked facts per prompt'), foot));
    } else {
      const layout = row => row.columns([1.2, 1, 1, 1, 1], 'normal');
      const [, ...columns] = layout(rows[0]);
      [...positions, 'Overall'].forEach((name, i) => nodes.push(place(label(name, { size: 37 }), columns[i])));
      [example.baseline, example.candidate].forEach((scores, i) => {
        const [name, ...slots] = layout(rows[i + 1]);
        nodes.push(place(label(i ? 'Candidate' : 'Baseline', { size: 39 }), name, 'left'));
        const mean = scores.reduce((sum, value) => sum + value, 0) / (scores.length * perDepth) * 100;
        nodes.push(place(mono(mean + '%', { size: 57 }), slots[3]));
        scores.forEach((score, j) => {
          const slot = slots[j], passes = score >= floor;
          const color = k === 5 ? passes ? 'green' : 'pink' : 'cyan';
          if (k < 4) nodes.push(place(mono('?', { color: 'dim' }), slot));
          else {
            const w = slot.width * score / perDepth;
            nodes.push(rect(w, slot.height * 0.72, { fill: color, stroke: null, opacity: 0.25 }).moveTo([slot.left + w / 2, slot.cy]),
              place(mono(score + '%', { size: 52, color }), slot));
          }
        });
      });
      if (k >= 3) nodes.push(place(label('Required at each depth   ≥   ' + floor + '%', { size: 47 }), rows[3]));
      if (k === 5) nodes.push(place(label('Hold candidate   ·   middle below floor', { color: 'pink', size: 42 }), foot));
    }
    return nodes;
  }));
  c.on('release-slices-0', () => s.play(picked.to(8, { duration: 3.6 })));
  c.on('release-slices-1', () => { mode.set(1); s.play(picked.to(0, { duration: 3.6 })); });
  c.on('means', () => mode.set(2));
  c.after('floor', () => mode.set(3));
  c.on('depths', () => mode.set(4));
  c.after('depth-verdict', () => mode.set(5));
}
