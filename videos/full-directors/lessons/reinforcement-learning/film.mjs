import { prepareCaptionReflow } from './captions.mjs';
import { Bench, C, clamp, lerp, fmt } from './workshop.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
import { actions, arrows, shortRoute, ridgeRoute, calm, windy, solve, step, defaultDiscount, discounted, softmax, policyGradient, checkExamples } from './gridworld.mjs';

const cell = state => ({ x: 210 + (state % 4) * 223, y: 380 + Math.floor(state / 4) * 177 });
const beat = k => k.beat.beatIndex;
const cheaperCliff = solve({ slip: .2, cliff: -5 });
const shorterHorizon = solve({ slip: .2, gamma: .5 });
const firstPolicyEvaluation = solve({ slip: .2, policy: calm.policy });
function after(k, phrase, duration = .45, captionStart = phrase) {
  const cue = k.wordCue(phrase);
  k.reveal(phrase, cue.end - cue.start + duration, { captionStart });
  return clamp((k.elapsed - cue.end) / duration);
}
function spoken(k, phrase) {
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: false }) === 1;
}
function words(d, text, x, y, width = 680, size = 36, color = C.cream, spacing = 1.4) {
  d.c.font = lessonFont(size);
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? line + ' ' + word : word;
    if (line && d.c.measureText(next).width > width) { lines.push(line); line = word; }
    else line = next;
  }
  lines.push(line);
  lines.forEach((row, i) => d.txt(row, x, y + i * size * spacing, size, color));
  return y + lines.length * size * spacing;
}
function side(d, title, lines, color = C.brass) {
  d.txt(title, 1115, 313, 44, color, 'left', 'Serif');
  let y = 393;
  for (const line of lines) y = words(d, line, 1115, y, 690, 34) + 22;
}
function alpha(d, opacity, paint) { d.c.save(); d.c.globalAlpha *= opacity; paint(); d.c.restore(); }
function footer(d, line, y = 969) { d.note(line, 960, y, C.faint, 31); }
function map(d, { values, policy, focus, labels = true, bonus = false, cliff = -50 } = {}) {
  for (let state = 0; state < 12; state++) {
    const { x, y } = cell(state), terminal = state >= 8;
    const color = state === 11 ? C.green : terminal ? C.red : focus === state ? C.brass : C.hair;
    d.rect(x - 99, y - 75, 198, 150, terminal ? '#243b3c' : C.plate, 14, color, focus === state ? 4 : 2);
    const tag = state === 11 ? 'BEACON' : terminal ? 'CLIFF' : `(${Math.floor(state / 4)},${state % 4})`;
    d.txt(tag, x - 80, y - 46, 22, terminal ? color : C.faint, 'left', 'Mono');
    if (terminal) {
      d.mono(values ? 'V = 0' : state === 11 ? '+20' : fmt(cliff), x, y + 11, 40, color, 'center');
      d.txt(values ? 'entry ' + (state === 11 ? '+20' : fmt(cliff)) : 'entry reward', x - 10, y + 52, 22, color, 'center');
    }
    else if (policy && !values) d.txt(arrows[policy[state]], x, y + 9, 58, C.green, 'center');
    else if (values && values[state] !== null) d.mono(fmt(values[state]), x, y + 11, 43, state === focus ? C.brass : C.cream, 'center');
    else if (state === 4 && labels) d.txt('START', x, y + 16, 28, C.cream, 'center');
    if (bonus && state === 3) d.txt('+8 bonus', x, y + 20, 30, C.brass, 'center');
    if (!terminal && policy && values) d.txt(arrows[policy[state]], x + 67, y - 45, 32, C.green, 'center');
  }
}
function route(d, states, color, progress = 1, offset = 0) {
  const lane = offset === -13 ? [70, 36] : offset === 14 ? [86, 56] : [82, 50];
  const points = states.map(state => { const p = cell(state); return [p.x + lane[0], p.y + lane[1]]; });
  d.path(points, color, 6);
  const position = clamp(progress) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(position)), t = position - i;
  const x = lerp(points[i][0], points[i + 1][0], t), y = lerp(points[i][1], points[i + 1][1], t);
  d.dot(x, y, 10, color, C.bg, 3);
}
function backward(d, source, dest, amount = 1) {
  const a = cell(source), b = cell(dest);
  const vertical = a.x === b.x;
  const from = vertical ? [a.x, a.y - 65] : [a.x - 60, a.y + 51];
  const to = vertical ? [b.x, b.y + 65] : [b.x + 60, b.y + 51];
  d.arrow(...from, ...to, C.brass, 4);
  d.dot(lerp(from[0], to[0], amount), lerp(from[1], to[1], amount), 9, C.brass);
}
function branches(d, progress = 1) {
  const a = cell(5);
  for (const [state, color] of [[6, C.brass], [1, C.blue], [9, C.red]]) {
    const b = cell(state), vertical = a.x === b.x;
    const p = vertical ? [a.x, a.y + (b.y > a.y ? 63 : -63)] : [a.x + 65, a.y + 20];
    const q = vertical ? [b.x, b.y + (b.y > a.y ? -63 : 63)] : [b.x - 65, b.y + 20];
    d.arrow(...p, ...q, color, 5);
    d.dot(lerp(p[0], q[0], progress), lerp(p[1], q[1], progress), 8, color);
  }
}
function actionBars(d, values, title, { x = 1115, y = 412, highlighted } = {}) {
  d.txt(title, x, y - 74, 42, C.cream, 'left', 'Serif');
  const min = Math.min(0, ...values), max = Math.max(0, ...values);
  const plot = value => x + 143 + (value - min) / (max - min) * 360;
  const zero = plot(0);
  d.line(zero, y - 34, zero, y + 341, C.rim, 2);
  d.txt('0', zero, y + 375, 23, C.faint, 'center', 'Mono');
  values.forEach((value, i) => {
    const yy = y + i * 101, end = plot(value);
    d.txt(actions[i], x, yy, 32, highlighted === i ? C.brass : C.faint);
    d.rect(Math.min(zero, end), yy - 17, Math.abs(end - zero), 34, value < 0 ? C.red : C.green, 6);
    d.mono(fmt(value), x + 650, yy, 35, highlighted === i ? C.brass : C.cream, 'right');
  });
}
function opening(d, k) {
  const b = beat(k);
  map(d, { labels: b < 3 });
  if (b === 0 || b >= 3) {
    route(d, ridgeRoute, C.blue, b === 3 ? k.reveal('blue route', 5) : 1, -13);
    route(d, shortRoute, C.brass, b === 3 ? k.reveal('right, right, right, down', 4) : 1, 14);
  }
  const panels = [
    ['One destination, two routes', ['Gold: 4 moves beside the cliff.', 'Blue: 6 moves over the ridge.', 'What makes a route worth taking?']],
    ['A small world', ['State: a row and a column.', 'Actions: Up, Right, Down, Left.', 'Start: (1,0). Beacon: (2,3).']],
    ['Rewards on arrival', ['Ordinary move: −1', 'Beacon: +20, then the trip ends.', 'Cliff: −50, then the trip ends.', 'Outer wall: stay in place and pay −1.']],
    ['First, firm ground', ['Every chosen move succeeds.', 'Shortcut: −1, −1, −1, +20', 'Ridge: five costs, then +20']],
    ['Learn from consequences', ['Choose an action.', 'Observe a reward and next state.', 'Improve the policy: the rule for choosing actions.']],
  ];
  side(d, ...panels[b]);
  footer(d, b >= 4 ? 'The same map will connect planning, learning, and policy gradients.' : 'Gold = shortcut     Blue = ridge     Red = terminal cliff');
}
function rewardToGo(d, k, rewards, width) {
  const returns = Array(rewards.length + 1).fill(0);
  for (let i = rewards.length - 1; i >= 0; i--)
    returns[i] = rewards[i] + defaultDiscount * returns[i + 1];

  const final = k.wordCue('start with the final reward');
  const ends = [
    final.end,
    k.wordCue('add the current reward').end,
    k.wordCue('point nine times').end,
    k.wordCue('the return already computed').end,
  ];
  const center = i => 160 + width * (i + .5) - 18;
  for (const [stage, end] of ends.entries()) {
    const i = rewards.length - 1 - stage;
    const start = stage === 0 ? final.start : ends[stage - 1];
    if (k.elapsed < start) break;
    if (stage) {
      const progress = clamp((k.elapsed - start) / (end - start));
      const from = center(i + 1) - 29;
      const to = center(i) + 29;
      if (progress > 0) {
        const tip = lerp(from, to, progress);
        if (from - tip > 25) d.arrow(from, 690, tip, 690, C.blue, 4);
        d.dot(tip, 690, 6, C.blue);
      }
    }
    const ready = k.elapsed >= end;
    d.mono(`G${'₀₁₂₃'[i]} = ${ready ? returns[i].toFixed(2).replace(/\.00$/u, '') : '?'}`,
      center(i), 622, 53, ready ? C.green : C.faint, 'center');
    d.mono(`${fmt(rewards[i])} + 0.90 × ${fmt(returns[i + 1])}`,
      center(i), 756, 38, C.brass, 'center', width - 50);
  }
  footer(d, 'Work backward: Gₜ = Rₜ₊₁ + γGₜ₊₁. After the last reward, G₄ = 0.', 249);
}
function returns(d, k) {
  const b = beat(k), rewards = b === 2 ? [-1, -1, -1, -1, -1, 20] : [-1, -1, -1, 20];
  const width = 1600 / rewards.length, y = 460;
  const visible = b === 1 ? k.reveal('first reward', 4) : 1;
  rewards.forEach((r, i) => {
    const x = 160 + width * i;
    d.txt(`MOVE ${i + 1}`, x + width / 2 - 18, 321, 27, C.faint, 'center', 'Mono');
    d.rect(x, 370, width - 38, 175, C.plate, 15, r > 0 ? C.green : C.hair);
    d.mono(r > 0 ? '+20' : '−1', x + width / 2 - 18, y - 25, 64, r > 0 ? C.green : C.cream, 'center');
    if (b > 0 && b < 4) alpha(d, clamp(visible * rewards.length - i), () => {
      d.mono('× ' + fmt(0.9 ** i, 5), x + width / 2 - 18, 510, 30, C.brass, 'center');
      d.mono(fmt(r * 0.9 ** i, 4), x + width / 2 - 18, 625, 40, C.brass, 'center');
    });
  });
  if (b === 4) {
    rewardToGo(d, k, rewards, width);
    return;
  }
  const shown = b === 0 ? rewards.reduce((a, v) => a + v) : discounted(rewards);
  const amount = b === 0 ? after(k, 'seventeen') : b === 1 ? after(k, 'eleven point eight seven') : b === 2 ? after(k, 'seven point seven one') : 1;
  alpha(d, amount, () => d.mono(`Return = ${fmt(shown, 4)}`, 960, 795, 72, C.green, 'center'));
  footer(d, ['Reward = one transition. Return = rewards across a trip.', 'The first reward is undiscounted. The fourth reward carries γ³.', amount === 1 ? 'Six moves: 7.7147. Four moves: 11.87.' : 'The ridge reaches the same reward after two additional moves.', 'Changing γ changes the objective, even on the same physical map.'][b], b === 2 ? 249 : undefined);
}
function state(d, k) {
  const b = beat(k);
  map(d, { focus: 5 });
  if (b < 3) branches(d, b === 0 ? k.reveal('intended move', 3) : 1);
  const panels = [
    ['Choose Right; wind decides', ['80%: land right.', '10%: land up.', '10%: land down, in the cliff.']],
    ['Expected immediate reward', ['0.80 × (−1)', '+ 0.10 × (−1)', '+ 0.10 × (−50)', b === 1 && after(k, 'minus five point nine') === 1 ? '= −5.90' : '']],
    ['A Markov decision process', ['States S, actions A', 'Transitions P(s′ | s,a)', 'Rewards R, discount γ', 'The action is a choice. The landing is an outcome.']],
    ['What belongs in the state?', ['Coordinates suffice for our fixed wind rule.', 'Persistent wind needs a direction field too.', 'Same state + same action → same outcome distribution.']],
    ['Two sources of randomness', ['Policy: which action is chosen?', 'Environment: where does it land?', 'Exploration and wind can both move the rover off its intended route.']],
  ];
  side(d, ...panels[b]);
  footer(d, b === 3 ? 'Add information when it changes the transition or reward prediction.' : 'An action can have several outcomes. A policy can choose several actions.', b === 3 ? 856 : undefined);
}
function bellman(d, k) {
  const b = beat(k), values = Array(12).fill(null);
  let extent = b === 0 ? 1 : b === 1 ? 1 + Math.floor(after(k, 'seventeen')) + Math.floor(after(k, 'fourteen point three')) + Math.floor(after(k, 'eleven point eight seven')) : 4;
  for (let i = 0; i < extent; i++) values[7 - i] = calm.values[7 - i];
  map(d, { values: b === 4 ? undefined : values, focus: b === 4 ? 5 : 8 - extent });
  if (b === 4) branches(d, k.reveal('weighted average', 1));
  else for (let i = 0; i < extent; i++) backward(d, i === 0 ? 11 : 8 - i, 7 - i);
  const panels = [
    ['One move to success', ['Q((1,3), Down) = 20', 'The entry reward is immediate.', 'Terminal continuation = 0.']],
    ['Bring the value backward', [extent > 1 ? '−1 + 0.90 × 20 = 17' : 'Next value: 20. Step cost: −1.', extent > 2 ? '−1 + 0.90 × 17 = 14.30' : '', extent > 3 ? '−1 + 0.90 × 14.30 = 11.87' : '']],
    ['One step + the remaining trip', ['Q(s,a) = E[ R + γV(s′) ]', 'Q: choose this action, then continue.', 'V: expected return from this state.']],
    ['Evaluate or improve?', ['Follow π: Vπ(s) = Σₐ π(a|s)Qπ(s,a)', 'Choose the best: V*(s) = maxₐ Q*(s,a)', 'A policy average and an action maximum answer different questions.']],
    ['Average complete branches', ['For each possible landing:', 'reward + γ × continuation', 'Then weight by its probability and add.']],
  ];
  side(d, ...panels[b]);
  footer(d, 'The terminal state has value zero. The reward is paid on the transition into it.');
}
function sweepTable(d, { x, heading, values, focus, color }) {
  d.txt(heading, x, 292, 45, color, 'left', 'Serif');
  for (let state = 0; state < 12; state++) {
    const left = x + state % 4 * 170;
    const top = 344 + Math.floor(state / 4) * 116;
    const tag = state === 11 ? 'Beacon' : state >= 8 ? 'Cliff' : state === shortRoute[0] ? 'Start' : '';
    const active = state === focus;
    d.rect(left, top, 156, 102, state >= 8 ? C.dark : C.plate, 12, active ? color : C.hair, active ? 5 : 2);
    if (tag) d.txt(tag, left + 78, top + 25, 26, state === 11 ? C.green : state >= 8 ? C.red : C.faint, 'center');
    const value = values ? fmt(values[state]) : active ? '?' : '';
    d.mono(value, left + 78, top + (tag ? 68 : 53), 43, active ? color : C.faint, 'center');
  }
}
function synchronousSweeps(d, k) {
  const b = beat(k);
  let sweep = b === 0 ? 1 : 4;
  let reading = 1;
  if (b === 1) {
    const third = after(k, 'On the third sweep', .8);
    const fourth = after(k, 'On the fourth sweep', .8);
    sweep = 2 + Number(third > 0) + Number(fourth > 0);
    reading = fourth || third || k.reveal('read the first table', .8);
  } else if (b === 0) {
    reading = k.reveal('looks only one move ahead', .8);
  }
  const previous = calm.sweeps[sweep - 1];
  const current = calm.sweeps[sweep];
  const state = shortRoute[shortRoute.length - 1 - sweep];
  const { next, reward } = step(state, calm.policy[state]);
  const resultCue = ['discovers twenty', 'as seventeen', 'fourteen point three', 'eleven point eight seven'][sweep - 1];
  let written = b === 2;
  if (!written) {
    const { start, end } = k.wordCue(resultCue);
    written = k.reveal(resultCue, end - start, { captionStart: resultCue }) === 1;
  }

  sweepTable(d, { x: 128, heading: `Read sweep ${sweep - 1}`, values: previous, focus: next, color: C.blue });
  sweepTable(d, { x: 1128, heading: `Write sweep ${sweep}`, values: written ? current : null, focus: state, color: C.brass });
  d.arrow(839, 510, 1094, 510, C.hair, 4);
  if (reading > 0) {
    const end = lerp(839, 1094, reading);
    d.line(839, 510, end, 510, C.blue, 5);
    d.dot(end, 510, 11, C.blue, C.bg, 3);
  }

  const equationLift = b === 2 ? 46 : 0;
  d.txt('Reward for this move', 400, 770 - equationLift, 32, C.faint, 'center');
  d.txt('Discounted next-cell value', 960, 770 - equationLift, 32, C.blue, 'center');
  d.txt('New value for this cell', 1520, 770 - equationLift, 32, C.brass, 'center');
  d.mono(sweep === 1 && !written ? '?' : fmt(reward), 400, 846 - equationLift, 54, C.cream, 'center');
  d.mono('+', 680, 846 - equationLift, 50, C.faint, 'center');
  d.mono(`${defaultDiscount.toFixed(2)} × ${fmt(previous[next])}`, 960, 846 - equationLift, 54, C.blue, 'center');
  d.mono('=', 1240, 846 - equationLift, 50, C.faint, 'center');
  d.mono(written ? fmt(current[state]) : '?', 1520, 846 - equationLift, 54, C.brass, 'center');
  d.note('Every cell reads the previous sweep. The new values become available together.', 960, 242, C.faint, 31);
}
function iterations(d, k) {
  const b = beat(k);
  if (b < 3) {
    synchronousSweeps(d, k);
    return;
  }
  if (b === 4) {
    const evaluated = after(k, 'compute its expected returns') === 1;
    const improved = after(k, 'Then improve the policy') === 1;
    map(d, { policy: improved ? firstPolicyEvaluation.policy : calm.policy, values: evaluated ? firstPolicyEvaluation.values : undefined });
    side(d, improved ? 'Improve the policy' : evaluated ? 'Evaluate the fixed policy' : 'Begin with the shortcut', [
      'Keep wind at slip = 0.20.',
      improved ? 'Choose actions using these evaluated successor values.' : 'Hold the action arrows fixed while computing returns.',
      evaluated ? `Evaluated shortcut: V(start) = ${fmt(firstPolicyEvaluation.values[4])}` : 'The first policy follows the cliff edge.',
      improved ? 'Evaluate the new arrows next.' : 'Then improve the actions.',
    ]);
    footer(d, 'Policy iteration alternates a value calculation with a change of actions.', 856);
    return;
  }
  const wind = k.reveal('windy map') > .5;
  map(d, { policy: wind ? windy.policy : calm.policy });
  side(d, wind ? 'Windy policy' : 'Firm-ground policy', [
    'Value iteration takes the best action at every backup.',
    'When values settle, follow the maximizing actions.',
  ]);
  footer(d, 'Arrows show chosen actions, not wind-driven landings.', 856);
}
function risk(d, k) {
  const b = beat(k);
  const values = b === 1 ? windy.values.map((v,i) => [1,6].includes(i) ? v : null) : b === 2 ? windy.values : undefined;
  map(d, { values, policy: b === 4 ? windy.policy : undefined, focus: 5 });
  if (b < 2) branches(d, b === 0 ? k.reveal('land right', 2) : 1);
  if (b === 2 || b === 4) route(d, ridgeRoute, C.blue, b === 2 ? k.reveal('Once the rover', 5) : 1, 48);
  if (b === 0) side(d, 'Right in wind', ['On firm ground: 14.30', '80% right, 10% up, 10% cliff.', 'Use the windy world’s continuation values.']);
  if (b === 1) side(d, 'Right in wind', ['0.80 × (−1 + 0.90 × 9.340)', '+ 0.10 × (−1 + 0.90 × 8.455)', '+ 0.10 × (−50 + 0)', after(k, 'one point five nine') === 1 ? `= ${fmt(windy.q[5][1])}` : '']);
  if (b === 2) alpha(d, after(k, 'six point three one'), () => actionBars(d, windy.q[5], 'Action values at (1,1)', { highlighted: 0 }));
  if (b === 3) side(d, '5,000 sampled trips per policy', ['Cliff-edge policy: mean −4.988', 'Cliff rate: 26.2%', 'Ridge policy: mean 4.313', 'Model expectation: 4.284']);
  if (b === 4) side(d, 'Why the ridge never falls', ['Beside a cliff, choose Up.', 'Perpendicular slips go left or right.', 'On the ridge, a downward slip reaches the edge; the policy climbs back.']);
  footer(d, b === 3 ? 'Monte Carlo evaluation averages complete sampled returns.' : 'All continuation values use the same windy transition model.');
}
function learning(d, k) {
  const b = beat(k), updated = b >= 2 ? (b === 2 ? after(k, 'twelve point one five') : 1) : 0;
  map(d, { focus: 5 });
  route(d, [5, 6], C.brass, b === 0 ? k.reveal('landed one cell east', 1) : 1, 24);
  side(d, b === 0 ? 'One observed transition' : 'One Q-learning update', b === 0 ? ['State: (1,1)', 'Action: Right', 'Reward: −1', 'Next state: (1,2)'] : ['Next-state maximum: 17', 'Target: −1 + 0.90 × 17 = 14.30', 'Old estimate: 10. Error: 4.30', 'Learning rate α = 0.50']);
  if (b > 0) {
    alpha(d, 1 - updated, () => d.mono('Old Q = 10', 1450, 817, 65, C.faint, 'center'));
    if (updated === 1) d.mono('New Q = 12.15', 1450, 817, 65, C.green, 'center');
  }
  footer(d, ['Learn from a sample without knowing its probability.', 'Target = reward + discounted best next estimate.', 'New estimate = old estimate + α × (target − old estimate).', 'Off-policy: the greedy target can differ from the action actually taken.', 'Model-based backup: average outcomes. Sample backup: observe one outcome.'][b], b === 2 ? 259 : 866);
}
function continuation(d, k) {
  const b = beat(k);
  const rightEstimate = 17, upEstimate = 9;
  const td = b === 3 && after(k, 'after one transition') > 0;
  const truncated = b === 4 && after(k, 'A collector stopping') > 0;
  const values = b === 4 || td ? Array(12).fill(null) : undefined;
  if (values && (td || truncated)) values[6] = 17;
  map(d, { focus: b === 4 && !truncated ? 7 : 6, values });
  if (b < 3) {
    const a = cell(6), right = cell(7), up = cell(2);
    d.arrow(a.x + 65, a.y + 19, right.x - 65, right.y + 19, C.green);
    d.arrow(a.x, a.y - 65, up.x, up.y + 65, C.blue);
    d.mono(`Q(Up) = ${upEstimate}`, a.x, a.y - 2, 26, C.blue, 'center');
    d.mono(`Q(Right)=${rightEstimate}`, a.x, a.y + 39, 25, C.green, 'center');
  } else if (b === 3) {
    if (td) {
      route(d, [5, 6], C.brass, 1);
      alpha(d, .5, () => route(d, [6, 7, 11], C.blue, k.reveal('bootstrapping from an estimate', 3)));
    } else route(d, shortRoute, C.brass, k.reveal('complete trip', 3));
    d.txt(td ? 'One observed step + estimated continuation' : 'Observe the complete trip', 120, 267, 31, td ? C.blue : C.brass);
  } else if (truncated) {
    route(d, [5, 6], C.brass, 1);
    alpha(d, .5, () => route(d, [6, 7, 11], C.blue, k.reveal('underlying task may still continue', 4)));
    d.txt('Recording stops at (1,2); the route continues', 120, 267, 31, C.blue);
    const p = cell(6);
    d.line(p.x + 101, p.y + 29, p.x + 101, p.y + 71, C.brass, 5);
  } else {
    route(d, [7, 11], C.green, k.reveal('true terminal landing', 2));
    d.txt('The task ends at the beacon: no future return', 120, 267, 31, C.green);
  }
  if (b === 1) {
    const qLearning = spoken(k, 'fourteen point three');
    const sarsa = spoken(k, 'seven point one');
    const target = (show, estimate) =>
      `−1 + ${defaultDiscount.toFixed(2)} × ${show ? estimate : '?'} = ${show ? (-1 + defaultDiscount * estimate).toFixed(2) : '?'}`;
    d.txt('Which next value counts?', 1115, 313, 44, C.brass, 'left', 'Serif');
    d.txt('Same observed reward: −1', 1115, 400, 34, C.cream);
    d.txt('Q-learning / best estimated action', 1115, 506, 31, C.green);
    d.txt('SARSA / sampled next action', 1115, 686, 31, C.blue);
    d.mono(target(qLearning, rightEstimate), 1115, 574, 40, C.green);
    d.mono(target(sarsa, upEstimate), 1115, 754, 40, C.blue);
  } else side(d, ['SARSA follows its next action', '', 'Exploration has consequences', 'When does the update happen?', 'End of task or end of collection?'][b], [
    ['S → A → R → S′ → A′', 'Sample the next action from the behavior policy.', 'Use its value, and execute that action next.'],
    [],
    ['Firm ground: no wind.', 'ε = 0.20 over four actions.', 'At the cliff edge, Down is selected with probability 0.20 / 4 = 0.05.'],
    ['Monte Carlo: wait for the complete return.', 'TD: use reward + an estimated continuation.', 'Q-learning vs SARSA: which continuation?'],
    ['True terminal: use reward only.', 'Collector truncation: keep the continuation.', '−1 + 0.90 × 17 = 14.30', 'A task deadline belongs in the state.'],
  ][b]);
  footer(d, b === 4 ? 'A time limit in the data collector does not erase the task’s future.' : 'On-policy SARSA learns the continuation of its own behavior policy.', b === 1 || b === 4 ? 858 : undefined);
}
function exploration(d, k) {
  const b = beat(k);
  if (b < 2) {
    map(d, { policy: calm.policy });
    actionBars(d, [.05, .85, .05, .05], 'ε-greedy action probabilities', { scale: 400, highlighted: 1 });
    footer(d, b === 0 ? '80% choose the unique greedy action + 20% sample uniformly.' : 'A greedy evaluation run and an exploratory training run follow different policies.', b === 0 ? 856 : undefined);
    return;
  }
  if (b === 4) {
    shaping(d, k);
    return;
  }
  map(d, { bonus: true, labels: false });
  if (b === 2) route(d, [2, 3, 7, 11], C.brass, k.reveal('three-move trip', 4), 31);
  if (b === 3) {
    const progress = k.reveal('shuttle left and right', 6);
    route(d, [2, 3, 2, 3, 2], C.brass, progress, 31);
  }
  side(d, b === 2 ? 'A bonus for reaching this square' : 'A more profitable mistake', b === 2 ? ['Entry bonus: +8', 'Net entry reward: +7', 'Finish: [7, −1, 20]', after(k, 'twenty-two point three') === 1 ? 'Return: 22.30' : ''] : ['Shuttle: [7, −1, 7, −1, …]', 'Return: (7 − 0.90) / (1 − 0.81)', after(k, 'thirty-two point one one') === 1 ? '= 32.105' : '', 'Compare with finishing: 22.30.']);
  footer(d, b === 4 ? 'Potential shaping preserves rankings by telescoping across the complete return.' : 'Compare both choices from the same starting square, (0,2).', 856);
}
function shaping(d, k) {
  const second = after(k, 'discounted second bonus');
  const cancel = after(k, 'They cancel', .9);
  const result = after(k, 'total adjustment is just minus the starting potential');
  for (const [i, name] of ['Start', 'Middle', 'Terminal'].entries()) {
    const x = 320 + i * 630;
    d.rect(x - 177, 280, 354, 155, C.plate, 15, i === 2 ? C.green : C.hair);
    d.txt(name, x, 322, 34, C.cream, 'center', 'Serif');
    d.mono(['Φ(start)', 'Φ(mid)', 'Φ(end)'][i], x, 383, 38, i === 1 ? C.blue : C.brass, 'center');
    if (i < 2) d.arrow(x + 196, 358, x + 433, 358, C.faint);
  }
  d.txt(cancel > 0 ? 'Add both discounted shaping rewards' : 'First shaping reward', 155, 533, 32, C.faint);
  d.mono(cancel > 0 ? 'Sum =' : 'F₀ =', 155, 603, 47, C.cream);
  alpha(d, 1 - cancel, () => d.mono('γΦ(mid)', 405, 603, 47, C.blue));
  d.mono('− Φ(start)', 850, 603, 47, C.brass);
  alpha(d, second, () => {
    if (cancel === 0) {
      d.txt('Discounted second shaping reward', 155, 700, 32, C.faint);
      d.mono('γF₁ =', 155, 770, 47, C.cream);
    }
    alpha(d, 1 - cancel, () => d.mono('−γΦ(mid)', 405, 770, 47, C.blue));
    d.mono('+ γ²Φ(end)', 850, 770, 47, C.brass);
  });
  alpha(d, result, () => d.mono('Terminal Φ = 0: total = −Φ(start)', 960, 820, 51, C.green, 'center'));
  footer(d, 'Matching middle-state terms cancel. Only the endpoints remain.');
}
function gradient(d, k) {
  const b = beat(k);
  if (b === 5) {
    const steps = ['Collect a complete trip', 'Compute reward-to-go backward', 'Accumulate gradients', 'Update policy once', 'Update baseline afterward'];
    steps.forEach((line, i) => {
      d.rect(145, 285 + i * 115, 1625, 88, C.plate, 12);
      d.mono(String(i + 1), 190, 330 + i * 115, 37, C.brass);
      d.txt(line, 275, 330 + i * 115, 40, C.cream);
    });
    footer(d, 'Keep rollout probabilities fixed. Include γᵗ for the discounted start-return objective.', 249);
    return;
  }
  const direction = b === 4 ? policyGradient([0, 0, 0, 0]) : [.75, -.25, -.25, -.25].map(x => x * (b === 3 ? 4 : 1));
  const weighted = b === 3 && after(k, 'multiplier is four') === 1;
  const progress = b === 1 ? after(k, 'raises the Up logit', 2) : b === 3 ? after(k, 'multiplier is four', 2) : 0;
  const stepSize = .2;
  const probs = softmax(direction.map(x => x * progress * stepSize));
  d.txt(b === 4 ? 'Exact gradient check' : 'Action probabilities', 145, 314, 48, C.cream, 'left', 'Serif');
  actions.forEach((action, i) => {
    const x = 175 + i * 219;
    d.rect(x, 391, 144, 294, C.dark, 10, C.hair);
    d.rect(x, 685 - 294 * probs[i], 144, 294 * probs[i], i === 0 ? C.brass : C.blue, 10);
    d.txt(action, x + 72, 716, 33, C.faint, 'center');
    d.mono(fmt(probs[i], 3), x + 72, 764, 36, C.cream, 'center');
    if (b > 0 && (b !== 3 || weighted)) d.mono((direction[i] > 0 ? '+' : '') + fmt(direction[i], 3), x + 72, 813, 33, direction[i] > 0 ? C.green : C.red, 'center');
  });
  d.mono('1', 154, 391, 24, C.faint, 'right');
  d.mono('0', 154, 685, 24, C.faint, 'right');
  if (b > 0 && (b !== 3 || weighted)) d.txt(b === 3 ? '4 × gradient at the original uniform policy' : 'Gradient at the original uniform policy', 145, 353, 29, C.faint);
  side(d, ['Parameterize the policy', 'Sample Up', 'Why weight by return?', 'Better than the baseline?', 'Differentiate the expectation'][b], [
    ['Four logits → softmax → four probabilities.', 'π(a|s) = exp(zₐ) / Σ exp(zᵢ)', 'The policy chooses an action by sampling.'],
    ['At the original uniform policy:', '∇ log π(Up|s) = eᵤₚ − π', 'Example multiplier: +1', 'Step size: 0.20', 'New logits = old logits + 0.20 × gradient.'],
    ['∇P(τ) = P(τ) ∇log P(τ)', 'This identity turns a derivative into an expectation over sampled trips.', 'Use rewards after the action.'],
    [weighted ? 'Return 12 − baseline 8 = +4' : 'Return: 12. Baseline: 8.', weighted ? '4 × [0.75, −0.25, −0.25, −0.25]' : 'Subtract the baseline from the return.', weighted ? '= [3, −1, −1, −1]' : '', 'Step size: 0.20', progress === 1 ? 'New logits: [0.60, −0.20, −0.20, −0.20]' : 'Begin with four zero logits.'],
    ['Estimated Q: [6, 2, −40, −2]', 'Uniform expected return: −8.50', '∇J = π × (Q − E[Q])', 'Analytic and finite-difference gradients agree.'],
  ][b]);
  footer(d, b === 4 ? 'Gradient components: [3.625, 2.625, −7.875, 1.625].' : b === 3 ? 'Baseline cancellation: b(s)∇Σₐπ(a|s) = b(s)∇1 = 0.' : 'A policy gradient changes action probabilities directly.', b === 3 ? 249 : undefined);
}
function tokens(d, k) {
  const b = beat(k);
  if (b === 2) { ppo(d, k); return; }
  if (b === 3) { references(d); return; }
  if (b === 4) { groupRewards(d, k); return; }
  d.txt('PROMPT', 140, 310, 27, C.faint, 'left', 'Mono');
  d.txt('What is two plus three?', 140, 382, 55, C.cream, 'left', 'Serif');
  const sequence = ['The', ' answer', ' is', ' 5', '.'];
  const progress = b === 0 ? k.reveal('Appending that token', 5) : 1;
  sequence.forEach((token, i) => {
    const x = 140 + i * 175;
    alpha(d, clamp(progress * sequence.length - i), () => {
      d.rect(x, 469, 154, 94, C.plate, 10, i === 3 ? C.green : C.hair);
      d.txt(token, x + 77, 516, 36, C.cream, 'center');
    });
  });
  d.txt('Each prefix is a state. Each next token is an action.', 140, 629, 32, C.faint);
  if (b === 1) alpha(d, after(k, 'success or failure'), () => d.pill(375, 723, 430, 75, 'Verifier: correct', C.green));
  side(d, b === 0 ? 'From moves to tokens' : 'Credit before the final score', b === 0 ? [
    'State: prompt + generated prefix.', 'Action: next token.', 'Final response receives a score.',
  ] : [
    'A final score follows many choices.', 'A value model estimates return from each prefix.', 'Advantage compares the outcome with that expectation.',
  ]);
  footer(d, 'A completed answer carries the consequences of its earlier token choices.');
}
function ppo(d, k) {
  const x = ratio => 200 + ratio * 410, y = score => 798 - score * 285;
  const update = after(k, 'point two eight', 1.3);
  const probability = lerp(.20, .28, update), ratio = probability / .20;
  const clip = after(k, 'upper clip threshold of one point two');
  const objective = lerp(ratio, Math.min(ratio, 1.2), clip);
  d.txt('A positively advantaged action', 140, 310, 45, C.cream, 'left', 'Serif');
  d.txt('Objective contribution for A = +1', 140, 376, 30, C.faint);
  d.line(x(0), y(0), x(1.8), y(0), C.faint, 3);
  d.line(x(0), y(0), x(0), y(1.4), C.faint, 3);
  d.path([[x(0), y(0)], [x(1.4), y(1.4)]], C.blue, 4);
  alpha(d, clip, () => {
    d.path([[x(0), y(0)], [x(1.2), y(1.2)], [x(1.8), y(1.2)]], C.green, 6);
    d.txt('No extra credit', x(1.23), y(1.2) + 45, 30, C.green);
  });
  [0, 1, 1.2, 1.4].forEach(value => d.mono(fmt(value), x(value), y(0) + 25, 25, C.faint, 'center'));
  d.txt('new / old probability', 405, y(0) + 25, 31, C.faint, 'center');
  d.dot(x(ratio), y(objective), 13, C.brass, C.bg, 3);
  side(d, 'PPO probability ratio', [
    'Old probability: 0.20',
    'New probability: ' + fmt(probability, 3),
    'Ratio: ' + fmt(ratio),
    clip === 1 ? 'Clipped contribution: ' + fmt(objective) : 'For positive advantage, more probability increases the objective.',
  ]);
  footer(d, 'Clipping limits the incentive. It does not impose a hard probability bound.', 249);
}
function references(d) {
  const policies = [
    {x:390, name:'Old policy', sub:'Before the update', color:C.blue},
    {x:960, name:'Current policy', sub:'Being optimized', color:C.brass},
    {x:1530, name:'Reference policy', sub:'A separate anchor', color:C.green},
  ];
  policies.forEach(({x,name,sub,color}) => {
    d.rect(x - 215, 310, 430, 182, C.plate, 15, color);
    d.txt(name, x, 367, 40, color, 'center', 'Serif');
    d.txt(sub, x, 434, 30, C.faint, 'center');
  });
  d.arrow(935, 520, 510, 665, C.blue);
  d.arrow(985, 520, 1410, 665, C.green);
  d.txt('PPO ratio', 450, 720, 50, C.blue, 'center', 'Serif');
  d.txt('Controls the update incentive', 450, 793, 34, C.cream, 'center');
  d.txt('Reference KL penalty', 1470, 720, 50, C.green, 'center', 'Serif');
  d.txt('Discourages long-term drift', 1470, 793, 34, C.cream, 'center');
  footer(d, 'The old policy and the reference policy have different jobs.');
}
function groupRewards(d, k) {
  const centered = after(k, 'Centering them gives minus one, zero, one', 1);
  const normalized = after(k, 'minus one point two two five, zero, one point two two five', 1);
  const scores = [0, 1, 2], mean = scores.reduce((a,b) => a+b) / scores.length;
  const std = Math.sqrt(scores.reduce((sum,r) => sum + (r - mean) ** 2, 0) / scores.length);
  const values = scores.map(score => (score - centered * mean) / lerp(1, std, normalized));
  const zero = 650, scale = 105;
  d.txt(normalized > 0 ? 'Divide by group standard deviation' : centered > 0 ? 'Subtract the group mean' : 'Score three completions', 140, 310, 43, C.cream, 'left', 'Serif');
  d.line(140, zero, 990, zero, C.rim, 2);
  values.forEach((value, i) => {
    const x = 190 + i * 280, end = zero - value * scale;
    d.rect(x, Math.min(zero,end), 160, Math.max(2, Math.abs(value * scale)), value < 0 ? C.red : C.green, 8);
    d.txt(['Completion A','Completion B','Completion C'][i], x + 80, 365, 29, C.faint, 'center');
    d.mono(fmt(value, 3), x + 80, value >= 0 ? end - 32 : end + 35, 35, value < 0 ? C.red : C.green, 'center');
  });
  side(d, 'Compare the same prompt', [
    'Original scores: [0, 1, 2]',
    'Group mean: ' + fmt(mean),
    'Group standard deviation: ' + fmt(std, 3),
    normalized === 1 ? 'Relative weights: [−1.225, 0, 1.225]' : centered === 1 ? 'Centered scores: [−1, 0, 1]' : 'Each completion gets its own score.',
  ]);
  footer(d, 'Outcome supervision uses each completion’s relative weight in its token terms.');
}

function offline(d, k) {
  const b = beat(k);
  if (b === 3 || b === 4) {
    map(d, { focus: 4 });
    route(d, shortRoute, C.brass, 1, 35);
    side(d, 'The log never chose Up', ['Behavior policy: P(Up | start) = 0', 'Target policy: P(Up | start) > 0', 'No weight creates a trip that was never observed.', 'Collect coverage or supply a justified model.']);
  } else {
    d.txt('A recorded six-move trip', 140, 320, 48, C.cream, 'left', 'Serif');
    const productDone = b === 2 && after(k, 'one thousand five hundred forty-four point eight') === 1;
    const accumulated = b === 1 ? Math.floor(after(k, 'Multiply these ratios along the trip', 3) * 6) : b === 2 ? productDone ? 6 : Math.floor(after(k, 'three point four per step', 3) * 5) : 0;
    for (let i = 0; i < 6; i++) {
      const x = 140 + i * 272;
      const reached = accumulated > i;
      d.rect(x, 418, 223, 151, C.plate, 12, reached ? C.brass : C.hair);
      d.txt(`Move ${i + 1}`, x + 111, 453, 28, C.faint, 'center');
      d.mono(b === 0 ? ['Up', 'Right', 'Right', 'Right', 'Down', 'Down'][i] : b === 1 ? 'πnew / πold' : '0.85 / 0.25', x + 111, 515, 27, C.cream, 'center');
      if (b === 2 && after(k, 'three point four per step') === 1) d.mono('3.4', x + 111, 612, 36, C.faint, 'center');
      if (reached) {
        if (i > 0) d.arrow(x - 35, 675, x - 10, 675, C.brass, 3);
        d.mono(b === 1 ? i === 0 ? 'ρ₁' : `ρ₁…ρ${['₁', '₂', '₃', '₄', '₅', '₆'][i]}` : fmt(3.4 ** (i + 1), 6), x + 111, 675, 31, C.brass, 'center');
      }
    }
    if (b === 2) {
      if (productDone) d.mono('3.4⁶ ≈ 1544.80', 960, 818, 79, C.green, 'center');
      else if (accumulated > 0) d.txt(`Product after ${accumulated} move${accumulated === 1 ? '' : 's'}: ${fmt(3.4 ** accumulated, 6)}`, 960, 818, 45, C.brass, 'center');
    } else words(d, b === 0 ? 'The raw average estimates the return of the behavior policy that generated these trips.' : accumulated === 6 ? 'Trajectory weight × recorded return. Average these weighted returns over behavior-policy trips.' : 'The running product carries each earlier ratio into the next multiplication.', 300, 751, 1350, 40);
  }
  footer(d, b === 2 ? 'Long products can make a few rare trips dominate an estimate.' : 'Reweighting changes how much observed experience counts. It does not create missing experience.', 262);
}
function conclusion(d, k) {
  const b = beat(k), changed = b === 1 || b === 2 ? cheaperCliff : b === 4 ? shorterHorizon : windy;
  const result = b === 2 ? Number(spoken(k, 'Right wins')) : b === 4 ? after(k, 'minus five point five eight', .45, 'Up still beats Right') : 1;
  map(d, { policy: b === 1 || result < 1 ? undefined : changed.policy, focus: 5, cliff: b === 1 || b === 2 ? -5 : -50 });
  if (b === 2) {
    const right = spoken(k, 'eight point eight seven');
    const up = spoken(k, 'seven point three three');
    d.txt('Cheaper cliff: −5', 1115, 313, 44, C.brass, 'left', 'Serif');
    d.txt('Same wind and discount', 1115, 396, 34, C.faint);
    d.txt('Right', 1115, 529, 40, result ? C.brass : C.cream);
    d.mono(right ? fmt(changed.q[5][1]) : '?', 1625, 529, 55, result ? C.brass : C.cream, 'right');
    d.txt('Up', 1115, 660, 40, C.cream);
    d.mono(up ? fmt(changed.q[5][0]) : '?', 1625, 660, 55, C.cream, 'right');
    if (result) d.txt('Choose Right', 1115, 788, 38, C.brass);
  } else if (b === 4) {
    if (result === 0) side(d, 'Shorter horizon: γ = 0.50', ['Same wind: slip = 0.20', 'Original cliff penalty: −50', 'Recompute every continuation value.']);
    alpha(d, result, () => actionBars(d, changed.q[5], 'Shorter horizon: γ = 0.50', { highlighted: changed.policy[5] }));
  }
  else side(d, b === 1 ? 'Change only the cliff penalty' : b === 3 ? 'Three routes to better choices' : 'One map, one explanation', b === 1 ? ['Cliff: −50 → −5', 'Wind: unchanged, slip = 0.20', 'Discount: unchanged, γ = 0.90', 'Does Right now beat Up?'] : b === 3 ? ['Dynamic programming: model-based backups.', 'Q-learning / SARSA: sample-based value updates.', 'Policy gradients: update action probabilities.'] : ['Firm ground favors the shortcut.', 'Wind makes the ridge worthwhile.', 'Rewards and continuation explain the change.']);
  footer(d, b === 1 ? 'Recompute the continuation values when the objective changes.' : b === 4 ? 'Original −50 cliff. Discounted future shrinks; immediate cliff cost remains.' : 'A good policy is a solution to specified transitions, rewards, and discount.', b === 2 || b === 4 ? 858 : undefined);
}
const painters = [opening, returns, state, bellman, iterations, risk, learning, continuation, exploration, gradient, tokens, offline, conclusion];
function drawLesson(d, clock) {
  d.title(`REINFORCEMENT LEARNING / ${String(clock.beat.chapterIndex + 1).padStart(2, '0')}`, clock.beat.chapterTitle, 61);
  painters[clock.beat.chapterIndex](d, clock);
}

class LayoutBench extends Bench {
  texts = [];
  edges = [];
  boxes = [];
  dots = [];
  txt(value, x, y, size, color, align = 'left', face, weight, maxWidth) {
    super.txt(value, x, y, size, color, align, face, weight, maxWidth);
    if (this.c.globalAlpha < .25) return;
    const m = this.c.measureText(String(value));
    const scale = maxWidth && m.width > maxWidth ? maxWidth / m.width : 1;
    this.texts.push({
      text: String(value),
      left: x - m.actualBoundingBoxLeft * scale,
      right: x + m.actualBoundingBoxRight * scale,
      top: y - m.actualBoundingBoxAscent,
      bottom: y + m.actualBoundingBoxDescent,
    });
  }
  path(points, color, width = 4) {
    super.path(points, color, width);
    if (this.c.globalAlpha < .25) return;
    for (let i = 1; i < points.length; i++) this.edges.push({ from: points[i - 1], to: points[i], width });
  }
  rect(x, y, width, height, color, radius, edge, lineWidth) {
    super.rect(x, y, width, height, color, radius, edge, lineWidth);
    if (edge && this.c.globalAlpha >= .25) this.boxes.push({ left: x, top: y, right: x + width, bottom: y + height });
  }
  dot(x, y, radius, fill, edge, lineWidth = 2) {
    super.dot(x, y, radius, fill, edge, lineWidth);
    if (this.c.globalAlpha >= .25) this.dots.push({ x, y, radius: radius + (edge ? lineWidth / 2 : 0) });
  }
}

function segmentMeetsBox({ from, to }, box) {
  let low = 0, high = 1;
  for (const [start, delta, min, max] of [[from[0], to[0] - from[0], box.left, box.right], [from[1], to[1] - from[1], box.top, box.bottom]]) {
    if (delta === 0) { if (start < min || start > max) return false; }
    else {
      const a = (min - start) / delta, b = (max - start) / delta;
      low = Math.max(low, Math.min(a, b));
      high = Math.min(high, Math.max(a, b));
      if (low > high) return false;
    }
  }
  return true;
}

// The same painter supplies the export and native-frame text/connector checks.
export function auditFrame(ctx, clock) {
  const d = new LayoutBench(ctx);
  drawLesson(d, clock);
  const issues = [], overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  for (let i = 0; i < d.texts.length; i++) {
    const text = d.texts[i];
    if (text.left < 0 || text.top < 0 || text.right > 1920 || text.bottom > 1080) issues.push(`off-screen: ${text.text}`);
    for (const other of d.texts.slice(i + 1)) if (overlap(text, other)) issues.push(`text overlap: ${text.text} / ${other.text}`);
    for (const edge of d.edges) {
      const margin = edge.width / 2;
      if (segmentMeetsBox(edge, { left: text.left - margin, right: text.right + margin, top: text.top - margin, bottom: text.bottom + margin })) issues.push(`connector crosses text: ${text.text}`);
    }
    for (const dot of d.dots) {
      const x = Math.max(text.left, Math.min(text.right, dot.x)), y = Math.max(text.top, Math.min(text.bottom, dot.y));
      if (Math.hypot(x - dot.x, y - dot.y) < dot.radius) issues.push(`moving point crosses text: ${text.text}`);
    }
    for (const box of d.boxes) if (overlap(text, box) && !(text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom)) issues.push(`box edge crosses text: ${text.text}`);
  }
  return { issues: [...new Set(issues)], texts: d.texts };
}
function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = {
      'c08-b02': ['but exploration selects', 'seven point one'],
      'c13-b03': ['Right is now worth about', 'and Up about', 'but the price of failure'],
    }[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
  prepareCaptionReflow(schedule);
}
export default {
  title: 'Reinforcement Learning: From a Cliff Path to a Learned Policy',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    drawLesson(new Bench(ctx), clock);
  },
  check: checkExamples,
};
