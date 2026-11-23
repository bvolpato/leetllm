export const C = {
  paper: '#f4f1e7', ink: '#162f32', muted: '#526864', light: '#d6ded2', line: '#a7b8ac',
  board: '#193d3a', rail: '#30514c', mint: '#a9e4b5', green: '#146a55', blue: '#4377a1',
  paleBlue: '#d9e4e9', rust: '#aa4328', orange: '#f78b50', gold: '#c4a15e',
  cream: '#fffaf0', dim: '#b8ccbf', dark: '#294841'
};
export function words(c, s, x, y, size = 18, color = C.ink, opt = {}) {
  c.save();
  c.font = `${opt.bold ? 700 : 400} ${size}px "Lesson ${opt.font || 'Sans'}"`;
  c.textAlign = opt.align || 'left';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
  c.restore();
}
export function mono(c, s, x, y, size = 15, color = C.muted, align = 'left') {
  words(c, s, x, y, size, color, { font: 'Mono', align });
}
export function rect(c, x, y, w, h, fill, stroke, weight = 1) {
  if (fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight; c.strokeRect(x, y, w, h); }
}
export function line(c, points, color = C.line, weight = 1, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = weight;
  c.setLineDash(dash);
  c.lineJoin = 'round';
  c.beginPath();
  for (const [i, [x,y]] of points.entries()) {
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}
export function dot(c,x,y,r,fill,stroke) {
  c.beginPath(); c.arc(x,y,r,0,Math.PI*2);
  if (fill) {c.fillStyle=fill; c.fill();}
  if (stroke) {c.lineWidth=1.4; c.strokeStyle=stroke; c.stroke();}
}
export function hatch(c,x,y,w,h,color,step=6) {
  if(w<=0) return;
  c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip();
  for(let k=-h; k<w; k+=step) line(c, [[x+k,y+h],[x+k+h,y]],color,1.2);
  c.restore();
}
export function board(c,x,y,w,h) {
  rect(c,x,y,w,h,C.board);
  for (const dx of [9,w-9]) for(const dy of [9,h-9]) {
    dot(c,x+dx,y+dy,3,C.gold); dot(c,x+dx,y+dy,1.3,C.board);
  }
}
export function header(c, title, context) {
  words(c,context,46,51,16,C.green,{font:'Mono'});
  line(c,[[46,60],[914,60]],C.line);
  words(c,title,44,97,38,C.ink,{font:'Serif',bold:true});
}
export function foot(c,main,sub='') {
  line(c,[[46,420],[914,420]],C.line);
  words(c,main,46,444,23,C.ink,{bold:true});
  if(sub) words(c,sub,46,470,16,C.muted);
}
export const clamp = n=>Math.max(0,Math.min(1,n));
export const lerp = (a,b,t)=>a+(b-a)*t;
export const smooth = t=>t*t*(3-2*t);
export function cue(k, beat, phrase, span=0) {
  if(k.beat.beatIndex < beat) return 0;
  if(k.beat.beatIndex > beat) return 1;
  return k.reveal(phrase,span);
}
export function pointOn(points, t) {
  const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
  let left=t*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++) {
    if(left<=lengths[i] || i===lengths.length-1) {
      const q=clamp(left/lengths[i]); return [lerp(points[i][0],points[i+1][0],q),lerp(points[i][1],points[i+1][1],q)];
    }
    left-=lengths[i];
  }
}
export function packet(c,points,t,label) {
  const [x,y]=pointOn(points,t);
  rect(c,x-19,y-13,38,26,C.cream,C.green,2);
  mono(c,label,x,y+5,14,C.green,'center');
}
export const f2=n=>n.toFixed(2);

