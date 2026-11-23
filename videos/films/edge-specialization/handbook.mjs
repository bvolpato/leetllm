import { manuals } from './fixtures.mjs';

export function drawHandbook(
  p,
  { visible, meanings, selected, sweep = 0, showSelectedMeaning = true, target },
) {
  const { text, rect, line, C } = p;
  rect(909, 258, 830, 532, C.panel, C.muted, 14);
  rect(903, 250, 830, 532, C.panel, C.muted, 14);
  rect(896, 240, 830, 532, C.panel, C.muted, 18);
  line(925, 260, 925, 752, C.muted, 2);
  for (let y = 320; y <= 720; y += 100) rect(914, y, 42, 12, C.muted, undefined, 6);
  text('LOCAL HANDBOOK', 982, 324, 30, C.muted);
  if (!visible) return;
  p.target(target, () => {
    Object.entries(manuals).forEach(([page, record], i) => {
      const y = 382 + i * 178;
      const marked = selected === page;
      if (marked && sweep > 0) rect(957, y, 7, 116 * sweep, C.yellow);
      text(page, 990, y + 57, 49, marked ? C.yellow : C.ink);
      text('Sensor ' + record.sensor + '   /   ' + record.code, 1190, y + 54, 41, C.ink);
      if (meanings || (marked && sweep === 1 && showSelectedMeaning))
        text(record.meaning, 1190, y + 112, 37, C.cyan);
      if (i === 0) line(981, y + 145, 1660, y + 145, C.muted);
    });
  });
}

export function drawTicket(p, { sensor, code, answer, source, status, target, answerTarget }) {
  const { C, rect, text, line } = p;
  rect(140, 240, 620, 532, C.panel, C.muted, 32);
  text('INSPECTION LOG', 197, 321, 30, C.muted);
  text('Offline', 704, 321, 30, C.yellow, 'right');
  p.target(target, () => {
    text('Sensor', 197, 422, 30, C.muted);
    text('Code', 489, 422, 30, C.muted);
    text(sensor ?? '…', 197, 535, 88, C.cyan);
    text(code, 489, 535, 88, C.cyan);
  });
  line(197, 572, 703, 572, C.muted);
  p.target(answerTarget, () => {
    text(status, 197, 629, 28, C.muted);
    text(answer ?? '…', 197, 704, 41, C.ink);
    if (source) text(source, 705, 704, 32, C.yellow, 'right');
  });
}
