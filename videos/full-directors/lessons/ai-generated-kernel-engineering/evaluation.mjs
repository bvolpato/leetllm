import {C,tag,text,number,box,line,dot,arrow,header,foot,display,cell,strip,bracket,count,cue} from './bench.mjs';
import {calls,route,storage,changedView,changedShape,smoke,readRow,mutants,witnessed,caught as detected,ownershipAudit} from './experiments.mjs';

const routeColors=[C.teal,C.blue,C.rust];
function showRoutes(c,k){
  const show=k.beat.id==='routes';
  header(c,'Dispatch  /  public validation','Where do the three calls go?');
  text(c,'Tested CUDA target    ·    packed input and weight    ·    gradients off',110,304,37,C.sub);
  tag(c,'Call',116,400);tag(c,'Width in tiles of 128',335,400);tag(c,'Epsilon',945,400);tag(c,'Wrapper decision',1350,400);
  calls.forEach((call,i)=>{
    const y=500+i*137,known=show&&cue(k,['Three full tiles','Its extra feature','A Boolean'][i]);
    text(c,['A','B','C'][i],130,y+17,55,C.ink,'center','Serif');
    number(c,call.width,231,y+16,40);
    for(let j=0;j<Math.floor(call.width/128);j++)box(c,345+j*133,y-29,123,53,C.aqua,C.teal,4);
    if(call.width%128){box(c,744,y-29,9,53,C.rust,null,2);text(c,'+1',767,y+13,30,C.rust);}
    number(c,call.epsilon===true?'True':call.epsilon,945,y+16,42);
    line(c,1190,y,1280,y,known?routeColors[i]:C.line,4,known?[]:[7,8]);
    cell(c,1300,y-44,463,87,known?route(call):'',known?[C.aqua,C.wash,C.peach][i]:C.white,known?routeColors[i]:C.sub,known?routeColors[i]:C.line,43);
  });
  foot(c,'ε accepts Python int or float and excludes bool.','Fast width must be a multiple of 128');
}
function gap(c,k){
  const layout=k.beat.id==='layout',bad=layout&&cue(k,'Packed indexing'),correct=layout&&cue(k,'The actual row');
  const buffer=[1,2,3,4,'·','·',5,6,7,8],addresses=readRow(buffer,4,1,6).addresses;
  header(c,'Dispatch  /  layout','Where does the second row begin?');
  tag(c,'Storage offset',115,343);const x=120,w=1680,step=(w+8)/10;
  for(let i=0;i<10;i++)number(c,i,x+i*step+(step-8)/2,417,34,C.sub,'center');
  strip(c,buffer,x,449,w,128,{active:correct?addresses:[0,1,2,3],bad:bad?[4,5]:[]});
  bracket(c,x,600,4*step-8,'First row');bracket(c,x+6*step,600,4*step-8,'Second row');
  if(bad){arrow(c,x+4.5*step,779,x+4.5*step,601,C.rust);text(c,'Packed start = 4',x+4.5*step-30,826,32,C.rust,'center');}
  if(correct){arrow(c,x+6.5*step,779,x+6.5*step,666,C.teal);text(c,'Strided start = 6',x+6.5*step+95,826,32,C.teal,'center');}
  foot(c,'Shape [2, 4]     ·     Strides [6, 1]',correct?'Valid gapped view   →   reference':'Feature stride = 1');
}
export function dispatchScene(c,k){
  const id=k.beat.id;
  if(id==='pick'||id==='routes')return showRoutes(c,k);
  if(id==='gap'||id==='layout')return gap(c,k);
  const fresh=cue(k,'return fresh storage'),empty=cue(k,'Empty outer batches');
  header(c,'Dispatch  /  operator contract','What may the caller pass in?');
  tag(c,'Input   [rows, H]',125,326);tag(c,'Weight   [H]',1020,326);
  if(empty){
    box(c,125,367,755,195,C.white,C.line,6);
    text(c,'0 rows   ×   4 features',175,486,42,C.sub);
  }else{
    strip(c,[1,2,3,4],125,367,755,88,{active:[0,1,2,3]});
    strip(c,[5,6,7,8],125,474,755,88,{active:[0,1,2,3]});
  }
  strip(c,[1,1,1,1],1020,367,755,88);
  bracket(c,129,577,745,'H > 0');bracket(c,1024,475,745,'One weight per feature');
  if(fresh){
    display(c,1010,604,781,160);
    tag(c,'Output allocation',1046,663,C.soft);
    text(c,empty?'[0, 4]   ·   same dtype as input':'same shape and dtype as input',1046,724,41,C.mint);
  }
  text(c,'FP16   ·   BF16   ·   FP32',125,765,41,C.ink,'left','Mono');
  if(cue(k,'For epsilon')){
    foot(c,'ε accepts Python int or float and excludes bool.','Positive and finite in FP32');
  }else foot(c,empty?'An empty outer batch is valid.':'Input and weight share dtype and device.');
}

function hidden(c,k){
  const id=k.beat.id,gather=id==='gather',wrong=id==='mismatch';
  const trans=changedView.rows[0], other=wrong&&cue(k,'Three packed rows');
  const row=other?changedShape.rows[0]:trans;
  const buf=other?Array.from({length:15},(_,i)=>i+1):storage;
  const sweep=gather?cue(k,'Read one',1.4):0;
  const nr=wrong?row.values.length:gather?count(sweep,row.values.length):0;
  const loaded=row.addresses.slice(0,nr);
  const strideStep=id==='stride'?cue(k,'Advance two storage positions',0.9):0;
  const observed=wrong&&cue(k,'we observe zero');
  const meanReady=wrong||gather&&cue(k,'Divide five');
  const refReady=wrong||gather&&cue(k,'Can the four packed runs');
  const verdict=wrong&&cue(k,'That mismatch exposes');
  let title='Read row zero through the view';
  if(refReady)title='Can the packed runs predict this result?';
  if(verdict)title='What did the frozen candidate return?';
  if(other)title='Does a different packed shape pass?';
  header(c,'Private evaluation  /  frozen candidate',title);
  tag(c,'Storage offset',105,300); const start=108,w=1704,step=(w+8)/buf.length;
  for(let i=0;i<buf.length;i++)number(c,i,start+i*step+(step-8)/2,368,28,C.sub,'center');
  strip(c,buf,start,391,w,102,{active:loaded,labelSize:50});
  const center=(offset)=>start+offset*step+(step-8)/2;
  if(strideStep>0||sweep>0){
    const addresses=strideStep>0?row.addresses.slice(0,2):row.addresses;
    const position=(addresses.length-1)*(strideStep||sweep);
    const first=Math.min(addresses.length-2,Math.floor(position));
    const cursor=center(addresses[first]+(addresses[first+1]-addresses[first])*(position-first));
    line(c,center(addresses[0]),521,center(addresses.at(-1)),521,C.line,3,[8,7]);
    line(c,center(addresses[0]),521,cursor,521,C.teal,5);
    dot(c,cursor,521,9,C.teal);
  }
  text(c,other?'Shape [3, 5]     Strides [5, 1]':'Shape [2, 4]     Strides [1, 2]',113,567,36);
  text(c,'ε = 0.00001     w = 1 throughout',1800,566,32,C.sub,'right');
  display(c,108,612,1704,221);
  tag(c,'Row zero',142,682,C.soft);
  const measuredFeature=other?4:2;
  row.values.forEach((value,i)=>{
    const x=170+i*112;
    number(c,i<nr?value:'·',x,766,49,C.mint,'center');
    if(observed&&i===measuredFeature)line(c,x-26,788,x+26,788,C.copper,5);
  });
  tag(c,'Squared sum',760,682,C.soft);
  number(c,row.values.slice(0,nr).reduce((a,x)=>a+x*x,0),760,769,62,C.white);
  if(meanReady){
    tag(c,'Mean square',1170,682,C.soft);
    number(c,row.mean,1170,769,62,C.white);
  }
  if(refReady){
    const j=measuredFeature;
    number(c,'Feature '+(j+1)+'   Reference '+row.ref[j].toFixed(3),108,875,37,C.teal);
    number(c,'Candidate '+(observed?row.candidate[j]:'?'),985,875,37,observed?C.rust:C.sub);
    if(verdict)text(c,'Mismatch  ·  hold build',1812,875,33,C.rust,'right','Sans',700);
  } else {
    text(c,'Reference reads   '+nr+' / '+row.values.length,108,875,36,C.teal);
    text(c,'Candidate comparison pending',1812,875,33,C.sub,'right');
  }
}
function smokeScene(c,k){
  header(c,'Public evaluation  /  host fixture','What would you change in the next run?');
  const runs=['Original','10 × row','0.01 × row','Negated row'];
  const ready=cue(k,'All four runs pass');
  runs.forEach((name,i)=>{
    const y=375+i*116,row=smoke[i].rows[0];
    text(c,name,116,y+13,40);
    strip(c,row.values,485,y-48,730,86,{labelSize:38});
    if(ready)text(c,smoke[i].pass?'Match':'Mismatch',1440,y+13,39,C.teal,'center','Sans',700);
  });
  tag(c,'Input transform',116,290);tag(c,'First row',485,290);tag(c,'Vs. reference',1320,290);
  foot(c,'Shape [2, 4]     ·     Strides [4, 1]','Unit weights in all four runs');
}
function holdout(c,k){
  const fresh=cue(k,'open a fresh holdout'), publicOnly=cue(k,'If only public');
  header(c,'Private evaluation  /  information boundary','Which suite is still independent?');
  const columns=[120,735,1360];
  ['Feedback used','Frozen revision','Acceptance suite'].forEach((s,i)=>tag(c,s,columns[i],344));
  function path(y,label,build,suite,freshness){
    box(c,columns[0],y,385,98,C.white,C.line);text(c,label,columns[0]+20,y+62,37);
    arrow(c,516,y+49,700,y+49);
    box(c,columns[1],y,370,98,C.panel);text(c,build,columns[1]+25,y+62,37,C.white);
    if(suite){
      arrow(c,1127,y+49,1321,y+49);box(c,columns[2],y,425,98,C.aqua,C.teal);
      text(c,suite,columns[2]+20,y+62,37,C.teal);
      text(c,freshness,columns[2]+5,y+147,29,C.sub);
    }
  }
  path(397,'Private failure','Repair A',fresh?'New holdout':'', 'First holdout was consumed');
  if(publicOnly)path(650,'Compiler report','Repair B','Untouched holdout','Private cases stayed private');
  foot(c,'Freeze source, dispatch, reference and policy before acceptance.');
}
function ownership(c,k){
  const t=cue(k,'A temporary write'), alias=cue(k,'Here the output shares');
  header(c,'Ownership audit  /  nonempty tensors','What survives a before-and-after snapshot?');
  const xx=[150,735,1320];
  ['Before call','During call','After call'].forEach((s,i)=>tag(c,s,xx[i],323));
  [ownershipAudit.before,t?ownershipAudit.during:[1,'?',3],ownershipAudit.after].forEach((vals,i)=>strip(c,vals,xx[i],373,450,100,{bad:i===1&&t?[1]:[]}));
  bracket(c,150,495,1620,'Snapshots at both ends see the same bytes.');
  tag(c,'Returned view',152,676);
  box(c,500,614,350,100,C.white,C.line);number(c,'output',675,678,43,C.ink,'center');
  if(alias&&ownershipAudit.shared){
    arrow(c,879,664,1190,664,C.rust);
    cell(c,1220,614,548,100,'input storage A',C.peach,C.rust,C.rust,38);
  }
  foot(c,alias?'Shared allocation   →   reject the returned view.':t?'A restored write can escape two snapshots.':'Compare the input bytes at both endpoints.');
}
export function evaluator(c,k) {
  if(k.beat.id==='smoke')return smokeScene(c,k);
  if(k.beat.id==='holdout')return holdout(c,k);
  if(k.beat.id==='ownership')return ownership(c,k);
  if(k.beat.id==='witness'||k.beat.id==='witnessScore')return witness(c,k);
  hidden(c,k);
}

function witness(c,k){
  const score=k.beat.id==='witnessScore';
  const caught=score||cue(k,'If the checker catches'),answer=score&&cue(k,'Only the six');
  header(c,'Evaluator coverage  /  mutation study','What fraction of witnessed defects did it catch?');
  tag(c,'Has a distinguishing input',120,347);tag(c,'No witness',1450,347);
  for(let i=0;i<mutants.length;i++){
    const x=122+(i<6?i*195:1328+(i-6)*165),w=i<6?155:140;
    const scored=mutants[i]!=='pending',found=mutants[i]==='caught';
    cell(c,x,395,w,155,'M'+(i+1),!scored?C.white:caught?(found?C.aqua:C.peach):C.wash,C.ink,C.line,44);
    text(c,scored?(caught?(found?'Caught':'Missed'):'Exposed'):'Pending',x+w/2,609,29,scored?(caught&&!found?C.rust:C.teal):C.sub,'center');
  }
  bracket(c,122,642,1130,'Witness passes the original and exposes this defect');
  if(answer){number(c,detected+' / '+witnessed,124,833,64,C.teal);text(c,'detected among witnessed defects',437,821,43);}
  foot(c,'Score the checker against the stated fault model.');
}
