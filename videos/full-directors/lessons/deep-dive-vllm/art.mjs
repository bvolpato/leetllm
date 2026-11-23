// The copper contacts under each position stand for stored keys and values.
export const ink = '#182f33', paper = '#f4f0e5', cream = '#fffdf3', dim = '#4c6466';
export const blue = '#185d77', red = '#ac482e', green = '#22725d', gold = '#8b5f1d';
export const line = '#a3b2a9', light = '#dce3d8', bluePale = '#cfe3e8', redPale = '#ead7ca';
export const clamp = t => Math.max(0, Math.min(1,t));
export const smooth = t => { t = clamp(t); return t*t*(3-2*t); };

export function txt(c, value, x, y, size=34, color=ink, options={}) {
  c.fillStyle=color;
  c.font=`${options.bold?700:400} ${size}px "Lesson ${options.font??'Sans'}"`;
  c.textAlign=options.align??'left';
  c.textBaseline='middle';
  c.fillText(String(value),x,y);
}
export function mid(c,t,x,y,size=32,color=ink,font='Sans',bold=false) {
  txt(c,t,x,y,size,color,{align:'center',font,bold});
}
export function cap(c,t,x,y,color=dim,size=25) {
  txt(c,t,x,y,size,color,{font:'Mono'});
}
export function box(c,x,y,w,h,fill,stroke=null,r=0,sw=2) {
  c.beginPath(); c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.lineWidth=sw;c.strokeStyle=stroke;c.stroke();}
}
export function path(c,points,color,width=3) {
  c.beginPath();c.moveTo(...points[0]);
  for(const point of points.slice(1)) c.lineTo(...point);
  c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();
}
export function dot(c,x,y,r,color) {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
}
export function wire(c,x,y,tx,ty,color,width=4) {
  c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x,(y+ty)/2,tx,(y+ty)/2,tx,ty);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();dot(c,tx,ty,6,color);
}

export function header(c,section,title) {
  c.fillStyle=paper;c.fillRect(0,0,1920,1080);
  cap(c,'vLLM   /   '+section,88,68,dim,27);
  path(c,[[88,104],[1832,104]],line,2);
  txt(c,title,86,174,66,ink,{font:'Serif'});
}
export function note(c,t,detail='',accent=blue) {
  path(c,[[90,823],[1830,823]],line,2);
  box(c,90,851,7,detail?90:56,accent);
  txt(c,t,120,879,42,ink,{font:'Serif'});
  if(detail)txt(c,detail,121,935,29,dim);
}
export function tag(c,text,x,y,color=blue,w=120) {
  box(c,x,y,w,46,color,null,4);mid(c,text,x+w/2,y+24,26,cream,'Mono',true);
}
export function cell(c,text,x,y,w,h,fill=cream,edge=line,fg=ink,size=33) {
  box(c,x,y+4,w,h,'#b7bfb4',null,5);box(c,x,y,w,h,fill,edge,5);
  if(text!=='' && text!==null)mid(c,text,x+w/2,y+h/2,size,fg,'Serif');
}
export function empty(c,x,y,w,h) {
  c.save();c.setLineDash([8,7]);box(c,x,y,w,h,null,line,5,2);c.restore();
}
export function bracket(c,x1,x2,y,label,color=dim) {
  path(c,[[x1,y-12],[x1,y],[x2,y],[x2,y-12]],color,3);
  mid(c,label,(x1+x2)/2,y+27,25,color,'Mono');
}

// A field-guide engraving beside the sentence whose tokens the lesson follows.
export function finch(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  path(c,[[-106,76],[-34,64],[35,67],[100,53]],dim,6);
  path(c,[[-69,71],[-90,55]],dim,3);
  for(const k of [-10,11]) {
    path(c,[[k,38],[k-2,62],[k+12,66]],ink,3);
    path(c,[[k-2,62],[k-12,66]],ink,3);
  }
  c.beginPath();c.moveTo(-88,28);c.quadraticCurveTo(-56,16,-36,-4);
  c.bezierCurveTo(-12,-18,-3,-44,24,-46);c.bezierCurveTo(48,-47,59,-34,58,-18);
  c.lineTo(82,-12);c.lineTo(57,-6);c.bezierCurveTo(46,49,-2,62,-39,26);
  c.lineTo(-90,43);c.closePath();c.fillStyle='#c5ac7e';c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(-57,25);c.quadraticCurveTo(-26,-24,17,-9);c.quadraticCurveTo(8,21,-57,25);
  c.fillStyle=dim;c.fill();c.stroke();
  for(let i=0;i<5;i++)path(c,[[-41+i*6,19-i*3],[-2+i*3,-5-i]],'#d9ccb0',1.7);
  c.beginPath();c.ellipse(31,-22,13,10,-0.25,0,Math.PI*2);c.fillStyle=cream;c.fill();
  dot(c,36,-25,4.8,ink);dot(c,37,-27,1.5,cream);
  path(c,[[55,-16],[77,-12],[57,-11]],ink,3);
  c.restore();
}
export function chip(c,x,y,w,id,words,options={}) {
  const h=137, gap=8, pitch=(w-24)/4;
  box(c,x+4,y+7,w,h,dim,null,8);
  box(c,x,y,w,h,options.free?'#677670':ink,null,8);
  cap(c,'KV  /  '+id,x+15,y+23,cream,23);
  for(let i=0;i<4;i++){
    const bx=x+12+i*pitch, has=words[i]!==undefined;
    const active=options.mark===i;
    const fill=active?'#faf0b9':has?(options.free?'#d6dbcd':(options.tint??bluePale)):'#75857e';
    box(c,bx,y+47,pitch-gap,71,fill,null,2);
    if(has){
      for(let k=0;k<6;k++) box(c,bx+4+k*(pitch-gap-8)/6,y+50,(pitch-gap-8)/6-1,6,k%2?'#528985':'#83a49e');
      for(let k=0;k<6;k++) box(c,bx+4+k*(pitch-gap-8)/6,y+60,(pitch-gap-8)/6-1,6,k%2?'#a18c81':'#b6a399');
      mid(c,words[i],bx+(pitch-gap)/2,y+91,options.size??29,ink,'Serif');
    }
    for(let k=0;k<3;k++)box(c,bx+5+k*(pitch-gap-12)/3,y+126,(pitch-gap-15)/3,9,'#c5ac7e');
  }
}
export function sockets(c,x,y,width,labels,colorAt,options={}) {
  const pitch=width/labels.length, h=options.h??90;
  labels.forEach((v,i)=>{
    const px=x+i*pitch, w=pitch-9;
    if(v==null){empty(c,px,y,w,h);return;}
    const color=colorAt(i);
    cell(c,v,px,y,w,h,color,color,cream,options.size??36);
  });
}
