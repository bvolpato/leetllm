import { multiTenantConstructionModel } from '../model.mjs';

export function drawPhysicalReferences(ctx, scene, state, api) {
  const s = multiTenantConstructionModel(scene.id, state);
  const { C } = api;
  const colors = { A: C.blue, B: C.pink };
  api.focus.target('reference-map', () => {
    for (const [i, owner] of ['A', 'B'].entries()) {
      const x = i ? 1370 : 550;
      const retired = i ? s.bRetired : s.aRetired;
      api.text(ctx, owner + '  /  ' + (i ? 'Bob' : 'Alice'), x, 277, 49, colors[owner], 'center');
      api.text(
        ctx,
        retired
          ? 'device reads finished'
          : i && s.hostClosed
            ? 'stream closed · read pending'
            : 'active request',
        x,
        337,
        31,
        retired ? C.muted : C.ink,
        'center',
      );
      if (!retired) {
        const suffixX = i ? 1510 : 410;
        api.arrow(ctx, x - 5, 375, suffixX, 530, colors[owner], 6);
        api.arrow(ctx, x + 5, 375, i ? 1025 : 895, 530, colors[owner], 6);
      }
    }
    for (const [i, page] of s.pages.entries()) {
      const x = 140 + i * 550;
      const n = page.readers.length;
      const color = n ? [C.blue, C.cyan, C.pink][i] : C.muted;
      api.rect(ctx, x, 552, 540, 236, C.panel, color, 14);
      api.text(ctx, page.id, x + 270, 635, 58, color, 'center');
      api.text(ctx, page.content, x + 270, 700, 37, n ? C.ink : C.muted, 'center');
      const count = n + (n === 1 ? ' live reference' : ' live references');
      api.text(ctx, count, x + 270, 760, 30, n ? C.ink : C.muted, 'center');
    }
  });
  api.focus.target('reference-counts', () => {
    api.text(
      ctx,
      s.counted ? s.logical + ' live block entries' : 'Count the block entries',
      140,
      890,
      43,
      C.ink,
    );
    api.text(
      ctx,
      s.counted ? s.physical + ' physical pages with readers' : 'Count the pages they reach',
      1778,
      890,
      43,
      C.ink,
      'right',
    );
    const question = [
      'How many distinct pages do the two requests use?',
      s.aRetired
        ? 'After A’s last read, which page can the allocator reclaim?'
        : 'Count each live line once.',
      s.hostClosed
        ? 'The host has closed B’s stream. Can another request overwrite P0?'
        : 'B still holds a reference to P0.',
      s.bRetired
        ? 'The final reference has retired. P0 can return to the free pool.'
        : 'Check the last device reader on P0.',
    ][s.b];
    api.text(ctx, question, 960, 992, 37, C.yellow, 'center');
  });
}
export default {
  id: 'physical-references',
  draw: drawPhysicalReferences,
  cues: [
    'mt-physical-references-b0',
    'mt-physical-references-b1',
    'mt-physical-references-s1-0',
    'mt-physical-references-s1-1',
    'mt-physical-references-b2',
    'mt-physical-references-s2-1',
    'mt-physical-references-b3',
    'mt-physical-references-s3-1',
  ],
};
