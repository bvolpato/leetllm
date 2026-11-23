export const paper = {
  bg: '#fcf5e9', wash: '#e5d9e1', ink: '#2c2835', soft: '#625864',
  rule: '#b7a6ac', field: '#ece2df', blue: '#205b70', pale: '#c9dee1',
  red: '#a33225', gold: '#8b591c', green: '#206554', white: '#fffaf2',
};
export const night = {
  bg: '#182936', wash: '#14222d', ink: '#fff3d9', soft: '#c3c9c5',
  rule: '#61747c', field: '#283e48', blue: '#84d5dc', pale: '#345961',
  red: '#ffa48c', gold: '#e7bc70', green: '#9bd5ae', white: '#132732',
};

export function txt(g, value, x, y, size, color, options = {}) {
  const { family = 'Sans', weight = 400, align = 'left', max = 1700 } = options;
  let fitted = size;
  g.font = weight + ' ' + fitted + 'px "Lesson ' + family + '"';
  while (g.measureText(String(value)).width > max && fitted > 18) {
    fitted -= 1;
    g.font = weight + ' ' + fitted + 'px "Lesson ' + family + '"';
  }
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(value), x, y);
}
export const mono = (g, v, x, y, sz, color, align='left', max=1700) =>
  txt(g,v,x,y,sz,color,{family:'Mono',align,max});
export const serif = (g, v, x, y, sz, color, max=1720, align='left') =>
  txt(g,v,x,y,sz,color,{family:'Serif',max,align});
export function line(g,x,y,x2,y2,color,w=3) {
  g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.strokeStyle=color; g.lineWidth=w; g.stroke();
}
export function box(g,x,y,w,h,color,r=0) {
  if (w <= 0 || h <= 0) return;
  g.beginPath(); g.roundRect(x,y,w,h,Math.min(r,h/2,w/2)); g.fillStyle=color; g.fill();
}
export function dot(g,x,y,r,color) {
  g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle=color; g.fill();
}
export function page(g,t,context,title) {
  const fill=g.createLinearGradient(0,0,1700,1060);
  fill.addColorStop(0,t.wash); fill.addColorStop(.65,t.bg);
  g.fillStyle=fill; g.fillRect(0,0,1920,1080);
  mono(g,context,92,90,33,t.soft);
  serif(g,title,88,198,77,t.ink);
  line(g,92,238,1828,238,t.rule,2);
}
export function bottom(g,t,text) {
  line(g,92,862,1828,862,t.rule,2);
  txt(g,text,92,927,43,t.ink,{max:1740});
}
export function bracket(g,x1,x2,y,text,color,above=false) {
  const tick=above?-16:16;
  line(g,x1,y,x2,y,color,4); line(g,x1,y,x1,y+tick,color,4); line(g,x2,y,x2,y+tick,color,4);
  mono(g,text,(x1+x2)/2,y+(above?-19:50),37,color,'center');
}
export function cue(clock, beat, phrase, seconds=0) {
  if (clock.beat.beatIndex !== beat) return clock.beat.beatIndex > beat ? 1 : 0;
  return clock.reveal(phrase,seconds);
}
export function opacity(g,alpha,draw) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; draw(); g.restore();
}
export function wave(g, peaks, x, y, width, height, color, fraction=1) {
  const n=Math.min(peaks.length,Math.ceil(peaks.length*fraction));
  g.beginPath(); g.moveTo(x,y);
  const scale=height/32768;
  for(let i=0;i<n;i++) g.lineTo(x+(i+.5)*width/peaks.length,y-peaks[i][1]*scale);
  for(let i=n-1;i>=0;i--) g.lineTo(x+(i+.5)*width/peaks.length,y-peaks[i][0]*scale);
  g.closePath(); g.fillStyle=color; g.fill();
}
