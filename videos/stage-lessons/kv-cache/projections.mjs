import { arrow, line, Node, rect, to } from 'vizmatic/stage';
import { PAIRS, QUERY, attend, showPair } from '../../films/kv-cache/model.mjs';
import { left, picture, tile, words } from './picture.mjs';

const tokens = ['The', 'fox', 'ran', 'straight', 'past', 'us'];
const pairs = PAIRS.slice(0, 3);
const vector = values => '(' + values.join(', ') + ')';

export function buildHook(stage, narration) {
  const { clock, show, hide, caption, finish } = picture(stage, narration, 'hook');
  const x = [-310, 170, 650];
  const inputY = -290, outputY = 286;
  const name = (i, y = inputY) => words(tokens[i], 95, i === 2 ? 'yellow' : 'ink').moveTo([x[i], y]);
  const pair = (i, component) =>
    tile(vector(pairs[i][component]), {
      w: 330, h: 104, color: component === 0 ? 'blue' : 'teal', size: 56,
    }).at(x[i], component === 0 ? -55 : 115);
  const outlines = [-55, 115].map(y =>
    rect(330, 104, { radius: 10, stroke: 'dim', width: 2 }).dash([10, 10]).at(x[2], y),
  );
  const rowLabels = ['Key', 'Value'].map((value, i) =>
    left(words(value, 60, i ? 'teal' : 'blue'), -845, i ? 115 : -55),
  );
  const outputLabel = words('Next token', 52, 'dim').moveTo([x[2] - 237, outputY]);
  const outputSlot = line([x[2] - 78, outputY + 43], [x[2] + 78, outputY + 43], {
    stroke: 'yellow', width: 5,
  });
  const nextToken = name(2, outputY);
  clock.at(0, () => show([
    name(0), name(1), ...rowLabels, pair(0, 0), pair(1, 0), pair(0, 1), pair(1, 1),
    outputLabel, outputSlot,
  ], 0));
  clock.after('ran', () => show(nextToken));
  clock.on('feed-back', () => {
    const labelFade = 0.14;
    hide([outputLabel, outputSlot], labelFade);
    stage.play(to(nextToken, word => word.moveTo([x[2], inputY])), {
      duration: clock.span('feed-back') - labelFade,
    });
    show(outlines);
  });
  clock.on('ask', () => caption('Which tokens need a fresh key and value?', 'yellow'));
  clock.after('new-pair', () => {
    hide(outlines);
    show([pair(2, 0), pair(2, 1)], 0.4);
    caption('One new pair, for ran.');
  });

  const query = left(words('Query  ' + vector(QUERY), 44, 'yellow', 'mono'), -845, -178);
  const trunk = line([x[2], -231], [x[2], -177], { stroke: 'yellow', width: 4 });
  const bus = line([x[2], -177], [x[0], -177], { stroke: 'yellow', width: 4 });
  const taps = x.map(cx => arrow([cx, -177], [cx, -115], { stroke: 'yellow', width: 4, tip: 14 }));
  clock.on('query', () => show([query, trunk]));
  clock.on('keys', () => {
    show(bus, 0.3);
    show(taps, 0.42);
    caption('One query scores three keys.');
  });
  const blend = words('Weighted mix   ' + showPair(attend(QUERY, pairs)), 54, 'teal', 'mono')
    .moveTo([x[1], 318]);
  const drain = new Node().add(
    ...x.map(cx => line([cx, 170], [cx, 218], { stroke: 'teal', width: 4 })),
    line([x[0], 218], [x[2], 218], { stroke: 'teal', width: 4 }),
    arrow([x[1], 218], [x[1], 272], { stroke: 'teal', width: 4, tip: 14 }),
  );
  clock.on('mix', () => {
    show(drain, 0.45);
    show(blend);
    caption('All three values contribute.');
  });
  clock.on('cache', () => caption('The KV cache keeps these pairs for the next step.'));
  finish();
}

export function buildWaste(stage, narration) {
  const { clock, show, hide, caption, clear, finish } = picture(stage, narration, 'waste');
  const x = [-185, 245, 675];
  const y = [-110, 135];
  const pairTile = (i, lane, kept = false) =>
    tile('K + V', { w: 282, h: 110, color: kept ? 'blue' : 'green', solid: true }).at(x[i], y[lane]);
  const lane = (name, index) => [
    left(words(name, 58), -850, y[index]),
    ...x.map(cx => rect(282, 110, { radius: 10, stroke: 'dim', width: 2 }).at(cx, y[index])),
  ];
  clock.at(0.03, () => show(x.map((cx, i) => words(tokens[i], 86).moveTo([cx, -308]))));
  clock.on('cold', () => show(lane('Start empty', 0)));
  clock.on('rebuild', () => show([pairTile(0, 0), pairTile(1, 0)]));
  clock.on('third', () => {
    show(pairTile(2, 0));
    caption('Starting empty takes 3 projected positions.');
  });
  clock.on('warm', () => show([...lane('Keep The fox', 1), pairTile(0, 1, true), pairTile(1, 1, true)]));
  clock.after('one', () => {
    show(pairTile(2, 1));
    caption('Keeping the prefix takes 1 projected position.');
  });
  clock.after('same-read', () => {
    const rings = y.map(cy => rect(x[2] - x[0] + 312, 140, {
      radius: 13, stroke: 'yellow', width: 5,
    }).at(x[1], cy));
    show(rings);
    caption('Both queries attend to 3 positions.', 'yellow');
  });

  const origins = [-625, 305];
  const dx = 100, dy = 69, top = -176;
  const cellX = (laneIndex, i) => origins[laneIndex] + i * dx;
  const cellY = step => top + step * dy;
  const columns = origins.map((origin, index) =>
    words(index ? 'Keep the pairs' : 'Discard after each step', 60).moveTo([origin + 245, -324]),
  );
  clock.on('six-steps', () => {
    clear();
    show(columns);
    caption('Each filled square counts one position projected on that step.');
  });
  const columnRing = rect(96, dy * 2 + 62, {
    radius: 8, stroke: 'yellow', width: 4,
  }).at(cellX(0, 0), cellY(1));
  let totalCold = 0, totalWarm = 0;
  for (let step = 0; step < tokens.length; step++) {
    clock.on('r' + (step + 1), () => {
      if (step === 3) hide(columnRing);
      const row = [];
      for (let side = 0; side < 2; side++) {
        row.push(left(words(tokens[step], 35, 'ink', 'mono'), origins[side] - 224, cellY(step)));
        for (let i = 0; i <= step; i++) {
          const project = side === 0 || i === step;
          if (project && side === 0) totalCold++;
          if (project && side === 1) totalWarm++;
          row.push(rect(78, 50, {
            radius: 6, fill: project ? 'green' : 'surface',
            stroke: project ? 'green' : 'blue', width: 2,
          }).at(cellX(side, i), cellY(step)));
        }
      }
      show(row, 0.2);
    });
    if (step === 2) clock.on('column', () => show(columnRing));
  }
  clock.after('total', () => show([
    words(totalCold + ' projected', 59, 'green', 'mono').moveTo([-400, 290]),
    words(totalWarm + ' projected', 59, 'green', 'mono').moveTo([510, 290]),
  ]));
  clock.on('read-row', () => {
    const outlines = origins.map(origin => rect(5 * dx + 94, 62, {
      radius: 8, stroke: 'yellow', width: 4,
    }).at(origin + 2.5 * dx, cellY(5)));
    show(outlines);
    caption('On step six, each query reads six positions.', 'yellow');
  });
  finish();
}
