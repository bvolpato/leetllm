import { dynamic, rect, place } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { longContextModel } from '../../../films/context-packing/construction.mjs';

export default function distributedContext(s,c) {
  s.add(heading(c.title));
  const m = longContextModel('distributed-context',{});
  const [head,body,foot] = area.rows([1,4,1],'normal');
  const positions = body.rows(2,'normal').map(r=>r.columns(2,'normal'));
  const owners = [positions[0][0],positions[0][1],positions[1][1],positions[1][0]];
  const colors = ['blue','green','pink','yellow'];
  const hop = s.value(0), view = s.value(0);
  s.add(dynamic(()=>{
    const nodes=[];
    if(view.value<2) {
      nodes.push(place(label(view.value===0?'Global attention across four query owners':'Decode can shard one history across ranks'),head));
      const stops=[];
      owners.forEach((r,i)=>{
        const [a,b]=r.rows(2,'tight');
        nodes.push(place(mono(`Rank ${i}  ·  Q${i}`,{size:34}),a));
        stops.push(b.point('center'));
      });
      colors.forEach((color,i)=>{
        const t=view.value===1?0:hop.value;
        const from=stops[(i+Math.floor(t))%4], to=stops[(i+Math.floor(t)+1)%4];
        const fraction=t-Math.floor(t);
        const point=from.map((v,j)=>v+(to[j]-v)*fraction);
        nodes.push(rect(185,56,{fill:null,stroke:color,width:4,radius:6}).moveTo(point),
          mono(`KV ${i}`,{size:31,color}).moveTo(point));
      });
      nodes.push(place(note(view.value===0?'Queries stay in place as key/value blocks circulate.':'Physical residency and communication depend on the decode backend.'),foot));
    } else {
      const [group,blocks]=body.rows(2,'normal');
      nodes.push(place(label('One logical block spans four physical groups'),head));
      group.columns(4,'normal').forEach((r,i)=>{
        nodes.push(rect(r.width*.75,72,{stroke:colors[i],fill:null,width:3}).moveTo(r.point('center')),
          place(mono(`${m.physical} positions`,{color:colors[i],size:31}),r));
      });
      if (view.value >= 3) blocks.columns(m.blocks,'tight').forEach((r,i)=>{
        nodes.push(rect(r.width,68,{stroke:'cyan',fill:i===m.blocks-1?null:'blue',width:2}).moveTo(r.point('center')));
        if(i===m.blocks-1) nodes.push(rect(r.width/m.logical,64,{stroke:null,fill:'yellow'}).moveTo([r.left+r.width/m.logical/2,r.cy]));
      });
      const text = view.value >= 3 ? `1,025 positions  →  ${m.blocks} blocks × ${m.logical} = ${m.rounded.toLocaleString('en-US')} slots` : `4 × ${m.physical} = ${m.logical} positions per logical block`;
      nodes.push(place(mono(text,{size:37}),foot));
    }
    return nodes;
  }));
  c.on('distributed-context-0',()=>s.play(hop.to(4,{duration:5})));
  c.on('distributed-context-1',()=>view.set(1));
  c.on('distributed-context-2',()=>view.set(2));
  c.after('block-round',()=>view.set(3));
}
