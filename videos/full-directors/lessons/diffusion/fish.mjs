import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {generator,normal} from '../../../films/diffusion/arithmetic.mjs';
import {C,cue,mix,clamp} from './studio.mjs';

const W=320,H=136;
const source=await loadImage(await readFile(new URL('../../../director-cuts/lessons/diffusion/mackerel.svg',import.meta.url)));
const plane=createCanvas(W,H), ctx=plane.getContext('2d');
ctx.drawImage(source,0,0,W,H);
const raw=ctx.getImageData(0,0,W,H);
const left=Float64Array.from({length:W*H},(_,i)=>raw.data[4*i]/127.5-1);
const right=left.map((_,i)=>left[i-2*(i%W)+W-1]);
const delta=right.map((v,i)=>v-left[i]);
const seed=generator(6),screenSeed=generator(42);
const grain=left.map(()=>normal(screenSeed));
const levels=[0,.001,.002,.004,.006,.009,.012,.016,.02,.026,.034,.045,.06,.085,.12,.17,.24,.34,.48,.64,.79,.9,.97,.995,1];
let pixels=left.map(()=>normal(seed));
const states=levels.map((s,k)=>{
  const proj=pixels.reduce((total,v,i)=>total+v*delta[i],0);
  const w=s===1?Number(proj>0):1/(1+Math.exp(-s*proj/(1-s*s)));
  const estimate=left.map((v,i)=>v+w*delta[i]);
  const state={w,estimate,pixels};
  if(k+1<levels.length){
    const t=levels[k+1], ratio=Math.sqrt((1-t*t)/(1-s*s));
    pixels=pixels.map((x,i)=>t*estimate[i]+ratio*(x-s*estimate[i]));
  }
  return state;
});
function plate(values,texture=0){
  const c=createCanvas(W,H),g=c.getContext('2d'),rgba=g.createImageData(W,H);
  for(let i=0;i<values.length;i++){
    const q=clamp((values[i]+1)*.5+texture*grain[i]);
    for(const [j,v] of [19,57,76].entries())rgba.data[4*i+j]=mix(v,[247,239,218][j],q);
    rgba.data[4*i+3]=255;
  }
  g.putImageData(rgba,0,0);return c;
}
const prints=states.map(s=>plate(s.estimate,.035)),inputs=states.map(s=>plate(s.pixels));
function imageAt(d,images,k,x,y,w,h,box=[0,0,W,H]){
  const lo=Math.floor(k),hi=Math.min(images.length-1,lo+1);
  d.ctx.drawImage(images[lo],...box,x,y,w,h);
  d.fade(k-lo,()=>d.ctx.drawImage(images[hi],...box,x,y,w,h));
}
export function drawFish(d,c){
  const b=c.beat.beatIndex;
  d.title('Mackerel   /   two possible originals','Which end gets the eye?');
  const pull=cue(c,1,'Pull back',2.4);
  const k=6*cue(c,2,'Watch the right ring',4)+18*cue(c,2,'The eye sharpens',2.6);
  const w=mix(650,1190,pull),h=mix(510,506,pull),x=mix(630,630,pull),y=289;
  const box=[mix(19,0,pull),mix(48,0,pull),mix(46,W,pull),mix(36,H,pull)];
  imageAt(d,prints,k,x,y,w,h,box);
  if(pull<1)d.fade(clamp(1-3*pull),()=>{
    // Frame the small grainy ring without tracing a head outline.
    d.frame(x-5,y-5,w+10,h+10,C.blue,3);
    d.text('Detail of the first estimate',x+w/2,842,36,C.quiet,'sans','center');
  });
  d.fade(pull,()=>{
    imageAt(d,inputs,k,88,420,465,198);
    d.text('Current sample',88,384,39,C.blue);
    d.text('Clean estimate',633,264,39,C.green);
    const lo=Math.floor(k),hi=Math.min(levels.length-1,lo+1);
    const percent=Math.round(100*mix(states[lo].w,states[hi].w,k-lo));
    d.fade(clamp((pull-.65)/.35),()=>{
      d.text((100-percent)+'% left-facing',647,839,35,C.ink);
      d.text(percent+'% right-facing',1810,839,35,C.ink,'sans','right');
    });
  });
  d.note(b===0?'Pick a direction before the print comes into view.':b===1?'In pure noise, each print gets half the ink.':b===2?'Same denoiser, new pixels at each step.':'From two possible prints to a distribution of photographs.');
}
export function checkFish(){
  assert.equal(states[0].w,.5);
  assert.ok(states[11].w>.98);
  assert.ok(states.at(-1).pixels.every((x,i)=>Math.abs(x-right[i])<1e-9));
  const s=levels[6],z=states[6];
  const dist=p=>z.pixels.reduce((sum,v,i)=>sum+(v-s*p[i])**2,0);
  const posterior=1/(1+Math.exp((dist(right)-dist(left))/(2*(1-s*s))));
  assert.ok(Math.abs(z.w-posterior)<1e-8);
}
