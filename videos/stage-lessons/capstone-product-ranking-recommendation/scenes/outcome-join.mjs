import { place } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, open } from '../parts.mjs';

export default function outcome(s, c) {
  const [heading, board, verdict, foot] = open(s, c).rows([0.7, 4.6, 0.85, 0.8], 'wide');
  const [response, records] = board.columns([1, 2], 'loose');
  const [responseHead, recordsHead] = heading.columns([1, 2], 'loose');
  const req = 'REQ-501', served = '12:00:05', slate = ['P5', 'P6', 'P4'];
  const left = response.rows(4, 'normal'), right = records.rows(4, 'normal');
  s.add(place(label(req + ' · returned', { size: 38 }), responseHead),
    place(mono(served + ' UTC', { size: 37 }), left[0]),
    ...slate.map((id, i) => place(namedBox((i + 1) + '    ' + id, { width: 270, height: 84, color: COLOR[id] }), left[i + 1])));
  const click = { id: 'EVT-900', time: '12:00:08', request: req, product: 'P5', type: 'click' };
  const purchase = { ...click, id: 'EVT-901', time: '12:04:18', type: 'purchase' };
  const earlier = { ...click, id: 'EVT-902', time: '12:00:03', product: 'P6' };
  const conflict = { ...click, product: 'P9' };
  const fields = ['id', 'time', 'request', 'product', 'type'];
  function row(event, region, prior) {
    return region.columns([1.2, 1.2, 1.2, 0.65, 1], 'normal').map((cell, i) => {
      const key = fields[i], changed = prior && event[key] !== prior[key];
      return place(mono(event[key], { size: 31, color: changed ? 'yellow' : 'ink' }), cell);
    });
  }
  const headers = right[0].columns([1.2, 1.2, 1.2, 0.65, 1], 'normal');
  const accepted = place(label('Event records', { size: 38 }), recordsHead);
  s.add(accepted, ...['Event', 'UTC', 'Request', 'Item', 'Outcome'].map((v, i) => place(note(v), headers[i])));
  const saved = row(click, right[1]);
  const receipt = row(purchase, right[2]);
  const position = event => event.request === req ? slate.indexOf(event.product) + 1 : 0;
  c.show('event-click', saved);
  const pair = place(label('Both events match ' + req + ' / P5 at position ' + position(purchase) + '.', { color: 'green' }), verdict);
  c.show('event-purchase', receipt);
  c.show('event-join', pair, { after: true });
  const incoming = place(note('Ingestion worksheet · compare the incoming row with stored EVT-900'), foot);
  const replay = row({ ...click }, right[2]);
  c.swap('event-replay', [receipt, pair], [incoming, ...replay,
    place(note('Stored', { color: 'dim' }), right[1], 'top left'),
    place(note('Incoming', { color: 'cyan' }), right[2], 'top left')]);
  const sameIdDisposition = event => fields.every(k => event[k] === click[k]) ? 'Identical replay · count once' : 'Same ID, different payload · quarantine';
  const once = place(label(sameIdDisposition(click), { color: 'green' }), verdict);
  c.show('event-ignore', once, { after: true });
  const mismatch = row(conflict, right[2], click);
  const ask = place(label('Same event ID. Is this still a replay?', { color: 'yellow' }), verdict);
  c.swap('event-change', [...replay, once], [...mismatch, ask]);
  const isolate = place(label(sameIdDisposition(conflict), { color: 'red' }), verdict);
  c.swap('event-conflict', ask, isolate, { after: true });
  const noMember = place(note(conflict.product + (position(conflict) ? ' is present' : ' is absent') + ' in the returned slate.'), foot);
  c.swap('event-absent', incoming, noMember);
  const tooEarly = row(earlier, right[2]);
  const timeLabel = place(note('New event ID · P6 matches position ' + position(earlier)), foot);
  c.swap('event-clock', [...mismatch, noMember, isolate], [...tooEarly, timeLabel]);
  const timing = earlier.time < served ? 'Before serving · investigate the timestamps' : 'After serving';
  c.show('event-early', place(label(timing, { color: 'red' }), verdict), { after: true });
}
