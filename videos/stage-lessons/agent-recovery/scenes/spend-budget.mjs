// Scene `spend-budget`: what retries and turns cost.
//
// Three pictures, one for each part. Sends: 3 balls become 9 and then 64, as layers multiply.
// Tokens: four prompt bars grow by 50 a turn, and their copies fill the bar of the run to 700.
// Reservation: the oversized request is refused. Workers then compete for the same balance.
// A timeout keeps its reservation, and compaction shrinks only the next prompt.
import {
  appear,
  assertEqual,
  beside,
  boxOf,
  circle,
  column,
  dot,
  dynamic,
  fadeOut,
  to,
  fade,
  fadeIn,
  grid,
  grow,
  indicate,
  lagged,
  line,
  moveTo,
  par,
  pictogram,
  place,
  rect,
  row,
  seq,
  tex,
  vanish,
} from 'vizmatic/stage';
import { area, chip, display, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR } from '../parts.mjs';

/** The numbers that the voice says. */
const SENDS = { attempts: 3, layers: 2, retries: 3, deep: 3 };
const TOKENS = { prefix: 100, added: 50, turns: 4 };
const RESERVE = { input: 120, output: 80, left: 150 };

/** A rectangle with no border, by its left end: `bar(width, height, color).moveTo(...)`. */
const bar = (width, height, color, opacity = 0.9) =>
  rect(width, height, { radius: 8, fill: color, stroke: null, opacity });

export default function spendBudget(s, c) {
  const perLayer = 1 + SENDS.retries;
  assertEqual(
    [SENDS.attempts ** SENDS.layers, perLayer ** SENDS.deep],
    [9, 64],
    'the two bounds of sends',
  );
  const prompts = Array.from(
    { length: TOKENS.turns },
    (_, turn) => TOKENS.prefix + TOKENS.added * turn,
  );
  const total = prompts.reduce((sum, size) => sum + size, 0);
  assertEqual(prompts, [100, 150, 200, 250], 'the four prompts');
  assertEqual(
    total,
    TOKENS.turns * TOKENS.prefix + (TOKENS.added * TOKENS.turns * (TOKENS.turns - 1)) / 2,
    'the sum and its formula',
  );
  assertEqual(total, 700, 'the submitted input tokens');
  assertEqual(RESERVE.input + RESERVE.output > RESERVE.left, true, 'the reservation does not fit');

  // Each outer attempt contains an inner send strip. The deep case adds a middle layer.
  const [ballBand, readBand, footBand] = area.rows([5, 2, 1], 'normal');
  const blocks = ballBand.columns(perLayer, 'wide');
  const sections = blocks.map((block) => block.rows([1, 6], 'tight'));
  const strips = sections.map(([, body]) =>
    body.rows(perLayer, 'none').map((lane) => lane.columns([2, 5], 'tight')),
  );
  const cells = strips.map((block) => block.map(([, lane]) => lane.columns(perLayer, 'none')));
  const balls = cells.map((block, k) =>
    block.map((cellRow, r) =>
      cellRow.map((cell, q) => dot(22, q === 0 ? 'ink' : COLOR.attempt).at(...cell.point())),
    ),
  );
  // The places of the largest bound are on screen from the start, as rings.
  const rings = cells
    .flat(2)
    .map((cell) => circle(22, { stroke: 'dim', fill: null, width: 2 }).at(...cell.point()));
  const first = balls[0][0].slice(0, SENDS.attempts);
  const square = balls[0]
    .slice(0, SENDS.attempts)
    .map((cellRow) => cellRow.slice(0, SENDS.attempts));
  const oneLayer = place(note('inner layer: 3 attempts'), sections[0][0], 'left');
  const outerNames = strips[0]
    .slice(0, SENDS.attempts)
    .map(([side], index) => place(note(`outer ${index + 1}`), side, 'left'));
  const stripFrames = square.map((strip) => {
    const bounds = boxOf(strip);
    return rect(bounds.width + 20, 64, {
      radius: 10,
      stroke: 'dim',
      fill: null,
      width: 2,
    }).moveTo(bounds.point());
  });
  const copies = square
    .slice(1)
    .flat()
    .map((ball, index) => {
      const destination = [...ball.center];
      ball.moveTo(first[index % SENDS.attempts].center);
      return { ball, destination };
    });
  const outerHeads = sections.map(([head], index) =>
    place(note(`outer attempt ${index + 1}`), head, 'left'),
  );
  const middleNames = strips.flatMap((block) =>
    block.map(([side], index) => place(note(`middle ${index + 1}`), side, 'left')),
  );
  const deepFrames = sections.map(([, body]) =>
    rect(body.width + 16, body.height + 16, {
      radius: 12,
      stroke: 'dim',
      fill: null,
      width: 2,
    }).moveTo(body.point()),
  );
  const everyBall = balls.flat(2);
  const cube = everyBall.filter((ball) => !square.flat().includes(ball));
  const counts = [
    display(`${SENDS.attempts} sends`, { font: 'mono' }),
    display(`${SENDS.attempts} × ${SENDS.attempts} = ${SENDS.attempts ** SENDS.layers} sends`, {
      font: 'mono',
      color: COLOR.mark,
    }),
    display(`${perLayer} × ${perLayer} × ${perLayer} = ${perLayer ** SENDS.deep} sends`, {
      font: 'mono',
      color: COLOR.mark,
    }),
  ].map((count) => place(count, readBand));
  const bounds = place(label('possible bound'), footBand);
  const owner = balls[0][0];
  const ownerBox = boxOf(owner).grow('tight');
  const ownerFrame = rect(ownerBox.width, ownerBox.height, {
    radius: 40,
    stroke: COLOR.mark,
    fill: null,
    width: 3,
    dash: [10, 8],
  }).moveTo(ownerBox.point());
  const reask = place(
    chip('possible bound · a re-ask needs admission', {
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
    footBand,
  );

  // Part 2. A prompt is a bar: the fixed prefix, and the history that each turn adds.
  const [promptBand, runBand] = area.rows([5, 2], 'wide');
  const [names, plot] = promptBand.columns([1, 8], 'normal');
  const [runName, runPlot] = runBand.columns([1, 8], 'normal');
  const scale = (plot.width * 0.9) / total;
  const lanes = plot.rows(TOKENS.turns, 'tight');
  const HIGH = 60;
  const turns = prompts.map((size, turn) => {
    const lane = lanes[turn];
    const prefix = bar(TOKENS.prefix * scale, HIGH, 'dim').moveTo([
      plot.left + (TOKENS.prefix * scale) / 2,
      lane.cy,
    ]);
    const history = Array.from({ length: turn }, (_, block) =>
      bar(TOKENS.added * scale - 3, HIGH, COLOR.attempt).moveTo([
        plot.left + (TOKENS.prefix + (block + 0.5) * TOKENS.added) * scale,
        lane.cy,
      ]),
    );
    const parts = [prefix, ...history];
    return {
      name: place(label(`turn ${turn + 1}`), names.rows(TOKENS.turns, 'tight')[turn], 'left'),
      parts,
      size: beside(mono(String(size)), parts, 'right', 'normal'),
      // The copy that goes down to the bar of the run, at the place where its turn ends.
      copy: bar(size * scale, HIGH, COLOR.attempt, 0.75).moveTo([
        plot.left + (size * scale) / 2,
        lane.cy,
      ]),
      end: [
        runPlot.left +
          (prompts.slice(0, turn).reduce((sum, other) => sum + other, 0) + size / 2) * scale,
        runPlot.cy,
      ],
    };
  });
  const runLabel = place(label('the run'), runName, 'left');
  const runFrame = rect(total * scale + 12, HIGH + 12, {
    radius: 12,
    stroke: 'dim',
    fill: null,
    width: 2.5,
    dash: [10, 8],
  }).moveTo([runPlot.left + (total * scale) / 2, runPlot.cy]);
  const sum = beside(
    display(String(total), { font: 'mono', color: COLOR.mark }),
    runFrame,
    'right',
    'normal',
  );
  const sumUnit = beside(note('input tokens'), sum, 'under', 'none');
  // The limit of one request, at the right of the longest prompt, and what the bars are made of.
  const limitX = plot.left + (prompts.at(-1) + 2 * TOKENS.added) * scale;
  const limit = line([limitX, plot.top], [limitX, plot.bottom], {
    stroke: 'ink',
    width: 3,
    dash: [10, 8],
  });
  const side = plot.beside([limitX, plot.cy], 'right', 'wide');
  const limitName = place(note('context window: the limit of one request'), side, 'top left');
  const legend = [
    row([bar(40, 28, 'dim'), note(`prefix h = ${TOKENS.prefix}`)], { gap: 'tight' }),
    row(
      [
        bar(40, 28, COLOR.attempt),
        note(`added per turn s = ${TOKENS.added}`, { color: COLOR.attempt }),
      ],
      { gap: 'tight' },
    ),
  ];
  const general = tex('n\\,h + s\\,\\frac{n\\,(n-1)}{2}', { size: 60 });
  const turnsLabel = note(`n = ${TOKENS.turns} turns`);
  const apart = row([
    chip('outputs', { color: 'dim', stroke: 'dim', dash: [10, 8] }),
    chip('cache pricing', { color: 'dim', stroke: 'dim', dash: [10, 8] }),
    note('counted apart'),
  ]);
  place(
    column([legend[0], legend[1], turnsLabel, general, apart], { gap: 'normal' }),
    side.beside(limitName, 'under', 'normal'),
    'left',
  );

  // Part 3. The balance of the run, and a request that reserves before it goes.
  const [requestBand, balanceBand, rulesBand] = area.rows([2, 2, 3], 'normal');
  const [, requestPlot] = requestBand.columns([1, 6], 'normal');
  const [balanceName, balancePlot] = balanceBand.columns([1, 6], 'normal');
  const unit = (balancePlot.width * 0.8) / (RESERVE.input + RESERVE.output);
  const left = bar(RESERVE.left * unit, 84, COLOR.sure, 0.3).moveTo([
    balancePlot.left + (RESERVE.left * unit) / 2,
    balancePlot.cy,
  ]);
  const leftEdge = rect(RESERVE.left * unit, 84, {
    radius: 8,
    stroke: COLOR.sure,
    fill: null,
    width: 3,
  }).moveTo(left.center);
  const leftName = place(
    column([label('left'), mono(String(RESERVE.left), { color: COLOR.sure })], { gap: 'none' }),
    balanceName,
    'left',
  );
  const segment = (from, size, words, opacity) => {
    const body = bar(size * unit, 84, COLOR.attempt, opacity).moveTo([
      requestPlot.left + (from + size / 2) * unit,
      requestPlot.bottom - 42,
    ]);
    return [body, beside(mono(words, { size: 34, color: COLOR.attempt }), body, 'above', 'tight')];
  };
  const request = [
    segment(0, RESERVE.input, `${RESERVE.input} input`, 0.95),
    segment(RESERVE.input, RESERVE.output, `${RESERVE.output} output`, 0.6),
  ];
  const requestName = place(
    label('request'),
    requestBand.columns([1, 6], 'normal')[0],
    'bottom left',
  );
  const edgeX = balancePlot.left + RESERVE.left * unit;
  const edge = line([edgeX, balancePlot.cy + 60], [edgeX, requestPlot.bottom - 88], {
    stroke: COLOR.fail,
    width: 4,
    dash: [8, 8],
  });
  const over = rect((RESERVE.input + RESERVE.output - RESERVE.left) * unit, 84, {
    radius: 8,
    stroke: COLOR.fail,
    fill: null,
    width: 4,
  }).moveTo([
    edgeX + ((RESERVE.input + RESERVE.output - RESERVE.left) * unit) / 2,
    requestPlot.bottom - 42,
  ]);
  const refused = beside(
    chip('refused', { color: COLOR.fail, stroke: COLOR.fail }),
    over,
    'right',
    'normal',
  );
  const reserveFirst = place(
    note('reserve before the send, and settle the real use after it'),
    balancePlot,
    'bottom left',
  );
  const lock = beside(
    pictogram('lock', { size: 64, color: COLOR.mark, accent: COLOR.mark }),
    leftEdge,
    'right',
    'normal',
  );
  // Two workers compete for one balance in this illustrative reservation case.
  const reserved = s.value(0);
  const workerSize = (RESERVE.left * 2) / 3;
  assertEqual(
    [workerSize, RESERVE.left - workerSize],
    [100, 50],
    'one reservation leaves too little for its peer',
  );
  const [workerA, workerB] = rulesBand.columns(2, 'loose');
  const workerNames = [
    place(label('worker A'), workerA, 'top left'),
    place(label('worker B'), workerB, 'top left'),
  ];
  const requestA = beside(
    bar(workerSize * unit, 64, COLOR.attempt),
    workerNames[0],
    'under',
    'normal',
    'left',
  );
  const promptFrame = beside(
    rect(workerSize * unit, 64, { stroke: 'dim', fill: null, width: 2, dash: [10, 8] }),
    workerNames[1],
    'under',
    'normal',
    'left',
  );
  const future = s.value(1);
  const requestB = dynamic(() =>
    rect(workerSize * unit * future.value, 64, {
      radius: 8,
      fill: COLOR.attempt,
      stroke: null,
    }).moveTo([
      boxOf(promptFrame).left + (workerSize * unit * future.value) / 2,
      promptFrame.center[1],
    ]),
  );
  const balanceWords = mono('available: 150', { size: 34, color: COLOR.sure });
  beside(balanceWords, leftEdge, 'above', 'normal', 'left');
  const available = dynamic(() =>
    mono('available: ' + Math.round(RESERVE.left - reserved.value), { size: 34, color: COLOR.sure })
      .moveTo(balanceWords.center)
      .alignTo(balanceWords, 'left'),
  );
  const reserveAt = [balancePlot.left + (workerSize * unit) / 2, balancePlot.cy];
  const reservedName = beside(
    note('reserved', { color: COLOR.mark }),
    leftEdge,
    'under',
    'normal',
    'left',
  );
  const blocked = beside(
    chip('earlier reservation refused', { color: COLOR.fail, stroke: COLOR.fail }),
    promptFrame,
    'under',
    'normal',
    'left',
  );
  const unknownUse = note('usage unknown: keep the reservation', { color: COLOR.mark })
    .moveTo(reservedName.center)
    .alignTo(reservedName, 'left');
  const timeout = beside(
    chip('timeout', { color: COLOR.fail, stroke: COLOR.fail }),
    workerNames[0],
    'right',
    'normal',
  );
  const compact = beside(
    note('next prompt: less input, no refund'),
    blocked,
    'under',
    'normal',
    'left',
  );
  const cancel = beside(
    note('local cancel · remote use unverified', { color: COLOR.fail }),
    requestA,
    'under',
    'normal',
    'left',
  );

  s.add(heading(c.title), rings, first, counts[0], bounds, oneLayer);

  // Part 1: three sends, then a layer over them, then three layers of four.
  c.on('three-attempts', () =>
    s.play(
      lagged(
        first.map((ball) => indicate(ball, { scale: 1.2 })),
        { lag: 0.6 },
      ),
    ),
  );
  c.hide('two-layers', counts[0]);
  c.show('two-layers', [outerNames, stripFrames]);
  c.on('two-layers', () =>
    s.play(
      lagged(
        copies.map(({ ball, destination }) =>
          seq(appear(ball), moveTo(ball, destination, { duration: 0.6 })),
        ),
        { lag: 0.3 },
      ),
    ),
  );
  c.show('retry-layers', counts[1], { after: true });
  const deep = c.cue('retry-cube').start - c.cue('three-layers').start;
  c.hide('three-layers', [oneLayer, outerNames, stripFrames], { lead: -1.2, fade: 0.15 });
  c.show('three-layers', [outerHeads, middleNames, deepFrames], { lead: -1.4 });
  c.hide('three-layers', counts[1], { lead: -1.2, fade: 0.15 });
  c.on(
    'three-layers',
    () =>
      s.play(
        lagged(
          cube.map((ball) => fadeIn(ball, { duration: 0.3, scale: 0.4 })),
          { lag: 0.3, duration: deep - 1.4 },
        ),
      ),
    1.4,
  );
  c.show('retry-cube', counts[2], { after: true });
  c.on('possible-bounds', () =>
    s.play(...everyBall.map((ball) => fade(ball, 0.35, { duration: 0.6 }))),
  );
  c.show('one-owner', ownerFrame);
  c.on('one-owner', () => s.play(...owner.map((ball) => fade(ball, 1, { duration: 0.4 }))));
  c.swap('re-ask', bounds, reask);

  // Part 2: the prompts grow, and the run pays for all of them.
  const second = [...turns.map((turn) => turn.name), limit, limitName];
  c.onBeat(1, () =>
    s.play(
      vanish([...rings, ...everyBall, counts[2], ownerFrame, reask, outerHeads, middleNames, deepFrames]),
      appear(second),
    ),
  );
  c.on('window-vs-run', () => s.play(indicate(limitName, { color: COLOR.mark, scale: 1 })), 0.8);
  c.show('cumulative', [runLabel, runFrame]);
  c.show('prefix', legend[0]);
  c.show('added', legend[1]);
  const said = c.cue('token-prompts');
  turns.forEach((turn, index) =>
    s.at(said.start + 1.3 + index * ((said.end - said.start - 1.3) / TOKENS.turns), () =>
      s.play(
        ...turn.parts.map((part) =>
          grow(part, { from: [plot.left, part.center[1]], duration: 0.5 }),
        ),
        fadeIn(turn.size, { duration: 0.3 }),
      ),
    ),
  );
  c.hide(
    'token-total',
    turns.map((turn) => turn.size),
    { lead: 0.3, fade: 0.15 },
  );
  c.on('token-total', () =>
    s.play(
      lagged(
        turns.map((turn) => seq(appear(turn.copy), moveTo(turn.copy, turn.end, { duration: 0.7 }))),
        { lag: 0.4 },
      ),
    ),
  );
  c.show(
    'token-total',
    turns.map((turn) => turn.size),
    { lead: -2.1, fade: 0.2 },
  );
  c.show('token-total', [sum, sumUnit], { after: true });
  c.show('formula', [turnsLabel, general]);
  c.on('formula', () =>
    s.play(...turns.map((turn) => indicate(turn.parts[0], { color: 'ink', scale: 1 }))),
  );
  c.on('history-blocks', () =>
    s.play(
      lagged(
        turns.flatMap((turn) =>
          turn.parts.slice(1).map((block) => indicate(block, { color: COLOR.mark, scale: 1 })),
        ),
        { lag: 0.3 },
      ),
    ),
  );
  c.show('separate-accounting', apart);

  // Part 3: a reservation that is longer than the balance does not go.
  const third = [left, leftEdge, leftName, reserveFirst];
  c.onBeat(2, () =>
    s.play(
      vanish([
        ...second,
        runLabel,
        runFrame,
        ...legend,
        turnsLabel,
        general,
        apart,
        sum,
        sumUnit,
        ...turns.flatMap((turn) => [...turn.parts, turn.size, turn.copy]),
      ]),
      appear(third),
    ),
  );
  c.on('reserve-first', () => s.play(indicate(reserveFirst, { color: COLOR.mark, scale: 1 })), 0.8);
  c.show('request-size', [requestName, request[0]]);
  c.show('request-size', request[1], { lead: -2 });
  c.on('reserve-total', () => s.play(fadeIn(edge, { duration: 0.4 })));
  c.show('reserve-total', [over, refused], { after: true });
  c.swap(
    'parallel',
    [requestName, ...request.flat(), edge, over, refused, reserveFirst, leftName],
    [workerNames, promptFrame, requestB, available, lock],
    { lead: -1.2 },
  );
  c.on(
    'parallel',
    () =>
      s.play(
        seq(
          appear(requestA),
          moveTo(requestA, reserveAt, { duration: 0.9 }),
          reserved.to(workerSize, { duration: 0.05 }),
        ),
      ),
    1.8,
  );
  c.show('parallel', [reservedName, blocked], { after: true });
  c.show('ambiguous', timeout);
  c.swap('ambiguous', reservedName, unknownUse, { after: true });
  c.on(
    'ambiguous',
    () => s.play(to(requestA, () => requestA.fill(COLOR.mark), { duration: 0.3 })),
    0.5,
  );
  c.on('compaction', () => s.play(future.to(0.5, { duration: 0.9 })));
  c.show('compaction', compact, { after: true });
  c.show('cancel', cancel);
  c.on('cancel', () => s.play(indicate(requestA, { color: COLOR.mark, scale: 1 })), 0.5);
}
