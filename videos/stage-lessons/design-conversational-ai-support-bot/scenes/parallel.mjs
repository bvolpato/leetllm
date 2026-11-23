import { assertEqual, dynamic, line, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, open, original, parallel, serial, timeout } from '../parts.mjs';
import { mergeObservation } from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function reads(s, c) {
  open(s, c, 'policy');
  const [tickBand, firstBand, secondBand, dock] = MAIN.rows([0.6, 2.5, 2.5, 1], 'normal');
  const [serialClock, parallelClock, mode] = [s.value(0), s.value(0), s.value(0)];
  const maxTime = serial.at(-1).end;
  const forkEnd = parallel.at(-1).end;
  const deadline = timeout.at(-1).end;
  const receipt = {
    success: true,
    customer: original.customer,
    invoice: original.invoice,
    revision: original.revision,
  };
  const matches = (success) => mergeObservation(original, { ...receipt, success });
  assertEqual(matches(true), true, 'The completed invoice belongs to this revision.');
  assertEqual(matches(false), false, 'A timeout supplies no successful invoice observation.');
  assertEqual(
    forkEnd,
    Math.max(parallel[0].end, parallel[1].end) + 1,
    'The merge takes one unit after both reads.',
  );

  const [names, axis] = tickBand.columns([1.8, 5], 'loose');
  const x = (time) => axis.left + (time / maxTime) * axis.width;
  const tick = place(note('Time units'), names, 'left');
  const ticks = Array.from({ length: maxTime + 1 }, (_, t) =>
    mono(String(t), { size: 32, color: 'dim' }).moveTo([x(t), axis.cy]),
  );
  const colors = ['green', 'blue', 'cyan'];
  const namesByLane = ['Policy', 'Invoice', 'Merge'];
  function chart(band, clock, schedule) {
    const [head, ...lanes] = band.rows([1, 1, 1, 1], 'tight');
    const rows = lanes.map((lane) => lane.columns([1.8, 5], 'loose'));
    const tracks = rows.map(([, lane]) =>
      line([axis.left, lane.cy], [axis.right, lane.cy], { stroke: 'grid', width: 3 }),
    );
    const labels = rows.map(([name], i) =>
      place(label(namesByLane[i], { size: 32, color: colors[i] }), name, 'left'),
    );
    const progress = dynamic(() =>
      schedule().flatMap(({ start, end }, i) => {
        const arrived = Math.min(end, clock.value);
        if (arrived <= start) return [];
        const y = rows[i][1].cy;
        const span = x(arrived) - x(start);
        return [rect(span, 27, { fill: colors[i], radius: 4 }).moveTo([x(start) + span / 2, y])];
      }),
    );
    const cursor = dynamic(() =>
      line([x(clock.value), lanes[0].top], [x(clock.value), lanes[2].bottom], {
        stroke: 'yellow',
        width: 3,
      }),
    );
    return { head, nodes: [...labels, ...tracks, progress, cursor] };
  }

  const serialRun = chart(firstBand, serialClock, () => serial);
  const fork = chart(secondBand, parallelClock, () => (mode.value < 0.5 ? parallel : timeout));
  const header = (title, region) => place(label(title, { size: 37 }), region, 'left');
  const serialTitle = header('One read at a time', serialRun.head);
  const forkTitle = header('Start both reads together', fork.head);
  const failedTitle = header('Replay with an invoice deadline', fork.head);
  const serialResult = place(
    mono(maxTime + ' units', { size: 36, color: 'cyan' }),
    serialRun.head,
    'right',
  );
  const forkResult = place(
    mono(forkEnd + ' units', { size: 36, color: 'cyan' }),
    fork.head,
    'right',
  );
  const receiptSlots = dock.columns(2, 'loose');
  const receipts = dynamic(() => {
    const clock = parallelClock.value;
    const expired = mode.value > 0.5 && clock >= deadline;
    const invoiceReturned = clock >= parallel[1].end && matches(!expired);
    return [
      place(
        note(clock >= parallel[0].end ? 'Policy received  ·  US-v3' : 'Policy  ·  reading', {
          size: 32,
          color: clock >= parallel[0].end ? 'green' : 'dim',
        }),
        receiptSlots[0],
      ),
      place(
        note(
          expired
            ? 'Invoice timed out  ·  no receipt'
            : invoiceReturned
              ? 'Invoice received  ·  A10234 / R4'
              : 'Invoice  ·  reading',
          { size: 32, color: expired ? 'pink' : invoiceReturned ? 'blue' : 'dim' },
        ),
        receiptSlots[1],
      ),
    ];
  });
  const question = place(
    label('At tick 2, can the merge start?', { size: 42, color: 'yellow' }),
    FOOT,
  );
  const wait = place(label('Wait for the invoice receipt.', { size: 40, color: 'blue' }), FOOT);
  const ready = place(
    label('Both receipts match this case and revision.', { size: 39, color: 'cyan' }),
    FOOT,
  );
  const missing = place(
    label('Keep the policy receipt. Refer the missing invoice read.', { size: 34, color: 'pink' }),
    FOOT,
  );

  s.add(tick, ticks, serialTitle, serialRun.nodes);
  c.on('serial-policy', () => s.play(serialClock.to(serial[0].end, { duration: 0.8 })));
  c.on('serial-invoice', () => s.play(serialClock.to(serial[1].end, { duration: 1.2 })));
  c.on('serial-merge', () => s.play(serialClock.to(maxTime, { duration: 0.55 })));
  c.show('serial-total', serialResult, { after: true });
  c.show('start-together', [forkTitle, fork.nodes, receipts]);
  c.on('start-together', () => s.play(parallelClock.to(parallel[0].end, { duration: 1.25 })));
  c.show('join-question', question);
  c.swap('wait-invoice', question, wait, { after: true });
  c.on('both-receipts', () => s.play(parallelClock.to(parallel[1].end, { duration: 0.7 })));
  c.swap('both-receipts', wait, ready, { after: true });
  c.on('complete-merge', () => s.play(parallelClock.to(forkEnd, { duration: 0.6 })));
  c.show('parallel-total', forkResult, { after: true });
  c.hide('deadline-run', [ready, forkResult]);
  c.swap('deadline-run', forkTitle, failedTitle);
  c.on('deadline-run', () => {
    s.play(parallelClock.to(0, { duration: 0 }), mode.to(1, { duration: 0 }));
    s.play(parallelClock.to(timeout[0].end, { duration: 1.1 }));
  });
  c.on('invoice-deadline', () => s.play(parallelClock.to(deadline, { duration: 0.7 })));
  c.show('missing-invoice', missing, { after: true });
}
