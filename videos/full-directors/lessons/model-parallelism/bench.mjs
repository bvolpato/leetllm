export const paper = '#f5eddb', faint = '#b3bec1', base = '#121b25', surface = '#202d3a';
export const gold = '#ffcc78', violet = '#c6adff', mint = '#82dec9', rose = '#ffa288';
export const ranks = [violet, mint];
export const palette = [violet, mint, gold, '#e9a5ca'];
export const mix = (from, to, p) => from + (to - from) * p;
export const between = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const smooth = p => p * p * (3 - 2 * p);
export const num = v => String(Number(v.toFixed(4))).replace('-', '−');
export const vec = a => '[ ' + a.map(num).join(' , ') + ' ]';

export function mark(c, content, x, y, size = 40, color = paper, align = 'left', face = 'Sans', weight = 500) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(content), x, y);
}
export function mono(c, value, x, y, size = 48, color = paper, align = 'center') {
  mark(c, value, x, y, size, color, align, 'Mono');
}
export function box(c, x, y, w, h, fill = surface, edge = null, radius = 12, width = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(radius, w/2, h/2));
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = width;
    c.stroke();
  }
}
export function wire(c, points, color = faint, width = 4, dashed = false) {
  c.beginPath();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dashed ? [8, 11] : []);
  c.stroke();
  c.setLineDash([]);
}
export function dot(c, x, y, radius, fill) {
  c.beginPath(); c.arc(x, y, radius, 0, 2*Math.PI); c.fillStyle = fill; c.fill();
}
export function lamp(c, x, y, radius, color) {
  dot(c,x,y,radius+5,'#09121b');
  dot(c,x,y,radius,color);
  dot(c,x-radius*.22,y-radius*.28,radius*.25,'#ffffff99');
}
export function label(c, txt, x, y, color = faint, align = 'left') {
  mark(c,txt,x,y,30,color,align,'Sans',600);
}
export function panel(c,x,y,w,h,color = '#63717b') {
  box(c,x+4,y+7,w,h,'#09121a',null,18);
  box(c,x,y,w,h,surface,color,18,2);
  for (const dx of [15,w-15]) for (const dy of [15,h-15]) dot(c,x+dx,y+dy,3.5,'#809099');
}
export function bench(c, category, title) {
  const gradient = c.createLinearGradient(0,0,1500,1080);
  gradient.addColorStop(0,'#25323c'); gradient.addColorStop(.56,base); gradient.addColorStop(1,'#0b151e');
  c.fillStyle=gradient; c.fillRect(0,0,1920,1080);
  label(c,category,86,76,mint);
  mark(c,title,82,167,72,paper,'left','Serif',500);
  wire(c,[[84,229],[1836,229]],'#50616c',2);
}
export function note(c, txt, color = paper) {
  mark(c,txt,960,922,40,color,'center','Serif');
}
export function show(c,alpha,fn) {
  if(alpha<=0) return;
  c.save(); c.globalAlpha*=alpha; fn(); c.restore();
}
export function event(clock, beat, phrase, duration = .6) {
  if(clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  return clock.reveal(phrase,duration);
}
export function socket(c,value,x,y,w=108,h=86,color=paper,active=true) {
  box(c,x,y,w,h,active ? '#273642' : '#1a2630',active ? color : '#475761',9,active?2.6:1.6);
  if(value!==null && value!==undefined) mono(c,value,x+w/2,y+h/2,Math.min(46,w*.49,h*.56),active ? color : faint);
}
export function matrix(c, rows, x,y, w,h, colors=paper, select=()=>true,gap=8) {
  rows.forEach((row,i)=>row.forEach((v,j)=>{
    const color=typeof colors==='function'?colors(i,j):colors;
    socket(c,typeof v==='number'?num(v):v,x+j*(w+gap),y+i*(h+gap),w,h,color,select(i,j));
  }));
}
export function bar(c, x, y, w, h, max, segments) {
  box(c,x,y,w,h,'#0d1720','#586b75',3);
  let start=x;
  for(const {value,color} of segments) {
    const len=w*value/max;
    if(len>0) { c.fillStyle=color; c.fillRect(start,y+2,len,h-4); }
    start+=len;
  }
}
