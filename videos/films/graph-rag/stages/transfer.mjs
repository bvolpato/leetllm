import { catalogSlip, followBookRecord } from '../catalog-slip.mjs';
import { line, text } from '../defaults.mjs';
import { BOOK_ENTRIES, BOOK_TOPICS } from '../fixtures.mjs';
import { topicCounts } from '../model.mjs';

const id = 'transfer';

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const after = (name) => cue(name)?.phase === 'after';
  const p = (name) => cue(name)?.progress ?? 0;
  const write = (s, x, y, z, color, align = 'left') => text(ctx, api, id, s, x, y, z, color, align);
  if (state.beat < 2) {
    const open = after('lookup-result');
    api.focus.target(id + '-files', () => {
      write('Who published Lena’s book?', 120, 297, 51, C.ink);
      catalogSlip(ctx, api, id, {
        id: 'author',
        x: 120,
        y: 445,
        label: 'A   /   Author record',
        title: 'Lena wrote River Walk.',
        detail: 'Work cited    ·    book:river',
        color: C.blue,
      });
      catalogSlip(ctx, api, id, {
        id: 'book',
        x: 1140,
        y: 290,
        label: 'B   /   Revision 2   ·   current',
        title: open ? 'Juniper Press' : 'River Walk',
        detail: open ? 'Publisher    ·    book:river' : 'Catalogue ID    ·    book:river',
        color: C.cyan,
      });
      catalogSlip(ctx, api, id, {
        id: 'old-report',
        x: 1140,
        y: 631,
        label: 'Report   /   Built from B, revision 1',
        title: 'Willow Press',
        detail: 'Awaiting rebuild',
        color: C.muted,
      });
      followBookRecord(ctx, api, p('follow'));
      write(
        open ? 'A + B, revision 2' : 'Which source can you cite now?',
        960,
        950,
        43,
        open ? C.ink : C.yellow,
        'center',
      );
    });
    return;
  }
  const newBook = p('fifth-book') > 0;
  const rows = BOOK_ENTRIES.slice(0, newBook ? 6 : 5);
  const collapsed = p('same-book');
  const result = newBook ? after('tie') : after('count-result');
  const counted = newBook ? (result ? rows : rows.slice(0, -1)) : rows;
  const { books, counts } = topicCounts(counted);
  api.focus.target(id + '-shelf', () => {
    write('Catalogue entries', 130, 258, 40, C.ink);
    rows.forEach(([book, topic], i) => {
      const repeated = i === 3;
      const y = 368 + i * 92;
      const color = repeated && collapsed > 0 ? C.muted : book === 'B5' ? C.yellow : C.blue;
      write(book, 146, y, 39, color);
      write(topic, 327, y, 39, color);
      if (repeated && collapsed > 0) {
        const right = 577;
        line(ctx, api, right, y - 103, right + 22, y - 103, C.cyan, 3);
        line(ctx, api, right + 22, y - 103, right + 22, y - 103 + 92 * collapsed, C.cyan, 3);
        if (collapsed === 1) {
          line(ctx, api, right, y - 11, right + 22, y - 11, C.cyan, 3);
          write('Count once', 626, y - 43, 31, C.cyan);
        }
      }
    });
  });
  api.focus.target(id + '-tally', () => {
    write(
      newBook && !result ? 'Previous four books' : 'Distinct books per topic',
      1020,
      258,
      40,
      C.ink,
    );
    BOOK_TOPICS.forEach((topic, i) => {
      const y = 335 + i * 155;
      write(topic, 1020, y + 45, 36, C.ink);
      if (result || newBook || (i === 0 && after('count-two'))) {
        const color = [C.green, C.blue, C.pink][i];
        for (let j = 0; j < counts[i]; j++) {
          api.rect(ctx, 1300 + 110 * j, y, 95, 58, color, undefined, 5);
        }
        write(String(counts[i]), 1645, y + 46, 43, color);
      } else write('?', 1645, y + 46, 43, C.muted);
    });
    if (result || newBook) write(books + ' distinct books', 1020, 822, 36, C.ink);
    else if (after('count-two')) write('2 gardening IDs', 1020, 822, 36, C.green);
    const prompt = result
      ? newBook
        ? 'Gardening and travel tie at two books each.'
        : 'Gardening · 2 of 4'
      : newBook
        ? 'B5 is a new travel book. Who leads now?'
        : 'Which topic has the most books?';
    write(prompt, 960, 969, 43, result ? C.ink : C.yellow, 'center');
  });
}
export default {
  id,
  draw: drawTransfer,
  cues: [
    'choose',
    'follow',
    'lookup-result',
    'entries',
    'same-book',
    'count-two',
    'count-result',
    'fifth-book',
    'tie',
  ].map((name) => id + '-' + name),
};
