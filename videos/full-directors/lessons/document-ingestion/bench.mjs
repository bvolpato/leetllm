import { createCanvas } from '@napi-rs/canvas';

export const C = {
  base:'#1a343b', deep:'#10282f', metal:'#395359', line:'#648084', white:'#f3f3df',
  dim:'#b5c6c1', paper:'#f4ebd7', edge:'#d6c8aa', ink:'#243637', gray:'#586b67',
  gold:'#f2bb69', copper:'#aa572f', green:'#9bd4ba', forest:'#276348',
  red:'#f4a58e', oxide:'#9a4137', mist:'#d6e4d9', navy:'#184652',
};
export const clamp = v => Math.min(1,Math.max(0,v));
export const ease = v => v*v*(3-2*v);
export function cue(clock, beat, phrase, span=.5) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex>beat);
  return clock.reveal(phrase,span);
}
export function face(size, family='Sans', weight=400) { return weight + ' ' + size + 'px "Lesson '+family+'"'; }

export class Bench {
  constructor(ctx) { this.c=ctx; }
  rect(x,y,w,h,col) { this.c.fillStyle=col; this.c.fillRect(x,y,w,h); }
  path(points,col,width=1,dash=[]) {
    const c=this.c; c.save(); c.beginPath(); c.lineJoin='round'; c.lineCap='round';
    c.setLineDash(dash); points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.strokeStyle=col; c.lineWidth=width; c.stroke(); c.restore();
  }
  circle(x,y,r,fill,stroke) {
    const c=this.c; c.beginPath(); c.arc(x,y,r,0,Math.PI*2);
    if(fill) {c.fillStyle=fill;c.fill();}
    if(stroke) {c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}
  }
  text(str,x,y,size=18,color=C.ink,family='Sans',weight=400,maxWidth=undefined,align='left') {
    const c=this.c; c.font=face(size,family,weight);c.textAlign=align;c.textBaseline='alphabetic';
    c.fillStyle=color;
    if(maxWidth) c.fillText(String(str),x,y,maxWidth); else c.fillText(String(str),x,y);
    c.textAlign='left';
  }
  mono(s,x,y,size=15,color=C.gray,w) { this.text(s,x,y,size,color,'Mono',400,w); }
  serif(s,x,y,size=24,color=C.ink,w) { this.text(s,x,y,size,color,'Serif',400,w); }
  para(str,x,y,w,size=20,leading=29,color=C.ink,family='Serif') {
    const c=this.c;c.font=face(size,family);let line='';
    for (const word of str.split(' ')) {
      if(line && c.measureText(line+' '+word).width>w) {this.text(line,x,y,size,color,family);y+=leading;line=word;}
      else line=line ? line+' '+word : word;
    }
    if(line) this.text(line,x,y,size,color,family);
    return y;
  }
  base(title,context) {
    const c=this.c;c.scale(2,2);
    const gradient=c.createLinearGradient(0,0,850,540);
    gradient.addColorStop(0,'#293f43');gradient.addColorStop(.64,C.base);gradient.addColorStop(1,C.deep);
    this.rect(0,0,960,540,gradient);
    this.mono(context,40,37,14,C.dim,420);
    this.serif(title,40,82,38,C.white,878);
    this.path([[40,101],[920,101]],C.line);
    for(let x=42;x<920;x+=16)this.rect(x,102,1,x%64===42?7:3,C.line);
  }
  paper(x,y,w,h,label,stock=C.paper) {
    const c=this.c;c.save();c.shadowColor='#091b2299';c.shadowBlur=9;c.shadowOffsetY=4;
    this.rect(x,y,w,h,stock);c.restore();
    this.rect(x+4,y+3,1,h-6,C.edge);
    if(label) {
      this.mono(label,x+18,y+29,14,C.gray,w-36);
      this.path([[x+18,y+40],[x+w-18,y+40]],C.edge);
    }
  }
  reviewStamp(right,top) {
    const width=186;
    this.rect(right-width,top,width,39,C.oxide);
    this.text('Held for review',right-width/2,top+27,22,C.white,'Sans',600,width-16,'center');
  }
  register(x,y,w,h,col=C.copper) {
    const a=11;
    for(const [sx,sy,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])
      this.path([[sx+dx*a,sy],[sx,sy],[sx,sy+dy*a]],col,2);
  }
  label(str,x,y,w,color=C.gold) {this.text(str,x,y,17,color,'Sans',500,w);}
  ruleLine(str,x,y,w,col=C.paper) {
    this.rect(x,y,w,43,col);this.serif(str,x+13,y+29,20,C.ink,w-26);
  }
  wire(points,p=1,col=C.gold) {
    this.path(points,C.line,1.2,[4,5]);if(p<=0)return;
    const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
    let remaining=lengths.reduce((a,b)=>a+b,0)*clamp(p);
    const path=[points[0]];
    for(let i=0;i<lengths.length && remaining>0;i++) {
      const a=points[i],b=points[i+1],t=Math.min(1,remaining/lengths[i]);
      path.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);remaining-=lengths[i];
    }
    this.path(path,col,3);this.circle(...path.at(-1),4,col);
  }
}

// Both the small scan and the loupe sample this same raster. The printed five has a flat cap.
const scans=new Map();
export function scanPlate(number) {
  if(scans.has(number))return scans.get(number);
  const canvas=createCanvas(270,95), c=canvas.getContext('2d');
  c.fillStyle='#e3dec7';c.fillRect(0,0,270,95);
  let seed=251;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<3900;i++) {
    c.fillStyle=rand()>.5?'#776e5425':'#ffffff48';c.fillRect(rand()*270,rand()*95,1+rand(),1);
  }
  c.translate(12,5);c.rotate(-.012);
  c.font=face(59,'Mono',700);c.fillStyle='#334342';c.fillText(number,4,63);
  c.font=face(31,'Serif');c.fillText('minutes',93,62);
  scans.set(number,canvas);return canvas;
}
export function scanWindow(a,n,x,y,w,h,zoom) {
  const plate=scanPlate(n);
  const k=ease(clamp(zoom));
  const sw=270-167*k,sh=95-(95-75)*k;
  const c=a.c;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  c.imageSmoothingEnabled=false;
  const scale=Math.min(w/sw,h/sh);
  a.rect(x,y,w,h,'#dfdac2');
  c.drawImage(plate,0,0,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);
  c.restore();a.register(x-2,y-2,w+4,h+4);
}

// The glass enlarges the glyphs on the scan while the rest of the sentence stays visible.
export function loupe(a,n,x,y,zoom) {
  const c=a.c,plate=scanPlate(n),scale=.74;
  c.drawImage(plate,x,y,270*scale,95*scale);
  if(!zoom)return;
  const t=ease(zoom),cx=x+42+247*t,cy=y+36+3*t,r=25+23*t;
  a.register(x+8,y+9,63,46,C.copper);
  a.path([[x+74,y+55],[x+91,y+74],[cx-21,cy+r-6]],C.copper,1);
  a.path([[cx+r*.66,cy+r*.66],[cx+r+10,cy+r+10]],C.metal,9);
  a.circle(cx,cy,r+4,C.navy);
  c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();
  c.imageSmoothingEnabled=false;
  const z=1+.82*t;
  c.drawImage(plate,cx-(52+16*t)*z,cy-46*z,270*z,95*z);
  c.restore();
  a.circle(cx,cy,r,null,C.edge);
}
