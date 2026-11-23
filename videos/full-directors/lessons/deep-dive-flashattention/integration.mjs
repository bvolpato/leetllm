import { C, base, text, mono, centered, plate, socket, line, tag, footer, on, after, rect } from './drawing.mjs';
import { bytes, unit, group, shapes, runCache } from './operator.mjs';

const surfaces=[
  ['FA2','flash-attn','flash_attn','Tensor'],
  ['FA3','hopper/','flash_attn_3','Hopper path'],
  ['FA4','flash-attn-4','flash_attn.cute','(out, lse)'],
];

export function integration(c,k) {
  const b=k.beat.beatIndex;
  if(b===4) {
    const debug=on(k,4,'Request the debug return'), pair=on(k,4,'Switch to the pinned');
    const dependency=on(k,4,'An import can take a fallback');
    if(dependency) {
      base(c,'What follows a missing HIP extension?','Pinned FA2 wrapper  /  ROCm');
      const nodes=[['HIP extension','Try the configured extension'],['Import fails','Record the warning'],['AIter Triton','Try the alternate import']];
      nodes.forEach(([s,label],i)=>{
        const x=125+600*i;
        plate(c,x,388,474,174,i===1?'#f1c1a7':'#c4e1cd');
        centered(c,s,x+237,494,51);
        centered(c,label,x+237,653,34);
        if(i<2)line(c,[[x+476,478],[x+583,478]],C.green,5);
      });
      footer(c,'Import success still depends on compatible packages and hardware. Record the module that loaded.');
      return;
    }
    base(c,'What reaches the caller?','Public return  /  pinned wrapper examples');
    tag(c,pair?'FA4 default':debug?'FA2 with return_attn_probs':'FA2 default',125,339);
    const fields=pair?['Output','LSE or None']:debug?['Output','Row LSE','Debug buffer']:['Output'];
    fields.forEach((s,i)=>{
      const x=125+i*578;plate(c,x,414,525,224,i?'#f2d5ae':'#bedfcd');
      centered(c,s,x+262,546,57);
    });
    footer(c,pair?'Unpack the output tensor. The row summary can be absent.':debug?'The debug buffer can be quadratic and its scaling can be unreliable.':'The ordinary public call returns one tensor.');
    return;
  }
  if(b===0){
    base(c,'Which import identifies each wrapper?','Caller contract  /  article snapshot, 2026');
    ['Generation','Install surface','Import namespace'].forEach((s,i)=>tag(c,s,[125,472,1121][i],318));
    surfaces.forEach(([id,pkg,module],i)=>{
      const y=375+i*145;plate(c,119,y,1680,117,i===1?'#d4e1d4':'#f8f3df');
      text(c,id,151,y+81,52,C.green,{face:'Serif'});mono(c,pkg,469,y+77,44);line(c,[[884,y+59],[1025,y+59]],C.rule,4);
      mono(c,module,1120,y+77,45);
    });
    footer(c,'Record the loaded import, device, dtype and operation. Check that wrapper’s signature.');return;
  }
  if(b===3){
    const compare=on(k,3,'With sixteen gibibytes'),blocked=on(k,3,'reroute this request');
    base(c,'Can the fallback hold the scores?','Backend dispatch  /  remaining workspace',true);
    const gb=bytes(8,32,8192,8192,2)/unit,x=155,w=46;
    tag(c,'Materialized score buffer',154,305,C.aqua);mono(c,'8 × 32 × 8,192² × 2 B',154,410,62,C.white);
    for(let i=0;i<gb;i++)rect(c,x+i*w,475,w-2,124,compare&&i>=16?C.orange:C.aqua);
    if(compare){line(c,[[x+16*w,442],[x+16*w,655]],C.white,5);centered(c,'16 GiB left',x+16*w,715,43,C.gold);}
    text(c,gb+' GiB',x+32*w-6,673,53,C.white,{align:'right',face:'Mono'});
    footer(c,blocked?'Reroute. This one tensor already exceeds the available workspace.':'A forced fused path can be ineligible. Size a materializing fallback before using it.',true);return;
  }
  const swapped=on(k,2,'Swap those two axes'),mask=on(k,2,'Next align the causal corner'),ret=on(k,2,'Then adapt the return');
  base(c,'Where does token 0, head 1 belong?','Caller contract  /  batch and head width fixed');
  const gridX=342,gridY=395,d=173;
  const flat=swapped?['t0 h0','t0 h1','t1 h0','t1 h1']:['t0 h0','t1 h0','t0 h1','t1 h1'];
  tag(c,swapped?'FA2 input  [B, S, H, D]':'SDPA input  [B, H, S, D]',120,292);
  [0,1].forEach(i=>{
    centered(c,(swapped?'head ':'token ')+i,gridX+i*d+d/2,367,35,C.sub);
    text(c,(swapped?'token ':'head ')+i,126,gridY+i*d+90,37,C.sub);
  });
  flat.forEach((a,i)=>{
    const x=gridX+i%2*d,y=gridY+Math.floor(i/2)*d;
    plate(c,x,y,d-9,d-9,a==='t0 h1'?'#ffc58b':'#c5daca');centered(c,a,x+(d-9)/2,y+98,39,C.ink,{face:'Mono'});
  });
  tag(c,'Adapter for a tail decode',895,292);
  const rows=[
    [swapped?'FA2 input':'Current caller layout',swapped?'[B, S, H, D]':'[B, H, S, D]',swapped],
    ['Reference corner',mask?'bottom-right':'upper-left',mask],
    ['Public output',ret?'FA2 tensor  /  FA4 pair':'check signature',ret],
  ];
  rows.forEach(([name,value,ok],i)=>{
    const y=341+i*151;plate(c,891,y,896,125,ok?'#c5e4cc':'#eee3ca');
    text(c,name,923,y+44,33,C.sub);mono(c,value,922,y+101,44,ok?C.green:C.ink);
  });
  footer(c,'The highlighted cell denotes token 0, head 1 in both layouts.');
}

export function headGroups(c,k) {
  const owned=on(k,1,'Each group has three');
  const outcomes={2:after(k,1,'Head two uses','Head three starts'),3:after(k,1,'Head three starts','In general')};
  base(c,'Where do heads two and three get their values?','Grouped-query attention');
  const qx=i=>235+i*289, kx=i=>524+867*i;
  tag(c,'Query heads',112,295);
  group.forEach((g,i)=>{
    const x=qx(i);
    plate(c,x-104,348,208,117,i===2||i===3?'#f4cf96':'#dce5d6');
    centered(c,'q'+i,x,428,55,C.ink,{face:'Mono'});
    if(owned)line(c,[[x,469],[x,536],[kx(g),615]],g?C.orange:C.teal,6);
    if(outcomes[i])centered(c,'out '+[10,100][g],x,321,37,C.green,{face:'Mono'});
  });
  [10,100].forEach((v,i)=>{
    const x=kx(i);socket(c,x-251,616,502,173);centered(c,'KV head '+i,x,684,44,C.aqua);centered(c,'value '+v,x,757,51,C.paper,{face:'Mono'});
  });
  footer(c,owned?'Owner = floor(query index / 3). The actual key and value head counts both equal 2.':'Each KV head supplies a constant value across its allowed keys.');
}

export function cache(c,k) {
  const collide=after(k,1,'B finds the entry','That key describes'),fix=on(k,1,'Add the key-value head count'),both=on(k,1,'B then A');
  base(c,'What does the second shape find in the cache?','Specialized kernel  /  modeled warmup order',true);
  Object.entries(shapes).forEach(([name,[q,kv]],i)=>{
    const x=110+i*876;plate(c,x,284,806,155,'#35574c','#122c27');
    text(c,'Shape '+name,x+24,344,40,C.gold);mono(c,q+' Q  /  '+kv+' KV   =   '+(q/kv),x+24,406,43,C.white);
  });
  tag(c,fix?'Key = ratio / KV count':'Key = ratio only',114,530,C.aqua);
  for(const [i,ord] of ['AB','BA'].entries()){
    if(i===1&&!both)continue;
    const y=578+i*143, run=runCache(ord,fix);
    text(c,ord.split('').join(' → '),118,y+69,49,C.paper,{face:'Mono'});
    run.forEach((r,j)=>{
      const x=441+j*663,show=j===0||collide;
      plate(c,x,y,602,107,show&&!r.ok?'#783f36':'#2d5148','#102926');
      mono(c,show?'key '+r.key:'?',x+22,y+43,31,C.aqua);
      text(c,show?'Use '+r.owner+' for '+r.name:'Which compiled shape?',x+21,y+89,38,C.white);
    });
  }
  footer(c,fix?'Check A → B and B → A against the reference, with fresh-process controls.':collide?'The ratio-only lookup for B returns the specialization built for A.':'Both isolated shapes work. Keep the first compiled entry alive.',true);
}
