import {createCanvas} from '@napi-rs/canvas';
import {generator} from '../../../films/diffusion/arithmetic.mjs';

export const C = {
  paper:'#f6f0e2', pale:'#e7dfca', faint:'#cfc7b5', ink:'#173545', quiet:'#52666a',
  blue:'#386888', green:'#157567', copper:'#a24324', gold:'#d29239', white:'#fffdf4', dark:'#133747',
};
export const mix=(a,b,p)=>a+(b-a)*p;
export const clamp=p=>Math.max(0,Math.min(1,p));
export const smooth=p=>clamp(p)**2*(3-2*clamp(p));
export const num=(x,d=3)=>Number(x.toFixed(d)).toFixed(d).replace('-','−');
export const vec=(xs,d=2)=>'('+xs.map(x=>num(x,d)).join(',  ')+')';
export function cue(clock, index, phrase, seconds=1) {
  const beat=clock.beat.beatIndex;
  return beat===index?smooth(clock.reveal(phrase,seconds)):Number(beat>index);
}
const background=createCanvas(1920,1080);
const paper=background.getContext('2d');
const wash=paper.createLinearGradient(0,0,1770,920);
wash.addColorStop(0,'#fbf6e9');wash.addColorStop(1,'#eee5d1');
paper.fillStyle=wash;paper.fillRect(0,0,1920,1080);
const rng=generator(76);
for(let i=0;i<17500;i++){
  paper.fillStyle=i%2?'#544a3310':'#fffaf373';
  paper.fillRect(rng()*1920,rng()*1080,1+3*rng(),1);
}

export class Studio {
  constructor(ctx){this.ctx=ctx;}
  text(str,x,y,size=40,color=C.ink,kind='sans',align='left',max=1750){
    const c=this.ctx, family={serif:'Lesson Serif',sans:'Lesson Sans',mono:'Lesson Mono'}[kind];
    c.save();
    c.font='400 '+size+'px "'+family+'"';
    const width=c.measureText(String(str)).width;
    if(width>max)c.font='400 '+Math.floor(size*max/width)+'px "'+family+'"';
    c.fillStyle=color;c.textAlign=align;c.fillText(String(str),x,y);c.restore();
  }
  rect(x,y,w,h,col){this.ctx.fillStyle=col;this.ctx.fillRect(x,y,w,h);}
  frame(x,y,w,h,col=C.quiet,width=3){this.ctx.strokeStyle=col;this.ctx.lineWidth=width;this.ctx.strokeRect(x,y,w,h);}
  path(pts,col,width=3,fill=false){
    if(!pts.length)return;
    const c=this.ctx;c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
    if(fill){c.closePath();c.fillStyle=col;c.fill();}
    else{c.strokeStyle=col;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}
  }
  line(x,y,X,Y,col=C.quiet,w=3){this.path([[x,y],[X,Y]],col,w);}
  arrow(x,y,X,Y,col=C.ink,w=7){
    const len=Math.hypot(X-x,Y-y);if(len<1)return;
    const a=Math.atan2(Y-y,X-x),head=Math.min(15+w,len*.48);
    this.line(x,y,X-head*.43*Math.cos(a),Y-head*.43*Math.sin(a),col,w);
    this.path([[X,Y],[X-head*Math.cos(a-.47),Y-head*Math.sin(a-.47)],[X-head*Math.cos(a+.47),Y-head*Math.sin(a+.47)]],col,1,true);
  }
  dot(x,y,r,col,ring=false,width=4){
    const c=this.ctx;c.beginPath();c.arc(x,y,r,0,2*Math.PI);
    if(ring){c.strokeStyle=col;c.lineWidth=width;c.stroke();}else{c.fillStyle=col;c.fill();}
  }
  fade(alpha,paint){if(alpha<=0)return;this.ctx.save();this.ctx.globalAlpha*=clamp(alpha);paint();this.ctx.restore();}
  title(section,title){
    this.ctx.drawImage(background,0,0);this.text(section,85,77,32,C.green,'mono');
    this.text(title,81,175,79,C.ink,'serif','left',1760);
    this.line(85,217,1835,217,C.faint,2);
  }
  note(str,col=C.ink,baseline=937){
    this.line(85,baseline-65,1835,baseline-65,C.faint,2);
    this.text(str,87,baseline,42,col,'serif','left',1740);
  }
  axis(x,y,w,min,max,ticks,label=''){
    const at=v=>x+(v-min)/(max-min)*w;
    this.line(x,y,x+w,y,C.quiet,3);
    for(const v of ticks){this.line(at(v),y-8,at(v),y+11,C.quiet,3);this.text(String(v).replace('-','−'),at(v),y+50,30,C.quiet,'mono','center');}
    if(label)this.text(label,x,y+108,34,C.quiet);
    return at;
  }
  mark(x,y,col,r=13){this.dot(x,y,r+4,C.paper);this.dot(x,y,r,col);}
  sheet(pixels,x,y,w,mark,caption='',col=C.copper){
    const n=Math.sqrt(pixels.length),step=w/n;
    this.rect(x+8,y+10,w,w,'#33424126');this.rect(x-6,y-6,w+12,w+12,C.white);
    for(let i=0;i<pixels.length;i++){
      const a=clamp((pixels[i]+1)/2);
      const rgb=[25,57,69].map((base,j)=>Math.round(mix(base,[240,222,178][j],a)));
      this.rect(x+(i%n)*step,y+Math.floor(i/n)*step,step+.45,step+.45,'rgb('+rgb.join(',')+')');
    }
    if(mark!=null){
      const mx=x+mark%n*step,my=y+Math.floor(mark/n)*step;
      this.frame(mx-1,my-1,step+2,step+2,C.white,7);this.frame(mx-1,my-1,step+2,step+2,col,3.5);
    }
    if(caption)this.text(caption,x,y+w+54,35,C.ink,'sans','left',Math.max(w,365));
  }
}
