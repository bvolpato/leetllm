export const C = {
  page: '#f7f2e7', ink: '#193234', soft: '#526963', edge: '#b3b9ab', rule: '#d4d6c7',
  teal: '#176d65', mint: '#b6e0be', dark: '#183f41', dark2: '#244c4c', ghost: '#80948c',
  warm: '#bd6034', cream: '#fff9ec', gold: '#f1b966', red: '#a34430', pale: '#f1d8c5',
};
export const ease = t => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;
export const num = v => String(v).replace('-', '−');
export const signed = v => v > 0 ? '+' + num(v) : num(v);
export function text(g, s, x, y, size = 23, color = C.ink, family = 'Sans', align = 'left', weight = 400) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  g.fillText(String(s), x, y);
}
export function box(g, x, y, w, h, fill, r = 0, edge = null, width = 1) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (edge) { g.strokeStyle = edge; g.lineWidth = width; g.stroke(); }
}
export function line(g, x, y, x2, y2, color = C.edge, width = 2, dash = []) {
  g.save(); g.beginPath(); g.setLineDash(dash); g.moveTo(x,y); g.lineTo(x2,y2);
  g.strokeStyle = color; g.lineWidth = width; g.stroke(); g.restore();
}
export function dot(g, x, y, r, color, stroke = null) {
  g.beginPath(); g.arc(x,y,r,0,2*Math.PI); g.fillStyle = color; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
}
export function poly(g, points, fill) {
  g.beginPath(); points.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
  g.closePath(); g.fillStyle=fill; g.fill();
}
export function fade(g, opacity, fn) {
  if (opacity <= 0) return;
  g.save(); g.globalAlpha *= opacity; fn(); g.restore();
}
export function arrow(g, x1, y, x2, col, width = 3) {
  const s = x2 > x1 ? 1 : -1;
  line(g,x1,y,x2-9*s,y,col,width);
  poly(g,[[x2,y],[x2-11*s,y-6],[x2-11*s,y+6]],col);
}
export function header(g, section, title, sub) {
  box(g,0,0,1280,720,C.page);
  line(g,48,58,1232,58,C.edge,1);
  text(g,'TINKER   /   '+section.toUpperCase(),50,34,17,C.teal,'Mono','left',600);
  text(g,title,48,106,49,C.ink,'Serif');
  if(sub) text(g,sub,50,165,24,C.soft);
}
export function footer(g, s, col = C.teal) {
  line(g,50,605,1230,605,C.edge,1);
  box(g,50,623,5,27,col,2);
  text(g,s,68,638,23,col,'Sans','left',600);
}
export function plate(g,x,y,w,h) {
  box(g,x+2,y+5,w,h,'#c5c8b7',12);
  box(g,x,y,w,h,C.dark,12);
  for(const sx of [x+14,x+w-14]) for(const sy of [y+14,y+h-14]) {
    dot(g,sx,sy,4,'#74938a'); line(g,sx-2,sy+1,sx+2,sy-1,C.dark,1);
  }
}
// The two jaws mark the inclusive range on a single calibrated output rail.
export function gauge(g,x,y,w,h,fixture,result,options={}) {
  const {tag='LOCAL CLAMP FIXTURE', expect=false, trace=1, input=true, showVerdict=true} = options;
  const {lo,hi,x:inputValue,expected} = fixture;
  plate(g,x,y,w,h);
  const left=x+52, right=x+w-48, rail=y+h*0.58, pos=v=>lerp(left,right,(v+1)/5);
  text(g,tag,x+30,y+30,18,C.mint,'Mono','left',600);
  box(g,left,rail-11,right-left,22,'#d9daca',4);
  box(g,pos(lo),rail-11,pos(hi)-pos(lo),22,'#9cd5b1');
  for(let i=-4;i<=16;i++){
    const p=pos(i/4), whole=i%4===0;
    line(g,p,rail-9,p,rail+(whole?8:0),'#506e64',whole?2:1);
    if(whole) text(g,num(i/4),p,rail+34,20,C.cream,'Mono','center');
  }
  for (const [v,dir] of [[lo,1],[hi,-1]]) {
    const px=pos(v);
    poly(g,[[px,rail+10],[px,rail-24],[px-dir*12,rail-36],[px-dir*18,rail-36],[px-dir*18,rail+10]],'#77c8a9');
    line(g,px,rail-19,px,rail+10,C.mint,2);
  }
  if(input) fade(g,Number(input),()=>{
    const px=pos(inputValue);
    text(g,'x = '+inputValue,px,rail-79,23,C.gold,'Mono','center',600);
    line(g,px,rail-57,px,rail-23,C.gold,2);
    poly(g,[[px,rail-12],[px-7,rail-24],[px+7,rail-24]],C.gold);
  });
  if(expect) text(g,'target '+expected,pos(expected)-8,rail-49,18,C.mint,'Mono','right');
  if(result) fade(g,trace,()=>{
    const px=pos(result.value);
    const col=showVerdict?(result.passed?C.mint:'#ffad85'):C.cream;
    line(g,px,rail+12,px,rail+20,col,2);
    line(g,px,rail+47,px,rail+61,col,2);
    dot(g,px,rail+1,9,col,C.dark);
    text(g,'out '+result.value,px,rail+79,24,col,'Mono','center',600);
  });
}
export function ticket(g,x,y,w,h,fill,border=C.edge) {
  box(g,x+1,y+3,w,h,'#d0cebe',6);
  box(g,x,y,w,h,fill,6,border);
  for(const px of [x+11,x+w-11]) {
    dot(g,px,y+9,2.5,C.page); dot(g,px,y+h-9,2.5,C.page);
  }
}
export function token(g,x,y,w,h,value,action,caption) {
  ticket(g,x,y,w,h,action?'#eeb979':'#c7dcd1',action?'#c19058':'#94b4a1');
  text(g,num(value),x+w/2,y+h*(caption?0.43:0.5),caption?39:34,C.ink,'Mono','center',600);
  if(caption) text(g,caption,x+w/2,y+h*0.78,18,C.ink,'Sans','center');
}
// A cue only belongs to its own beat. Past cues remain settled on a seek.
export function cues(clock) {
  const b=clock.beat.beatIndex;
  return (beat,phrase,span=0) => b===beat ? clock.reveal(phrase,span) : Number(b>beat);
}
