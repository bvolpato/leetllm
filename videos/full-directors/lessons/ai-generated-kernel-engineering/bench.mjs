export const C = {
  paper: '#f5f2e9', white: '#fffcf4', ink: '#192f33', sub: '#4b6464', line: '#b9c6bd',
  panel: '#173539', panel2: '#214349', panelLine: '#426367', soft: '#bfd5cc',
  mint: '#93e1c0', teal: '#19715e', aqua: '#cae9db', rust: '#ae4c27', copper: '#ffab78',
  peach: '#f6dfce', blue: '#386382', wash: '#dce8ed', muted: '#82928b',
};
const clamp = x => Math.max(0, Math.min(1, x));
export const count = (progress, n) => Math.min(n, Math.floor(clamp(progress) * n + 0.000001));
export const cue = (clock, phrase, duration = 0) => clock.reveal(phrase, duration);
export function tag(c, value, x, y, color = C.sub) {
  text(c, value.toUpperCase(), x, y, 25, color, 'left', 'Sans', 700);
}
export function text(c, value, x, y, size = 40, color = C.ink, align = 'left', family = 'Sans', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(value), x, y);
}
export function number(c, value, x, y, size = 48, color = C.ink, align = 'left') {
  text(c, value, x, y, size, color, align, 'Mono', 500);
}
export function box(c, x, y, w, h, color, edge = null, radius = 10) {
  c.beginPath(); c.roundRect(x, y, w, h, radius);
  if (color) { c.fillStyle = color; c.fill(); }
  if (edge) { c.lineWidth = 2; c.strokeStyle = edge; c.stroke(); }
}
export function line(c,x,y,x2,y2,color=C.line,width=3,dash=[]) {
  c.save(); c.setLineDash(dash); c.strokeStyle=color; c.lineWidth=width;
  c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.stroke(); c.restore();
}
export function dot(c,x,y,r,color,edge) {
  c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=color; c.fill();
  if (edge) {c.strokeStyle=edge; c.lineWidth=3; c.stroke();}
}
export function arrow(c,x,y,x2,y2,color=C.teal,width=5) {
  line(c,x,y,x2,y2,color,width);
  const a=Math.atan2(y2-y,x2-x);
  line(c,x2,y2,x2-16*Math.cos(a-0.48),y2-16*Math.sin(a-0.48),color,width);
  line(c,x2,y2,x2-16*Math.cos(a+0.48),y2-16*Math.sin(a+0.48),color,width);
}
export function header(c, section, title) {
  c.fillStyle=C.paper; c.fillRect(0,0,1920,1080);
  tag(c,section,100,85,C.teal);
  text(c,title,96,182,69,C.ink,'left','Serif');
  line(c,100,220,1820,220,C.line,2);
}
export function foot(c, left, right='', color=C.teal) {
  line(c,100,881,1820,881,C.line,2);
  text(c,left,100,943,37,color,'left','Sans',600);
  if(right) text(c,right,1820,941,30,C.sub,'right');
}
export function display(c,x,y,w,h) {
  box(c,x,y,w,h,C.panel,null,18);
}
export function scale(c,x,y,w,min,max,steps,format=String,color=C.sub) {
  line(c,x,y,x+w,y,color,3);
  for(let i=0;i<=steps;i++){
    const xx=x+w*i/steps;
    line(c,xx,y-10,xx,y+10,color,3);
    number(c,format(min+(max-min)*i/steps),xx,y+50,26,color,'center');
  }
}
export function cell(c,x,y,w,h,v,fill=C.white,ink=C.ink,edge=C.line,size=44) {
  box(c,x,y,w,h,fill,edge,6);
  number(c,v,x+w/2,y+h/2+size*0.32,size,ink,'center');
}
export function strip(c,values,x,y,w,h,{active=[],bad=[],dark=false,labelSize=44}={}) {
  const gap=8, cw=(w-(values.length-1)*gap)/values.length;
  values.forEach((v,i)=>{
    const hi=active.includes(i),warn=bad.includes(i);
    cell(c,x+i*(cw+gap),y,cw,h,v,warn?C.peach:hi?C.aqua:dark?C.panel2:C.white,
      warn?C.rust:hi?C.teal:dark?C.white:C.ink,warn?C.rust:hi?C.teal:dark?C.panelLine:C.line,labelSize);
  });
}
export function bracket(c,x,y,w,label,color=C.sub) {
  line(c,x,y,x,y+12,color);line(c,x,y+12,x+w,y+12,color);line(c,x+w,y+12,x+w,y,color);
  text(c,label,x+w/2,y+55,30,color,'center');
}
