import {C,txt,box,line,dot,title,tape,field,cue,mix,signed,percent} from './studio.mjs';
import {freshRecords,freshProduct} from '../../../films/verifiable-rewards/capacity.mjs';
import {rlvrGroupUpdate,rlvrRepair} from '../../../films/verifiable-rewards/arithmetic.mjs';

const submitted=freshRecords.map(r=>r.response?.match(/\d+/g)??[]);
const rowY = i => 213 + i * 107;
const submissionX = 63;
const submissionWidth = 410;
const submissionHeight = 78;
const twoBoxRow = 1;

function specimen(c,x,y,w,h,i){
  tape(c,x,y,w,h);
  txt(c,freshRecords[i].id,x+19,y+.64*h,25,C.teal,'left','Mono');
  if(i<2){
    submitted[i].forEach((v,j)=>{if(j)txt(c,'then',x+177,y+.61*h,20,C.ink);field(c,v,x+74+j*175,y+14,89,h-28);});
  }else txt(c,i===2?'Own time limit':'Lost host',x+80,y+.63*h,27,C.ink);
}
export function repairState(k){
  const lift = cue(k, 2, 'Lift the lost-host', 1.15);
  const rescore = k.beat.beatIndex >= 3;
  const strict = Boolean(cue(k, 3, 'One pass among three', 0));
  const stage = strict ? 2 : lift === 1 ? 1 : 0;
  return {
    lift,
    rescore,
    stage,
    group: rlvrRepair(stage),
    showFirstMean: Boolean(cue(k, 2, 'The contradictory answer still sits', 0)),
    showNewMean: k.beat.beatIndex >= 4,
    showNewAdvantage: [
      k.beat.beatIndex >= 5,
      Boolean(cue(k, 5, 'The timeout still earned zero', 0)),
      Boolean(cue(k, 5, 'Both answers are now compared', 0)),
    ],
  };
}

export function repair(c,k){
  const b = k.beat.beatIndex;
  const {lift, rescore, stage, group, showFirstMean, showNewMean, showNewAdvantage} = repairState(k);
  const firstBox = rlvrRepair(1);
  const heading = rescore ? 'Rescore the same three submissions'
    : stage ? 'Keep the measured rewards' : 'Which zero belongs in training?';
  title(c, heading,
    '18 workers × 14 slots  =  ' + freshProduct + ' jobs   /   one slot per job');
  const stored = cue(k, 1, 'Which zero belongs', 0);
  const twoFields = cue(k, 3, 'The second contains two boxes', 0);
  const sameSpread = b >= 5;
  const focus = cue(k, 5, 'Read across the second row', 0);
  const [firstRewardX, newRewardX, firstAdvantageX, newAdvantageX] = [523, 633, 738, 848];
  txt(c, 'Reward', 578, 163, 23, C.muted, 'center');
  txt(c, stage ? 'First box' : 'Old log', firstRewardX, 192, 21, stage ? C.gold : C.muted, 'center');
  if (stage) {
    txt(c, 'Advantage', 793, 163, 23, C.muted, 'center');
    txt(c, 'First box', firstAdvantageX, 192, 21, C.gold, 'center');
  }
  if (rescore) {
    txt(c, 'Single box', newRewardX, 192, 21, C.cyan, 'center');
    txt(c, 'Single box', newAdvantageX, 192, 21, C.cyan, 'center');
  }
  for (let i = 0; i < 3; i++) {
    const y = rowY(i);
    if (i === twoBoxRow && focus) box(c, 54, y - 9, 840, 96, C.slate, 6, C.edge);
    specimen(c, submissionX, y, submissionWidth, submissionHeight, i);
    if (i === twoBoxRow && twoFields) {
      submitted[i].forEach((_, j) => line(c, submissionX + 74 + j * 175, y + 69,
        submissionX + 163 + j * 175, y + 69, C.mark, 3));
    }
    if (stored) {
      const reward = stage ? firstBox.rewards[i] : group.rewards[i];
      txt(c, reward, firstRewardX, y + 52, 36, stage ? C.gold : C.light, 'center', 'Mono');
    }
    if (showFirstMean) {
      txt(c, signed(firstBox.advantages[i], 3), firstAdvantageX, y + 51, 25, C.gold, 'center', 'Mono');
    }
    if (rescore) {
      txt(c, stage === 2 ? group.rewards[i] : '…', newRewardX, y + 52, 36, C.cyan, 'center', 'Mono');
      txt(c, showNewAdvantage[i] ? signed(group.advantages[i], 3) : '…',
        newAdvantageX, y + 51, 25, C.cyan, 'center', 'Mono');
    }
  }
  if (b > 0) {
    const slide = Math.min(1, lift / .63), rise = Math.max(0, (lift - .63) / .37);
    const y = mix(rowY(3), rowY(0), rise);
    const x = mix(submissionX, 913, slide), w = mix(submissionWidth, 232, slide);
    if (lift > 0) {
      box(c, 905, 174, 249, 156, C.deep, 8, C.edge);
      txt(c, 'Retry queue', 1029, 200, 22, C.light, 'center');
    }
    specimen(c, x, y, w, submissionHeight, 3);
    if (!lift && stored) txt(c, group.rewards[3], firstRewardX, y + 52, 36, C.light, 'center', 'Mono');
    if (lift === 1) txt(c, 'Same attempt · unscored', 1029, 316, 19, C.muted, 'center');
  }
  if (showFirstMean) {
    const mean = g => g.rewards.reduce((sum, reward) => sum + reward, 0) + ' / ' + g.active.length;
    txt(c, 'First-box mean  ' + mean(firstBox), 64, 582, 26, C.gold, 'left', 'Mono');
    if (showNewMean) txt(c, 'Single-box mean  ' + mean(group), 425, 582, 26, C.cyan, 'left', 'Mono');
    const spread = sameSpread ? 'Same spread' : 'Population spread';
    txt(c, spread + '  ≈ ' + group.std.toFixed(4), 814, 582, 22, C.light, 'left', 'Mono', 322);
  }
}

export function payoffState(k){
  const repaired = rlvrRepair(2), firstBox = rlvrRepair(1);
  const stepSize = .3;
  const logitStep = cue(k, 1, 'The first logit rises', 1);
  const normalized = cue(k, 2, 'Their unrounded shares', .65);
  const replay = cue(k, 3, 'The single-box checker pushed', 1);
  const fixed = rlvrGroupUpdate(repaired.rewards, stepSize, logitStep);
  const exponentials = fixed.logits.map(Math.exp);
  return {
    fixed,
    stepSize,
    exponentials,
    normalizer: exponentials.reduce((sum, weight) => sum + weight, 0),
    normalized,
    displayed: rlvrGroupUpdate(repaired.rewards, stepSize, normalized).probabilities,
    uniform: 1 / repaired.active.length,
    showWeights: k.beat.beatIndex === 2 && Boolean(cue(k, 2, 'Exponentiate those three logits', 0)),
    showSum: k.beat.beatIndex === 2 &&
      Boolean(k.reveal('divide each result by their sum', 0, {captionStart: false})),
    showReplay: Boolean(cue(k, 3, 'Start a second copy at one third', 0)),
    showReplayAdvantages: Boolean(cue(k, 3, 'This time use the first-box scores', 0)),
    prior: rlvrGroupUpdate(firstBox.rewards, stepSize, replay),
    replay,
  };
}

export function payoff(c,k){
  const {fixed, stepSize, exponentials, normalizer, normalized, displayed, uniform,
    showWeights, showSum, showReplay, showReplayAdvantages, prior, replay} = payoffState(k);
  const x = p => 772 + (p - .28) * 3180;
  const origin = x(uniform);
  const focus = cue(k, 0, 'Look at the second row again', 0);
  const predict = k.beat.beatIndex === 0 && cue(k, 0, 'Which way should', 0);
  title(c, 'One answer, two probability updates',
    '18 × 14   /   three measured responses   /   uniform start   /   step size ' + stepSize);
  txt(c, 'Submission', 64, 192, 24, C.muted);
  txt(c, 'Advantage', showReplay ? 609 : 542, 160, 22, C.muted, 'center');
  txt(c, showReplay ? 'First box' : 'Single box', 542, 192, 22, showReplay ? C.gold : C.cyan, 'center');
  txt(c, showReplay ? 'Single box' : showWeights ? 'exp(logit)' : 'Logit',
    677, 192, 23, C.cyan, 'center');
  txt(c, normalized ? 'Sampling probability' : 'Starting probability', origin, 160, 24, C.light, 'center');
  for (let i = 0; i < 3; i++) {
    const y = rowY(i);
    if (i === twoBoxRow && focus) box(c, 54, y - 9, 1092, 96, C.slate, 6, C.edge);
    specimen(c, submissionX, y, submissionWidth, submissionHeight, i);
    const left = showReplay ? (showReplayAdvantages ? signed(prior.advantages[i], 3) : '…')
      : signed(fixed.advantages[i], 3);
    const right = showReplay ? signed(fixed.advantages[i], 3)
      : showWeights ? exponentials[i].toFixed(3) : signed(fixed.logits[i], 3);
    txt(c, left, 542, y + 48, 27, showReplay ? C.gold : C.cyan, 'center', 'Mono');
    txt(c, right, 677, y + 48, 27, C.cyan, 'center', 'Mono');
    line(c, x(.28), y + 45, x(.39), y + 45, C.edge, 2);
    line(c, origin, y + 19, origin, y + 58, C.muted, 2);
    line(c, origin, y + 45, x(displayed[i]), y + 45, C.cyan, 5);
    dot(c, x(displayed[i]), y + 45, 8, C.cyan);
    if (normalized === 1) {
      txt(c, percent(displayed[i]), x(displayed[i]), y + 77, 24, C.cyan, 'center', 'Mono');
    }
    if (showReplay) {
      const p = prior.probabilities[i];
      line(c, origin, y + 25, x(p), y + 25, C.gold, 3);
      dot(c, x(p), y + 25, 7, C.gold);
      if (replay === 1) txt(c, percent(p), x(p), y + 11, 23, C.gold, 'center', 'Mono');
    }
  }
  txt(c, '1/3 start', origin, 192, 23, C.muted, 'center', 'Mono');
  txt(c, 'R4   Lost host · excluded', 65, 580, 24, C.muted);
  if (showSum) txt(c, 'Sum of exp(logit)  ≈  ' + normalizer.toFixed(3), 481, 580, 27, C.light, 'left', 'Mono');
  if (predict) txt(c, 'Which way will R2 move?', 772, 580, 28, C.light);
  if (showReplay) {
    txt(c, 'First box', 793, 580, 25, C.gold);
    txt(c, 'Single box', 972, 580, 25, C.cyan);
  }
  if (cue(k, 4, 'To find out whether', 0)) {
    txt(c, 'Test new worker counts', 416, 580, 26, C.light);
  }
}

