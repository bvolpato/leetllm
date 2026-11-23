import { C, base, text, mono, centered, plate, socket, line, footer, on, after, rect, tag } from './drawing.mjs';
import { scores, first, merged, output, values, lse, probabilities, sum, vector, decimals, gp, dp, ds, correction } from './operator.mjs';

export function backward(c,k) {
  const saved=on(k,0,'Keep the inputs'), firstScores=on(k,1,'Recompute the first two scores');
  const firstPass=on(k,1,'That rebuilds their probabilities'), freed=on(k,1,'Use them and free'), second=on(k,1,'Rebuild the next pair'), done=on(k,2,'discards it');
  const count=second?4:firstPass?2:0, active=second?2:0, occupied=firstPass&&!freed||second&&!done;
  base(c,'How can backward recover the probabilities?','Backward  /  nonempty row',true);
  tag(c,'Saved for backward',110,296,C.aqua);socket(c,110,346,567,418);
  mono(c,'Q   K   V   O',153,427,48,C.white);
  text(c,'Forward output',154,504,32,C.aqua);mono(c,vector(output),151,563,42,C.white);
  line(c,[[148,608],[633,608]],'#46685f',2);
  text(c,'Row log-sum-exp',153,658,33,C.aqua);mono(c,saved?decimals(lse,4):'?',148,735,59,C.gold);
  line(c,[[680,546],[785,546]],C.aqua,5);
  tag(c,'Recompute two scores at a time',792,296,C.aqua);
  for(let j=0;j<2;j++){
    const x=795+j*511,i=active+j;
    plate(c,x,346,475,255,'#30534c','#0d2422');
    centered(c,occupied||firstScores&&!freed?'K'+i+'   score '+scores[i]:'Temporary slot',x+237,422,40,C.paper,{face:'Mono'});
    centered(c,occupied?'exp('+scores[i]+' − '+decimals(lse,4)+')':'·',x+237,489,36,C.aqua,{face:'Mono'});
    centered(c,occupied?decimals(probabilities[i],4):'·',x+237,565,50,C.gold,{face:'Mono'});
  }
  const mass=sum(probabilities.slice(0,count));
  tag(c,'Reconstructed mass so far',796,682,C.aqua);
  rect(c,797,717,684,45,'#354e49');rect(c,797,717,684*mass,45,C.aqua);
  mono(c,decimals(mass,4),1520,757,43,C.white);
  const partial=output.map((_,d)=>sum(probabilities.slice(0,count).map((p,j)=>p*values[j][d])));
  mono(c,'Value contribution  '+vector(partial),795,840,37,C.white);
  footer(c,saved?'For a nonempty row: LSE = m + log ℓ.  Rebuild allowed P = exp(score − LSE).':'Training will need the effect of each key again.',true);
}

export function gradient(c,k) {
  const avg=after(k,1,'is four','Subtract four'), minus=on(k,1,'Subtract four');
  const signs=[after(k,1,'The first derivative','The second is'),after(k,1,'The second is','They cancel')];
  base(c,'Which score derivative is negative?','Softmax backward  /  nonempty row, dropout off');
  tag(c,'Probability',119,315);tag(c,'Incoming dP',588,315);tag(c,'dP − D',963,315);tag(c,'Score derivative dS',1348,315);
  gp.forEach((p,i)=>{
    const y=390+i*193;
    plate(c,116,y,394,133,'#c6dfce');rect(c,140,y+97,333*p,12,C.green);mono(c,'P'+i+' = '+p,142,y+70,43);
    centered(c,String(dp[i]),692,y+82,61);
    centered(c,minus?String(dp[i]-correction):'?',1049,y+82,61);
    const origin=1572, length=ds[i]*223;
    line(c,[[origin,y+63],[origin,y+133]],C.sub,3);
    if(signs[i]){rect(c,length<0?origin+length:origin,y+74,Math.abs(length),42,i?C.teal:C.orange);centered(c,(ds[i]>0?'+':'')+ds[i],origin,y+46,49,C.ink,{face:'Mono'});}
  });
  mono(c,'D = 0.25 × 1 + 0.75 × 5 = '+(avg?correction:'?'),120,823,46);
  if(signs[1])mono(c,'Σ dS = 0',1400,823,47,C.green);
  footer(c,k.beat.beatIndex===2?'G = output gradient.   dV = transpose(P) G     dQ = dS K / √d     dK = transpose(dS) Q / √d':'For a nonempty row without dropout:  dS = P × (dP − D).');
}
