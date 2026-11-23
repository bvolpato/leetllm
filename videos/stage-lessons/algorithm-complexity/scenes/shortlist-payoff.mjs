import { assertEqual, column, dynamic, indicate, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { DOCS, FOOT, NAMES, PICTURE, TERMS, shortlist } from '../parts.mjs';
import { boardRegion, desk, noteBoard, noteId } from '../note-board.mjs';

export default function payoff(s, c) {
  const two = shortlist(2),
    three = shortlist(3),
    four = shortlist(4);
  const [best, second] = two.reference;
  assertEqual(two.winners[0].id, second.id, 'the fixture survives the narrow shortlist');
  assertEqual(
    three.winners.map((d) => d.id).join(),
    [best, second].map((d) => d.id).join(),
    'three candidates recover both reference citations',
  );
  assertEqual(two.hits, 1, 'two candidates recover one reference citation');
  assertEqual(
    four.winners.map((d) => d.id).join(),
    three.winners.map((d) => d.id).join(),
    'a fourth full read retains exactly the same citations',
  );

  const board = noteBoard(s.value(DOCS.length * TERMS.length));
  const [head, ranking, detail] = desk.rows([1, 3.1, 2.3], 'normal');
  const columns = ranking.columns(2, 'wide');
  const live = columns[0].rows(2, 'normal'),
    reference = columns[1].rows(2, 'normal');
  const heads = head.columns(2, 'wide');
  const admitted = s.value(0),
    benchmark = s.value(0),
    climb = s.value(0),
    enter = s.value(0);
  const bracketX = boardRegion.right + 10;
  const gates = dynamic(() => {
    if (!admitted.value) return [];
    const y = board.rows[0].top;
    const bottom =
      board.rows[1].bottom +
      Math.max(0, admitted.value - 2) * (board.rows[2].bottom - board.rows[1].bottom);
    return [
      line([bracketX - 12, y], [bracketX, y], { stroke: 'green', width: 4 }),
      line([bracketX, y], [bracketX, bottom], { stroke: 'green', width: 4 }),
      line([bracketX - 12, bottom], [bracketX, bottom], { stroke: 'green', width: 4 }),
    ];
  });
  const titles = [
    place(label('Live answer', { size: 38 }), heads[0]),
    place(label('Offline top two', { size: 38 }), heads[1]),
  ];
  const slotFrames = (cells, stroke) =>
    cells.map((cell) =>
      rect(cell.width, cell.height, { fill: 'surface', stroke, width: 2 }).moveTo(
        cell.point('center'),
      ),
    );
  const frames = dynamic(() => [
    ...slotFrames(live, 'dim'),
    ...(benchmark.value ? slotFrames(reference, 'blue') : []),
  ]);
  function card(doc, point, color) {
    const idx = DOCS.findIndex((d) => d.id === doc.id);
    return [
      rect(live[0].width - 8, live[0].height - 8, { fill: 'surface', stroke: null }).moveTo(point),
      label(noteId(idx) + '  ' + NAMES[idx], { size: 32, color }).moveTo([point[0], point[1] - 22]),
      mono(doc.refine.toFixed(2), { size: 34, color: 'ink' }).moveTo([point[0], point[1] + 27]),
    ];
  }
  const cards = dynamic(() => {
    const nodes = [];
    if (admitted.value >= 2) {
      if (climb.value === 0) nodes.push(...card(two.winners[1], live[1].point('center'), 'green'));
      nodes.push(
        ...card(
          second,
          [live[0].cx, live[0].cy + climb.value * (live[1].cy - live[0].cy)],
          'green',
        ),
      );
    }
    if (benchmark.value)
      two.reference.forEach((doc, j) =>
        nodes.push(...card(doc, reference[j].point('center'), 'blue')),
      );
    return nodes;
  });
  const sourceRow = DOCS.indexOf(best);
  const marker = dynamic(() => {
    const point = [
      bracketX + enter.value * (live[0].cx - bracketX),
      board.rows[sourceRow].cy + climb.value * (live[0].cy - board.rows[sourceRow].cy),
    ];
    return [
      rect(48, 52, { fill: 'green', stroke: null }).moveTo(point),
      mono(noteId(sourceRow), { color: 'bg', size: 36 }).moveTo(point),
    ];
  });
  const [sent, expects, test] = detail.rows(3, 'tight');
  const cause = place(label('Provider now sends    NEW', { size: 35, color: 'yellow' }), sent);
  const old = place(label('Verifier still expects    OLD', { size: 35, color: 'yellow' }), expects);
  const verify = place(
    label('Check the failed run’s rejection reason', { size: 35, color: 'cyan' }),
    test,
  );
  const readCount = s.value(0);
  const offlineReads = dynamic(() =>
    detail.columns(4, 'tight').flatMap(
      (cell, i) =>
        place(
          column(
            [
              note(noteId(i)),
              mono(i < Math.floor(readCount.value) ? DOCS[i].refine.toFixed(2) : '·', {
                size: 40,
                color: 'blue',
              }),
            ],
            { gap: 'normal' },
          ),
          cell,
        ).nodes,
    ),
  );
  const badge = (words, color = 'ink') => place(label(words, { size: 40, color }), FOOT);
  const search = badge('Which two notes would you send for a closer read?');
  const gate = badge('Read A and B in context. Return two citations.');
  const mismatch = badge('Which query words does C contain?');
  const zero = badge('C and D tie on words. Earlier input wins the tie.');
  const oneHit = badge('Two full reads   ·   one of the reference pair recovered');
  const choice = badge('The shortlist has room for one more note.');
  const table = detail.rows(4, 'tight').map((r) => r.columns([1, 1.3, 1.2, 1.1], 'tight'));
  const headings = ['Shortlist', 'Word scans', 'Full reads', 'Recall@2'].map((name, i) =>
    place(note(name), table[0][i]),
  );
  const receipt = [two, three, four].map((run, i) =>
    [
      run.selected.length,
      run.cheapReads,
      run.refineReads,
      run.hits + ' / ' + run.reference.length,
    ].map((value, j) => place(mono(String(value), { size: 35, color: 'ink' }), table[i + 1][j])),
  );
  const lastRead = four.selected.at(-1);
  const compareFourth = badge(
    'D   ' +
      lastRead.refine.toFixed(2) +
      '     <     A   ' +
      second.refine.toFixed(2) +
      '   at the cutoff',
  );
  s.add(heading(c.title), board.nodes, gates, titles[0], frames, cards, search);
  c.show('shortlist-reference', titles[1]);
  c.on('shortlist-two', () => admitted.set(2));
  c.swap('shortlist-two', search, gate);
  c.show('shortlist-reference', offlineReads);
  c.on('shortlist-reference', () => s.play(readCount.to(DOCS.length), { duration: 2.5 }));
  c.after('shortlist-rank', () => benchmark.set(1));
  c.hide('shortlist-one-hit', offlineReads);
  c.swap('shortlist-one-hit', gate, oneHit);
  c.show('shortlist-cause', cause);
  c.show('shortlist-expected', old);
  c.show('shortlist-verify', verify);
  c.swap('shortlist-match', oneHit, mismatch);
  c.swap('shortlist-zero', mismatch, zero);
  c.swap('shortlist-three', zero, choice);
  c.on('shortlist-three', () => s.play(admitted.to(3), { duration: 1.1 }));
  c.on('shortlist-travel', () => s.add(marker));
  const rise = c.cue('shortlist-climb'),
    cross = c.cue('shortlist-enter'),
    arrive = c.cue('shortlist-first');
  c.on('shortlist-climb', () => s.play(climb.to(1), { duration: cross.start - rise.start }));
  c.on('shortlist-enter', () => s.play(enter.to(1), { duration: arrive.start - cross.start }));
  c.on('shortlist-first', () => {
    s.remove(marker);
    s.add(...card(best, live[0].point('center'), 'green'));
  });
  c.swap('shortlist-payoff', [cause, old, verify], [headings, receipt[0]], { after: true });
  const twoSlots = badge('Return limit   ·   two citations', 'green');
  c.show('shortlist-choice', receipt[1], { after: true });
  c.swap('shortlist-choice', choice, twoSlots, { after: true });
  c.on('shortlist-read-cost', () =>
    s.play(indicate(receipt[1][2], { scale: 1, color: 'yellow' }), { duration: 0.8 }),
  );
  c.on('shortlist-four', () => s.play(admitted.to(4), { duration: 1.1 }));
  c.show('shortlist-four', receipt[2].slice(0, 3), { after: true });
  c.swap('shortlist-four-score', twoSlots, compareFourth, { after: true });
  c.show('shortlist-four-result', receipt[2][3], { after: true });
  c.swap(
    'shortlist-stop',
    compareFourth,
    badge('Stop at three full reads for this question.', 'green'),
    { after: true },
  );
  c.after('shortlist-stop', () =>
    s.play(indicate(receipt[1][2], { scale: 1, color: 'green' }), { duration: 0.9 }),
  );

  const tokens = 200,
    block = 100,
    measured = 5,
    initialRate = 3,
    lowerRate = 2.6;
  const predict = (rate) => (tokens / block) * rate;
  assertEqual(predict(initialRate), 6, 'initial latency prediction in seconds');
  assertEqual(predict(lowerRate), 5.2, 'revised latency prediction in seconds');
  const rate = s.value(initialRate);
  const displayedRate = () => Math.ceil(rate.value * 10 - 1e-8) / 10;
  const [scale, actual, predicted] = PICTURE.inset(45).rows([0.8, 1, 1], 'wide');
  const columnsFor = (band) => band.columns([1, 3.7, 0.8], 'wide');
  const [, ruler] = columnsFor(scale);
  const range = 7;
  function bar(lane, seconds, color) {
    const width = (lane.width * seconds) / range;
    return rect(width, 74, { fill: color, stroke: null }).moveTo([lane.left + width / 2, lane.cy]);
  }
  const scaleNodes = [
    line(ruler.point('left'), ruler.point('right'), { stroke: 'dim', width: 3 }),
    ...Array.from({ length: range + 1 }, (_, i) => {
      const x = ruler.left + (ruler.width * i) / range;
      return [
        line([x, ruler.cy - 10], [x, ruler.cy + 10], { stroke: 'dim', width: 3 }),
        mono(i + ' s', { size: 34, color: 'dim' }).moveTo([x, ruler.cy - 44]),
      ];
    }),
  ];
  const [observedTitle, observedLane, observedTime] = columnsFor(actual);
  const [modelTitle, modelLane, modelTime] = columnsFor(predicted);
  const measuredRow = [
    place(label('Measured'), observedTitle, 'left'),
    bar(observedLane, measured, 'blue'),
    place(mono(measured + ' s', { size: 54 }), observedTime, 'left'),
  ];
  const predictionRow = dynamic(() => {
    const seconds = predict(displayedRate());
    return [
      place(label('Predicted'), modelTitle, 'left'),
      bar(modelLane, seconds, 'yellow'),
      place(
        mono(Number(seconds.toFixed(1)) + ' s', { size: 54, color: 'yellow' }),
        modelTime,
        'left',
      ),
    ];
  });
  const rateLabel = dynamic(() => [
    place(
      mono(displayedRate() + ' seconds per 100 tokens', {
        size: 47,
        color: 'yellow',
      }),
      FOOT,
    ),
  ]);
  c.swapAll('latency-measurement', [
    heading('One request · ' + tokens + ' tokens'),
    scaleNodes,
    measuredRow,
  ]);
  c.show('latency-rate', rateLabel);
  c.show('latency-prediction', predictionRow, { after: true });
  c.on('latency-lower', () => {
    const cue = c.cue('latency-lower');
    s.play(rate.to(lowerRate), { duration: cue.end - cue.start });
  });
}
