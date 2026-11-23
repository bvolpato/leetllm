export const P = {
  ink:'#19383c', soft:'#536e6e', paper:'#fff9e7', ground:'#eee9d8', edge:'#bbb9a4',
  teal:'#126d67', mint:'#bfe0ce', rust:'#a43c26', coral:'#f3bc99', gold:'#efb85e',
  navy:'#284963', blue:'#c0d8e6', white:'#fffdf1', night:'#15383e',
};
export const mix = (a,b,t) => a+(b-a)*t;
export const clip = x => Math.max(0,Math.min(1,x));
export const smooth = x => { const t=clip(x); return t*t*(3-2*t); };
export const phase = (k,i,phrase,d=.55) => k.beat.beatIndex<i ? 0 : k.beat.beatIndex>i ? 1 : smooth(k.reveal(phrase,d));
export const fixed = (x,p=2) => Number(x.toFixed(p)).toFixed(p).replace('-','−');
export function box(c,x,y,w,h,fill,edge=null,r=0,thick=1.6){
  c.beginPath(); c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}
  if(edge){c.lineWidth=thick;c.strokeStyle=edge;c.stroke();}
}
export function circle(c,x,y,r,fill,edge=null,thick=2){
  c.beginPath();c.arc(x,y,r,0,2*Math.PI);
  if(fill){c.fillStyle=fill;c.fill();}
  if(edge){c.lineWidth=thick;c.strokeStyle=edge;c.stroke();}
}
export function path(c,points,color,width=2,dash=[]){
  c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.lineJoin='round';c.lineCap='round';
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
}
export function text(c,s,x,y,size=26,color=P.ink,align='left',family='Sans',weight=500){
  c.font=weight+' '+size+'px "Lesson '+family+'"';c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(String(s),x,y);
}
export const mid=(c,s,x,y,size=26,color=P.ink)=>text(c,s,x,y,size,color,'center');
export const mono=(c,s,x,y,size=23,color=P.ink,align='left')=>text(c,s,x,y,size,color,align,'Mono');
export const serif=(c,s,x,y,size=38,color=P.ink,align='left')=>text(c,s,x,y,size,color,align,'Serif');
export function leaf(c,x,y,w,h,fill=P.paper,edge=P.edge){
  box(c,x+4,y+6,w,h,'#243d3520',null,5);box(c,x,y,w,h,fill,edge,5);
}
export function tag(c,s,x,y,w,fill=P.teal,color=P.white,h=43){
  box(c,x,y,w,h,fill,null,4);mid(c,s,x+w/2,y+h*.68,Math.min(24,h*.53),color);
}
export function arrow(c,x,y,u,v,color=P.teal,width=4){
  const a=Math.atan2(v-y,u-x);
  path(c,[[x,y],[u,v]],color,width);
  path(c,[[u-14*Math.cos(a-.45),v-14*Math.sin(a-.45)],[u,v],[u-14*Math.cos(a+.45),v-14*Math.sin(a+.45)]],color,width);
}
export function scene(c,title,kicker,dark=false){
  const g=c.createLinearGradient(0,0,1240,760);
  g.addColorStop(0,dark?'#254a50':'#fffae8');g.addColorStop(1,dark?'#0e2c31':'#e4dfcc');
  c.fillStyle=g;c.fillRect(0,0,1280,720);
  for(let i=0;i<110;i++){const x=(i*619)%1280,y=(i*379)%720;path(c,[[x,y],[x+3+i%6,y+.6]],dark?'#d8eee00b':'#5a60530d',1);}
  text(c,kicker,54,60,20,dark?'#a9cdc1':P.teal,'left','Mono',600);
  serif(c,title,51,128,52,dark?P.paper:P.ink);
}
export function clockface(c,x,y,r,minutes){
  circle(c,x+3,y+6,r+10,'#122b2b52');circle(c,x,y,r+10,'#aa9467',P.ink,3);circle(c,x,y,r+3,P.paper,P.ink,3);
  for(let i=0;i<60;i++){
    const a=i*Math.PI/30-Math.PI/2,major=i%5===0;
    const pt=(s)=>[x+s*Math.cos(a),y+s*Math.sin(a)];
    path(c,[pt(r-4),pt(r-(major?18:10))],major?P.ink:P.edge,major?3.4:1.6);
    if(major){const [u,v]=pt(r-37);mid(c,i===0?12:i/5,u,v+9,25);}
  }
  function hand(a,len,w,col){
    const theta=a-Math.PI/2;path(c,[[x-10*Math.cos(theta),y-10*Math.sin(theta)],[x+len*Math.cos(theta),y+len*Math.sin(theta)]],col,w);
  }
  hand(minutes*Math.PI/360,r*.54,9,P.ink);hand(minutes*Math.PI/30,r*.76,5,P.rust);
  circle(c,x,y,8,P.gold,P.ink,2);
}
export function seal(c,x,y,locked=true,size=1){
  c.save();c.translate(x,y);c.scale(size,size);
  c.strokeStyle='#b49e6f';c.lineWidth=5;c.beginPath();c.moveTo(-10,0);c.lineTo(-10,-9);c.arc(0,-9,10,Math.PI,2*Math.PI);c.lineTo(10,0);c.stroke();
  box(c,locked?-16:-20,-6,32,26,locked?P.gold:P.blue,P.ink,3);
  circle(c,locked?0:-4,5,3,P.ink);c.restore();
}
export function punch(c,x,y,s,fill=P.mint,w=86){
  leaf(c,x,y,w,54,fill);circle(c,x+10,y+9,2.6,P.edge);
  mid(c,s,x+w/2,y+37,25);
}
export function boundBook(c,x,y,w,h,id,subtitle,col=P.teal){
  box(c,x+6,y+8,w,h,'#132e3055',null,5);
  box(c,x,y+5,w,h,P.paper,P.ink,5);box(c,x,y,w,h-6,col,P.ink,5);
  path(c,[[x+18,y+2],[x+18,y+h-9]],'#ffffff70',2);
  serif(c,id,x+30,y+h*.50,Math.min(60,h*.46),P.paper);
  if(subtitle)text(c,subtitle,x+30,y+h*.78,Math.min(22,h*.18),P.paper);
}
export function result(c,label,value,x,y,col=P.ink){
  text(c,label,x,y,22,col);serif(c,value,x,y+57,50,col);
}

