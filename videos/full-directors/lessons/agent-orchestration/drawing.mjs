import { paintStrip } from './fox.mjs';

export const C = {
  bg: '#F5EFDF', paper: '#FFFAEF', ink: '#232B38', dim: '#515A61', rule: '#B5AD9D',
  eval: '#385C99', health: '#A24A3C', policy: '#28665D', plum: '#67467B', gold: '#DAA748',
  mist: '#DAE4EA', peach: '#EFCDC1', mint: '#C8DDCE', lilac: '#DCD1E4', dark: '#202F3D',
  white: '#FFFBF0', warn: '#973F32', green: '#226451',
};
export const clamp = n => Math.max(0, Math.min(1,n));
export const lerp = (a,b,t) => a+(b-a)*t;
export const b = k => k.beat.beatIndex;
export function cue(k, beat, phrase, span = 0.55) {
  return b(k) < beat ? 0 : b(k) > beat ? 1 : k.reveal(phrase, span);
}
export function rect(g,x,y,w,h,fill,stroke=null,lw=2) {
  if (fill) { g.fillStyle=fill; g.fillRect(x,y,w,h); }
  if (stroke) { g.lineWidth=lw; g.strokeStyle=stroke; g.strokeRect(x,y,w,h); }
}
export function path(g, pts, color, lw=4, dash=[]) {
  g.save(); g.strokeStyle=color; g.lineWidth=lw; g.lineJoin='round'; g.lineCap='round'; g.setLineDash(dash);
  g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.restore();
}
export function poly(g, pts, fill) {
  g.fillStyle=fill; g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill();
}
export function dot(g,x,y,r,fill,stroke=null,lw=3) {
  g.beginPath(); g.arc(x,y,r,0,2*Math.PI); g.fillStyle=fill; g.fill();
  if (stroke) { g.strokeStyle=stroke; g.lineWidth=lw; g.stroke(); }
}
export function arrow(g,x,y,u,v,color=C.dim,w=4) {
  path(g,[[x,y],[u,v]],color,w);
  const angle=Math.atan2(v-y,u-x), size=w*2.9;
  poly(g,[[u,v],[u-size*Math.cos(angle-.5),v-size*Math.sin(angle-.5)],[u-size*Math.cos(angle+.5),v-size*Math.sin(angle+.5)]],color);
}
export function txt(g,str,x,y,size=38,options={}) {
  const {color=C.ink,font='Sans',weight=500,align='left',width} = options;
  const val=String(str);
  g.font=weight+' '+size+'px "Lesson '+font+'"';
  if(width) {
    const measured=g.measureText(val).width;
    if(measured>width) g.font=weight+' '+Math.floor(size*width/measured)+'px "Lesson '+font+'"';
  }
  g.textBaseline='alphabetic'; g.textAlign=align; g.fillStyle=color; g.fillText(val,x,y);
}
export const mono = (g,s,x,y,size=36,color=C.ink,align='left',width) => txt(g,s,x,y,size,{font:'Mono',color,align,width});
export const serif = (g,s,x,y,size=68,color=C.ink,align='left',width) => txt(g,s,x,y,size,{font:'Serif',weight:600,color,align,width});
const diagramRise = 56;

export function stage(g,section,title) {
  rect(g,0,0,1920,1080,C.bg);
  txt(g,section,78,49,32,{weight:600,color:C.plum});
  serif(g,title,74,127,83,C.ink,'left',1770);
  path(g,[[78,156],[1842,156]],C.rule,2);
  g.translate(0,-diagramRise);
}
export function foot(g,text,sub,color=C.ink) {
  // The stage has already moved the diagram. Place the footer in screen coordinates.
  g.save();
  g.translate(0,diagramRise);
  path(g,[[78,774],[1842,774]],C.rule,2);
  serif(g,text,78,825,53,color,'left',1764);
  if(sub) txt(g,sub,80,878,34,{color:C.dim,width:1754});
  g.restore();
}
export function tag(g,str,x,y,w,fill=C.paper,ink=C.ink,size=32) {
  rect(g,x,y,w,64,fill);
  txt(g,str,x+w/2,y+44,size,{color:ink,weight:600,align:'center',width:w-20});
}
export function fox(g,versions,x,y,p) {
  rect(g,x-6,y-6,120*p+12,60*p+12,C.ink);
  versions.forEach((v,i)=>paintStrip(g,v,i,x,y,p));
}
export function tick(g,x,y,color=C.green) {
  path(g,[[x-12,y],[x-4,y+9],[x+16,y-15]],color,6);
}
export function icon(g,id,x,y,s=1,fg=C.ink) {
  g.save(); g.translate(x,y); g.scale(s,s);
  if(id==='eval') {
    rect(g,-31,-33,62,68,null,fg,4);
    [-15,0,15].forEach(v=>{rect(g,-20,v-4,7,7,fg);path(g,[[-5,v],[19,v]],fg,4);});
  } else if(id==='health') {
    path(g,[[-37,4],[-23,4],[-15,-10],[-4,26],[7,-27],[18,4],[36,4]],fg,5);
  } else if(id==='policy') {
    path(g,[[-30,25],[-30,-20],[29,-20],[29,25]],fg,4);
    [-16,0,16].forEach(v=>path(g,[[v,-20],[v,9]],fg,5));
    path(g,[[-37,25],[37,25]],fg,4);
  }
  g.restore();
}
export const tints={eval:C.mist,health:C.peach,policy:C.mint};
export function receipt(g,x,y,w,h,row,{label,detail,emphasis,fill=C.paper}={}) {
  const key=row.branch;
  rect(g,x,y,w,h,fill,C.rule,2);
  rect(g,x,y,10,h,C[key]); rect(g,x+24,y+20,69,68,tints[key]);
  icon(g,key,x+59,y+54,.65,C[key]);
  txt(g,label??({eval:'Evaluation',health:'Health',policy:'Policy'})[key],x+109,y+64,42,{weight:600,width:w-132});
  if(detail) mono(g,detail,x+29,y+130,35,emphasis??C.dim,'left',w-56);
}
