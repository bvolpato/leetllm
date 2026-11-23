import { assertEqual, column, pictogram, place, row } from 'vizmatic/stage';
import { heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { context, diskRow, drawing, referenceRow, verdict } from '../handoff.mjs';
import { sandboxPages, sandboxRetirement } from '../parts.mjs';

export default function scene(s, c) {
  const base = [4, 8, 12];
  const changed = sandboxPages(base, [
    { clone: 'A', index: 0, value: 99 },
    { clone: 'A', index: 2, value: 41 },
  ]);
  const clean = sandboxPages(base);
  assertEqual(changed.kib, 20, 'two private entries');
  assertEqual(clean.kib, 12, 'three base entries');
  const events = [
    { time: 2, noticeGeneration: 5, refs: 2 },
    { time: 4, noticeGeneration: 4, refs: 2 },
    { time: 6, noticeGeneration: 4, refs: 1 },
    { time: 9, noticeGeneration: 4, refs: 0 },
  ];
  const firstFree = events.find((event) => sandboxRetirement(event).free);
  assertEqual(firstFree.time, 9, 'first verified opportunity to dispose of the whole slot');

  const baseStrip = place(
    row(
      [
        label('B reads the base', { size: 38, color: 'green' }),
        ...base.map((v) =>
          namedBox(String(v), { width: 130, height: 78, size: 44, color: 'green' }),
        ),
        mono('4 KiB / page', { size: 33 }),
      ],
      { gap: 'normal' },
    ),
    context,
  );
  const [record, vm, disk] = drawing.rows([0.53, 1, 1], 'normal');
  const [ownerSlot, eventSlot] = record.columns([1, 2.4], 'wide');
  const owner = place(mono('Owner  A / J4 / g4', { color: 'cyan', size: 38 }), ownerSlot);
  const stopped = place(
    column(
      [
        mono('Owner  A / J4 / g4', { color: 'cyan', size: 35 }),
        label('4 s   ·   execution retired', { size: 32 }),
      ],
      { gap: 'tight', align: 'center' },
    ),
    ownerSlot,
  );
  const retiredOwner = place(mono('A / J4 / g4   disposed', { color: 'dim', size: 35 }), ownerSlot);
  const notice = (words, color = 'ink') => place(label(words, { size: 38, color }), eventSlot);
  const cancel = notice('A requests cancellation');
  const wrong = notice('2 s    Retirement notice for g5', 'yellow');
  const match = notice('4 s    Host confirms g4 stopped', 'cyan');
  const six = notice('6 s    Exporter closed its reader');
  const plan = notice('6 s    Reader closed     ·     9 s    VM handle due to close');
  const last = notice(firstFree.time + ' s    Final closure verified', 'green');
  const machine = referenceRow(s, vm, {
    resource: 'A’s virtual machine',
    contents: 'p0 = ' + changed.a[0] + '    p2 = ' + changed.a[2],
    holder: 'Host helper',
    handle: 'duplicate VM handle',
    art: 'vm',
  });
  const scratch = diskRow(s, disk);
  const [memoryName, pageSlots] = vm.columns([1, 2.4], 'wide');
  const [diskName, fileSlot] = disk.columns([1, 2.4], 'wide');
  const resourceName = (where, art, words) =>
    place(
      column([pictogram(art, { size: 78, color: 'cyan' }), label(words, { size: 38 })], {
        align: 'center',
        gap: 'tight',
      }),
      where,
    );
  const pagesLabel = resourceName(memoryName, 'vm', 'A’s private pages');
  const diskLabel = resourceName(diskName, 'disk', 'A’s scratch disk');
  const cells = pageSlots.columns(base.length, 'normal');
  const slots = cells.map((cell, i) => {
    const [header, body] = cell.rows([1, 1.5], 'tight');
    const tile = (value, color, dash = false) =>
      place(namedBox(value, { width: 180, height: 74, color, dash, size: 42 }), body);
    return {
      header: place(mono('page ' + i, { size: 34 }), header),
      empty: tile('empty', 'dim', true),
      tile,
    };
  });
  const first = slots[0].tile(String(changed.a[0]), 'cyan');
  const lastPage = slots[2].tile(String(changed.a[2]), 'cyan');
  const emptyDisk = place(mono('Empty directory', { size: 41, color: 'dim' }), fileSlot);
  const file = place(mono('output.csv     1,99', { size: 45, color: 'cyan' }), fileSlot);
  const headers = slots.map((slot) => slot.header);
  const prompt = (words, color = 'yellow') => place(label(words, { size: 43, color }), verdict);
  const size = prompt('How much page memory does the model count?');
  const count = prompt('(3 shared + 2 private) × 4 KiB = ' + changed.kib + ' KiB');
  const ask = prompt('When can the host begin reclaiming the whole slot?');
  const safe = prompt('Reclamation can begin at ' + firstFree.time + ' s', 'green');
  const gone = place(
    label('A’s two private pages and scratch disk disposed', { color: 'dim', size: 40 }),
    vm,
  );
  const nextDisk = pictogram('disk', { size: 94, color: 'blue' });
  const nextOwner = label('Next tenant’s scratch disk', { color: 'blue', size: 43 });
  const directory = mono('0 files', { size: 46 });
  place(row([nextDisk, column([nextOwner, directory], { gap: 'tight' })], { gap: 'normal' }), disk);
  const baseOnly = prompt('3 shared × 4 KiB = ' + clean.kib + ' KiB', 'green');

  s.add(
    heading(c.title),
    baseStrip,
    owner,
    pagesLabel,
    diskLabel,
    headers,
    slots.map((slot) => slot.empty),
    emptyDisk,
  );
  c.swap('first', slots[0].empty, first, { after: true, lead: 0 });
  c.swap('last-page', slots[2].empty, lastPage, { after: true, lead: 0 });
  c.swap('file', emptyDisk, file, { after: true, lead: 0 });
  c.show('size', size);
  c.swap('count', size, count, { after: true });
  c.show('cancel', cancel);
  c.swap('wrong', cancel, wrong, { after: true });
  c.swap('match', [wrong, owner], [match, stopped], { after: true });
  c.swap(
    'links',
    [pagesLabel, diskLabel, headers, first, slots[1].empty, lastPage, file],
    [machine.item, machine.connection, scratch.item, scratch.connection],
  );
  scratch.close(c, 'six');
  c.swap('six', match, six, { after: true });
  c.swap('nine-plan', six, plan, { after: true });
  c.swap('ask', count, ask);
  machine.close(c, 'last');
  c.swap('last', [plan, ask], [last, safe], { after: true, lead: -0.6 });
  c.swap(
    'dispose',
    [...machine.closedState, ...scratch.closedState, stopped],
    [gone, retiredOwner],
    { after: true },
  );
  c.swap('base', safe, baseOnly, { after: true });
  c.show('fresh', [nextDisk, nextOwner], { after: true, lead: 0 });
  c.show('empty', directory, { after: true, lead: 0 });
}
