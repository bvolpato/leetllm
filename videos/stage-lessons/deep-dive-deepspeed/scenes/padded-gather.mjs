import { gatherBoard } from '../gather-board.mjs';

export default function padded(s, c) {
  const board = gatherBoard(s, c, [5, 7]);
  c.on('fifth', () => board.message.set(1));
  c.after('divide', () => {
    board.shardWidth.set(board.width);
    board.message.set(2);
  });
  c.on('deal', () => {
    board.message.set(3);
    s.play(board.dealt.to(board.size, { duration: 2.5, ease: (t) => t }));
  });
  c.after('resident', () => {
    board.resident.set(board.model.resident);
    board.message.set(4);
  });
  c.after('reserve', () => {
    board.aLive.set(1);
    board.message.set(5);
  });
  c.on('copy', () => {
    board.aPairs.set(1);
    board.message.set(6);
  });
  c.on('receive', () => {
    board.message.set(7);
    s.play(board.aPairs.to(board.ranks, { duration: 1.6, ease: (t) => t }));
  });
  c.on('counts', () => board.message.set(8));
  c.after('prefetch', () => {
    board.bLive.set(1);
    board.message.set(9);
    s.play(board.bPairs.to(board.ranks, { duration: 2.1, ease: (t) => t }));
  });
}
