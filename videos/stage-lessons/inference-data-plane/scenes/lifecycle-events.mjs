// Scene `lifecycle-events`: data movement and request state are different.
//
// The picture: the board, and under it three lanes with the seven events of the request. One
// cursor runs along the lanes. Each event that it passes changes the board: slots are reserved,
// blocks move, bytes arrive, the state turns valid, a token is made, and the token reaches the
// client. Arrived is not ready, and generated is not delivered.
import { between, boxOf, column, fitted, indicate, lanes, place } from 'vizmatic/stage';
import { events } from '../../../films/inference-data-plane/fixtures.mjs';
import { lifecycleSnapshot } from '../../../films/inference-data-plane/construction.mjs';
import { chipRow, heading, note } from '../../kit-narrated.mjs';
import { CELL, COLOR, FIXTURE, FOOT, cellRow, handoff } from '../parts.mjs';

const RECEIPT = lifecycleSnapshot(0, 0);
/** When each event of the model happens on the lanes. The times are a sequence, and not a scale. */
const AT = {
  queued: 4,
  reserved: 16,
  transferring: [22, 50],
  'transfer-complete': 50,
  'decode-ready': 62,
  generated: 74,
  delivered: 88,
};
if (events.join() !== Object.keys(AT).join())
  throw new Error('lifecycle-events: the events of the model changed');

export default function lifecycleEvents(s, c) {
  const { blocks } = FIXTURE;
  const board = handoff(s, { made: blocks });
  const [laneSide, outSide] = FOOT.columns([5, 2], 'wide');

  const flow = place(
    fitted(laneSide, (width) =>
      lanes(
        [
          { name: 'request owner', color: COLOR.control },
          { name: 'transfer engine', color: COLOR.state },
          { name: 'client', color: COLOR.valid },
        ],
        [
          { lane: 0, at: AT.queued, label: 'queued' },
          { lane: 0, at: AT.reserved, label: 'reserved' },
          {
            lane: 1,
            start: AT.transferring[0],
            end: AT.transferring[1],
            label: 'transferring',
            labelSide: 'over',
          },
          { from: 1, to: 0, at: AT['transfer-complete'], label: 'complete' },
          { lane: 0, at: AT['decode-ready'], label: 'ready' },
          { lane: 0, at: AT.generated, label: 'generated', color: COLOR.valid },
          { from: 0, to: 2, at: AT.delivered, label: 'delivered', color: COLOR.valid },
        ],
        { width, size: 30, barHeight: 54, pitch: 92, domain: [0, 100] },
      ),
    ),
    laneSide,
  );

  // The tokens of the decode worker, and the tokens that the client has.
  const made = s.value(0),
    got = s.value(0);
  const output = cellRow(8, () => made.value, {
    width: boxOf(board.dest.panel).width,
    height: CELL,
  });
  const client = cellRow(8, () => got.value, {
    width: boxOf(board.dest.panel).width,
    height: CELL,
  });
  const outputName = note('tokens at decode'),
    clientName = note('tokens at the client');
  place(
    column([output.bed, outputName, client.bed, clientName], { gap: 'tight' }),
    outSide,
    'top right',
  );

  // What a receipt names.
  const mid = between(board.source.panel, board.dest.panel);
  const receiptName = note('each receipt names', { color: COLOR.control });
  const receipt = chipRow([RECEIPT.request, RECEIPT.model, RECEIPT.operation, RECEIPT.buffer], {
    color: COLOR.control,
    stroke: COLOR.control,
  });
  place(
    column([receiptName, receipt], { gap: 'tight', align: 'center' }),
    mid.rows([3, 1], 'none')[1],
  );

  s.add(heading(c.title), board.standing, flow, output.marks, outputName, client.marks, clientName);

  // Beat 0: queued, reserved, moving, arrived, ready. The board follows the cursor.
  const until = (cue, from) => Math.max(0.4, c.cue(cue).end - c.cue(from).start);
  c.on('life-queued', () => s.play(flow.advance(AT.queued, { duration: 1 })));
  c.on('life-reserved', () =>
    s.play(flow.advance(AT.reserved, { duration: 1 }), board.reserved.to(blocks, { duration: 1 })),
  );
  const moving = until('life-complete', 'life-transfer') - 0.8;
  c.on('life-transfer', () =>
    s.play(
      flow.advance(AT.transferring[1], { duration: moving }),
      board.sent.to(blocks, { duration: moving }),
    ),
  );
  c.on(
    'life-complete',
    () => s.play(indicate(board.dest.panel, { scale: 1.02, color: COLOR.state })),
    moving - 0.6,
  );
  c.on('life-ready', () =>
    s.play(flow.advance(AT['decode-ready'], { duration: 1 }), board.valid.to(1, { duration: 1 })),
  );

  // Beat 1: a token is made, and then it is delivered. These are two events.
  c.on('life-generated', () =>
    s.play(flow.advance(AT.generated, { duration: 1 }), made.to(1, { duration: 1 })),
  );
  c.on('life-delivered', () =>
    s.play(flow.advance(AT.delivered, { duration: 1.4 }), got.to(1, { duration: 1.4 })),
  );
  c.on('life-separate', () =>
    s.play(...[3, 5, 6].map((index) => indicate(flow.events[index].text, { color: COLOR.mark }))),
  );

  // Beat 2: a receipt for each transition. The owner keeps the request, and the engine moves data.
  c.show('life-receipt', receiptName);
  c.show('life-identity', receipt);
  c.on('life-owner', () => s.play(indicate(flow.names[0], { color: COLOR.mark })));
  c.on('life-engine', () => s.play(indicate(flow.names[1], { color: COLOR.mark })));
}
