export const C = {paper:'#f6efdb', ink:'#18322f', sub:'#48645c', rule:'#91a69a', green:'#166b61', aqua:'#70d8bc', teal:'#249783', blue:'#61adc9', gold:'#ffc577', orange:'#d77a46', red:'#a34133', grey:'#ced9c9', white:'#fffaf0', deep:'#122d2e', violet:'#d1b2d5'};
export function rect(c,x,y,w,h,color) {c.fillStyle=color;c.fillRect(x,y,w,h);}
export function line(c,points,color,width=3) {
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
export function poly(c,points,color) {
  c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
export function text(c,str,x,y,size=40,color=C.ink,opt={}) {
  c.save();const family=opt.face||'Sans', weight=opt.weight||500;
  c.font=weight+' '+size+'px "Lesson '+family+'"';
  const width=c.measureText(String(str)).width;
  if(opt.max && width>opt.max)c.font=weight+' '+Math.floor(size*opt.max/width)+'px "Lesson '+family+'"';
  c.fillStyle=color;c.textAlign=opt.align||'left';c.fillText(String(str),x,y);c.restore();
}
export function mono(c,s,x,y,size=42,color=C.ink,opt={}) {text(c,s,x,y,size,color,{face:'Mono',...opt});}
export function centered(c,s,x,y,size=42,color=C.ink,opt={}) {text(c,s,x,y,size,color,{align:'center',...opt});}
export function plate(c,x,y,w,h,fill,lip=C.rule,cut=12) {
  poly(c,[[x+cut,y+6],[x+w,y+6],[x+w,y+h-cut+6],[x+w-cut,y+h+6],[x,y+h+6],[x,y+cut+6]],lip);
  poly(c,[[x+cut,y],[x+w,y],[x+w,y+h-cut],[x+w-cut,y+h],[x,y+h],[x,y+cut]],fill);
}
export function socket(c,x,y,w,h) {
  for(let i=x+26;i<x+w-15;i+=28){rect(c,i,y-10,9,11,'#b69363');rect(c,i,y+h+5,9,11,'#b69363');}
  plate(c,x,y,w,h,C.deep,'#82968a',18);
}
export function base(c,title,tag,dark=false) {
  const top=dark?'#163731':'#f8f1dd', bottom=dark?'#102b30':'#e2e8d7';
  const g=c.createLinearGradient(0,0,1860,1080);g.addColorStop(0,top);g.addColorStop(1,bottom);rect(c,0,0,1920,1080,g);
  const edge=dark?'#33544a':'#c6d0b8';
  for(let i=0;i<9;i++){
    const x=1120+i*76;
    line(c,[[x,-2],[x,15+i*3],[x+34,49+i*3],[1920,49+i*3]],edge,1.5);
    line(c,[[-5,1002+i*6],[420+i*18,1002+i*6],[464+i*18,1046+i*6],[980,1046+i*6]],edge,2);
  }
  for(let i=0;i<19;i++){rect(c,0,225+35*i,17,9,edge);rect(c,1903,225+35*i,17,9,edge);}
  const light=dark?C.white:C.ink;
  text(c,tag.toUpperCase(),88,87,29,dark?C.aqua:C.green,{weight:700});
  text(c,title,83,180,78,light,{face:'Serif',max:1760});
}
export function footer(c,str,dark=false) {
  const col=dark?C.white:C.ink;
  line(c,[[90,889],[1830,889]],dark?'#46685d':C.rule,2);
  text(c,str,92,954,45,col,{max:1730});
}
export function tag(c,str,x,y,color=C.sub) {text(c,str,x,y,30,color,{weight:700});}
export function on(c,beat,phrase,span=0) {
  const i=c.beat.beatIndex;
  return i===beat ? c.reveal(phrase,span) : Number(i>beat);
}
// Give the spoken answer its own caption boundary. Show its result after the clause.
export function after(c, beat, answer, next) {
  if (c.beat.beatIndex !== beat) return Number(c.beat.beatIndex > beat);
  c.reveal(answer, 0);
  return next ? c.reveal(next, 0) : Number(c.elapsed >= c.speechDuration);
}
export function bracket(c,x0,x1,y,color) {
  line(c,[[x0,y-12],[x0,y],[x1,y],[x1,y-12]],color,4);
}
export function bar(c,x,y,w,h,firstFraction,a=C.blue,b=C.orange){
  rect(c,x,y,w*firstFraction,h,a);rect(c,x+w*firstFraction,y,w*(1-firstFraction),h,b);
}
export function dot(c,x,y,r,color) {c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill();}
