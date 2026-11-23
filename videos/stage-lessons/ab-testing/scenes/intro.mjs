import {
  boxOf,
  column,
  draw,
  group,
  line,
  linear,
  place,
  polygon,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function intro(s, c) {
  const [documents, scoreRow, questionRow] = area.rows([3.7, 1, 0.8], 'normal');
  const [chat, page] = documents.columns(2, 'wide');
  const [chatHead, reply, action] = chat.inset('wide').rows([1, 2.3, 1.3], 'tight');
  const [pageHead, excerptSlot, pageFoot] = page.inset('wide').rows([1, 2.3, 1.3], 'tight');
  const bubble = rect(chat.width, chat.height, {
    radius: 32,
    fill: 'surface',
    stroke: 'blue',
    width: 4,
  }).moveTo(chat.point('center'));
  const tail = polygon(
    [
      [chat.left + 50, chat.bottom - 2],
      [chat.left + 50, chat.bottom + 20],
      [chat.left + 85, chat.bottom - 2],
    ],
    { fill: 'blue', stroke: null },
  );
  const paper = rect(page.width, page.height, {
    radius: 8,
    fill: 'surface',
    stroke: 'dim',
    width: 3,
  }).moveTo(page.point('center'));
  const spine = line([page.left + 18, page.top], [page.left + 18, page.bottom], {
    stroke: 'cyan',
    width: 6,
  });
  const tabX = page.right - 85;
  const bookmark = polygon(
    [
      [tabX, page.top],
      [tabX + 40, page.top],
      [tabX + 40, page.top + 80],
      [tabX + 20, page.top + 64],
      [tabX, page.top + 80],
    ],
    { fill: 'cyan', stroke: null },
  );
  const alone = label('alone', { size: 54 });
  const answer = place(
    column(
      [
        row([label('“Acknowledgement', { size: 54 }), alone], { gap: 20 }),
        label('authorizes rollback.”', { size: 54 }),
      ],
      { gap: 'normal' },
    ),
    reply,
    'left',
  );
  const excerpt = place(
    column(
      [label('“Rollback requires', { size: 54 }), label('owner acknowledgement.”', { size: 54 })],
      { gap: 'normal' },
    ),
    excerptSlot,
    'left',
  );
  const buttonStyle = { size: 37, minWidth: 360, height: 1.8, round: true };
  const button = place(
    chip('Mark usable', { ...buttonStyle, fill: 'blue', color: 'bg' }),
    action,
    'left',
  );
  const marked = place(
    chip('Marked usable', { ...buttonStyle, stroke: 'blue', color: 'blue' }),
    action,
    'left',
  );
  const tip = boxOf(button).point('bottom right');
  const click = [tip[0] - 22, tip[1] - 14];
  const pointer = polygon(
    [
      [0, 0],
      [8, 62],
      [23, 45],
      [38, 69],
      [51, 61],
      [36, 38],
      [59, 35],
    ],
    {
      fill: 'ink',
      stroke: 'bg',
      width: 3,
    },
  ).at(click[0] + 206, click[1] + 62);
  const pageLines = [0.78, 0.57].map((fraction, i) => {
    const y = pageFoot.cy + i * 21 - 10;
    return line([pageFoot.left, y], [pageFoot.left + pageFoot.width * fraction, y], {
      stroke: 'gridStrong',
      width: 4,
    });
  });
  const documentsOn = group(
    bubble,
    tail,
    paper,
    spine,
    bookmark,
    ...pageLines,
    answer,
    excerpt,
    place(label('Incident assistant   ·   rewrite', { size: 38, color: 'blue' }), chatHead, 'left'),
    place(label('Payment runbook', { size: 38, color: 'cyan' }), pageHead, 'left'),
  );
  const openingQuestion = heading(c.title);
  const question = place(
    label('Which word turns a requirement into permission?', {
      size: 48,
      color: 'yellow',
    }),
    questionRow,
  );
  const word = boxOf(alone);
  const underline = line([word.left, word.bottom + 10], [word.right, word.bottom + 10], {
    stroke: 'yellow',
    width: 6,
  });
  const [outcomeSlot, auditSlot] = scoreRow.columns(2, 'wide');
  const audit = place(chip('1 grounding failure', { size: 39, color: 'yellow' }), auditSlot);
  const observed = place(
    column(
      [
        chip('1 resolved incident', { size: 39, color: 'green' }),
        note('Usable at 8 min   ·   no new page through 10'),
      ],
      { gap: 'tight' },
    ),
    outcomeSlot,
  );

  const opening = [openingQuestion, documentsOn, button, pointer];
  s.add(...opening);
  // The cursor is already moving when the brand cuts to the answer.
  for (const node of opening) node.track('opacity').step(0, 1);
  s.play(
    to(pointer, (p) => p.at(...click)),
    { duration: c.cue('marked').start, ease: linear },
  );
  c.swap('marked', button, marked, { lead: 0 });
  c.hide('source', pointer);
  c.show('ask', question);
  c.hide('alone', question, { lead: 0 });
  c.show('alone', draw(underline), { lead: 0 });
  c.show('audit', audit, { after: true });
  c.show('resolved', observed, { after: true });

  const [raw, rewrite] = documents.columns(2, 'wide');
  const arms = [
    place(
      column([label('Control', { color: 'cyan' }), note('Search the original question')], {
        gap: 'tight',
      }),
      raw,
    ),
    place(
      column([label('Treatment', { color: 'blue' }), note('Rewrite the search query')], {
        gap: 'tight',
      }),
      rewrite,
    ),
  ];
  const lock = place(label('Same runbook index, prompt, generator and decoder'), scoreRow);
  const budget = place(
    mono('Grounding limit   +0.50 percentage points', {
      size: 44,
      color: 'yellow',
    }),
    questionRow,
  );
  c.swapAll('split', [heading('Should we ship the query rewrite?'), arms, lock]);
  c.show('budget', budget);
}
