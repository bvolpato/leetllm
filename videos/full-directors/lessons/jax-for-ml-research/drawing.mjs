// Coordinates use the course host's 1920 by 1080 stage.
export const C = {
  paper: '#f5f1e7', white: '#fffcf5', ink: '#152f36', muted: '#52686a', rule: '#b6c1b7',
  teal: '#08776f', pale: '#cbe9dc', violet: '#794878', lilac: '#eadddf',
  amber: '#a14722', peach: '#f4dbbf', dark: '#122e36', glow: '#79ddba',
};
export const clamp = t => Math.min(1, Math.max(0, t));
export const smooth = t => t * t * (3 - 2 * t);
export const fmt = (n, places = 3) => Number(n.toFixed(places)).toString().replace('-', '−');
export const vec = (v, places = 3) => '[' + v.map(n => fmt(n, places)).join(', ') + ']';

export function instrument(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  function cue(beat, phrase, seconds = 0) {
    if (beat !== b) return Number(b > beat);
    return clock.reveal(phrase, seconds);
  }
  function box(x, y, w, h, color, stroke, width = 2) {
    if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.strokeRect(x, y, w, h); }
  }
  function line(points, color = C.rule, width = 3, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
    if (dashed) ctx.setLineDash([12, 11]);
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.restore();
  }
  function dot(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function arrow(x1, y1, x2, y2, color = C.teal, width = 5) {
    line([[x1,y1],[x2,y2]],color,width);
    const a = Math.atan2(y2-y1,x2-x1), len = 18;
    line([[x2-len*Math.cos(a-.48),y2-len*Math.sin(a-.48)],[x2,y2],
          [x2-len*Math.cos(a+.48),y2-len*Math.sin(a+.48)]],color,width);
  }
  function text(value, x, y, size = 42, opts = {}) {
    const {color = C.ink, face = 'Sans', align = 'left', weight = 400, max = 1750} = opts;
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y, max);
  }
  const mono = (v,x,y,size=45,opts={}) => text(v,x,y,size,{face:'Mono',...opts});
  const label = (v,x,y,opts={}) => text(v,x,y,33,{color:C.muted,...opts});
  function title(v, sub) {
    text(v, 94, 101, 69, {face:'Serif',max:1730});
    if (sub) label(sub, 97, 179);
  }
  function fade(a, fn) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
  }
  function cells(values,x,y,{w=112,h=90,fill=C.pale,ink=C.teal,size=46,gap=6}={}) {
    values.forEach((v,i) => {
      box(x+i*(w+gap),y,w,h,Array.isArray(fill)?fill[i]:fill);
      mono(v,x+i*(w+gap)+w/2,y+h/2,size,{color:ink,align:'center',max:w-10});
    });
  }
  function bracket(x1, x2, y, color = C.amber) {
    line([[x1,y-22],[x1,y],[x2,y],[x2,y-22]],color,6);
  }
  function table(headers, rows, xs, {y=300,dy=110,colors=[],widths=[],size=46,hot=-1}={}) {
    const right = 1824;
    headers.forEach((h,j)=>label(h,xs[j],y-44,{max:widths[j]??(xs[j+1]??right)-xs[j]-12}));
    line([[xs[0],y],[right,y]],C.muted,3);
    rows.forEach((row,i)=>{
      if (hot===i) box(xs[0]-12,y+i*dy+3,right-xs[0]+12,dy-4,C.peach);
      row.forEach((v,j)=>mono(v,xs[j],y+(i+.5)*dy,size,{
        color:colors[j]??C.ink,max:widths[j]??(xs[j+1]??right)-xs[j]-15}));
      line([[xs[0],y+(i+1)*dy],[right,y+(i+1)*dy]],C.rule,2);
    });
  }
  function result(name, value, y = 888, color = C.teal) {
    line([[96,y-77],[1824,y-77]],C.rule,2);
    label(name,100,y,{max:565});
    mono(value,695,y,59,{color,max:1110});
  }
  box(0,0,1920,1080,C.paper);
  return {ctx,clock,b,cue,box,line,dot,arrow,text,mono,label,title,fade,cells,bracket,table,result};
}
