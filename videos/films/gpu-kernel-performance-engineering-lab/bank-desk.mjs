import { bankModel, edgeOwnership } from './arithmetic.mjs';
import { chapterText } from './defaults.mjs';

const bankCount = 32;
const edge = edgeOwnership(33, 1, 0);
const inputByLane = edge.pairs.slice().sort((a, b) => a.consumer.thread[0] - b.consumer.thread[0]);
const gridLine = '#3a424e';

export function columnRequests(stride, lanes) {
  const counts = Array(bankCount).fill(0);
  for (let lane = 0; lane < lanes; lane++) counts[(lane * stride) % bankCount]++;
  return counts;
}

export function drawBankDesk(ctx, api, { stride, lanes, rowLanes, detail, caption, tally }) {
  const { C, focus } = api;
  const counts = columnRequests(stride, lanes);
  const allocation = bankModel(stride).sharedBytes;
  chapterText(ctx, api, `Shared stride   ${stride} words per row`, 132, 245, 43, C.ink, 'left');
  chapterText(
    ctx,
    api,
    tally
      ? `32 rows × ${stride} words × 4 B  =  ${allocation.toLocaleString('en-US')} B`
      : 'One warp reading shared column 0',
    1780,
    245,
    32,
    C.muted,
    'right',
  );

  focus.target('bank-addresses', () => {
    chapterText(ctx, api, 'Lane', 205, 335, 29, C.muted);
    chapterText(ctx, api, 'Value', 434, 335, 29, C.muted);
    chapterText(
      ctx,
      api,
      'Shared word addresses  ·  first four of 32 banks',
      1220,
      300,
      28,
      C.muted,
    );
    for (let bank = 0; bank < 4; bank++)
      chapterText(ctx, api, `Bank ${bank}`, 805 + bank * 275, 357, 32, C.ink);
    rowLanes.forEach((lane, row) => {
      const y = 379 + row * 77;
      const address = lane * stride;
      const base = address - (address % bankCount);
      const ink = lane === 1 ? C.yellow : C.cyan;
      chapterText(ctx, api, lane, 205, y + 43, 41, C.ink);
      chapterText(ctx, api, inputByLane[lane].producer.value, 434, y + 43, 44, ink);
      for (let bank = 0; bank < 4; bank++) {
        const x = 805 + bank * 275;
        const word = base + bank;
        const isRequest = word === address && lane < lanes;
        const isPadding = word % stride >= 32;
        api.rect(
          ctx,
          x - 117,
          y,
          234,
          60,
          isRequest ? ink : isPadding ? '#434852' : C.panel,
          isRequest ? ink : gridLine,
          4,
        );
        chapterText(
          ctx,
          api,
          isPadding ? `${word}  ·  pad` : word,
          x,
          y + 43,
          isPadding ? 32 : 42,
          isRequest ? C.bg : C.muted,
        );
      }
    });
  });
  focus.target('bank-rack', () => {
    chapterText(ctx, api, 'Distinct words requested from each bank', 132, 678, 35, C.ink, 'left');
    chapterText(ctx, api, `${lanes} / 32 lanes counted`, 1780, 678, 30, C.muted, 'right');
    for (let bank = 0; bank < bankCount; bank++) {
      const x = 326 + bank * 46.7,
        n = counts[bank];
      api.rect(
        ctx,
        x - 21,
        710,
        42,
        59,
        n ? (n > 1 ? '#623d4c' : '#23505e') : C.panel,
        n ? (n > 1 ? C.pink : C.cyan) : gridLine,
        3,
      );
      if (n) chapterText(ctx, api, n, x, 750, 33, C.ink);
      if (bank < 3 || bank % 4 === 0 || bank === 31)
        chapterText(ctx, api, bank, x, 815, 27, C.muted);
    }
    chapterText(ctx, api, 'Words', 282, 750, 28, C.muted, 'right');
    chapterText(ctx, api, 'Bank', 282, 815, 27, C.muted, 'right');
  });
  focus.target('bank-detail', () => {
    chapterText(ctx, api, detail, 960, 904, 41, C.yellow);
    chapterText(ctx, api, caption, 960, 981, 32, C.ink);
  });
}
