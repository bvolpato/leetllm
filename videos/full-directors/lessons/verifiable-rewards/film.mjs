import assert from 'node:assert/strict';
import {background} from './studio.mjs';
import {scanner,methods,tuluTerminalRows,contract,ownership,twoWays,prime,parser,host,look,hidden,bullets,gradeBullets,proofPass,theorem,snapshots,queryTrays,formatOnly,priorityRows,priority,transfer,scores} from './checker.mjs';
import {sample,critic,groups,groupState,clipping,tokenTerm,tokenCases,responseMean,kl,klTerms,sampling,reduction,categorical,scalarProbes,eight,budget} from './learning.mjs';
import {reports,aggregate,answers,pipeline,trace,ablation,ablationState,releaseGate,gates,within,decimal,decimalCases,teaching,costComparison} from './studies.mjs';
import {repair,payoff,repairState,payoffState} from './practice.mjs';
import {rlvrDecimalCheck,rlvrMixedProbability,rlvrReduction,rlvrGroupUpdate} from '../../../films/verifiable-rewards/arithmetic.mjs';
const painters=[
  scanner,methods,contract,ownership,twoWays,prime,parser,host,hidden,bullets,theorem,
  sample,critic,(c,k)=>groups(c,k,4),(c,k)=>groups(c,k,8),clipping,kl,sampling,reduction,
  (c,k)=>categorical(c,k,4),(c,k)=>categorical(c,k,8),reports,pipeline,trace,ablation,
  formatOnly,(c,k)=>scanner(c,k,true),priority,transfer,releaseGate,decimal,teaching,repair,payoff
];
function draw(c,k){
  c.save();
  try {c.scale(1.6,1.6);background(c);painters[k.beat.chapterIndex](c,k);}
  finally {c.restore();}
}
const clock=(beatIndex,opts={})=>({beat:{beatIndex},reveal:phrase=>opts[phrase]??0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' vs '+b);
function check(){
  const tuluScores=cues=>tuluTerminalRows(clock(4,cues)).map(row=>row.slice(1));
  const correctScored={'An incorrect answer':1};
  const predicting={...correctScored,'What happens if':1};
  assert.deepEqual(tuluScores({}),[[null,null],[null,null]]);
  assert.deepEqual(tuluScores(correctScored),[[10,null],[null,null]]);
  assert.deepEqual(tuluScores(predicting),[[10,null],[0,null]]);
  assert.deepEqual(tuluScores({...predicting,'These terminal scores':1}),[[10,-10],[0,-10]]);
  assert.deepEqual(scores(false),[1,1]);assert.deepEqual(scores(true),[1,0]);
  assert.deepEqual(look([[14,12],[8,12],[7,9],[11,13]]),[168,96,undefined,undefined]);
  const directions=['- north','- south','- west'];
  assert.deepEqual(gradeBullets(directions),{markers:3,total:3,filled:3,weak:1,strict:1});
  for(const extra of ['Done.','']){
    assert.deepEqual(gradeBullets([...directions,extra]),{markers:3,total:4,filled:3,weak:1,strict:0});
  }
  assert.deepEqual(gradeBullets(['- ','-  ','- \t']),{markers:3,total:3,filled:0,weak:1,strict:0});
  assert.equal(gradeBullets(['- north','south','- west']).strict,0);
  assert.equal(proofPass(['Classical.choice','propext']),true);
  assert.equal(proofPass(['sorryAx']),false);
  const a=['A',1], b=['B',null];
  assert.deepEqual(queryTrays(snapshots[0]),[[a,a,b],[a,b,b]]);
  assert.deepEqual(queryTrays(snapshots[1]),[[a,b],[a,b]]);
  assert.deepEqual(queryTrays(snapshots[2]),[[a,a,b],[a,b]]);
  assert.deepEqual(priorityRows(false),[.7,.3,.7]);assert.deepEqual(priorityRows(true),[0,0,1]);
  const stages=[{}, {'Replace one miss':1},{'Replace one miss':1,'then the other':1},
    {'Replace one miss':1,'then the other':1,'With four misses':1}];
  const groups=stages.map(s=>groupState(clock(5,s),4));
  assert.deepEqual(groups.map(s=>s.mean),[.5,.75,1,0]);
  assert.deepEqual(groups.map(s=>s.values),[[1,0,1,0],[1,1,1,0],[1,1,1,1],[0,0,0,0]]);
  for(const g of groups.slice(-2)){assert.equal(g.std,0);assert.deepEqual(g.advantages,[0,0,0,0]);}
  const continuous=groupState(clock(3),8);near(continuous.std,Math.sqrt(2/3));near(continuous.advantages[0],Math.sqrt(1.5));
  assert.deepEqual(tokenCases.map(c=>tokenTerm(c).surrogate),[1.2,-.8]);near(responseMean(tokenCases[1]),-2.8/3);
  assert.deepEqual(scalarProbes.map(({ratio,advantage,raw,alternative,surrogate,slope}) =>
    [ratio,advantage,raw,alternative,surrogate,slope]), [
    [0.7,  1,  0.7,  0.8,  0.7,  1],
    [0.7, -1, -0.7, -0.8, -0.8,  0],
    [1.3,  1,  1.3,  1.2,  1.2,  0],
    [1.3, -1, -1.3, -1.2, -1.3, -1],
  ]);
  near(klTerms(0).full,klTerms(0).frozen);assert.ok(klTerms(1).full<klTerms(1).frozen);
  near(klTerms(0).fullGradient,.16*Math.log(4));near(klTerms(0).fixedGradient,.3);
  assert.equal(rlvrMixedProbability(.01,64).mixed.toFixed(4),'0.4744');
  assert.equal(budget.reduce((a,b)=>a+b),3);near(rlvrReduction(0).loss,1);near(rlvrReduction(1).loss,2/3);
  near(rlvrGroupUpdate([1,0,1,0],1).expectedReward,.6224593312);near(rlvrGroupUpdate(eight,.1).expectedReward,.5062496745);
  assert.deepEqual(aggregate(answers,17),{hits:3,mode:16,votes:4});
  const comparing = ablationState(clock(1));
  assert.deepEqual(comparing.bars.map(b=>[b.label,b.points,b.opacity]), [
    ['Random rewards',21.4,1], ['Ground-truth rewards',29.1,1],
  ]);
  assert.equal(comparing.bracketOpacity,0);
  assert.equal(ablationState(clock(0,{'twenty-one point four':1})).bars[0].opacity,0);
  assert.equal(ablationState(clock(1,{'seven point seven percentage points':1})).bracketOpacity,0);
  const revealing = ablationState(clock(1,{'Now change the starting model':0.5}));
  assert.equal(revealing.bracketOpacity,0.5);
  const settled = ablationState(clock(2));
  assert.equal(settled.bracketOpacity,1);
  near(settled.gap,7.7);
  near(settled.bars[1].end-settled.bars[0].end,24*settled.gap);
  assert.deepEqual(revealing.bars,comparing.bars);
  assert.deepEqual(settled.bars,comparing.bars);
  assert.deepEqual(gates.map(within),[true,false,false]);
  const releaseChecks=candidate=>gates.map((row,i)=>within({...row,next:candidate[i]}));
  assert.deepEqual(releaseChecks([61,92,4]),[false,true,true]);
  assert.deepEqual(releaseChecks([62,89,6]),[true,true,true]);
  assert.deepEqual(decimalCases.map(args=>rlvrDecimalCheck(...args).pass),[true,false,false]);
  const comparisonAt = cues => costComparison(clock(2,cues));
  assert.deepEqual(comparisonAt({}).map(run=>run.score),[null,null]);
  assert.deepEqual(comparisonAt({'The direct RL run':1}).map(run=>run.score),[72.6,null]);
  assert.deepEqual(costComparison(clock(3)),[
    {name:'Distilled',score:72.6,costs:['Teacher answer generation','Filtering','Verification','Student training on saved answers']},
    {name:'Direct RL',score:47.0,costs:['Student rollouts','Verifier calls','Policy updates']},
  ]);
  const before=repairState(clock(1)).group, first=repairState(clock(2,{'Lift the lost-host':1})).group, fixed=repairState(clock(4)).group;
  assert.deepEqual(before.rewards,[1,1,0,0]);
  assert.deepEqual(first.active,['R1','R2','R3']);assert.deepEqual(first.quarantined,['R4']);
  assert.deepEqual(first.rewards,[1,1,0]);assert.deepEqual(fixed.rewards,[1,0,0]);
  near(first.mean,2/3);near(fixed.mean,1/3);near(first.std,fixed.std);
  assert.ok(first.advantages[1]>0&&fixed.advantages[1]<0);
  const rescore = repairState(clock(3, {'One pass among three': 1}));
  assert.deepEqual(rescore.group.rewards, [1, 0, 0]);
  assert.equal(rescore.showNewMean, false);
  assert.deepEqual(rescore.showNewAdvantage, [false, false, false]);
  assert.deepEqual(repairState(clock(5, {'The timeout still earned zero': 1})).showNewAdvantage,
    [true, true, false]);
  const start = payoffState(clock(0));
  const logitStep = payoffState(clock(1, {'The first logit rises': 1}));
  assert.ok(logitStep.fixed.logits[1] < 0);
  assert.deepEqual(logitStep.displayed, start.displayed);
  const beforeNormalization = payoffState(clock(2, {
    'Exponentiate those three logits': 1,
    'divide each result by their sum': 1,
  }));
  assert.ok(beforeNormalization.showWeights && beforeNormalization.showSum);
  assert.deepEqual(beforeNormalization.displayed, start.displayed);
  near(beforeNormalization.exponentials[1] / beforeNormalization.normalizer, logitStep.fixed.probabilities[1]);
  const midway = payoffState(clock(2, {'Their unrounded shares': .5}));
  const replayStart = payoffState(clock(3, {'Start a second copy at one third': 1}));
  const end = payoffState(clock(4));
  for (const probabilities of [start.displayed, midway.displayed, end.displayed, end.prior.probabilities]) {
    near(probabilities.reduce((a, b) => a + b), 1);
  }
  assert.ok(end.displayed[1] < midway.displayed[1] && midway.displayed[1] < start.uniform);
  assert.ok(replayStart.showReplay && !replayStart.showReplayAdvantages);
  assert.deepEqual(replayStart.displayed, end.displayed);
  assert.deepEqual(replayStart.prior.probabilities, start.displayed);
  assert.equal((100 * end.prior.probabilities[1]).toFixed(1), '35.6');
  assert.equal((100 * end.displayed[1]).toFixed(1), '30.9');
  return true;
}
export default {title:'Learning from Answers We Can Check',draw,check};

