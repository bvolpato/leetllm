import { dynamic, rect, place } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { longContextModel } from '../../../films/context-packing/construction.mjs';

export default function cacheExecution(s,c) {
  s.add(heading(c.title));
  const m = longContextModel('cache-execution',{});
  const [head, chart, foot] = area.rows([1,4,1],'normal');
  const precision = s.value(0), view = s.value(0), count = s.value(0), allocated = s.value(0);
  s.add(dynamic(() => {
    const nodes = [];
    if (view.value === 0) {
      const size = m.bf + (m.quant - m.bf) * precision.value;
      const slots = Math.floor(m.budget / size);
      const w = chart.width * .82, left = chart.cx - w / 2;
      nodes.push(place(label('64 GiB cache budget'),head),
        rect(w,100,{fill:null,stroke:'dim',width:3}).moveTo([chart.cx,chart.cy]));
      for (let i=0;i<slots;i++) {
        const width = w * size / m.budget;
        nodes.push(rect(width-6,88,{fill:'blue',stroke:null,opacity:.7}).moveTo([left+(i+.5)*width,chart.cy]),
          mono(`${Math.round(size)} GiB`,{size:34}).moveTo([left+(i+.5)*width,chart.cy]));
      }
      const used = slots * size;
      nodes.push(place(mono(`${slots} × ${size} = ${used} GiB   ·   ${m.budget - used} GiB left`, { size: 46 }), foot));
    } else if (view.value === 1) {
      const regions = chart.columns(8,'tight');
      const owners = ['A','B','A','','B','','A',''];
      if (allocated.value) { owners[3] = 'C'; owners[5] = 'C'; }
      nodes.push(place(label('Reuse free physical pages'),head),
        place(note(allocated.value ? 'C uses two free pages. Its logical sequence stays contiguous.' : 'Three free pages lie between or after occupied pages.'),foot));
      regions.forEach((r,i) => nodes.push(rect(r.width*.85,78,{stroke:'dim',fill:owners[i] === 'A'?'blue':owners[i]==='B'?'green':owners[i]==='C'?'yellow':null}).moveTo(r.point('center')),
        place(mono(owners[i] || 'free',{size:32,color:owners[i]?'bg':'ink'}),r)));
    } else {
      const rows = chart.rows(3,'normal');
      const reused = count.value >= 2, changed = view.value === 4;
      const suffixes = [800,1200,600];
      nodes.push(place(label(view.value===3?'Decode still reads the entire prefix':changed?'An early edit breaks downstream prefix matches':'Three requests share a 48,000-token prefix'),head));
      rows.forEach((r,i) => {
        const [name,strip,suffix] = r.columns([1,5,2],'normal');
        nodes.push(place(mono(`R${i+1}`),name));
        strip.columns(8,'tight').forEach((block,j) => {
          const color = changed && i===2 && j>=1 ? (j===1?'red':'dim') : i>0 && reused?'cyan':'blue';
          nodes.push(rect(block.width,40,{fill:color,stroke:null}).moveTo(block.point('center')));
        });
        nodes.push(place(mono(`+ ${suffixes[i].toLocaleString('en-US')}`,{color:'yellow'}),suffix));
      });
      const summary = changed?'Red = edited block   ·   gray = recompute':view.value===3?'Cyan = retained KV blocks   ·   every request attends to its retained history':
        count.value===3?`New prefill: ${m.reused.toLocaleString('en-US')} tokens  ·  cyan blocks reused`:
        count.value===2?'Cyan blocks reuse the first request’s cached prefix':
        count.value===1?`Without reuse: ${m.uncached.toLocaleString('en-US')} prompt tokens`:'Blue blocks process the same prefix on each request';
      nodes.push(place(note(summary),foot));
    }
    return nodes;
  }));
  c.after('precision',()=>precision.set(1));
  c.on('page-map',()=>view.set(1));
  c.on('allocate-pages',()=>allocated.set(1));
  c.on('prefixes',()=>view.set(2));
  c.after('cold-count',()=>count.set(1));
  c.on('reuse',()=>count.set(2));
  c.after('reuse-count',()=>count.set(3));
  c.on('decode-reads',()=>view.set(3));
  c.on('edited-prefix',()=>view.set(4));
}
