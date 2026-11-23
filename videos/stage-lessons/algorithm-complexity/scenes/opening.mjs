import {
  assertEqual,
  boxOf,
  column,
  dynamic,
  line,
  place,
  polygon,
  rect,
  row,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { DOCS, FOOT, PICTURE, TERMS } from '../parts.mjs';
import { desk, noteBoard } from '../note-board.mjs';

export default function opening(s, c) {
  const title = heading(c.title);
  const [stack, search] = PICTURE.columns([1.5, 1], 'loose');
  const sheet = stack.inset(58, 66);
  const pages = DOCS.slice(1).map((_, i) => {
    const step = 14;
    const offset = (DOCS.length - 1 - i) * step;
    const right = sheet.right + offset;
    const bottom = sheet.bottom + offset;
    const left = sheet.left + offset;
    const top = sheet.top + offset;
    return polygon(
      [
        [right - step, top],
        [right, top],
        [right, bottom],
        [left, bottom],
        [left, bottom - step],
        [right - step, bottom - step],
      ],
      { fill: 'surface', stroke: 'blue', width: 2 },
    );
  });
  const fold = 74;
  pages.push(
    polygon(
      [
        sheet.point('top left'),
        [sheet.right - fold, sheet.top],
        [sheet.right, sheet.top + fold],
        sheet.point('bottom right'),
        sheet.point('bottom left'),
      ],
      { fill: 'ink', stroke: null },
    ),
    polygon(
      [
        [sheet.right - fold, sheet.top],
        [sheet.right, sheet.top + fold],
        [sheet.right - fold, sheet.top + fold],
      ],
      { fill: 'blue', stroke: null },
    ),
  );
  const [header, body] = sheet.inset(46).rows([1, 4], 'normal');
  const words = ['The', 'login', 'test', 'fixture'].map((word) =>
    label(word, { size: 58, color: 'bg' }),
  );
  const lines = ['starts with an', 'expired session'];
  assertEqual(['The login test fixture', ...lines].join(' '), DOCS[0].detail, 'printed note A');
  const print = place(
    column(
      [
        row(words, { gap: 33 }),
        ...lines.map((v, i) => label(v + (i === 1 ? '.' : ''), { size: 58, color: 'bg' })),
      ],
      { align: 'left', gap: 36 },
    ),
    body,
    'left',
  );
  const [key, ...slots] = search.inset(30, 50).rows([0.8, 1, 1, 1], 'tight');
  const checks = s.value(0);
  const marked = [s.value(0), s.value(0)];
  const highlights = dynamic(() =>
    marked.flatMap((progress, i) => {
      if (progress.value <= 0) return [];
      const word = boxOf(words[i + 1]);
      return [
        rect(word.width + 24, word.height + 24, {
          fill: 'blue',
          stroke: null,
          opacity: progress.value,
        }).moveTo(word.point('center')),
      ];
    }),
  );
  const reads = slots.map((slot) => slot.columns([1.05, 1], 'tight'));
  const searchWords = TERMS.map((term, i) =>
    place(mono(term, { size: 57, color: 'cyan' }), reads[i][0], 'left'),
  );
  const answers = dynamic(() =>
    TERMS.slice(0, checks.value).map((term, i) => {
      const hit = DOCS[0].words.includes(term);
      return place(
        label(hit ? 'found' : 'absent', { size: 42, color: hit ? 'green' : 'dim' }),
        reads[i][1],
        'left',
      );
    }),
  );
  const caption = place(
    mono('1 of ' + DOCS.length + ' authorized notes', { size: 38, color: 'blue' }),
    FOOT,
  );
  const matchCount = TERMS.filter((term) => DOCS[0].words.includes(term)).length;
  const total = place(
    label(matchCount + ' of ' + TERMS.length + ' words match note A', { color: 'yellow' }),
    FOOT,
  );
  const noteShot = [
    pages,
    place(mono('A   /   TEST SETUP', { size: 34, color: 'bg' }), header, 'left'),
    line(header.point('bottom left'), header.point('bottom right'), { stroke: 'bg', width: 2 }),
    highlights,
    print,
    place(note('Search words'), key, 'left'),
    searchWords,
    answers,
  ];
  s.add(title, noteShot, caption);
  for (const [i, cue] of ['opening-terms', 'opening-test'].entries()) {
    c.on(cue, () => s.play(marked[i].to(1), { duration: c.cue(cue).end - c.cue(cue).start }));
    c.after(cue, () => checks.set(i + 1));
  }
  const pending = place(mono('?', { size: 44, color: 'yellow' }), reads[2][1], 'left');
  c.show('opening-fail', pending);
  c.on('opening-missing', () => {
    s.remove(pending);
    checks.set(TERMS.length);
  });
  c.swap('opening-match', caption, total, { after: true });

  const compared = s.value(TERMS.length);
  const board = noteBoard(compared);
  const [name, number] = desk.inset('wide').rows([1, 2], 'tight');
  const counter = dynamic(() => [
    place(
      mono(Math.floor(compared.value / TERMS.length) + ' / ' + DOCS.length, {
        size: 108,
        color: 'yellow',
      }),
      number,
      'top',
    ),
  ]);
  c.on('opening-rest', () => {
    s.remove(noteShot, total);
    s.add(board.nodes, place(label('Notes visited'), name, 'bottom'), counter);
  });
  for (const [cue, visits] of [
    ['opening-clock', 2],
    ['opening-zero', DOCS.length],
  ]) {
    c.on(cue, () =>
      s.play(compared.to(visits * TERMS.length), { duration: c.cue(cue).end - c.cue(cue).start }),
    );
  }
  c.show('opening-result', place(label('One visit per note'), FOOT), { after: true });
}
