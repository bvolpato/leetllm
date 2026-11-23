// A memory channel uses the same scale for its allocations and its limit.
export const ink = '#102b36', paper = '#f4f0e5', pale = '#dfdcca', mid = '#4b6264';
export const blue = '#42758b', mint = '#36796c', orange = '#b25437', plum = '#805677', gold = '#95681d';
export const colors = [blue, mint, orange, plum, gold];
export const sum = xs => xs.reduce((a,b) => a+b, 0);
export const range = n => Array.from({length:n},(_,i)=>i);
export const clamp = x => Math.min(1,Math.max(0,x));
export const fmt = n => String(+n.toFixed(4));
export function event(k, beat, phrase, seconds = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase,seconds);
}
export function rect(g,x,y,w,h,fill,stroke) {
  if (w<=0 || h<=0) return;
  if(fill){g.fillStyle=fill; g.fillRect(x,y,w,h);}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.strokeRect(x,y,w,h);}
}
export function line(g,x,y,ex,ey,color=mid,lw=3) {
  g.beginPath();g.moveTo(x,y);g.lineTo(ex,ey);g.strokeStyle=color;g.lineWidth=lw;g.stroke();
}
export function label(g,t,x,y,size=34,color=ink,opts={}) {
  g.font=(opts.bold?'700 ':'400 ')+size+'px "Lesson '+(opts.font||'Sans')+'"';
  g.fillStyle=color;g.textAlign=opts.align||'left';g.textBaseline='alphabetic';
  g.fillText(String(t),x,y,opts.width||1800);
}
export function base(g,section,title) {
  rect(g,0,0,1920,1080,paper);
  rect(g,0,0,1920,15,ink);
  label(g,'DEEPSPEED   /   '+section.toUpperCase(),90,78,25,mid,{bold:true});
  label(g,title,86,175,67,ink,{font:'Serif',width:1740});
  line(g,90,215,1830,215,'#b6b9a9',2);
}
export function note(g,msg,color=ink) {
  rect(g,90,846,1740,83,ink);
  rect(g,90,846,10,83,color===ink?'#e1ae63':color);
  label(g,msg,124,901,38,paper,{width:1665});
}
export function chip(g,x,y,w,h,value,color=blue,opts={}) {
  rect(g,x+3,y+5,w,h,'#c8c6b7');
  rect(g,x,y,w,h,color);
  const count=Math.floor((w-12)/18);
  for(let i=0;i<count;i++)rect(g,x+8+i*18,y+h-6,7,3,'#ffffff65');
  if (w>38) label(g,value,x+w/2,y+h/2+(opts.size||36)*.34,opts.size||36,paper,{align:'center',font:opts.font||'Mono',width:w-14});
}
export function socket(g,x,y,w,h,v='',sz=32) {
  rect(g,x,y,w,h,'#e6e4d7','#adbaad');
  if(v!=='')label(g,v,x+w/2,y+h/2+sz*.34,sz,mid,{align:'center',width:w-12});
}
export function cells(g,x,y,values,{w=100,h=80,gap=6,color=blue,sz=32}={}) {
  values.forEach((v,i)=>{const px=x+i*(w+gap);
    if(v===null)socket(g,px,y,w,h);
    else chip(g,px,y,w,h,v,typeof color==='function'?color(i):color,{size:sz});
  });
}
export function readout(g,x,y,heading,value,color=blue,w=450) {
  label(g,heading,x,y,32,mid,{width:w,bold:true});
  label(g,value,x,y+97,78,color,{font:'Mono',width:w});
}
export function arrow(g,x,y,ex,ey,color=mid) {
  line(g,x,y,ex,ey,color,4);const a=Math.atan2(ey-y,ex-x);
  for(const d of [-.52,.52]) line(g,ex,ey,ex-19*Math.cos(a+d),ey-19*Math.sin(a+d),color,4);
}
export function track(g,x,y,w,capacity,parts,{h=112,limit,unit='',color=orange,labels=true}={}) {
  const step=w/capacity;
  rect(g,x,y,w,h,'#e2e2d4','#9aa99f');
  for(let i=1;i<capacity;i++)line(g,x+i*step,y,x+i*step,y+h,'#bdc5b6',1);
  let offset=0;
  for(const p of parts){
    if(!p.n)continue;
    chip(g,x+offset*step+1,y+2,p.n*step-2,h-4,labels?p.label:'',p.color,{size:Math.min(37,h*.48)});
    offset+=p.n;
  }
  if(limit!=null){
    const dx=x+limit*step;
    line(g,dx,y-21,dx,y+h+21,color,6);
    label(g,limit+' '+unit+' limit',dx,y-35,32,color,{align:limit>=capacity-2?'right':'center',bold:true});
  }
}
export function row(g,y,title,values,opts={}) {
  label(g,title,100,y+48,35,ink,{bold:true,width:opts.labelWidth||455});
  cells(g,opts.x||585,y,values,{w:opts.w||122,h:opts.h||76,color:opts.color||blue,sz:opts.sz||32,gap:opts.gap??8});
}
export function measure(g,x,y,w,scale,items) {
  items.forEach(([name,start,end,c],i)=>{
    const py=y+i*110;
    label(g,name,x,py+42,32,ink,{bold:true,width:285});
    const left=x+315, span=w-315;
    line(g,left,py+39,left+span,py+39,'#b9c1b5',3);
    if(end>start)chip(g,left+span*start/scale,py,span*(end-start)/scale,74,fmt(end-start)+' s',c,{size:31});
  });
  const left=x+315,span=w-315,py=y+items.length*110-8;
  for(let t=0;t<=scale;t++){const px=left+span*t/scale;line(g,px,py,px,py+10);label(g,t,px,py+45,27,mid,{align:'center'});}
  label(g,'seconds',x,py+40,28,mid);
}

