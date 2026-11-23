import { boxOf, fadeIn, group, indicate, line, linear, place, rect, shift } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { renewalSheet } from '../renewals.mjs';
import { CASES, COLOR, scoreCases } from '../parts.mjs';

function pullRenewals() {
  const [scores, file] = area.columns([1, 1.8], 'loose');
  const [legend, a, b] = scores.rows([0.7, 2, 2], 'normal');
  const scoreLabels = [a, b].map((slot, i) => {
    const model = i ? 'B' : 'A';
    const result = scoreCases(model);
    const [who, number] = slot.rows([1, 2], 0);
    return group(
      place(label('Assistant ' + model, { size: 48, color: COLOR[model] }), who, 'bottom'),
      place(mono(`${result.correct}/${result.total}`, { size: 89 }), number, 'top'),
    );
  });
  const [header, page, tray] = file.rows([0.8, 5, 1.4], 'normal');
  const frame = place(
    rect(file.width, header.height + page.height + 50, {
      fill: 'surface',
      stroke: 'grid',
      width: 3,
      radius: 16,
    }),
    file,
    'top',
  );
  const columns = 10;
  const slots = page
    .inset('tight')
    .rows(CASES.length / columns, 0)
    .flatMap((row) => row.columns(columns, 0));
  const ordinary = [];
  const renewals = [];
  for (const [i, item] of CASES.entries()) {
    const slot = slots[i];
    const renewal = item.category === 'renewal';
    const tile = place(
      rect(slot.width - 8, slot.height - 7, {
        fill: renewal ? 'yellow' : 'grid',
        stroke: null,
        radius: 3,
      }),
      slot,
    );
    if (renewal) {
      renewals.push(group(tile, place(mono(item.id, { size: 30, color: 'bg' }), slot)));
    } else {
      ordinary.push(tile);
    }
  }
  const strip = group(...renewals);
  const tab = place(label('Renewal requests', { size: 41, color: 'yellow' }), tray, 'bottom');
  const destination = tray.cy;
  return {
    picture: [
      frame,
      place(label(`${CASES.length} library questions`, { size: 48 }), header),
      ordinary,
      strip,
      tab,
      place(label('Overall score', { size: 44 }), legend, 'bottom'),
      scoreLabels,
    ],
    strip,
    scoreLabels,
    travel: destination - slots.at(-1).cy,
  };
}

export default function intro(s, c) {
  const [context, sheet, count, question] = area.rows([1, 4.4, 1, 1], 'normal');
  const {
    titles,
    idLabels,
    rows: [a, b],
  } = renewalSheet(sheet);
  const renewalFile = place(label('Ten renewal questions', { size: 52 }), context);
  const [aCount, bCount] = count.columns(2, 'wide').map((slot, i) => {
    const model = i ? 'B' : 'A';
    const ordinary = scoreCases(model, 'ordinary').correct;
    const total = scoreCases(model).correct;
    return place(
      label(`${model}    ${total} − ${ordinary} = ${total - ordinary} renewals`, { size: 42 }),
      slot,
    );
  });
  const ask = place(label('Who answered more renewals correctly?', { color: 'yellow' }), question);
  const review = place(note('Q93  ·  same request, two scored answers'), question);
  const focus = [a, b].map((row) => {
    const tile = boxOf(row.frames[2]);
    return rect(tile.width + 5, tile.height + 5, { fill: null, stroke: 'yellow', width: 3 }).moveTo(
      tile.point('center'),
    );
  });
  const sameCase = line(boxOf(focus[0]).point('bottom'), boxOf(focus[1]).point('top'), {
    stroke: 'yellow',
    width: 3,
  });
  const next = place(note('What did the scorer accept?'), question);
  const title = heading('Who should answer renewals?');
  const opening = pullRenewals();
  const first = [title, opening.picture];
  s.add(first);
  s.play(fadeIn(first, { duration: 0 }));
  s.play(shift(opening.strip, 0, opening.travel), { duration: 1.1, ease: linear });
  c.on('tied-scores', () =>
    s.play(indicate(opening.scoreLabels, { scale: 1.04, color: 'yellow' })),
  );
  c.swap('renewal-file', opening.picture, [
    renewalFile,
    titles,
    a.totals,
    b.totals,
    idLabels,
    a.frames,
    b.frames,
  ]);
  c.show('ordinary-a', a.ordinaryCount, { after: true });
  c.show('ordinary-b', b.ordinaryCount, { after: true });
  c.show('ask-renewals', ask);
  c.on('open-a', () => s.play(indicate(a.frames, { scale: 1, color: 'yellow' })));
  c.show('count-a', [a.marks, aCount], { after: true });
  c.on('open-b', () => s.play(indicate(b.frames, { scale: 1, color: 'yellow' })));
  c.show('count-b', [b.marks, bCount], { after: true });
  c.swap('one-renewal', ask, review);
  c.show('one-renewal', [focus, sameCase]);
  c.on('tasks', () => s.play(indicate(idLabels, { scale: 1, color: 'yellow' })));
  c.hide('tasks', [focus, sameCase]);
  c.swap('grading', review, next);
}
