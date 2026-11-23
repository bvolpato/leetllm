import { sampleModel } from '../construction.mjs';

export function drawPackedPageContract(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  if (state.beat === 0) {
    focus.target('packed-offsets', () => {
      const lengths = [3, 2];
      const offsets = [0, lengths[0], lengths[0] + lengths[1]];
      const x = (n) => 235 + n * 283;
      label('Packed tokens', 145, 319, 39);
      ['Birds', 'sing', 'softly', 'Rain', 'falls'].forEach((w, i) => {
        const c = i < lengths[0] ? C.blue : C.pink;
        api.rect(ctx, x(i), 420, 276, 120, C.panel, c, 3);
        label(w, x(i) + 138, 500, 42, c, 'center');
      });
      offsets.forEach((n) => {
        api.line(ctx, x(n) - 4, 551, x(n) - 4, 645, C.yellow, 4);
        label(n, x(n) - 4, 710, 53, C.yellow, 'center');
      });
      label('int32 offsets for Q and K', 145, 858, 36);
      label('2 examples  ·  3 offsets  ·  maximum length 3', 145, 952, 37, C.muted);
    });
    return;
  }
  const { b, pages, request: which } = sampleModel(scene.id, state);
  const y = (r) => 392 + r * 150;
  focus.target('page-lookup', () => {
    label('Block table', 155, 310, 40);
    label('Physical cache pages', 1175, 310, 40);
    pages.forEach((page, i) => {
      const c = i === which ? C.yellow : C.muted;
      label('Request ' + (i ? 'B' : 'A') + '  ·  logical page 0', 155, y(i) + 66, 33, c);
      api.rect(ctx, 719, y(i), 130, 100, C.panel, c, 4);
      label(page, 784, y(i) + 69, 49, c, 'center');
    });
    [0, 1, 2].forEach((page) => {
      const selected = page === pages[which];
      const c = selected ? C.cyan : C.muted;
      api.rect(ctx, 1250, y(page), 375, 100, selected ? C.cyan + '26' : C.panel, c, 4);
      label('Page ' + page, 1437, y(page) + 66, 43, c, 'center');
    });
    api.arrow(ctx, 867, y(which) + 50, 1228, y(pages[which]) + 50, C.cyan, 4);
    label(
      b === 1
        ? 'The caller supplies the table and reserves the destination.'
        : 'FA2 cache call   ·   block size divisible by 256   ·   forward only',
      145,
      955,
      35,
      C.muted,
    );
  });
}

export default {
  id: 'packed-page-contract',
  draw: drawPackedPageContract,
  cues: ['page-offsets', 'page-a', 'page-b', 'page-writes'],
};
