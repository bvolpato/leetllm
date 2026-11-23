import { assertEqual, line, place, to } from 'vizmatic/stage';
import { mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { board, body, caption, fmt, foot, guide, ledger, pointAt } from '../parts.mjs';

export default function savings(s, c) {
  board(s, c, 'What did the worker do for each request?', 'Sequential requests · token counts');
  const [heads, ...bands] = body.rows([0.7, 1, 1, 1], 'tight');
  const cols = (band) => band.columns([0.85, 1.4, 1.4, 1.1, 1.1], 'normal');
  const headers = cols(heads);
  const titles = ['Request', 'Reused guide', 'Fresh guide', 'Fresh question', 'New output'];
  s.add(titles.map((v, i) => caption(v, headers[i], { size: 35, color: 'dim' })));
  const rows = ledger.rows.map((request, i) => {
    const cells = cols(bands[i]);
    const reading = (n, col, color) => place(mono(fmt(n), { size: 42, color }), cells[col]);
    const id = caption('R' + (i + 1), cells[0]);
    const guideTile = place(namedBox(fmt(guide), {
      width: cells[1].width * 0.75, height: 86, color: i ? 'green' : 'cyan',
    }), cells[i ? 1 : 2]);
    const tail = reading(request.tail, 3, 'cyan');
    const output = reading(request.output, 4, 'ink');
    const band = bands[i];
    s.add(id, line(band.point('bottom left'), band.point('bottom right'), { stroke: 'dim', width: 1 }));
    return { cells, id, guideTile, tail, output };
  });
  const total = (n, text, cell, color) => place(note(fmt(n) + ' ' + text, { size: 39, color }), cell);
  const fields = foot.columns(3, 'normal');
  const fresh = total(ledger.fresh, 'fresh input', fields[1], 'cyan');
  const read = total(ledger.reused, 'reused input', fields[0], 'green');
  const generated = total(ledger.output, 'output', fields[2], 'ink');
  const base = caption('Cold baseline   ·   ' + fmt(ledger.total) + ' input positions', foot, { color: 'dim' });
  const predict = caption('Where do R3’s 6,000 guide tokens go after eviction?', foot, { size: 40, color: 'yellow' });
  const replayFresh = ledger.fresh + guide;
  const replayRead = ledger.reused - guide;
  assertEqual(replayFresh + replayRead, ledger.total, 'Eviction changes which input positions are fresh.');
  const nextFresh = total(replayFresh, 'fresh input', fields[1], 'cyan');
  const nextRead = total(replayRead, 'reused input', fields[0], 'green');
  const row3 = rows[2];
  const before = caption('R3 before', row3.cells[0], { size: 34, color: 'dim' });
  const after = caption('R3 replay', row3.cells[0], { size: 34, color: 'cyan' });
  const rowTotal = caption('R3 fresh input   ·   ' + fmt(guide) + ' + ' + ledger.rows[2].tail +
    ' = ' + fmt(guide + ledger.rows[2].tail), foot, { color: 'cyan' });
  s.add(base, rows.map((r) => r.tail));
  ['ledger-first', 'ledger-second', 'ledger-third'].forEach((cue, i) =>
    c.show(cue, rows[i].guideTile, { after: true, lead: 0 }));
  c.show('ledger-output', rows.map((r) => r.output));
  c.swap('ledger-fresh', base, fresh, { after: true, lead: 0 });
  c.show('ledger-read', read, { after: true, lead: 0 });
  c.show('ledger-generated', generated, { after: true, lead: 0 });
  c.swap('ledger-rewind', row3.id, before);
  c.on('ledger-evict', () => s.play(pointAt(row3.guideTile)));
  c.swap('ledger-predict', [fresh, read, generated], predict);
  c.swap('ledger-move', before, after, { after: true });
  c.after('ledger-move', () => s.play(
    to(row3.guideTile, (tile) => place(tile, row3.cells[2])),
    tint(row3.guideTile, 'cyan'), { duration: 0.8 },
  ));
  c.swap('ledger-rerun', predict, rowTotal, { after: true, lead: 0 });
  c.swap('ledger-total', rowTotal, [nextFresh, nextRead, generated], { after: true, lead: 0 });
}
