export const C={
  paper:'#f5f0e5',white:'#fffcf5',ink:'#182f36',muted:'#52676a',line:'#a3b0a6',
  fine:'#d1d4c8',teal:'#006d6c',mint:'#b9d9ca',blue:'#264f93',sky:'#cedbf0',
  red:'#a13d27',salmon:'#f0c5b3',gold:'#d59a46',dark:'#153941',pale:'#dae6dc',
};
export function rect(g,x,y,w,h,fill,stroke=null,lw=2) {
  g.fillStyle=fill; g.fillRect(x,y,w,h);
  if(stroke){g.lineWidth=lw; g.strokeStyle=stroke; g.strokeRect(x,y,w,h);}
}
export function path(g,points,color,width=3,fill=false) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  if(fill){g.closePath();g.fillStyle=color;g.fill();}
  else {g.lineWidth=width;g.strokeStyle=color;g.stroke();}
}
export const line=(g,x,y,xx,yy,c=C.line,w=2)=>path(g,[[x,y],[xx,yy]],c,w);
export function dot(g,x,y,r,fill,stroke=null,lw=3) {
  g.beginPath();g.arc(x,y,r,0,2*Math.PI);g.fillStyle=fill;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}
}
export function txt(g,str,x,y,size=36,{color=C.ink,family='Sans',weight=400,align='left'}={}) {
  g.font=weight+' '+size+'px "Lesson '+family+'"';g.textAlign=align;
  g.textBaseline='middle';g.fillStyle=color;g.fillText(String(str),x,y);
}
export const mono=(g,s,x,y,size=34,color=C.ink,align='left')=>txt(g,s,x,y,size,{family:'Mono',color,align});
export const title=(g,s,x,y,size=62,color=C.ink,align='left')=>txt(g,s,x,y,size,{family:'Serif',color,align});
export const label=(g,s,x,y,color=C.muted)=>txt(g,s,x,y,29,{weight:700,color});
export function arrow(g,x,y,xx,yy,color=C.teal,w=5,headLength=14) {
  const ang=Math.atan2(yy-y,xx-x);
  line(g,x,y,xx,yy,color,w);
  path(g,[[xx,yy],[xx-headLength*Math.cos(ang-.53),yy-headLength*Math.sin(ang-.53)],
    [xx-headLength*Math.cos(ang+.53),yy-headLength*Math.sin(ang+.53)]],color,1,true);
}
export function paper(g,x,y,w,h,fill=C.white,fold=38) {
  path(g,[[x+7,y+8],[x+w-fold+7,y+8],[x+w+7,y+fold+8],[x+w+7,y+h+8],[x+7,y+h+8]],C.fine,1,true);
  const points=[[x,y],[x+w-fold,y],[x+w,y+fold],[x+w,y+h],[x,y+h],[x,y]];
  path(g,points,fill,1,true);path(g,points,C.line,2);
  path(g,[[x+w-fold,y],[x+w-fold,y+fold],[x+w,y+fold]],C.fine,1,true);
}
export function base(g,kicker,heading) {
  rect(g,0,0,1920,1080,C.paper);rect(g,72,73,12,42,C.teal);
  label(g,kicker,106,96);title(g,heading,72,184,71);
  line(g,72,250,1848,250,C.ink,3);
}
export function note(g,s,color=C.teal) {
  line(g,72,855,1848,855,C.line);
  rect(g,72,886,10,40,color);
  txt(g,s,106,907,34,{weight:600,color});
}
export function codeRow(g,code,x,y,w,active=false) {
  if(active){rect(g,x-13,y-31,w,62,C.mint);rect(g,x-13,y-31,8,62,C.teal);}
  mono(g,code,x+8,y,34);
}
