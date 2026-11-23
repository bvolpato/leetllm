import { assertEqual, graph, lanes, place } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, context } from '../parts.mjs';
import { bufferedFrontier, frontierBoard, traceFrontier } from '../frontier-merge.mjs';

export default function scene(s, c) {
  context(s, c);
  const parents = [
    { path: '/guide', links: ['/shared#intro', '/faq'] },
    { path: '/api', links: ['/shared#ref', '/types'] },
  ];
  const early = traceFrontier(parents, [1, 0]);
  const ordered = bufferedFrontier(parents, [1, 0]);
  assertEqual(early.queue.map((x) => x.path).join(' '), '/faq /shared /types', 'early claim');
  assertEqual(ordered.queue.map((x) => x.path).join(' '), '/shared /faq /types', 'parent order');
  const board = frontierBoard(parents);
  const [guide, api] = board.rows;
  const lost = board.skip(0, 0);
  const duplicate = board.skip(1, 0);
  const apiClaim = place(mono(early.rows[1][0].path, { size: 43, color: 'cyan' }), api.cells[0]);
  const wrong = board.queueTiles(early);
  const right = board.queueTiles(ordered);
  const prompt = place(label('Which page goes at the front?', { color: 'yellow' }), FOOT);
  const firstPass = place(label('Workers claim as their results arrive', { color: 'dim' }), FOOT);
  const replay = place(label('Parent collects raw lists before claiming', { color: 'dim' }), FOOT);
  const missed = place(
    label('Guide lost its first link before the lists were joined.', { color: 'yellow' }),
    FOOT,
  );
  s.add(board.fixed, firstPass);
  c.show('order-api', api.items);
  c.swap('order-api-claims', api.items[0], apiClaim, { after: true });
  c.show('order-guide', guide.items);
  c.swap('order-lost', guide.items[0], lost, { after: true });
  c.swap('order-question', firstPass, prompt);
  c.hide('order-wrong-front', prompt);
  c.after('order-wrong-front', () => board.enqueue(s, wrong[0], 0));
  c.after('order-wrong-middle', () => board.enqueue(s, wrong[1], 1));
  c.after('order-wrong-tail', () => board.enqueue(s, wrong[2], 2));
  c.show('order-wrong-tail', missed, { after: true });

  c.swap('order-rewind', [lost, guide.items[1], apiClaim, api.items[1], wrong, missed], replay);
  c.show('order-buffer-api', api.items);
  c.show('order-buffer-guide', guide.items);
  c.show('order-read-guide', board.cursor);
  c.after('order-first', () => board.enqueue(s, right[0], 0));
  c.after('order-second', () => board.enqueue(s, right[1], 1));
  c.on('order-read-api', () => s.play(board.nextParent()));
  c.swap('order-duplicate', api.items[0], duplicate, { after: true });
  c.after('order-last', () => board.enqueue(s, right[2], 2));

  const timeline = place(
    lanes(
      ['request', 'stop'],
      [
        { lane: 0, start: 0.2, end: 4.6, label: 'fetch', color: 'blue' },
        { lane: 1, at: 2.4, label: 'event set', color: 'yellow', labelSide: 'under' },
        { lane: 0, at: 5.6, label: 'children returned', color: 'cyan' },
      ],
      {
        width: BOARD.width * 0.76,
        domain: [0, 7],
        pitch: 150,
        barHeight: 70,
        size: 38,
        ticks: [],
        cursor: false,
        axisLabel: 'one request',
      },
    ),
    BOARD,
  );
  const withheld = place(
    mono('Children enqueued after stop = 0', { size: 43, color: 'yellow' }),
    FOOT,
  );
  c.swap(
    'stop-request',
    [board.fixed, board.cursor, guide.items, duplicate, api.items[1], right, replay],
    timeline,
  );
  c.on('stop-request', () => s.play(timeline.advance(1.9, { duration: 0.7 })), 0.55);
  c.after('stop-set', () => s.play(timeline.advance(2.8, { duration: 0.45 })));
  c.after('stop-children', () => s.play(timeline.advance(6.5, { duration: 0.55 })));
  c.show('stop-children', withheld, { after: true });

  const outcomes = place(
    graph(
      [
        { id: 'active', label: 'in flight', width: 265, height: 100 },
        { id: 'wait', label: 'retry wait', width: 265, height: 100 },
        { id: 'success', label: 'success', width: 265, height: 100 },
        { id: 'failed', label: 'terminal failure', width: 340, height: 100 },
      ],
      [
        { from: 'active', to: 'wait' },
        { from: 'wait', to: 'active' },
        { from: 'active', to: 'success' },
        { from: 'active', to: 'failed' },
      ],
      {
        fit: true,
        width: BOARD.width * 0.8,
        height: BOARD.height * 0.75,
        labelSize: 40,
        token: 'active',
      },
    ),
    BOARD,
  );
  const attempt = (n) => place(mono('Stop clear    •    attempt ' + n, { size: 40 }), FOOT);
  const first = attempt(1);
  const second = attempt(2);
  c.swap('retry-policy', [timeline, withheld], [outcomes, first]);
  c.after('retry-wait', () => s.play(outcomes.go('wait', { duration: 0.6 })));
  c.after('retry-again', () => s.play(outcomes.go('active', { duration: 0.6 })));
  c.swap('retry-again', first, second, { after: true });
  c.after('retry-finish', () => s.play(outcomes.go('success', { duration: 0.5 })));
}
