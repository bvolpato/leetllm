import {
  appear,
  beside,
  circle,
  column,
  dot,
  dynamic,
  indicate,
  line,
  place,
  polygon,
  rect,
} from 'vizmatic/stage';
import { area, chip, heading, label, mono } from '../../kit-narrated.mjs';
import { COLOR, OP, token, travel } from '../parts.mjs';
import { operationTrace } from '../operation-trace.mjs';

export default function subjectIntro(s, c) {
  const [main, foot] = area.rows([5, 1], 'normal');
  const [copy, face] = main.columns([6, 5], 'wide');
  const slip = copy.inset('wide');
  const [upper, lower] = slip.inset('wide').rows([3, 2], 'wide');
  const teeth = 20;
  const edge = Array.from({ length: teeth * 2 + 1 }, (_, index) => [
    slip.right - (slip.width * index) / (teeth * 2),
    slip.bottom - (index % 2) * 15,
  ]);
  const paper = polygon([[slip.left, slip.top], [slip.right, slip.top], ...edge], {
    fill: 'ink',
    stroke: null,
  });
  const copyName = mono('AGENT COPY   /   RUN-842', { size: 34, color: 'bg' });
  const action = label('Rollback to ' + OP.revision, { size: 64, color: 'bg' });
  const approval = label('Approved by operator', { size: 37, color: 'bg' });
  place(column([copyName, action, approval], { gap: 'normal' }), upper, 'left');
  const rule = line([upper.left, upper.bottom + 8], [upper.right, upper.bottom + 8], {
    stroke: 'bg',
    width: 2,
    dash: [13, 8],
  });
  const keyName = label('Saved operation key', { size: 36, color: 'bg' });
  const key = mono(OP.key, { size: 60, color: 'bg' });
  place(column([keyName, key], { gap: 'tight' }), lower, 'left');

  const radius = 171;
  const dial = place(circle(radius, { fill: 'surface', stroke: COLOR.attempt, width: 9 }), face);
  const [x, y] = dial.center;
  const polar = (r, angle) => [x + r * Math.sin(angle), y - r * Math.cos(angle)];
  const ticks = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    return line(polar(radius - 26, angle), polar(radius - 10, angle), {
      stroke: index === 0 ? COLOR.fail : 'dim',
      width: index === 0 ? 10 : 5,
    });
  });
  const crown = beside(
    rect(78, 26, { fill: COLOR.attempt, stroke: null, radius: 5 }),
    dial,
    'above',
    'tight',
  );
  const elapsed = s.value(0);
  const hand = dynamic(() =>
    line([x, y], polar(radius - 37, -Math.PI * (1 - elapsed.value) * 1.52), {
      stroke: elapsed.value < 1 ? COLOR.attempt : COLOR.fail,
      width: 10,
    }),
  );
  const hub = dot(12, 'ink').moveTo([x, y]);
  const waiting = beside(label('Waiting for receipt', { size: 44 }), dial, 'under', 'wide');
  const expired = beside(
    label('Timed out', { size: 54, color: COLOR.fail }),
    dial,
    'under',
    'wide',
  );
  const clock = [dial, ticks, crown, hand, hub];
  const title = heading(c.title);
  const question = place(
    label('Did the controller queue the rollback?', { size: 51, color: COLOR.mark }),
    foot,
  );
  const lookup = place(
    label('Controller lookup', { size: 49, color: COLOR.controller }),
    face,
    'center',
  );
  const query = beside(token(OP.key, COLOR.op, { size: 45 }), lookup, 'under', 'normal');
  const queryAt = query.center;
  const result = beside(
    chip(OP.job + '   ·   ' + OP.state, { color: COLOR.sure, size: 52 }),
    query,
    'under',
    'wide',
  );
  query.moveTo([key.right[0] + query.width / 2 + 24, key.center[1]]);
  const trace = operationTrace('RUN-842', 2);
  const write = trace.message(0, OP.key + '    rollback → ' + OP.revision, { color: COLOR.op });
  const lost = trace.message(1, 'receipt   ' + OP.job, {
    back: true,
    lost: true,
    color: COLOR.fail,
  });
  const replay = trace.caption('Replay of the interrupted request', COLOR.controller);
  const report = trace.caption(OP.job + ' was queued when checked', COLOR.sure);

  s.add(title, paper, copyName, action, approval, rule, keyName, key, clock, waiting);
  c.onBeat(0, () => s.play(elapsed.to(1, { duration: c.cue('timeout').start - c.beats[0].start })));
  c.swap('timeout', waiting, expired);
  c.on('saved-key', () => s.play(indicate(key, { color: 'bg', scale: 1.08 })));
  c.show('ask-queue', question);
  c.swap('saved-lookup', [clock, expired, question], lookup);
  c.on('saved-lookup', () => s.play(travel(query, queryAt, { duration: 1.2 })));
  c.show('lookup-reply', result);
  c.swapAll('inspect-fault', [trace.base, write.name, replay], { keep: [title] });
  c.on('inspect-fault', () => write.send(s));
  c.show('lost-receipt', lost.name);
  c.on('lost-receipt', () => lost.send(s));
  c.on('receipt-broke', () => s.play(appear(lost.end)));
  c.swap('queued-claim', replay, report);
}
