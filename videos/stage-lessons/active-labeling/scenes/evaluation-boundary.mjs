import {
  arrow,
  boxOf,
  column,
  draw,
  dot,
  grid,
  indicate,
  line,
  place,
  rect,
  row,
  swap,
  to,
} from 'vizmatic/stage';
import { chip, label, mono, note, tint } from '../../kit-narrated.mjs';
import { draftRows, testRows } from '../../../films/active-labeling/fixtures.mjs';
import { overlapFindings, reviewJudgeOrder } from '../../../films/active-labeling/model.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function evaluationBoundary(s, c) {
  open(s, c);
  const audit = reviewJudgeOrder();
  const [sourceArea, judgeArea] = picture.rows([2, 3], 'wide');
  const lanes = sourceArea.columns(3, 'wide');
  const frames = lanes.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 3, radius: 12 }), r).zIndex(-1),
  );
  const heads = ['Training', 'Development', 'Private test'].map((v, i) =>
    place(label(v, { color: i === 2 ? 'pink' : 'dim' }), lanes[i].inset('normal'), 'top'),
  );
  const train = place(chip(draftRows[3].id, { color: 'cyan' }), lanes[0]);
  const reserved = place(chip(testRows[0].id, { color: 'pink' }), lanes[2]);
  const development = place(chip('tune selector', { color: 'blue' }), lanes[1]);
  const parent = place(
    note('parent: ' + draftRows[3].parents[0], { color: 'pink' }),
    lanes[0].inset('normal'),
    'bottom',
  );
  const from = boxOf(train).point('right'),
    reservedTarget = boxOf(reserved).point('bottom');
  const routeX = boxOf(lanes[0]).right + 12;
  const routeY = boxOf(sourceArea).bottom + 12;
  const lineage = [
    line(from, [routeX, from[1]], { stroke: 'red', width: 4 }),
    line([routeX, from[1]], [routeX, routeY], { stroke: 'red', width: 4 }),
    line([routeX, routeY], [reservedTarget[0], routeY], { stroke: 'red', width: 4 }),
    arrow([reservedTarget[0], routeY], reservedTarget, { stroke: 'red', width: 4, pad: 10 }),
  ];
  const slotRegions = lanes[1].inset('normal').rows([1, 3], 'tight')[1].columns(2, 'normal');
  const slotFrames = slotRegions.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', radius: 10 }), r).zIndex(-1),
  );
  const slotLabels = slotRegions.map((r, i) =>
    place(note('Position ' + ['A', 'B'][i]), r.inset('tight'), 'top'),
  );
  const identities = slotRegions.map((r, i) =>
    place(
      chip('Answer ' + ['A', 'B'][i], { color: i ? 'blue' : 'green' }),
      r.inset('tight'),
      'bottom',
    ),
  );
  const identityPlaces = identities.map((n) => boxOf(n).point('center'));
  const identityDots = identityPlaces.map((p, i) => dot(13, i ? 'blue' : 'green').moveTo(p));
  const orderTitle = place(label('Display order'), lanes[1].inset('normal'), 'top');
  const [tableHead, tableBody] = judgeArea.rows([1, 5], 'normal');
  const judgeTitle = place(
    note('Map displayed positions back to original answer identity.'),
    tableHead,
  );
  const headers = ['case', 'human', 'original', 'swapped position', 'mapped identity'].map((v) =>
    note(v),
  );
  const cells = audit.rows.map((r) => [
    note(r.id),
    label(r.human, { color: 'blue' }),
    label(r.original, { color: 'blue' }),
    label(r.swapped, { color: 'blue' }),
    label(r.mapped, { color: r.mapped !== r.original ? 'red' : 'green' }),
  ]);
  place(grid([...headers, ...cells.flat()], { columns: 5, gap: ['loose', 'normal'] }), tableBody);
  const tableFrame = place(
    rect(tableBody.width - 8, tableBody.height - 8, { stroke: 'dim', width: 3, radius: 12 }),
    tableBody,
  ).zIndex(-1);
  const choice = dot(9, 'yellow').moveTo(boxOf(cells[0][3]).point('top'));
  const slotTarget = boxOf(slotFrames[0]).point('bottom');
  const mappedTarget = boxOf(cells[0][4]).point('top');
  const gutter = boxOf(tableBody).right - 36;
  const routeTop = boxOf(sourceArea).bottom + 30;
  const choiceRoute = [
    [gutter, boxOf(cells[0][3]).top],
    [gutter, routeTop],
    [slotTarget[0], routeTop],
    slotTarget,
  ];
  const returnRoute = [
    [slotTarget[0], routeTop],
    [gutter, routeTop],
    [gutter, mappedTarget[1]],
    mappedTarget,
  ];
  const premise = place(note('Split source families before selection.'), footer);
  const overlap = place(
    label(
      overlapFindings([draftRows[3]]).length ? 'Direct-parent overlap → blocked' : 'No overlap',
      { color: 'red' },
    ),
    footer,
  );
  const changed = place(
    label(audit.flips.length + ' mapped choices changed', { color: 'red' }),
    footer,
  );
  const repeat = place(note('Repeat balanced trials. Keep an unstable judge advisory.'), footer);
  const principles = place(
    column(
      [
        note('Constitutional AI: principles → critiques → revisions → AI preferences → RL'),
        note('Compare the judge’s labels with human judgments on the task.'),
      ],
      { gap: 'tight' },
    ),
    footer,
  );
  s.add(frames, heads, train, reserved, development, tableFrame, headers, judgeTitle, premise);
  c.on('separate-test', () => s.play(indicate([heads[2], reserved], { color: 'pink', scale: 1 })));
  c.show('source-overlap', [parent, ...lineage.map((n) => draw(n, { duration: 0.6 }))]);
  c.after('detect-overlap', () => s.play(tint(train, 'red')));
  c.swap('detect-overlap', premise, overlap, { after: true });
  c.swap(2, development, [slotFrames, slotLabels, identities]);
  c.swap(2, heads[1], orderTitle);
  c.show(
    2,
    cells.flatMap((r) => r.slice(0, 3)),
  );
  c.hide('map-identities', identities, { fade: 0.1 });
  c.show('map-identities', identityDots, { lead: -0.1, fade: 0.1 });
  c.on(
    'map-identities',
    () => {
      identities[0].moveTo(identityPlaces[1]);
      identities[1].moveTo(identityPlaces[0]);
      s.play(swap(identityDots[0], identityDots[1], { lift: 30, duration: 1 }));
    },
    0.2,
  );
  c.hide('map-identities', identityDots, { after: true, fade: 0.1 });
  c.show('map-identities', identities, { after: true, lead: -0.15, fade: 0.15 });
  c.show(
    'map-identities',
    cells.map((r) => r[3]),
    { after: true },
  );
  c.show('map-choice', choice);
  c.on(
    'map-choice',
    () => {
      choiceRoute.forEach((point) =>
        s.play(to(choice, (n) => n.moveTo(point), { duration: 0.35 })),
      );
      s.play(
        indicate([slotLabels[0], identities[1]], { color: 'yellow', scale: 1, duration: 0.4 }),
      );
      returnRoute.forEach((point) =>
        s.play(to(choice, (n) => n.moveTo(point), { duration: 0.35 })),
      );
    },
    0.3,
  );
  c.hide('map-choice', choice, { after: true });
  c.show(
    'map-choice',
    cells.map((r) => r[4]),
    { after: true },
  );
  c.swap('changed-choices', overlap, changed, { after: true });
  c.swap('judge-limits', changed, repeat);
  c.swap('synthetic-scope', repeat, principles);
  c.clear(lineage, 0.8, 0.2);
}
