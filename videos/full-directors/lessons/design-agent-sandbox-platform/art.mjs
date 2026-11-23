export const C = {
  paper:'#f4f0e6', white:'#fffcf4', ink:'#203239', dim:'#536970', faint:'#cbd1c9', dark:'#20363e',
  dark2:'#324e55', blue:'#246693', ice:'#b0d8de', copper:'#a94726', orange:'#f79b64', pink:'#cc537e',
  teal:'#176858', mint:'#9ad7bb', gold:'#e6c779'
};
export const clamp = n => Math.max(0,Math.min(1,n));
export const ease = p => p*p*(3-2*p);
export const fmt = n => n.toLocaleString('en-US');
export function rect(g,x,y,w,h,fill,stroke=null,r=0,lw=3) {
  g.beginPath(); g.roundRect(x,y,w,h,r);
  if(fill) {g.fillStyle=fill;g.fill();}
  if(stroke) {g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}
}
export function dot(g,x,y,r,fill,stroke=null,lw=3){
  g.beginPath();g.arc(x,y,r,0,Math.PI*2);
  if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}
}
export function type(g,s,x,y,size=36,color=C.ink,face='Sans',weight=500,align='left'){
  g.font=weight+' '+size+'px "Lesson '+face+'"';g.fillStyle=color;g.textAlign=align;g.textBaseline='middle';g.fillText(String(s),x,y);
}
export function line(g,x,y,X,Y,color=C.ink,w=4){
  g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke();
}
export function curve(g,pts,color,w=5){
  g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(pts[0],pts[1]);g.bezierCurveTo(...pts.slice(2));g.stroke();
}
export function ground(g,k,title,subject){
  g.fillStyle=C.paper;g.fillRect(0,0,1920,1080);
  for(let x=45;x<1910;x+=48)for(let y=187;y<894;y+=48){g.fillStyle='#daddd1';g.fillRect(x,y,2,2);}
  type(g,subject,85,57,28,C.dim,'Mono',500);type(g,title,82,130,60,C.ink,'Serif',500);
  line(g,84,185,1836,185,C.faint,2);
}
export function foot(g,primary,detail='',{raised=false}={}){
  const top=raised?806:898;
  rect(g,0,top,1920,1080-top,C.dark);
  type(g,primary,84,raised?832:950,42,C.white,'Sans',600);
  if(detail)type(g,detail,86,raised?880:1014,31,C.ice);
}
export function metal(g,x,y,w,h,fill=C.dark) {
  rect(g,x+6,y+8,w,h,'#c4c8bf',null,19);
  rect(g,x,y,w,h,fill,C.ink,19);
  for(const sx of [x+17,x+w-17])for(const sy of [y+17,y+h-17]){
    dot(g,sx,sy,6,'#aeb9af');line(g,sx-2,sy+2,sx+2,sy-2,C.dim,2);
  }
}
export function chapterCue(clock, index, phrase, duration=0){
  const i=clock.beat.beatIndex;
  return i<index ? 0 : i>index ? 1 : clock.reveal(phrase,duration);
}
export function fileIcon(g,x,y,w,h,body,edge){
  g.beginPath();g.moveTo(x,y);g.lineTo(x+w-25,y);g.lineTo(x+w,y+25);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.closePath();
  g.fillStyle=body;g.fill();g.lineWidth=3;g.strokeStyle=edge;g.stroke();
  line(g,x+w-25,y,x+w-25,y+25,edge,2);line(g,x+w-25,y+25,x+w,y+25,edge,2);
}
