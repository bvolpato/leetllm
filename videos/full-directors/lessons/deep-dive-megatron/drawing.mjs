// The instrument face has a fixed coordinate system so a changed connection is visible.
export const C = {
  bg:'#edf0e9', paper:'#faf9f0', ink:'#183136', sub:'#46636a', quiet:'#bccbc6', edge:'#839d98',
  well:'#20393d', deep:'#132b2e', mint:'#a2e1c7', teal:'#276758', blue:'#4d668f', ice:'#c1d3f6',
  gold:'#ffcf75', brass:'#895322', rust:'#99482f', rose:'#efb49c', white:'#fffdf1'
};
export const tint=[C.mint,C.ice,C.rose,C.gold];
export function txt(c,s,x,y,n=36,color=C.ink,align='left',family='Sans',weight=500) {
  c.fillStyle=color; c.textAlign=align; c.textBaseline='middle'; c.font=weight+' '+n+'px "Lesson '+family+'"'; c.fillText(String(s),x,y);
}
export const mono=(c,s,x,y,n=34,col=C.ink,align='left')=>txt(c,s,x,y,n,col,align,'Mono',500);
export function rect(c,x,y,w,h,color,r=0) {
  if(w<=0 || h<=0) return;
  c.fillStyle=color;
  c.beginPath(); c.roundRect(x,y,w,h,Math.min(r,w/2,h/2)); c.fill();
}
export function line(c,x,y,xx,yy,color=C.edge,w=3) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(xx,yy); c.lineWidth=w; c.strokeStyle=color; c.stroke();
}
export function dot(c,x,y,r,color) {c.beginPath(); c.arc(x,y,r,0,2*Math.PI); c.fillStyle=color; c.fill();}
export function path(c,pts,fill) {c.beginPath(); pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();}
export function screw(c,x,y) {dot(c,x,y,7,'#9aafa8'); line(c,x-3,y+3,x+3,y-3,'#526a65',2);}
export function bed(c,x,y,w,h) {
  rect(c,x+2,y+7,w,h,'#afbeb5',19); rect(c,x,y,w,h,'#ced9d1',19);
  rect(c,x+12,y+12,w-24,h-24,C.well,13);
  for (const a of [x+7,x+w-7]) for(const b of [y+21,y+h-21]) dot(c,a,b,2.3,C.sub);
}
export function tile(c,x,y,w,h,fill=C.mint) {
  rect(c,x,y+6,w,h,'#122e30',7); rect(c,x,y,w,h,fill,7);
  rect(c,x+5,y+3,w-10,2,'#ffffff65',1); rect(c,x+7,y+h-5,w-14,2,'#00000020',1);
}
export function back(c,title,sub) {
  const g=c.createLinearGradient(0,0,1650,1080);g.addColorStop(0,'#fcfaf0');g.addColorStop(1,'#dfe9e4');c.fillStyle=g;c.fillRect(0,0,1920,1080);
  line(c,92,204,1828,204,'#a5b9b2',2);
  txt(c,title,100,88,70,C.ink,'left','Serif',500);txt(c,sub,103,166,32,C.sub);
  for(const [x,y] of [[48,49],[1872,49],[48,1031],[1872,1031]]) screw(c,x,y);
}
export function note(c,s) {rect(c,103,866,9,43,C.brass,3); txt(c,s,137,887,34,C.ink);}
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=p=>p*p*(3-2*p);
export function cue(k,index,phrase,duration=0) {
  const i=k.beat.beatIndex;
  return i>index?1:i<index?0:k.reveal(phrase,duration);
}
export function after(k,index) {
  return k.beat.beatIndex>index || (k.beat.beatIndex===index && k.elapsed>=k.speechDuration);
}
export function arrow(c,x,y,xx,yy,color,w=4) {
  const t=Math.atan2(yy-y,xx-x), l=16;
  line(c,x,y,xx,yy,color,w);
  path(c,[[xx,yy],[xx-l*Math.cos(t-.48),yy-l*Math.sin(t-.48)],[xx-l*Math.cos(t+.48),yy-l*Math.sin(t+.48)]],color);
}
export function alpha(c,a,fn){ if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();}
export function brace(c,x,xx,y,label,color=C.sub,below=true) {
  const d=below?-1:1;line(c,x,y,xx,y,color,3);line(c,x,y,x,y+d*15,color,3);line(c,xx,y,xx,y+d*15,color,3);
  mono(c,label,(x+xx)/2,y-d*32,32,color,'center');
}
export const vec=(row,places=3)=>'['+row.map(v=>String(Number(v.toFixed(places)))).join(',  ')+']';
