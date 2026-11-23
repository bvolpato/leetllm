import { heading } from '../../kit-narrated.mjs';
import { massBoard } from '../cumulative-board.mjs';

export default function apsCrossing(s, c) {
  const board = massBoard(s, { example: 1, count: 4, threshold: true, direct: true });
  s.add(heading(c.title));
  c.take(board.drawing);
  const trace = c.cue('trace');
  c.on('trace', () => board.traceFirstEdge(trace.end - trace.start));
  c.after('one', () => board.crossingOn.set(1));
  c.on('uniform', () => board.reset(0));
  c.on('first-three', () => board.extend(3, 1.1));
  c.after('first-three', () => board.baseOn.set(1));
  c.on('fourth', () => board.extend(4));
  c.after('all-four', () => board.crossingOn.set(1));
  c.on('fresh', () => board.reset(2));
  c.on('sorted', () => {
    board.extend(2, 1.3);
    board.askDirect.set(1);
    board.askCrossing.set(1);
  });
  c.after('equality', () => board.baseOn.set(1));
  c.on('tie', () => board.extend(3));
  c.after('crossed', () => board.crossingOn.set(1));
  c.on('last-label', () => board.extend(4));
}
