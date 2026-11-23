import { C, base, text, mono, centered, plate, line, tag, footer, on, after, bracket, dot, rect, socket, poly } from './drawing.mjs';
import { decode, causal, polarity, padding, maskValues, words, wordValues, pack, page, pageTable, pageSize, used } from './operator.mjs';

export function corner(c,k) {
  const left=on(k,1,'Follow the upper-left mask'), right=on(k,2,'Align the last query'), window=on(k,3,'Narrow the local window');
  const rows=causal(2,decode,right?'right':'left',window?1:Infinity);
  const leftMeans=after(k,1,'Their means are ten','Compare those stops');
  const rightMeans=[after(k,2,'giving twenty-five','The second averages'),after(k,2,'The second averages','The bottom-right center')];
  const windowMeans=after(k,3,'Their means rise','Window endpoints');
  base(c,'Where does the first query sit?','Causal decode  /  equal scores');
  const x=396,dx=225;
  tag(c,'Key position',100,370);
  decode.forEach((v,j)=>{
    const cx=x+j*dx;
    if(j>=3){centered(c,'query '+(j-3),cx,269,39,C.green);poly(c,[[cx-11,286],[cx+11,286],[cx,301]],C.green);}
    centered(c,String(j),cx,370,40,C.sub,{face:'Mono'});
    plate(c,cx-91,397,182,97,'#f6d9a3','#bda986');centered(c,String(v),cx,466,53,C.ink,{face:'Mono'});
  });
  tag(c,'Value',103,460);tag(c,'Mean',1575,460);
  rows.forEach((row,i)=>{
    const y=550+i*147;
    text(c,'Query '+i,100,y+57,44,C.ink);
    decode.forEach((v,j)=>{
      const allowed=row.keep[j],cx=x+j*dx;
      plate(c,cx-91,y,182,87,!left?C.grey:allowed?(right?'#a6ddc4':'#f1c1a7'):'#dde3d7',C.rule,7);
      centered(c,!left?'?':allowed?String(v):'×',cx,y+59,48,allowed||!left?C.ink:C.sub,{face:'Mono'});
    });
    if(left){
      const ids=row.keep.flatMap((yes,j)=>yes?[j]:[]);
      bracket(c,x+ids[0]*dx-86,x+ids.at(-1)*dx+86,y+106,right?C.green:C.red);
      mono(c,row.total+' / '+row.count,1574,y+23,30,C.sub);
      const show=window?windowMeans:right?rightMeans[i]:leftMeans;
      mono(c,show?String(row.mean):'?',1574,y+82,56,right?C.green:C.red);
    }else mono(c,'?',1574,y+64,55);
  });
  const note=window?'Local window [center − 1, center], clipped to valid keys.':right?'Bottom-right center = query row + key length − query length.':left?'Upper left uses the query row number as its last key position.':'Both queries belong at the tail. A causal query can include itself.';
  footer(c,note);
}

export function bits(c,k) {
  const raw=after(k,1,'One thousand','True admits'),invert=on(k,1,'Invert the boolean mask');
  const repaired=after(k,1,'Now only ten','Broadcast that keep-mask');
  const r=polarity(invert);
  const showOutput=invert ? repaired : raw;
  base(c,'Which value passes the boolean mask?','Padding  /  zero scores');
  const xs=[583,1035];
  tag(c,'MHA padding mask',100,316);tag(c,'Key value',103,468);tag(c,'Bits passed to SDPA',103,635);
  maskValues.forEach((v,i)=>{
    const x=xs[i];centered(c,String(padding[i]),x,315,45,C.sub,{face:'Mono'});
    socket(c,x-157,372,314,143);centered(c,i?'Padding':'Real key',x,424,33,C.aqua);centered(c,String(v),x,489,57,C.white,{face:'Mono'});
    plate(c,x-156,558,312,114,showOutput && r.keep[i]?'#a9dcca':'#d2dacd');centered(c,String(r.keep[i]),x,634,47,C.ink,{face:'Mono'});
    if (!showOutput) return;
    if(r.keep[i]){
      line(c,[[x,674],[x,745],[1350,745]],C.green,7);
    }else{
      line(c,[[x,674],[x,693]],C.rule,3);
      line(c,[[x-12,690],[x+12,714]],C.red,4);
      line(c,[[x+12,690],[x-12,714]],C.red,4);
    }
  });
  plate(c,1353,625,393,190,C.deep);centered(c,'Output',1549,689,36,C.aqua);centered(c,showOutput?r.mean:'?',1549,776,76,C.white,{face:'Mono'});
  const note = repaired ? 'Inverted bits admit the real key. Boolean True means “allow” in SDPA.'
    : invert ? 'Only the bits sent to SDPA have changed.'
    : 'The caller passed its padding bits directly to boolean SDPA.';
  footer(c,note);
}

export function packed(c,k) {
  const wrong=after(k,2,'Rain brings a hundred','It joins'),fix=on(k,2,'Restore three'),cut=wrong&&!fix?4:3,s=pack(cut);
  const wrongMean=after(k,2,'Four values now average','Only the boundary changed');
  base(c,'Which word crosses the boundary?','Ragged batch  /  full attention per example');
  const start=123,step=331;
  tag(c,'Packed address',116,300);
  words.forEach((w,i)=>{
    const x=start+i*step,col=s.owners[i]==='A'?'#b5ddc5':'#edbc9d';
    centered(c,String(i),x+149,366,40,C.sub,{face:'Mono'});
    plate(c,x,400,300,201,col,'#a5b19c');
    centered(c,w,x+150,489,57,C.ink,{face:'Serif'});centered(c,'V = '+wordValues[i],x+150,560,40,C.ink,{face:'Mono'});
    centered(c,'Example '+s.owners[i],x+150,665,34);
  });
  const divide=start+cut*step-16;
  line(c,[[divide,377],[divide,673]],C.red,6);poly(c,[[divide-12,370],[divide+12,370],[divide,388]],C.red);
  bracket(c,start,divide-10,706,C.green);bracket(c,divide+10,start+4*step+300,706,C.orange);
  mono(c,'Offsets ['+s.offsets.join(', ')+']',120,815,43);
  mono(c,'A: ('+wordValues.slice(0,cut).join(' + ')+') / '+cut+' = '+(cut===3?s.result.total+'/'+cut:wrongMean?String(s.result.mean):'?'),785,815,43,C.green,{max:1015});
  footer(c,k.beat.beatIndex===1?'Proposed middle offset: 4. Which word would join the first sentence?':wrong&&!fix?'Address 3 still holds Rain. Its value now enters the first sentence’s mean.':'Each interval includes its first address and stops before its end offset.');
}

export function pages(c,k) {
  const b = k.beat.beatIndex, nan = on(k, 1, 'A NaN sits');
  const which = after(k, 2, 'The loaded padding', 'Even with zero probability');
  const done = (phrase) => b === 2 && k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  const clean = done('Keep loaded padding finite');
  const poisoned = done('produce NaN');
  const safe = done('safe for this multiply');
  const multiply = 'multiplying by a NaN value can produce NaN';
  const movement = b === 2 ? k.wordCue(multiply) : null;
  const travel = movement ? Math.max(0, Math.min(1, (k.elapsed - movement.start) / (movement.end - movement.start))) : 0;
  base(c,'Which padding reaches the multiply?','Paged KV  /  physical reads',true);
  if(b===0){
    const mapped=on(k,0,'This request maps');
    tag(c,'Request block table',112,320,C.aqua);tag(c,'Physical page pool',1144,320,C.aqua);
    pageTable.forEach((id,i)=>{
      const y=414+i*203;plate(c,120,y,626,124,'#34594e','#092a2b');text(c,'Logical page '+i,148,y+79,44,C.white);
      centered(c,mapped?id:'?',678,y+78,49,C.gold,{face:'Mono'});
      if(mapped)line(c,[[750,y+65],[834+i*70,y+65],[1014-i*45,401+id*152],[1150,401+id*152]],i?C.gold:C.aqua,5);
    });
    for(let id=0;id<3;id++){plate(c,1149,346+id*152,550,112,'#3d5855');text(c,'Page '+id,1191,418+id*152,47,C.paper);for(let j=0;j<12;j++)rect(c,1411+j*19,367+id*152,11,67,'#69817a');}
    footer(c,'The engine owns page lifetimes. The kernel follows the supplied locations.',true);return;
  }
  tag(c,'Physical page',108,307,C.aqua);tag(c,'256 rows per page  /  270 used keys',543,307,C.paper);
  [2,0,1].forEach((id,i)=>{
    const s=page(id),y=361+i*159,x=431,w=1006;
    text(c,'P'+id,121,y+70,56,C.paper,{face:'Mono'});
    text(c,s.loaded?'Read '+(s.logical+1):'Untouched',107,y+120,30,s.loaded?C.aqua:C.gold);
    rect(c,x,y+16,w,76,s.loaded?'#426558':'#2e4946');
    if(s.live)rect(c,x,y+16,w*s.live/pageSize,76,C.aqua);
    for(let n=0;n<=256;n+=8)line(c,[[x+n*w/pageSize,y+74],[x+n*w/pageSize,y+94]],C.deep,2);
    if(nan&&id!==2){
      const px=x+(14.5*w/pageSize);
      const picked = id === 0 && which;
      dot(c, px, y + 46, 10, picked && clean ? C.aqua : C.gold);
      line(c,[[px,y+98],[px+24,y+118],[px+66,y+118]],C.gold,2);
      text(c,id===0?(clean?'row 14 = 0':'row 14 = NaN'):'NaN in pool',px+77,y+130,32,C.gold);
      if (picked) {
        const from = px, to = 1410, trackY = y + 98;
        line(c, [[from, trackY], [to, trackY]], clean ? C.aqua : C.gold, 3);
        if (travel > 0 && travel < 1) {
          const sampleX = from + (to - from) * travel;
          plate(c, sampleX - 49, trackY - 22, 98, 40, C.deep, C.gold, 5);
          centered(c, 'NaN', sampleX, trackY + 8, 29, C.gold, { face: 'Mono' });
        }
        if (poisoned) {
          plate(c, 1452, y + 95, 389, 63, C.deep, clean ? C.aqua : C.gold);
          const equation = clean ? (safe ? '0 × 0 = 0' : '0 × 0 = ?') : '0 × NaN = NaN';
          centered(c, equation, 1646, y + 137, 39, clean ? C.aqua : C.gold, { face: 'Mono' });
        }
      }
    }
    const label=s.loaded?(s.pad?s.live+' live  /  '+s.pad+' pad':s.live+' live'):'No load';
    text(c,label,1472,y+69,39,C.paper,{max:370});
  });
  text(c, safe ? 'P0 padding is finite. P1 is still untouched.' :
    which ? 'Zero weight does not remove a loaded value from the multiply.' :
    'Which NaN is on a page this kernel reads?', 108, 854, 34, C.white);
}
