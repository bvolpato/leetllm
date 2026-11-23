import { assertEqual, indicate, line, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { gamma, returns, REWARD } from '../parts.mjs';
import { sign } from '../desk.mjs';

function operand(text, region, color) {
  return place(namedBox(text, { width: 130, height: 92, color, size: 45 }), region);
}

export default function tdTargets(s, c) {
  const [header, colHeaders, first, second, foot] = area.rows([1, 0.6, 2, 2, 1.15], 22);
  const headers = header.columns([2, 1], 'wide');
  const title = heading(c.title);
  const receipt = place(
    mono('REQ-10234    New → ask → evidence ready', { color: 'cyan' }),
    headers[0],
    'left',
  );
  const discount = place(mono('Discount  ' + gamma, { size: 40 }), headers[1], 'right');
  const phase = (words, color = 'yellow') => place(label(words, { color }), foot);
  const names = colHeaders.columns(2, 216);
  const columnNames = (left, right) => [place(note(left), names[0]), place(note(right), names[1])];
  const paid = phase('Immediate reward for asking  ' + sign(REWARD.ask), 'cyan');
  const sampleHeads = columnNames('At the evidence-ready state', 'Target for the opening action');
  const rows = [first, second].map((region) => {
    const [source, target] = region.columns(2, 216);
    const [name, value] = source.columns([3, 1], 'normal');
    const [type, equation] = target.rows([1, 1.2], 8);
    const [prefix, slot, answer] = equation.columns([2.2, 1, 1.5], 12);
    const divider = line([region.left, region.top], [region.right, region.top], {
      stroke: 'faint',
      width: 2,
    });
    return { name, value, type, prefix, slot, answer, divider };
  });
  const [a, b] = rows;
  const sourceName = (words, row, color = 'ink') =>
    place(label(words, { color, size: 39 }), row.name, 'left');
  const typeName = (words, row) => place(label(words, { size: 37 }), row.type, 'right');
  const estimate = 50;
  const futureApprove = REWARD.evidence,
    futureReview = returns.evidenceReadyHuman;
  const target = (next) => Number((REWARD.ask + gamma * next).toFixed(2));
  const term = (row, cost = REWARD.ask) =>
    place(mono(sign(cost) + ' + ' + gamma + ' ×', { size: 40 }), row.prefix, 'right');
  const result = (value, row, color) =>
    place(mono('= ' + value, { size: 48, color }), row.answer, 'left');
  const estimateName = sourceName('Current value estimate', a);
  const hiddenReceipt = place(
    namedBox('Later receipt sealed', { width: 470, height: 92, dash: true, color: 'dim' }),
    b.name,
  );
  const estimateNumber = operand(String(estimate), a.value, 'yellow');
  const observedName = sourceName('Observed on closure', b, 'green');
  const observedNumber = operand(String(futureApprove), b.value, 'green');
  const firstTypes = [typeName('One-step target', a), typeName('Completed return', b)];
  const formulas = rows.map((row) => term(row));
  const empty = rows.map((row) => operand('?', row.slot, 'dim'));
  const estimatedSlot = operand(String(estimate), a.slot, 'yellow');
  const observedSlot = operand(String(futureApprove), b.slot, 'green');
  const tdValue = result(target(estimate), a, 'yellow');
  const mcValue = result(target(futureApprove), b, 'green');
  const tdPrompt = phase('What target can we form from the estimate?');
  const sampleFoot = phase('One receipt records the future that actually happened.', 'green');

  const choiceHeads = columnNames('Next action at evidence ready', 'Target for asking');
  const choices = [
    sourceName('Approve with proof', b, 'green'),
    sourceName('Send on to review', a, 'blue'),
  ];
  const values = [
    operand(String(futureApprove), b.value, 'green'),
    operand(String(futureReview), a.value, 'blue'),
  ];
  const choiceTypes = [typeName('SARSA', a), typeName('Q-learning', b)];
  const picked = place(note('Router selected', { color: 'blue' }), a.name, 'bottom');
  const actionQuestion = phase('Which next value goes into SARSA?');
  const selectedValue = operand(String(futureReview), a.value, 'blue');
  const maxValue = operand(String(futureApprove), b.value, 'green');
  const selectedTotal = result(target(futureReview), a, 'blue');
  const greedyTotal = result(target(futureApprove), b, 'green');
  const actionFoot = phase('Same observed cost. Two ways to choose the next value.', 'cyan');

  const stopHeader = place(
    mono('Both tickets    Reward ' + sign(REWARD.reviewCost), { color: 'cyan' }),
    headers[0],
    'left',
  );
  const stopHeads = columnNames('Last observation on the ticket', 'One-step target');
  const stopTypes = [typeName('Terminal state', a), typeName('Truncated log', b)];
  const closed = sourceName('Ticket closed', a);
  const queued = sourceName('Ticket in review queue', b, 'blue');
  const bar = place(rect(8, 92, { fill: 'pink', stroke: null }), a.value);
  const next = operand(String(REWARD.review), b.value, 'blue');
  const stopTerms = rows.map((row) => term(row, REWARD.reviewCost));
  const noFuture = operand('0', a.slot, 'dim');
  const keepsFuture = operand(String(REWARD.review), b.value, 'blue');
  const masked = result(sign(REWARD.reviewCost), a, 'ink');
  const continues = result(REWARD.reviewCost + gamma * REWARD.review, b, 'blue');
  const stopPrompt = phase('Which ticket keeps a future value?');
  const stoppedFoot = phase('Use the last observation on this ticket.', 'cyan');
  assertEqual(
    [target(estimate), target(futureApprove), target(futureReview)].join(','),
    '41,59,51.8',
    'target operands',
  );
  assertEqual(REWARD.reviewCost + gamma * REWARD.review, 54, 'external cutoff');
  assertEqual(REWARD.reviewCost + gamma * 0, -18, 'terminal cutoff');

  // Carry a copy around the outside of the printed equations. The source receipt stays legible.
  function deliver(cue, copy, row, sourceRow) {
    const dest = row.slot.point('center');
    const destTop = row.prefix.top - 15;
    const gutter = (sourceRow.value.right + row.prefix.left) / 2;
    const start = sourceRow.value.point('center');
    // Route inside the gap above the equation, below its heading.
    c.after(cue, () => {
      s.add(copy);
      s.play(to(copy, (n) => n.moveTo([gutter, start[1]]), { duration: 0.24 }));
      s.play(to(copy, (n) => n.moveTo([gutter, destTop]), { duration: 0.34 }));
      s.play(to(copy, (n) => n.moveTo([dest[0], destTop]), { duration: 0.38 }));
      s.play(to(copy, (n) => n.moveTo(dest), { duration: 0.22 }));
    });
  }

  s.add(
    title,
    receipt,
    discount,
    sampleHeads,
    rows.map((row) => row.divider),
    estimateName,
    hiddenReceipt,
    firstTypes,
    empty,
  );
  c.show('paid', paid, { after: true });
  c.show('estimate', [estimateNumber, formulas[0], estimatedSlot], { after: true });
  c.hide('estimate', empty[0]);
  c.swap('predict-td', paid, tdPrompt);
  c.show('td-answer', tdValue, { after: true });
  c.hide('td-answer', tdPrompt, { after: true });
  c.swap('uncover', hiddenReceipt, observedName);
  c.swap('recorded', empty[1], [observedNumber, formulas[1], observedSlot], { after: true });
  c.show('mc-answer', [mcValue, sampleFoot], { after: true });
  c.on('compare', () =>
    s.play(indicate([estimateNumber, observedNumber], { scale: 1, color: 'yellow' })),
  );

  c.swap(
    'replay',
    [
      sampleHeads,
      estimateName,
      observedName,
      estimateNumber,
      observedNumber,
      firstTypes,
      estimatedSlot,
      observedSlot,
      tdValue,
      mcValue,
      sampleFoot,
    ],
    [choiceHeads, empty],
  );
  c.show('approve-value', [choices[0], values[0]], { after: true });
  c.show('review-value', [choices[1], values[1]], { after: true });
  c.show('selected', picked, { after: true });
  c.show('predict-action', actionQuestion);
  c.hide('take-selected', [empty[0], actionQuestion], { after: true });
  c.show('take-selected', choiceTypes[0]);
  deliver('take-selected', selectedValue, a, a);
  c.show('sarsa-total', selectedTotal, { after: true });
  c.hide('take-max', empty[1], { after: true });
  c.show('take-max', choiceTypes[1]);
  deliver('take-max', maxValue, b, b);
  c.show('q-total', [greedyTotal, actionFoot], { after: true });

  c.swap(
    'both-stop',
    [
      receipt,
      choiceHeads,
      choices,
      values,
      picked,
      choiceTypes,
      formulas,
      selectedValue,
      maxValue,
      selectedTotal,
      greedyTotal,
      actionFoot,
    ],
    [stopHeader, stopHeads, stopTerms, empty],
  );
  c.show('terminal', [closed, bar, stopTypes[0]]);
  c.show('truncated', [queued, stopTypes[1]]);
  c.show('next-value', next, { after: true });
  c.show('predict-stop', stopPrompt);
  c.hide('keep-next', [empty[1], stopPrompt], { after: true });
  deliver('keep-next', keepsFuture, b, b);
  c.show('limit-total', continues, { after: true });
  c.swap('end-total', empty[0], [noFuture, masked, stoppedFoot], { after: true });
}
