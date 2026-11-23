import {C,tag,text,number,box,line,dot,arrow,header,foot,display,cell,strip,bracket,cue} from './bench.mjs';
import {finalStorage,finalResult,finalRow,route,shadow,recovery,logits} from './experiments.mjs';

function isolation(c,k){
  const artifact=cue(k,'write the artifact');
  header(c,'Build isolation  /  capability boundary','What can the build worker reach?');
  tag(c,'Approved build input',124,341);
  cell(c,119,408,343,105,'Source S1',C.white,C.ink,C.line,40);
  arrow(c,481,461,624,461);
  display(c,657,307,626,455);
  tag(c,'Isolated worker',711,380,C.soft);
  text(c,'Pinned toolchain',706,481,53,C.white,'left','Serif');
  line(c,712,538,1220,538,C.panelLine,2);
  text(c,'Resource limit',712,610,36,C.mint);
  text(c,'Build timeout',712,680,36,C.mint);
  if(artifact){
    arrow(c,1310,461,1410,461);
    cell(c,1430,408,370,105,'Binary K1',C.aqua,C.teal,C.teal,40);
  }
  text(c,'Outside the worker',123,818,33,C.sub);
  text(c,'Private suite     ·     evaluator     ·     credentials     ·     live traffic',520,818,37);
  foot(c,'Run device checks in a disposable worker.','Source S1   →   loaded binary K1');
}
function capacity(c,k){
  const run=k.beat.id==='budget'&&cue(k,'Two start');
  const canary=run&&cue(k,'In a canary');
  header(c,'Rollout  /  shared device capacity',canary?'Whose output reaches the caller?':'How many shadow copies fit?');
  if(canary){
    const x=[120,708,1370];
    ['Mode','Eligible request','Returned result'].forEach((t,i)=>tag(c,t,x[i],345));
    [['Shadow','Trusted path','Reference'],['Canary','Candidate path','Candidate']].forEach(([a,b,d],i)=>{
      const y=448+185*i;
      text(c,a,x[0],y+38,56,C.ink,'left','Serif');arrow(c,372,y+14,654,y+14,i?C.rust:C.teal);
      cell(c,x[1],y-41,412,103,b,i?C.peach:C.aqua,i?C.rust:C.teal,null,36);
      arrow(c,1148,y+14,1317,y+14,i?C.rust:C.teal);
      text(c,d,x[2],y+39,47,i?C.rust:C.teal);
    });
    foot(c,'Watch per-request latency, worker health and downstream quality.');
    return;
  }
  tag(c,'Execution slots',125,337);
  for(let i=0;i<shadow.slots;i++){
    const live=i<shadow.live,started=run&&!live,x=130+i*165;
    box(c,x,385,146,210,live?C.panel:started?C.aqua:C.white,live?null:started?C.teal:C.line,9);
    number(c,i+1,x+73,459,42,live?C.soft:C.sub,'center');
    text(c,live?'Live':started?'Shadow':'Free',x+73,544,34,live?C.mint:started?C.teal:C.sub,'center');
  }
  tag(c,'Shadow copies',129,711);
  for(let i=0;i<shadow.requested;i++){
    const start=run&&i<shadow.start;
    cell(c,450+i*420,647,376,101,'S'+(i+1)+'  '+(start?'running':run?'waiting':'ready'),start?C.aqua:run?C.peach:C.white,start?C.teal:run?C.rust:C.ink,C.line,36);
  }
  foot(c,'Live requests keep their trusted responses.',run?'2 started   ·   1 queued':'3 copies requested');
}
function worker(c,k){
  const go=k.beat.id==='recover';
  let step=go?2:0;
  if(!go){
    if(cue(k,'An illegal-address fault'))step=1;
    if(cue(k,'Disable candidate routing'))step=2;
  }else{
    if(cue(k,'Terminate the failed worker'))step=3;
    if(cue(k,'start a healthy replacement'))step=4;
    if(cue(k,'Replay the saved input'))step=5;
    if(cue(k,'The reference returns'))step=6;
  }
  const s=recovery[step], healthy=step>=4;
  header(c,'Recovery  /  canary request R1','Where can the saved request finish?');
  tag(c,'Outside the worker',120,336);
  display(c,120,380,590,270);
  text(c,'Request R1',162,469,58,C.white,'left','Serif');
  text(c,'Input copy  +  retry key K-R1',162,558,34,C.mint);
  text(c,'Persists across process failure',162,608,28,C.soft);
  const tint=step===0||healthy?C.teal:C.rust;
  tag(c,healthy?'Replacement process':'Original process',1140,336);
  box(c,1125,380,650,270,healthy?C.aqua:step?C.peach:C.white,tint,15);
  number(c,s.worker,1170,473,69,tint);text(c,s.state,1716,462,39,tint,'right','Sans',700);
  line(c,1168,508,1726,508,tint,2);
  text(c,healthy?'Verified reference':'Candidate K1',1170,585,42,C.ink);
  if(step===0||step===5)arrow(c,742,505,1090,505,tint,6);
  if(step===5)text(c,'Same retry key',910,457,30,tint,'center');
  if(step===6){arrow(c,1090,505,742,505,C.teal,6);text(c,'R1 result',915,457,32,C.teal,'center');}
  if(step>=1&&step<=3){
    line(c,755,505,1084,505,C.line,4,[9,9]);line(c,901,483,941,527,C.rust,5);line(c,901,527,941,483,C.rust,5);
  }
  text(c,'Future calls',128,759,33,C.sub);text(c,s.route,434,764,43,step>=2?C.teal:C.ink);
  text(c,'R1',1140,759,33,C.sub);text(c,s.request,1270,764,43,tint);
  foot(c,step===6?'R1 completes only after the healthy reference returns.':step>=2?'Disabling new dispatch leaves R1 to recover.':'A copy of R1 lives outside W17.');
}
function signed(c,k){
  const change=cue(k,'D two changes'),review=cue(k,'Revalidate and sign');
  header(c,'Release record  /  signed payload','Which routing rule did the reviewer sign?');
  tag(c,'Reviewed payload',130,342);tag(c,'Proposed release',1035,342);
  for(let i=0;i<2;i++){
    const x=124+900*i;
    box(c,x,380,745,350,i?C.white:C.panel,i?C.line:null,14);
    const fg=i?C.ink:C.white,dim=i?C.sub:C.soft;
    text(c,'Source S1   ·   binary K1',x+47,459,43,fg);
    line(c,x+45,499,x+697,499,i?C.line:C.panelLine);
    tag(c,'Dispatch',x+49,579,dim);
    number(c,i&&change?'D2':'D1',x+490,608,82,i&&change?C.rust:i?C.teal:C.mint);
    text(c,i?(change?'Changed rule':'Same rule'):'Signed with reviewed evidence',x+48,684,31,dim);
  }
  foot(c,review?'Review the changed payload and bind D2 to fresh evidence.':change?'The signed record identifies D1.':'Bind the exact source, binary, dispatch and evidence.');
}
function practice(c,k){
  const answer=k.beat.id==='answer',read=answer&&cue(k,'Read five and twelve');
  const selected=answer&&cue(k,'Their mean square'),output=answer&&cue(k,"The caller's four numbers");
  header(c,'Final practice  /  strided input','What will row zero produce?');
  tag(c,'Caller storage',118,329);strip(c,finalStorage,120,379,1000,113,{active:read?finalRow.addresses:[]});
  for(let i=0;i<4;i++)number(c,i,242+252*i,553,32,C.sub,'center');
  tag(c,'Shape and strides',1230,329);number(c,'[2, 2]  [1, 2]',1230,431,46);
  text(c,'Row 0   ·   weights [1, 2]',1230,508,36,C.sub);
  display(c,117,625,1685,194);
  tag(c,'Route',157,689,C.soft);text(c,selected?route({width:2,packed:false}):'?',157,772,55,C.mint,'left','Serif');
  tag(c,'Fresh output row',913,689,C.soft);number(c,output?'['+finalResult.values.map(x=>x.toFixed(3)).join(', ')+']':'[ ? , ? ]',913,772,58,C.white);
  foot(c,answer&&cue(k,'Add epsilon')?'(5² + 12²) ÷ 2 = 84.5':'Read every second storage position.','ε = 0.00001');
}
function releaseGate(c,k){
  const hold=k.beat.id==='hold'&&cue(k,'Keep live requests');
  header(c,'Final practice  /  production decision','Would you enable K1 for live requests?');
  const left=123;
  tag(c,'Eligible call',left,320);tag(c,'Evidence for the loaded binary',1040,320);
  text(c,'H = 128',left,456,88,C.ink,'left','Serif');
  text(c,'Tested GPU  ·  packed tensors',left,530,38,C.sub);
  text(c,'Gradients off  ·  valid epsilon',left,592,38,C.sub);
  text(c,'Dispatch selects   '+route({width:128}),left,717,39,C.teal,'left','Sans',700);
  display(c,1037,377,749,388);
  text(c,'Binary K1    /    dispatch D2',1090,464,40,C.white);
  line(c,1087,507,1735,507,C.panelLine,3);
  tag(c,'Device safety report',1090,590,C.soft);
  number(c,'MISSING',1090,691,63,C.copper);
  foot(c,hold?'Hold the release. Serve live requests on the trusted path.':'Make the release decision.',hold?'Device checks required':'Lab fixture');
}
export function releaseScene(c,k){
  const id=k.beat.id;
  if(id==='canary')return canaryChoice(c,k);
  if(id==='isolate')return isolation(c,k);
  if(['shadow','budget'].includes(id))return capacity(c,k);
  if(['fault','recover'].includes(id))return worker(c,k);
  if(id==='receipt')return signed(c,k);
  if(['practice','answer'].includes(id))return practice(c,k);
  return releaseGate(c,k);
}

function canaryChoice(c,k){
  const changed=cue(k,'Raise only A');
  header(c,'Canary  /  downstream quality','Which token does the caller receive?');
  text(c,'Greedy decoding selects the larger logit.',118,324,42,C.sub);
  const toX=v=>610+(v-1)*4400000;
  [logits[0],logits[1]].forEach((record,i)=>{
    if(i&&!changed)return;
    const y=475+i*215;
    text(c,i?'Canary':'Trusted',118,y+22,55,C.ink,'left','Serif');
    line(c,600,y,1510,y,C.line,4);
    for(const [j,key] of ['a','b'].entries()){
      const xx=toX(record[key]);
      dot(c,xx,y,16,j?C.teal:C.rust);
      number(c,key.toUpperCase()+' '+record[key].toFixed(4),xx,y+(j?66:-32),33,j?C.teal:C.rust,'center');
    }
    cell(c,1634,y-48,142,98,record.winner,i?C.peach:C.aqua,i?C.rust:C.teal,null,48);
  });
  foot(c,changed?'A shift of 0.0002 reverses the winning token.':'B leads by 0.0001.','Magnified logit scale');
}
