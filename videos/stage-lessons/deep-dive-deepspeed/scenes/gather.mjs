import { gatherBoard } from '../gather-board.mjs';

export default function gather(s, c) {
  const board = gatherBoard(s, c, [8, 8, 8, 8]);
  c.on('local', () => board.message.set(1));
  c.on('ask', () => board.message.set(2));
  c.after('reserve', () => {
    board.aLive.set(1);
    board.message.set(3);
  });
  c.on('copy', () => {
    board.aPairs.set(1);
    board.message.set(4);
  });
  c.on('receive', () => {
    board.message.set(5);
    s.play(board.aPairs.to(board.ranks, { duration: 2.1, ease: (t) => t }));
  });
  c.on('prefetch', () => {
    board.bLive.set(1);
    board.message.set(6);
    s.play(board.bPairs.to(board.ranks, { duration: 2.4, ease: (t) => t }));
  });
  c.after('release', () => {
    board.aLive.set(0);
    board.message.set(7);
  });
}
