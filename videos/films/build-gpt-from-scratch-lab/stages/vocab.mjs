import { spoken } from '../construction.mjs';
import { prompt, tile } from '../prompt.mjs';

export function drawVocab(ctx, scene, state, api) {
  const { C } = api;
  const encode = spoken(state, 'lookup-row', 0);
  const decode = spoken(state, 'inverse-row', 1);
  const active = prompt[2];
  api.text(ctx, 'Sorted Shakespeare vocabulary', 160, 275, 36, C.muted);
  api.text(ctx, 'Piece', 290, 405, 33, C.muted, 'center');
  api.text(ctx, 'GPT-2 ID', 795, 405, 33, C.muted, 'center');
  api.text(ctx, 'Checkpoint row', 1455, 405, 33, C.muted, 'center');
  api.focus.target('comma-row', () => {
    tile(ctx, api, active.piece, 290, 475, C.cyan, 300);
    tile(ctx, api, active.original, 795, 475, C.blue, 315);
    tile(ctx, api, encode === 1 ? active.local : '?', 1455, 475, C.yellow, 330);
    api.line(ctx, 970, 530, 1266, 530, C.muted, 3);
    api.circle(ctx, 970 + 296 * encode * (1 - decode), 530, 11, decode > 0 ? C.cyan : C.yellow);
  });
  api.focus.target('vocabulary-size', () => {
    const width = 1440;
    api.rect(ctx, 240, 786, width, 39, C.panel, C.muted, 2);
    api.rect(ctx, 240, 786, width * (17485 / 50257), 39, C.blue, undefined, 0);
    api.text(ctx, '17,485 active rows', 240, 893, 38, C.blue);
    api.text(ctx, '50,257 GPT-2 IDs', 1680, 893, 38, C.muted, 'right');
  });
  api.text(
    ctx,
    decode === 1 ? 'local 2 → GPT-2 11 → comma' : 'Each retained piece has one saved row number.',
    960,
    680,
    38,
    decode === 1 ? C.cyan : C.ink,
    'center',
  );
}
export default { id: 'vocab', draw: drawVocab, cues: ['lookup-row', 'inverse-row', 'active-rows'] };
