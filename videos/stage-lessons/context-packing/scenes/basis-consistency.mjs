import { circle, dynamic, line, place } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { longContextModel } from '../../../films/context-packing/construction.mjs';

export default function basisConsistency(s, c) {
  s.add(heading(c.title));
  const [diagram, readout] = area.columns([1, 1], 'normal');
  const [dial, legend] = diagram.rows([5, 1], 'normal');
  const [status, query, key, score, check] = readout.rows(5, 'normal');
  const [x, y] = dial.point('center');
  const radius = Math.min(dial.width, dial.height) * 0.43;
  const progress = s.value(0), recalculating = s.value(0), scored = s.value(0);
  const stale = place(label('Cached key uses the old basis', {color:'yellow'}), status);
  const repaired = place(label('Key and query share one basis', {color:'green'}), status);
  const point = angle => [x + radius * Math.cos(angle), y - radius * Math.sin(angle)];
  s.add(circle(radius, {stroke:'dim', fill:null, width:3}).moveTo([x,y]),
    place(note('Both vectors have unit length'), legend),
    place(mono('Query    2 × 0.5 = 1.0 rad', {color:'blue'}), query),
    dynamic(() => {
      const m = longContextModel('basis-consistency', {beat:1, cues:{'basis-consistency-1':{progress:progress.value}}});
      return [line([x,y],point(m.query),{stroke:'blue',width:15}),
        line([x,y],point(m.key),{stroke:'yellow',width:5}),
        circle(9,{fill:'yellow',stroke:null}).moveTo(point(m.key)),
        place(mono(`Key angle     ${m.key.toFixed(2)} rad`,{color:'yellow'}),key),
        place(mono(`q · k = ${recalculating.value && !scored.value ? '?' : m.score.toFixed(3)}`,{size:54}),score)];
    }));
  c.show('basis-consistency-0', stale);
  c.on('basis-consistency-1', () => {
    recalculating.set(1);
    s.play(progress.to(1,{duration:1.8}));
  });
  c.hide('basis-consistency-1', stale);
  c.show('fresh-score', repaired);
  c.after('fresh-score', () => scored.set(1));
  c.show('basis-consistency-2', place(note('Compare cache-on and cache-off scores.'), check));
}
