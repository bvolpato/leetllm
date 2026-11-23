import {lessonFont} from '../../../lib/fonts.mjs';

export const C = {
  paper: '#f5f1e6', ink: '#142e33', subtle: '#496668', grid: '#b9c7b9',
  pale: '#e6eadc', board: '#24494b', well: '#173639', mint: '#97dbbd',
  teal: '#16675d', rust: '#aa3e20', orange: '#ffb17f', white: '#fffaf0',
  plum: '#63476e', violet: '#d6c4de', pin: '#ccac6b',
};

export function txt(g, str, x, y, size=34, color=C.ink, align='left', face='Sans', weight=400) {
  g.fillStyle=color;
  g.font=lessonFont(size,face.toLowerCase(),weight);
  g.textAlign=align;
  g.textBaseline='middle';
  g.fillText(String(str),x,y);
}
export function mono(g,str,x,y,size=34,color=C.ink,align='left') {
  txt(g,str,x,y,size,color,align,'Mono');
}
export function line(g,x,y,X,Y,color=C.grid,w=3) {
  g.beginPath(); g.moveTo(x,y); g.lineTo(X,Y); g.strokeStyle=color; g.lineWidth=w; g.stroke();
}
export function path(g,points,fill,stroke,width=3) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  if(fill){g.closePath();g.fillStyle=fill;g.fill();}
  if(stroke){g.lineWidth=width;g.strokeStyle=stroke;g.stroke();}
}
export function rect(g,x,y,w,h,fill,stroke,r=0) {
  g.beginPath();g.roundRect(x,y,w,h,r);
  if(fill){g.fillStyle=fill;g.fill();}
  if(stroke){g.lineWidth=3;g.strokeStyle=stroke;g.stroke();}
}
export function circle(g,x,y,r,fill,stroke) {
  g.beginPath();g.arc(x,y,r,0,2*Math.PI);
  if(fill){g.fillStyle=fill;g.fill();}
  if(stroke){g.lineWidth=3;g.strokeStyle=stroke;g.stroke();}
}
export function bracket(g,x,X,y,color=C.rust,depth=20) {
  path(g,[[x,y-depth],[x,y],[X,y],[X,y-depth]],null,color,5);
}
export function dotline(g,x,y,X,Y,color=C.grid) {
  g.save();g.setLineDash([9,10]);line(g,x,y,X,Y,color,3);g.restore();
}
export function bench(g,section,head) {
  rect(g,0,0,1920,1080,C.paper);
  txt(g,'FlashInfer',92,72,30,C.teal,'left','Serif',600);
  txt(g,section,1828,72,27,C.subtle,'right');
  line(g,92,111,1828,111,C.grid,2);
  txt(g,head,92,185,62,C.ink,'left','Serif',600);
}
export function note(g,text,accent=C.teal) {
  line(g,92,893,1828,893,C.grid,2);
  rect(g,93,920,8,48,accent);
  txt(g,text,128,945,34,C.ink);
}
export function strip(g,x,y,w,h,fill=C.board) {
  const k=16;
  path(g,[[x+k,y],[x+w-k,y],[x+w,y+k],[x+w,y+h-k],[x+w-k,y+h],[x+k,y+h],[x,y+h-k],[x,y+k]],fill);
  for (const dx of [13,w-13]) for (const dy of [14,h-14]) circle(g,x+dx,y+dy,3.5,C.pin);
}
// Each occupied socket carries a logical token and its paired K/V traces.
export function socket(g,x,y,w,h,token,active=false,showToken=true) {
  rect(g,x+3,y,w-6,h,token==null?C.well:active?C.orange:C.mint,null,5);
  if(token==null) {
    for(let a=13;a<w-19;a+=14)line(g,x+a,y+h*.65,x+a+8,y+h*.45,'#49605d',2);
    return;
  }
  const ink=active?'#682a17':C.well;
  if(showToken) mono(g,'t'+token,x+w/2,y+h*.38,Math.min(34,w*.39,h*.4),ink,'center');
  for(let j=0;j<2;j++) {
    const X=x+w*.2,Y=y+h*(.67+j*.12);
    line(g,X,Y,X+w*(j?.43:.60),Y,ink,Math.max(2,h*.035));
  }
}
export function pointer(g,x,y,down,color) {
  const d=down?1:-1;
  path(g,[[x-13,y-18*d],[x+13,y-18*d],[x,y]],color);
}
export const mix=(a,b,t)=>a+(b-a)*t;
export function cue(c,b,words,span=0) {
  const i=c.beat.beatIndex;
  return i===b?c.reveal(words,span):Number(i>b);
}
export function cueThrough(c, beatIndex, phrase) {
  if (c.beat.beatIndex !== beatIndex) return Number(c.beat.beatIndex > beatIndex);
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart: phrase });
}
export const cueEnd = (c, beatIndex, phrase) => cueThrough(c, beatIndex, phrase) === 1;
