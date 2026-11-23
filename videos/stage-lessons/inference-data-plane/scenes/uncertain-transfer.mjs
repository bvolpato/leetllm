import { assertEqual, column, dynamic, linear, place, rect } from 'vizmatic/stage';
import {
  expiredAttempt,
  fullyQuiescentAttempt,
} from '../../../films/inference-data-plane/fixtures.mjs';
import { mayReclaim } from '../../../films/inference-data-plane/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, FIXTURE, RESERVED_DASH, block, pool, slot } from '../parts.mjs';

const { slots, blocks, segmentBlocks } = FIXTURE;
const landed = expiredAttempt.received.length * segmentBlocks;
assertEqual(landed, 32, 'blocks present at lookup');
assertEqual(slots - blocks, 16, 'free slots while attempt four owns its reservation');
assertEqual(mayReclaim(expiredAttempt), false, 'retired with unconfirmed accesses');
assertEqual(mayReclaim(fullyQuiescentAttempt), true, 'retired with confirmed quiescence');

export default function uncertainTransfer(s, c) {
  const [main, footer] = area.rows([6, 1.3], 'normal');
  const [memory, account] = main.columns([1, 1.3], 'wide');
  const buffer = pool(slots, { columns: 8, pitch: 72 });
  const poolName = label(`Destination memory  ·  ${slots} slots`);
  place(column([poolName, buffer.panel], { gap: 'normal' }), memory, 'top left');

  const arrived = s.value(0);
  const known = s.value(0);
  const retired = s.value(0);
  const stopped = s.value(0);
  const freed = s.value(0);
  const retry = s.value(0);
  const late = s.value(0);
  const marks = dynamic(() => {
    const nodes = [];
    // The destination report reveals the reserved cells. The free slots stay visible throughout.
    for (let i = known.value ? 0 : blocks; i < slots; i++) {
      const owned = i < blocks && (!freed.value || retry.value);
      const ink = retry.value ? COLOR.other : COLOR.control;
      nodes.push(
        slot(buffer.p(i), owned ? ink : 'gridStrong', {
          size: buffer.cell,
          ...(owned ? { dash: RESERVED_DASH } : {}),
        }),
      );
      if (freed.value || i >= blocks) continue;
      if (i < Math.floor(arrived.value))
        nodes.push(block(buffer.p(i), COLOR.state, { size: buffer.cell * 0.72 }));
      if (i === landed && late.value > 0) {
        nodes.push(block(buffer.p(i), COLOR.state, { size: buffer.cell * 0.72 * late.value }));
        if (!stopped.value) nodes.push(slot(buffer.p(i), COLOR.mark, { size: buffer.cell + 6 }));
      }
    }
    if (!known.value) {
      const [x0, y0] = buffer.p(0),
        [x1, y1] = buffer.p(blocks - 1);
      nodes.push(
        rect(x1 - x0 + buffer.cell, y1 - y0 + buffer.cell, {
          fill: 'surface',
          stroke: COLOR.control,
          width: 2,
          dash: RESERVED_DASH,
          radius: 8,
        }).at((x0 + x1) / 2, (y0 + y1) / 2),
        label('Awaiting destination report', { size: 35, color: COLOR.control }).at(
          (x0 + x1) / 2,
          (y0 + y1) / 2,
        ),
      );
    }
    return nodes;
  });
  const [identity, coverage, charge, available, lease, writer, readers] = account.rows(7, 'tight');
  const id = place(
    mono(`${FIXTURE.request}   /   ${FIXTURE.operation}   /   attempt 4`, { size: 37 }),
    identity,
    'left',
  );
  const valueLine = (region, name, read, color) => {
    const [words, value] = region.columns([1.2, 1], 'tight');
    return [
      place(note(name, { size: 35 }), words, 'left'),
      dynamic(() => place(mono(read(), { size: 45, color }), value, 'left')),
    ];
  };
  const inventory = [
    ...valueLine(
      coverage,
      'Old blocks with KV',
      () => {
        if (!known.value) return '?';
        return freed.value
          ? 'released'
          : `${Math.floor(arrived.value) + Math.floor(late.value)} / ${blocks}`;
      },
      COLOR.state,
    ),
    ...valueLine(
      charge,
      'Old slots charged',
      () => String(freed.value ? 0 : blocks),
      COLOR.control,
    ),
    ...valueLine(
      available,
      'Slots free in pool',
      () => String(slots - (freed.value ? 0 : blocks) - (retry.value ? blocks : 0)),
      COLOR.mark,
    ),
  ];
  const leaseMark = dynamic(() =>
    place(
      label(retired.value ? 'Tick 10  ·  admission closed' : 'Tick 9  ·  lease live', {
        color: retired.value ? COLOR.fail : COLOR.control,
      }),
      lease,
      'left',
    ),
  );
  const writerMark = dynamic(() =>
    place(
      label(stopped.value ? 'Transport  ·  abort acknowledged' : 'Transport  ·  stop unconfirmed', {
        color: stopped.value ? COLOR.valid : 'ink',
      }),
      writer,
      'left',
    ),
  );
  const noReader = place(label('GPU  ·  no reader started', { color: 'dim' }), readers, 'left');
  const status = (words, color = 'ink') => place(label(words, { color }), footer, 'left');
  const unknown = status('Sender timed out. What reached the destination?', COLOR.mark);
  const partial = status('Decode waits for the missing ranges.');
  const want = status('Attempt 5 needs 48 slots. Can it reserve here?', COLOR.mark);
  const wait = status('Attempt 5 waits for 48 free slots.', COLOR.other);
  const reclaimed = status('The retired reservation returns 48 slots.', COLOR.control);
  const reserved = status('Attempt 5 reserves its own 48 slots.', COLOR.other);
  s.add(heading(c.title), poolName, buffer.panel, marks, id, inventory);
  c.show('timeout-sender', unknown);
  c.on('timeout-lookup', () => {
    known.set(1);
    s.play(arrived.to(landed, { duration: 1.8, ease: linear }));
  });
  c.swap('timeout-incomplete', unknown, partial, { after: true });
  c.show('timeout-clock', leaseMark);
  c.after('timeout-expiry', () => retired.set(1));
  c.show('timeout-write', [writerMark, noReader]);
  c.on('timeout-write', () => s.play(late.to(1, { duration: 1.15, ease: linear })));
  c.swap('timeout-ask', partial, want);
  c.swap('timeout-wait', want, wait, { after: true });
  c.after('timeout-stopped', () => stopped.set(1));
  c.after('timeout-reclaim', () => freed.set(1));
  c.swap('timeout-reclaim', wait, reclaimed, { after: true });
  c.after('timeout-retry', () => retry.set(1));
  c.swap('timeout-retry', reclaimed, reserved, { after: true });
}
