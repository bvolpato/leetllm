export const C = {
  night:'#10232c', deep:'#091a22', slate:'#29444d', edge:'#4b6971', light:'#f7efe2',
  muted:'#adc2bf', cyan:'#82d4e6', pass:'#98dfb4', miss:'#ffac93', gold:'#ffd782',
  paper:'#f5ead2', ink:'#21383d', mark:'#925236', teal:'#186c69'
};
export const clamp = n => Math.max(0,Math.min(1,n));
export const ease = n => { const t=clamp(n); return t*t*(3-2*t); };
export const mix = (a,b,t) => a+(b-a)*t;
export const percent = (p,places=1) => (100*p).toFixed(places)+'%';
export const signed = (v,n=2) => Math.abs(v)<1e-10?'0':(v>0?'+':'−')+Math.abs(v).toFixed(n);
export function cue(clock, beat, phrase, seconds=.55) {
  const b=clock.beat.beatIndex;
  return b===beat?ease(clock.reveal(phrase,seconds)):Number(b>beat);
}
export function box(c,x,y,w,h,color,r=0,stroke=null) {
  c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=color; c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1.4;c.stroke();}
}
export function line(c,x,y,x2,y2,col=C.edge,w=2) {
  c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
}
export function dot(c,x,y,r,col) {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill();
}
export function txt(c,s,x,y,size=29,col=C.light,align='left',face='Sans',max=1100) {
  c.fillStyle=col;c.textAlign=align;c.font='400 '+size+'px "Lesson '+face+'"';c.fillText(String(s),x,y,max);
}
export function title(c,s,sub='') {
  txt(c,s,60,86,51,C.light,'left','Serif',1090);
  if(sub)txt(c,sub,62,134,23,C.muted);
}
export function background(c) {
  const g=c.createLinearGradient(0,0,1060,675);
  g.addColorStop(0,'#24444a');g.addColorStop(.47,C.night);g.addColorStop(1,'#0b1c25');
  box(c,0,0,1200,675,g);
}
export function surface(c,x,y,w,h) {
  box(c,x+4,y+9,w,h,'#08171c',7);box(c,x,y,w,h,C.slate,7,C.edge);
  for(const dx of [9,w-9])for(const dy of [9,h-9]){
    dot(c,x+dx,y+dy,3.2,'#829a97');line(c,x+dx-1.7,y+dy+1.6,x+dx+1.7,y+dy-1.6,C.deep,1);
  }
}
export function tape(c,x,y,w,h) {
  box(c,x+3,y+5,w,h,'#091a1e',3);box(c,x,y,w,h,C.paper,3);
  for(let i=12;i<w-8;i+=22){dot(c,x+i,y+8,2.6,C.slate);dot(c,x+i,y+h-8,2.6,C.slate);}
}
export function field(c,v,x,y,w=99,h=62) {
  box(c,x,y,w,h,'#fffaeb',2,C.ink);
  txt(c,v,x+w/2,y+h*.7,h*.58,C.ink,'center','Mono',w-8);
}
export function rack(c,x,y,cols,rows,lit,cell=21,removed=null) {
  const w=cols*cell+42, rh=cell+3;
  surface(c,x,y,w,rows*rh+25);
  for(let row=0;row<rows;row++){
    const yy=y+14+row*rh;
    box(c,x+9,yy-2,w-18,cell+2,'#172f37',2);
    dot(c,x+17,yy+cell/2,2.5,'#91b1ae');
    for(let col=0;col<cols;col++){
      const missing=removed?.(row,col);
      const active=row*cols+col<lit&&!missing;
      const xx=x+28+col*cell;
      box(c,xx,yy+2,cell-4,cell-4,active?'#96dbcc':'#0b1d24',2);
      if(active)box(c,xx+1,yy+3,cell-7,2,'#dbf4d8');
      if(missing)line(c,xx+2,yy+cell-4,xx+cell-6,yy+4,C.miss,1.5);
    }
  }
}
export function strip(c,y,id,content,score=null) {
  tape(c,68,y,785,90);txt(c,id,93,y+57,30,C.teal,'left','Mono');
  txt(c,content,198,y+58,30,C.ink,'left','Mono',624);
  if(score!==null)txt(c,score,1002,y+61,44,C.gold,'center','Mono',248);
}
export function rule(c,x,y,w,t,col=C.cyan) {
  line(c,x,y,x+w,y,C.edge,3);
  for(let i=0;i<=10;i++)line(c,x+i*w/10,y-6,x+i*w/10,y+6,C.edge,1);
  dot(c,x+w*t,y,8,col);
}
export function rows(c,heads,records,xs,{y=204,step=77,widths=[],tone=()=>C.light}={}) {
  heads.forEach((v,i)=>txt(c,v,xs[i],y,22,C.muted,'left','Sans',widths[i]??300));
  line(c,60,y+14,1140,y+14,C.edge);
  records.forEach((row,j)=>{
    const yy=y+step*(j+1);
    row.forEach((v,i)=>txt(c,v,xs[i],yy,29,tone(j,i),'left',i?'Sans':'Mono',widths[i]??300));
    line(c,60,yy+20,1140,yy+20,'#37515a',1);
  });
}
export function arrow(c,x1,y1,x2,y2,col=C.cyan) {
  line(c,x1,y1,x2,y2,col,3);
  const a=Math.atan2(y2-y1,x2-x1);
  line(c,x2,y2,x2-14*Math.cos(a-.45),y2-14*Math.sin(a-.45),col,3);
  line(c,x2,y2,x2-14*Math.cos(a+.45),y2-14*Math.sin(a+.45),col,3);
}
export function note(c,s,y=589,col=C.gold) {txt(c,s,61,y,31,col,'left','Serif',1080);}

