import { assertEqual, dynamic, line, linear, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR } from '../parts.mjs';
import { rankMap } from '../rank-map.mjs';

// In these two completed transfers only the rank on the sixth receipt differs.
const firstFive = [
  [1, 0],
  [0, 0],
  [1, 2],
  [0, 1],
  [0, 2],
];
const repeated = [0, 1];
const replacement = [1, 1];
const pairKey = ([rank, block]) => 3 * rank + block;
const receiptSet = (entries) => new Set(entries.map(pairKey));
assertEqual(receiptSet([...firstFive, repeated]).size, 5, 'unique pairs in the first transfer');
assertEqual(receiptSet([...firstFive, replacement]).size, 6, 'unique pairs in the replay');

export default function transfer(s, c) {
  const [main, facts, callBand, answerBand] = area.rows([5.3, 0.9, 0.8, 0.95], 'normal');
  const [log, receiver] = main.columns([1, 1.36], 'wide');
  const rows = log.rows([1.15, 0.7, 1, 1, 1, 1, 1, 1], 'tight');
  const cols = (row) => row.columns([0.65, 1, 1], 'tight');
  const received = s.value(0);
  const repaired = s.value(0);
  const explain = s.value(0);
  const ready = s.value(0);
  const reading = s.value(0);
  const retired = s.value(0);
  const freed = s.value(0);
  const entries = () =>
    [...firstFive, repaired.value ? replacement : repeated].slice(0, Math.floor(received.value));
  const badPair = pairKey(repeated);
  const last = pairKey(replacement);
  const rankCells = rankMap(receiver, {
    title: 'Decode buffer',
    columns: ['block 0', 'block 1', 'block 2'],
    blocksPerCell: 1,
    read: (i) => ({
      count: !freed.value && receiptSet(entries()).has(i) ? 1 : 0,
      outline:
        i === last && reading.value
          ? COLOR.mark
          : explain.value && i === last && !repaired.value
            ? COLOR.fail
            : 'gridStrong',
      dashed: !receiptSet(entries()).has(i) && !freed.value,
      color: retired.value ? 'dim' : ready.value ? COLOR.valid : COLOR.state,
    }),
  });
  const logName = place(label('Transfer receipts'), rows[0], 'left');
  const keys = ['#', 'rank', 'block'].map((name, i) => place(note(name), cols(rows[1])[i]));
  const logMarks = dynamic(() =>
    entries().flatMap(([rank, block], i) => {
      const row = rows[i + 2];
      const column = cols(row);
      const duplicate = explain.value && !repaired.value && pairKey([rank, block]) === badPair;
      const active = i === 5 && repaired.value && !ready.value;
      const ink = duplicate || active ? COLOR.mark : 'ink';
      return [
        (duplicate || active) &&
          rect(row.width, row.height, {
            fill: 'surface',
            stroke: ink,
            width: 2,
            radius: 6,
          }).at(row.cx, row.cy),
        ...[i + 1, rank, block].map((n, j) =>
          place(mono(String(n), { size: 36, color: j ? ink : 'dim' }), column[j]),
        ),
      ].filter(Boolean);
    }),
  );
  const evidence = (words) =>
    place(label(words, { size: 37, color: COLOR.control }), facts, 'left');
  const contract = evidence('Attempt 4   ·   matching manifest   ·   lease expires at tick 10');
  const stopped = evidence(
    'Tick 9 / expiry 10   ·   manifest matched   ·   integrity and visibility verified   ·   writes stopped',
  );
  const trace = evidence('Prefill finished   →   transfer missing a range   →   decode waiting');
  const access = dynamic(() => {
    const cell = rankCells.cells[last];
    const state = freed.value ? 'Reclaimed' : retired.value ? 'Retired' : 'Committed';
    const reader = reading.value ? 'Active GPU reader' : 'GPU reader stopped';
    return [
      evidence(`${state}   ·   writes stopped`),
      label(reader, { size: 37, color: reading.value ? COLOR.mark : COLOR.control }).at(
        cell.cx,
        facts.cy,
      ),
      reading.value &&
        line([cell.cx, cell.bottom], [cell.cx, facts.cy - 31], {
          stroke: COLOR.mark,
          width: 4,
        }),
    ].filter(Boolean);
  });
  const call = (words) => place(mono(words, { size: 42, color: 'ink' }), callBand, 'left');
  const commit = call('pool.commit(key, now=9)');
  const reclaim = call('pool.reclaim(key)');
  const verdict = (words, color) => place(label(words, { size: 47, color }), answerBand, 'left');
  const ask = verdict('Which rank and block would keep decode waiting?', COLOR.mark);
  const gap = verdict('Commit refused   ·   5 of 6 distinct blocks', COLOR.fail);
  const replay = verdict('With the new sixth receipt, can decode start?', COLOR.mark);
  const yes = verdict('Commit accepted   ·   6 of 6 distinct blocks', COLOR.valid);
  const reuse = verdict('Can the allocator give these cells to another request?', COLOR.mark);
  const held = verdict('Reclaim refused   ·   GPU reader still holds the buffer', COLOR.fail);
  const canRelease = verdict('Reader released its handle. Try reclaim again.', COLOR.control);
  const free = verdict('Reclaimed   ·   all six cells available', COLOR.valid);

  s.add(heading(c.title), logName, keys, logMarks, rankCells.nodes, contract);
  c.on('final-five', () =>
    s.play(
      received.to(5, {
        duration: c.cue('final-five').end - c.cue('final-five').start,
        ease: linear,
      }),
    ),
  );
  c.after('final-sixth', () => received.set(6));
  c.swap('final-facts', contract, stopped, { after: true });
  c.show('final-ask', [commit, ask]);
  c.after('final-hole', () => explain.set(1));
  c.swap('final-refused', ask, gap, { after: true });
  c.swap('final-trace', stopped, trace);
  // Rewind the receipt log by one entry. The common five keep their positions.
  c.on('final-replay', () => {
    received.set(5);
    explain.set(0);
  });
  c.swap('final-replay', trace, stopped);
  c.hide('final-replay', gap);
  c.after('final-replace', () => {
    repaired.set(1);
    received.set(6);
  });
  c.show('final-commit-again', replay);
  c.after('final-ready', () => ready.set(1));
  c.swap('final-ready', replay, yes, { after: true });
  c.on('final-read', () => reading.set(1));
  c.swap('final-read', stopped, access);
  c.after('final-retire', () => retired.set(1));
  c.swap('final-reuse', [commit, yes], [reclaim, reuse]);
  c.swap('final-hold', reuse, held, { after: true });
  c.after('final-reader-stops', () => reading.set(0));
  c.swap('final-reader-stops', held, canRelease, { after: true });
  c.after('final-free', () => freed.set(1));
  c.swap('final-free', canRelease, free, { after: true });
}
