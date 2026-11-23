import { C, cue, fmt, lerp } from './workshop.mjs';
import {
  replay,
  receipt,
  targets,
  routes,
  returns,
  explorationEpisodes,
  explorationLedger,
  explorationEpsilon,
  actionNames,
  gate,
} from './exchange.mjs';

export function replayBench(d, k) {
  const b = k.beat.beatIndex + 1;
  const hit = cue(k, 3, 'Twenty-nine point five', 0.5);
  const s = replay(hit > 0);
  d.title('MODEL-FREE LEARNING   /   REPLAY HEAD', 'What can one receipt update?');
  d.rect(106, 292, 1708, 190, C.paper, 14);
  const fields = [
    ['FROM', 'New request'],
    ['ACTION', 'Ask for proof'],
    ['REWARD', fmt(s.observed.reward)],
    ['NEXT STATE', 'Evidence ready'],
  ];
  fields.forEach(([field, value], i) => {
    const x = 174 + i * 425;
    if (i) d.line(x - 49, 319, x - 49, 454, '#bfaf8f', 2);
    d.mono(field, x, 341, 23, '#57675d');
    d.txt(value, x, 409, 43, C.ink, 'left', 'Serif', 600, 355);
  });
  const pos = cue(k, 1, 'Replay receipt', 2.6);
  const headX = lerp(143, 1770, pos);
  if (pos > 0 && pos < 1) d.rect(headX - 12, 309, 24, 152, 'rgba(133, 105, 44, 0.18)', 4);
  d.rect(headX - 8, 282, 16, 21, C.brass, 4);
  d.rect(headX - 8, 470, 16, 21, C.brass, 4);
  d.mono(receipt.receipt + '   /   ONE TRANSITION', 124, 536, 24, C.brass);
  d.txt('Q at new request', 132, 630, 40, C.cream, 'left', 'Serif');
  const xs = [674, 1124, 1574];
  xs.forEach((x, i) => {
    const active = i === 1 && hit > 0;
    const color = active ? C.green : C.faint;
    d.txt(actionNames[i], x, 610, 38, color, 'center');
    d.rect(x - 151, 659, 302, 116, C.dark, 15, active ? C.green : C.rim, active ? 5 : 2);
    if (active) d.dot(x - 121, 690, 7, C.green);
    d.mono(fmt(s.q[i]), x, 717, 66, color, 'center');
  });
  if (b === 1) {
    d.note('One sample of asking on a new request', 960, 885, C.faint);
    return;
  }
  const seeTarget = cue(k, 2, 'target is fifty-nine') > 0;
  d.note(
    b === 4
      ? 'A tabular update writes one cell. Shared network weights can move several estimates.'
      : 'Target    ' +
          fmt(s.observed.reward) +
          ' + 0.90 × max(' +
          s.next.join(', ') +
          ') = ' +
          (seeTarget ? fmt(s.target) : '?'),
    960,
    854,
    C.brass,
    38,
  );
  if (b !== 4)
    d.note(
      hit > 0
        ? 'New estimate    0 + ½ × (59 − 0) = ' + fmt(s.q[1])
        : 'Learning rate ½    ·    how far from zero?',
      960,
      936,
      hit > 0 ? C.green : C.faint,
      34,
    );
}

function tail(d, k) {
  const b = k.beat.beatIndex + 1;
  const open = cue(k, 2, 'Now uncover', 1.1);
  const td = cue(k, 2, 'forty-one') > 0;
  d.title(
    'TARGETS   /   FOLLOW ONE REQUEST',
    'Stop at the estimate, or open the rest of the record',
  );
  d.ticket(95, 343, 343, 226, { id: 'Asked', foot: 'Cost  −4' });
  d.tube([
    [439, 453],
    [688, 453],
    [824, 367],
    [1510, 367],
  ]);
  d.tube([
    [688, 453],
    [824, 633],
    [1510, 633],
  ]);
  d.txt('At evidence ready', 605, 540, 31, C.cream, 'center', 'Serif');
  d.txt('Policy estimate', 1050, 298, 38, C.blue, 'center', 'Serif');
  d.window(918, 326, 264, 82, '50', C.blue);
  d.txt('Completed receipt', 1051, 558, 38, C.green, 'center', 'Serif');
  d.window(918, 592, 264, 82, '+70', C.green);
  if (open < 1) {
    const width = 270 * (1 - open);
    d.rect(914, 585, width, 97, C.plate, 8, C.rim);
    if (open < 0.25) d.txt('Sealed', 1049, 632, 36, C.faint, 'center', 'Serif');
  }
  d.window(1450, 315, 343, 104, td ? 'TD   ' + fmt(targets.td) : 'TD   ?', C.blue);
  const mc = cue(k, 2, 'return was fifty-nine') > 0;
  d.window(1450, 581, 343, 104, mc ? 'MC   ' + fmt(targets.mc) : 'MC   ?', C.green);
  d.note(
    b === 1
      ? 'You have paid four points. The estimated future is worth fifty.'
      : b === 2
        ? 'TD    −4 + 0.90 × 50' + (open === 1 ? '                 MC    −4 + 0.90 × 70' : '')
        : b === 3
          ? 'Monte Carlo uses the sampled tail. An exact conditional mean averages over that tail.'
          : 'The estimate can be wrong. This completed ticket supplies the actual tail.',
    960,
    866,
    C.brass,
    35,
  );
}
function nextAction(d, k) {
  const b = k.beat.beatIndex + 1;
  const picked = cue(k, 6, 'picks review') > 0;
  d.title('TARGETS   /   NEXT ACTION', 'Which estimate comes back through the tube?');
  d.ticket(100, 412, 363, 222, { id: 'Evidence ready', verified: true });
  const rows = [399, 698];
  rows.forEach((y, i) => {
    const color = i === 0 ? C.green : C.blue;
    d.tube([
      [464, 522],
      [630, 522],
      [756, y],
      [1450, y],
    ]);
    d.txt(
      i ? 'Review the proof' : 'Approve with proof',
      1031,
      y - 78,
      45,
      color,
      'center',
      'Serif',
    );
    d.window(960, y - 44, 143, 83, fmt(i ? returns.evidenceReadyHuman : routes[0].reward), color);
    const explain = cue(k, 7, i ? 'fifty-one point eight' : 'target stays fifty-nine') > 0;
    if (explain) {
      d.window(
        1350,
        y - 49,
        437,
        101,
        (i ? 'SARSA   ' : 'Q-learning   ') + fmt(i ? targets.sarsa : targets.q),
        color,
      );
    } else if (picked && i === 1) {
      d.pill(1400, y - 40, 359, 80, 'Router selected', C.blue);
    }
  });
  d.note(
    b === 5
      ? 'One receipt. Two available next actions.'
      : b === 6
        ? 'SARSA follows the sampled next action. Which value does that select?'
        : 'Both targets start at −4 and discount the next-action value by 0.90.',
    960,
    920,
    C.brass,
  );
}
function cutoff(d, k) {
  const b = k.beat.beatIndex + 1,
    reveal = cue(k, 9, 'Keep the queued ticket') > 0;
  d.title(
    'TARGETS   /   LAST OBSERVATION',
    b === 10
      ? 'A deadline can belong to the task'
      : 'Did the episode end when the recorder stopped?',
  );
  [
    ['Ticket closed', 'Terminal state', 0, targets.closed, C.red],
    ['Ticket still queued', 'Recorder timed out', 80, targets.cutoff, C.blue],
  ].forEach(([name, why, v, t, col], i) => {
    const x = 112 + 867 * i;
    d.plate(x, 302, 827, 471);
    d.txt(name, x + 44, 373, 48, C.cream, 'left', 'Serif');
    d.pill(x + 45, 445, 342, 65, why, col);
    d.mono('Immediate reward  −18', x + 48, 586, 35, C.faint);
    d.mono(reveal ? '−18 + 0.90 × ' + fmt(v) + ' = ' + fmt(t) : 'Target   ?', x + 48, 691, 41, col);
  });
  d.note(
    b === 10
      ? 'A task-defined deadline ends the episode. Include time left when it affects the decision.'
      : reveal
        ? 'Use this ticket’s final observation for the bootstrap. A reset starts another ticket.'
        : 'The queue has value 80. Which target keeps it?',
    960,
    899,
    C.brass,
    34,
  );
}
export function targetBench(d, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 5) return tail(d, k);
  if (b < 8) return nextAction(d, k);
  return cutoff(d, k);
}

export function exploration(d, k) {
  const b = k.beat.beatIndex + 1,
    episode = explorationEpisodes[1];
  const restricted = b === 5 && cue(k, 5, 'remove unsupported approval') > 0;
  d.title(
    'EXPLORATION   /   FROZEN Q TABLE',
    b <= 3
      ? 'Two draws route ticket E02'
      : b === 7
        ? 'The greedy action can win either draw'
        : restricted
          ? 'Remove a disallowed move before drawing'
          : 'Where did eight proposals land?',
  );
  if (b <= 3 || b === 7) {
    d.txt('First draw   ·   explore?', 119, 307, 46, C.cream, 'left', 'Serif');
    const x = 149,
      w = 1593,
      y = 407;
    d.rect(x, y, w, 77, C.plate, 8, C.rim);
    d.rect(x, y, w * explorationEpsilon, 77, C.copper, 8);
    d.txt('Explore  20%', x + w * 0.1, y + 39, 32, C.ink, 'center');
    d.txt('Greedy  ·  ask', x + w * 0.6, y + 39, 37, C.cream, 'center');
    if (cue(k, 1, 'point zero nine') > 0) {
      const px = x + w * episode.u;
      d.line(px, y - 24, px, y - 1, C.brass, 5);
      d.mono(fmt(episode.u), px, y - 51, 29, C.brass, 'center');
    }
    d.txt('If exploring   ·   uniform choice', 119, 581, 46, C.cream, 'left', 'Serif');
    actionNames.forEach((label, i) => {
      d.rect(x + (w * i) / 3, 673, w / 3 - 5, 86, [C.red, C.green, C.blue][i], 8);
      d.txt(label, x + (w * (i + 0.5)) / 3, 716, 40, C.ink, 'center', 'Serif');
      d.mono(
        'Q = ' + fmt([returns.approve, returns.evidence, returns.review][i]),
        x + (w * (i + 0.5)) / 3,
        804,
        32,
        C.faint,
        'center',
      );
    });
    if (cue(k, 2, 'point nine one') > 0) {
      const px = x + w * episode.v;
      d.line(px, 648, px, 676, C.brass, 5);
      d.mono(fmt(episode.v), px, 620, 30, C.brass, 'center');
    }
    d.note(
      b === 7
        ? 'P(ask) = 0.80 + 0.20 × ⅓ ≈ 86.7%'
        : b === 3
          ? 'E02 proposes review    →    P-7 checks the proposal before execution.'
          : 'ε = 0.20     ·     estimates held fixed throughout the replay',
      960,
      900,
      C.brass,
    );
    return;
  }
  if (restricted) {
    d.txt('Restricted simulator action sets', 136, 327, 50, C.cream, 'left', 'Serif');
    ['New request', 'Evidence ready'].forEach((state, i) => {
      const y = 446 + i * 183,
        permitted = i ? ['Approve', 'Review'] : ['Ask', 'Review'];
      d.ticket(131, y - 66, 416, 174, {
        id: state,
        label: 'STATE',
        foot: i ? 'Verified' : 'Proof missing',
        verified: !!i,
      });
      permitted.forEach((a, j) =>
        d.pill(709 + j * 494, y - 15, 405, 82, a, a === 'Review' ? C.blue : C.green),
      );
    });
    d.note(
      'Rebuild the table and sample only from the two available actions in each state.',
      960,
      921,
      C.brass,
    );
    return;
  }
  const count = b === 4 ? Math.floor(8 * cue(k, 4, 'Each ticket', 2.8)) : 8;
  const { rows, counts } = explorationLedger(count);
  actionNames.forEach((label, i) => {
    const x = 113 + i * 574,
      col = [C.red, C.green, C.blue][i];
    d.plate(x, 334, 542, 407);
    d.txt(label, x + 36, 401, 49, col, 'left', 'Serif');
    d.mono(String(counts[i]), x + 478, 402, 50, col, 'right');
    d.line(x + 36, 457, x + 504, 457, C.rim);
    rows
      .filter((e) => e.action === i)
      .forEach((e, j) =>
        d.pill(x + 40 + (j % 3) * 154, 507 + Math.floor(j / 3) * 84, 137, 60, e.id, col),
      );
  });
  if (b === 5)
    d.note(
      'E05   ·   proposed approval  →  proof missing  →  executed ' +
        gate('Approve', false).toLowerCase(),
      960,
      879,
      C.red,
    );
  else if (b === 6) {
    d.note(
      'Infinite visits for each state-action pair    ·    Σ αₙ = ∞       Σ αₙ² < ∞',
      960,
      876,
      C.brass,
    );
  } else d.note(count + ' of 8 simulator proposals recorded', 960, 889, C.faint);
}
