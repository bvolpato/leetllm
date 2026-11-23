import { C,tint,txt,mono,rect,line,dot,bed,back,note,lerp,smooth,cue,brace,alpha } from './drawing.mjs';
import {
  checkpointRow,trackedColumn,marked,markedAddress,saved,incomplete,receivedColumns,probeInput,probe,
  reference,reset,stale,momentumDecay,resumeRate,resumeTolerance,round,
} from './examples.mjs';
import { columnFace } from './layers.mjs';

const center=i=>366+184*i;

function resultAfter(k, index, phrase, duration = 0, captionStart = phrase) {
  const b = k.beat.beatIndex;
  if (b !== index) return Number(b > index);
  k.reveal(phrase, 0, { captionStart });
  const elapsed = k.elapsed - k.wordCue(phrase).end;
  if (elapsed >= duration - 1e-9) return 1;
  return elapsed > 0 ? elapsed / duration : 0;
}

function packingMotion(k) {
  if (k.beat.beatIndex !== 1) return 0;
  const phrase = 'The weight at six would slide into column four';
  const { start, end } = k.wordCue(phrase);
  const pack = k.reveal(phrase, end - start, { captionStart: phrase });
  const unpack = resultAfter(k,1,'Keep the gap',0.55);
  return smooth(pack) * (1 - smooth(unpack));
}

function storage(c,k) {
  const rebuilding=smooth(cue(k,0,'Rebuild it by global column number',1.5));
  const packing = packingMotion(k);
  const correcting = k.beat.beatIndex === 1 && cue(k,1,'Keep the gap');
  const arriving = smooth(resultAfter(k,1,'and the metadata are complete',0.75,false));
  const newLayout=cue(k,1,'Two workers now load');
  const address=resultAfter(k,2,'Rank one, local slot two');
  const trace=smooth(resultAfter(k,2,'Rank one, local slot two',0.7));
  const fill=cue(k,2,'The other seven columns',0.65);
  const probed=resultAfter(k,2,'still gives three');
  const snapshot=arriving>0?saved:incomplete;
  const packedColumn=receivedColumns.indexOf(trackedColumn);
  const width=saved.target[0].length, a=markedAddress(width), offset=a.rank*width;
  back(c,'Where will column six live after reload?', 'Same tensor row   /   The saved shards keep their global column offsets');
  txt(c,'Global',113,265,31,C.sub);
  for(let i=0;i<checkpointRow.length;i++)mono(c,i,center(i),265,38,i===trackedColumn?C.brass:C.sub,'center');
  txt(c,'Saved',113,412,37,C.ink,'left','Serif');
  for(const [r,shard] of saved.shards.entries()){
    const missing=!snapshot.available.some(s=>s.offset===shard.offset);
    brace(c,center(shard.offset)-81,center(shard.offset+1)+81,350,'rank '+r,missing?C.rust:C.sub,false);
    for(let j=0;j<shard.values.length;j++){
      const i=shard.offset+j;
      if(missing){rect(c,center(i)-80,376,160,77,'#ced7cc',6);mono(c,'…',center(i),415,39,C.sub,'center');}
      else columnFace(c,center(i),376,158,77,shard.values[j],i===trackedColumn,tint[r%2]);
    }
  }
  const y=552;
  txt(c,packing?'Packed row':'Global row',104,y+39,32,packing?C.rust:C.ink,'left','Serif');
  for (const [i,v] of incomplete.reconstructed.entries()) {
    const waiting = v === null && !packing && arriving < 1;
    const x = center(i);
    rect(c,x-81,y,162,79,waiting?'#e8d5c8':'#c5d0c7',6);
    if (waiting && !arriving) mono(c,'waiting',x,y+42,26,C.rust,'center');
  }
  for (const [packedIndex, column] of receivedColumns.entries()) {
    const x = lerp(center(column), center(packedIndex), packing);
    if (rebuilding > 0) {
      columnFace(c,x,lerp(460,y,rebuilding),158,77,checkpointRow[column],column===trackedColumn);
    }
  }
  if (arriving > 0) {
    for (const [column,value] of incomplete.reconstructed.entries()) {
      if (value === null) columnFace(c,center(column),lerp(460,y,arriving),158,77,checkpointRow[column]);
    }
  }
  if(newLayout){
    txt(c,'Reload',111,731,36,C.ink,'left','Serif');
    for(const [r,shard] of saved.target.entries()){
      const base=r*width,x=center(base)-87;bed(c,x,669,728,116);
      for(const [j,value] of shard.entries()){
        const i=base+j;
        rect(c,center(i)-71,691,142,65,'#40595a',7);
        const visible=i===trackedColumn?Number(trace===1):fill;
        alpha(c,visible,()=>columnFace(c,center(i),691,142,65,value,i===trackedColumn,tint[r]));
      }
      brace(c,x+9,x+720,800,'rank '+r);
    }
    if(trace>0){
      const x=center(trackedColumn), tip=lerp(637,688,trace);
      line(c,x,637,x,tip,C.brass,5);
      dot(c,x,tip,5,C.brass);
    }
  }else{
    const status = packing === 1 ? 'Packing puts the gold weight in column '+packedColumn+'.' :
      correcting ? 'Keep the original column offsets.' :
      packing > 0 ? 'Packing moves the received values into adjacent slots.' :
      'What if we pack the received values together?';
    if (arriving < 1) txt(c,status,975,739,43,packing?C.rust:C.ink,'center','Serif');
    else txt(c,'All '+checkpointRow.length+' positions have arrived.',975,739,43,C.ink,'center','Serif');
  }
  note(c,probed?'Forward probe    '+probeInput[trackedColumn]+' × '+marked+' = '+probe+'   in both layouts.':
    address?'Rank '+a.rank+' starts at column '+offset+'. Local slot = '+trackedColumn+' − '+offset+' = '+a.local+'.':
    newLayout?'Find the shard that contains global column six. Count the slots in that shard from zero.':
    packing?'The saved row above still shows where each value belongs.':
    arriving===1?'The late shard fills its own slots. The gold weight stays in column six.':
    correcting?'Leave the missing slots open until their writer finishes.':
    'The writer for columns four and five has yet to finish.');
}

function manifest(c,k){
  const cursor=cue(k,3,'Check the saved rank metadata');
  back(c,'What else must this restart restore?', 'Moving from four tensor shards to two   /   Check each state representation');
  const rows=[
    ['Model tensors','Global shapes and offsets','Gather the saved row and probe it.'],
    ['Optimizer','Masters, moments and parameter map','Check support for a tensor-degree change.'],
    ['Training stream','Iteration, RNG, scheduler and cursor','Restore the right example for each data rank.']
  ];
  rows.forEach(([name,fields,test],i)=>{
    const y=285+i*173;bed(c,143,y,1624,139);
    txt(c,name,190,y+67,42,C.paper,'left','Serif');
    txt(c,fields,580,y+45,33,tint[i]);txt(c,i===2&&!cursor?'Which sample comes next?':test,581,y+94,32,C.paper);
  });
  note(c,'A weight-only conversion can serve a forward pass. Continuing training also needs the saved history.');
}

function nextStep(c,k) {
  const b = k.beat.beatIndex;
  const referenceStep = resultAfter(k,5,'The saved run reaches one point two six',0.6);
  const resetStep = resultAfter(k,5,'The reset run reaches one point three',0.6);
  const resetCompared = resultAfter(k,5,'this four-hundredths error',0,false);
  const rewind = cue(k,6,'Rewind both',0.75);
  const rewinding = b === 6 && rewind < 1;
  const staleInput = resultAfter(k,6,'whose input is one',0,false);
  const staleStep = resultAfter(k,7,'Right, to one point five one',0.6);
  const staleCompared = resultAfter(k,7,'subtract a negative step',0,false);
  const replay = cue(k,7,'Advance the cursor',0.75);
  const replayed = resultAfter(k,7,'replay the saved example',0,false);
  const finalStep = resultAfter(k,7,'Both next weights reach one point two six',0.6);
  const candidate = b < 6 || rewinding ? reset : staleInput && !replayed ? stale : reference;
  const referenceMotion = b < 6 ? referenceStep : rewinding ? 1-rewind : staleStep;
  const restartMotion = b < 6 ? resetStep : rewinding ? 1-rewind :
    replayed ? finalStep : staleStep * (1-replay);
  const compare = b < 6 ? resetCompared && resetStep === 1 :
    replayed ? finalStep === 1 : staleCompared && staleStep === 1 && !replay;
  const previousReady = [
    resultAfter(k,4,'its saved velocity of point eight',0,false),
    resultAfter(k,4,'reset it to zero',0,false),
  ];
  const gradientReady = resultAfter(k,4,'gives a gradient of two',0,false);
  const formulaReady = resultAfter(k,4,'from the weight',0,false);
  const velocityReady = [
    resultAfter(k,5,'It carried point four into the gradient'),
    b < 6 ? resetStep > 0 : replayed ? finalStep > 0 : staleCompared && !replay,
  ];
  back(c,'Will the restart take the same next step?',
    'Column '+trackedColumn+'   /   Saved weight '+marked.toFixed(2)+'   /   Target '+reference.target);
  const xFor = w => 813+(w-1.2)*2500;
  for (const [i,t] of [reference,candidate].entries()) {
    const y = 267+i*242;
    const motion = i ? restartMotion : referenceMotion;
    const color = tint[i];
    bed(c,132,y,1651,197);
    txt(c,i?'Restart':'Reference',177,y+38,42,C.paper,'left','Serif');
    const previous = previousReady[i] ? t.previous.toFixed(1) : '?';
    mono(c,'input '+t.x+'   old v '+previous,180,y+83,29,color);
    mono(c,'prediction '+t.y+'   g '+(gradientReady?t.g:'?'),180,y+122,28,C.quiet);
    if (velocityReady[i] && !rewinding && motion === 1) {
      const gradient = t.g < 0 ? ' − '+Math.abs(t.g) : ' + '+t.g;
      mono(c,'v′ = '+round(t.carried)+gradient+' = '+round(t.velocity),180,y+161,28,color);
    }
    const yy=y+111;line(c,xFor(1.2),yy,xFor(1.55),yy,C.edge,4);
    for(const tick of [1.2,1.3,1.4,1.5]){const xx=xFor(tick);line(c,xx,yy-12,xx,yy+12,C.quiet,3);mono(c,tick.toFixed(2),xx,yy+43,27,C.quiet,'center');}
    dot(c,xFor(marked),yy,10,C.gold);
    if (motion > 0) {
      const end = xFor(lerp(marked,t.w,smooth(motion)));
      line(c,xFor(marked),yy,end,yy,color,7);
      dot(c,end,yy,12,color);
      if (motion === 1 && !rewinding && (!i || !replay || replayed)) {
        mono(c,t.w.toFixed(2),end,yy-48,42,color,'center');
      }
    } else if (b !== 6 || staleInput) {
      mono(c,'next weight?',1040,yy-48,34,C.quiet);
    }
  }
  if (compare) {
    const error = Math.abs(reference.w-candidate.w);
    const passed = error <= resumeTolerance;
    mono(c,'|restart − reference| = '+error.toFixed(3)+'   '+(passed?'≤':'>')+' '+resumeTolerance+
      '    '+(passed?'PASS':'FAIL'),960,785,40,C.ink,'center');
  } else if (formulaReady) {
    mono(c,'v′ = '+momentumDecay+' × old v + g     w′ = '+marked.toFixed(2)+' − '+resumeRate+' × v′',
      960,785,40,C.ink,'center');
  }
  note(c,finalStep===1?'The saved weight, velocity and data cursor reproduce the reference update.':
    replay?'Restore the data cursor and replay the saved example from the same weight.':
    staleInput?'Only the restart reads the previous example. Its target and saved velocity stay fixed.':
    b<6?'Both runs take their step from the gold weight using the same example.':
    rewind===1?'Both runs start again at the gold weight with the saved velocity.':
    'Return both runs to the saved weight.');
}
export function recovery(c,k){
  if(k.beat.beatIndex<=2)storage(c,k);
  else if(k.beat.beatIndex===3)manifest(c,k);
  else nextStep(c,k);
}
