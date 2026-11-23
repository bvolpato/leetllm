import { cachePicture, clauseEnded } from '../cache-picture.mjs';
import { requests } from '../fixtures.mjs';
import { address } from '../model.mjs';

export function drawPages(ctx, scene, state, api) {
  const { C } = api;
  const position = clauseEnded(state, 'pages-eight', 2, 0.08) ? 8 : 5;
  const { page, slot } = address(position);
  const entry = Math.floor(position / 4);
  const answered =
    position === 8 ? clauseEnded(state, 'pages-tail', 2) : clauseEnded(state, 'pages-address', 1);
  api.focus.target('pages-lookup', () => {
    api.text(ctx, 'R2  /  4 slots per page', 130, 269, 40, C.ink);
    const bank = cachePicture(ctx, api, {
      pages: requests[2].pages,
      pageSize: 4,
      length: 9,
      style: (j) => (answered && j === position ? { color: C.yellow, ink: C.yellow } : {}),
    });
    for (let i = 0; i < 12; i++) {
      api.text(ctx, String(i % 4), bank.slot(i) + bank.slotWidth / 2, 558, 26, C.muted, 'center');
    }
    api.text(ctx, 'Page list entry', 140, 680, 36, C.blue);
    api.text(
      ctx,
      `floor(${position} / 4)` + (answered ? `  =  ${entry}` : '  =  ?'),
      500,
      680,
      49,
      C.ink,
    );
    api.text(ctx, 'Slot', 1130, 680, 36, C.blue);
    api.text(
      ctx,
      `${position} mod 4` + (answered ? `  =  ${slot}` : '  =  ?'),
      1290,
      680,
      49,
      C.ink,
    );
    api.text(
      ctx,
      answered
        ? `k${position}  →  page ${page}, slot ${slot}`
        : `Where does R2 keep key ${position}?`,
      960,
      865,
      56,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'pages',
  draw: drawPages,
  cues: ['pages-five', 'pages-address', 'pages-eight', 'pages-tail'],
};
