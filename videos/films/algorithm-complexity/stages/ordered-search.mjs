import { CATALOG } from '../fixtures.mjs';
import { lerp, part, smooth } from '../construction.mjs';
import { binarySnapshot } from '../model.mjs';
import { box, focus, math, text } from '../defaults.mjs';
export function drawOrderedSearch(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = binarySnapshot(state);
    focus(ctx, api, themeColors, 'binary-work', () => {
      text(
        ctx,
        api,
        themeColors,
        s.insertion > 0
          ? 'Insert into the four-note array · one spare slot'
          : 'Sorted catalog · target: issuer-check',
        960,
        270,
        37,
      );
      if (s.insertion === 0) {
        CATALOG.forEach((id, i) => {
          const last = s.row,
            eligible =
              !last || last.found ? !last || i === last.mid : i >= last.nextLo && i < last.nextHi;
          box(
            ctx,
            api,
            themeColors,
            id,
            180 + (i % 4) * 410,
            370 + Math.floor(i / 4) * 200,
            370,
            100,
            last?.mid === i ? themeColors.yellow : eligible ? themeColors.blue : themeColors.muted,
            29,
          );
          text(
            ctx,
            api,
            themeColors,
            i,
            365 + (i % 4) * 410,
            510 + Math.floor(i / 4) * 200,
            29,
            themeColors.muted,
          );
        });
        text(
          ctx,
          api,
          themeColors,
          s.completed + (s.completed === 1 ? ' midpoint check' : ' midpoint checks'),
          960,
          825,
          42,
          themeColors.yellow,
        );
      } else {
        const original = ['ci-clock', 'issuer-check', 'release-guide', 'token-fixture'],
          moves = ['token-fixture', 'release-guide', 'issuer-check'];
        text(
          ctx,
          api,
          themeColors,
          'Retained lookup: issuer-check found in 3 checks',
          960,
          335,
          30,
          themeColors.muted,
        );
        original.forEach((id, i) => {
          const step = moves.indexOf(id),
            p = step < 0 ? 0 : smooth(part(s.insertion * 4, step, step + 0.8));
          box(ctx, api, themeColors, id, 170 + (i + p) * 340, 520, 315, 100, themeColors.blue, 28);
        });
        const insert = smooth(part(s.insertion, 0.75, 1));
        box(
          ctx,
          api,
          themeColors,
          'Issuer setup guide',
          510,
          lerp(760, 520, insert),
          315,
          100,
          themeColors.green,
          29,
        );
        text(
          ctx,
          api,
          themeColors,
          Math.min(3, Math.floor(s.insertion * 4)) + ' later references shifted',
          960,
          945,
          36,
          themeColors.yellow,
        );
      }
    });
    focus(ctx, api, themeColors, 'binary-bound', () =>
      math(
        ctx,
        api,
        themeColors,
        s.bound > 0
          ? String.raw`T_{\mathrm{lookup}}=O(\log n),\qquad T_{\mathrm{insert}}=O(n)`
          : String.raw`n\;\longrightarrow\;n/2\;\longrightarrow\;n/4\;\longrightarrow\;\cdots`,
        960,
        s.insertion > 0 ? 420 : 945,
        42,
        themeColors.cyan,
      ),
    );
  }
}
export default {
  id: 'ordered-search',
  draw: drawOrderedSearch,
  cues: ['binary-first', 'binary-rest', 'binary-bound', 'binary-insert'],
};
