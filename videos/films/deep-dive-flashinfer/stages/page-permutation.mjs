import { cachePicture, tile } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';
import { requests } from '../fixtures.mjs';

export function drawPagePermutation(ctx, scene, state, api) {
  const { C } = api;
  const {
    pages: list,
    page,
    slot,
    sorted,
    diagnosis,
  } = flashinferExtensionFrame('page-permutation', state);
  const fixed = requests[2];
  const selected = fixed.pages.indexOf(page) * 4 + slot;
  const bad = sorted && diagnosis;
  api.focus.target('fi-page-permutation-mechanism', () => {
    api.text(ctx, 'R2  /  physical cache', 130, 269, 40, C.ink);
    cachePicture(ctx, api, {
      pages: fixed.pages,
      pageSize: 4,
      length: 9,
      style: (j) =>
        j === selected ? { color: bad ? C.pink : C.yellow, ink: bad ? C.pink : C.yellow } : {},
    });
    api.text(ctx, 'Page list', 130, 690, 40, C.blue);
    list.forEach((id, i) => {
      const x = 440 + i * 330;
      api.text(ctx, `entry ${i}`, x + 128, 618, 29, C.muted, 'center');
      tile(api, String(id), x, 642, 256, 82, i === 1 ? C.yellow : C.blue);
    });
    const lookup = `Entry 1, slot 1  →  page ${page}, slot ${slot}`;
    api.text(ctx, lookup, 960, 838, 49, bad ? C.pink : C.yellow, 'center');
    api.text(
      ctx,
      state.beat === 2
        ? 'Valid length   4 × (3 − 1) + 1 = 9'
        : bad
          ? 'Empty in the original cache'
          : sorted
            ? ''
            : 'Contains k5',
      960,
      940,
      39,
      bad ? C.pink : C.ink,
      'center',
    );
  });
}
export default {
  id: 'page-permutation',
  draw: drawPagePermutation,
  cues: [
    'fi-page-permutation-sort',
    'fi-page-permutation-wrongpage',
    'fi-page-permutation-repair',
    'pages-length',
  ],
};
