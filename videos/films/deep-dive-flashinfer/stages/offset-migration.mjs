import { clauseEnded } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';

export function drawOffsetMigration(ctx, scene, state, api) {
  const { C } = api;
  const { tokens, q, o, qStride, oStride, qReady, oReady } = flashinferExtensionFrame(
    'offset-migration',
    state,
  );
  const wrong =
    clauseEnded(state, 'offset-copy', 1, 0.7) && !clauseEnded(state, 'offset-fix', 2, 0.25);
  const tokenMode = clauseEnded(state, 'offset-tokens', 2, 0.65);
  // Both rulers use the same number of pixels per element.
  const left = 323,
    scale = 1410 / q.at(-1);
  const fmt = (n) => n.toLocaleString('en-US');
  api.focus.target('offset-rulers', () => {
    api.text(ctx, 'cuDNN 0.7.1   /   32 query heads', 130, 267, 38, C.ink);
    for (const [lane, [name, stride, offsets]] of [
      ['Q', qStride, q],
      ['O', oStride, o],
    ].entries()) {
      const y = 455 + lane * 243,
        activeColor = lane ? C.cyan : C.blue;
      api.text(ctx, name, 130, y, 57, activeColor);
      api.text(
        ctx,
        `32 × ${stride / 32} = ${fmt(stride)} elements per token`,
        left,
        y - 81,
        36,
        activeColor,
      );
      for (let boundary = 0; boundary < tokens.at(-1); boundary++) {
        const x = left + boundary * stride * scale;
        api.rect(ctx, x + 2, y - 47, stride * scale - 4, 65, C.panel, activeColor, 3);
        api.text(ctx, String(boundary), x + (stride * scale) / 2, y - 3, 29, C.ink, 'center');
      }
      const show = lane ? oReady : qReady;
      if (show) {
        const offset = lane && wrong ? q[1] : offsets[1];
        const x = left + offset * scale;
        const color = lane && wrong ? C.pink : C.yellow;
        api.line(ctx, x, y + 28, x, y + 53, color, 4);
        const label = tokenMode ? 'token offset 3' : fmt(offset) + ' elements';
        api.text(ctx, label, x, y + 94, 35, color, 'center');
      }
    }
    const answer = tokenMode
      ? `Token boundaries for both tensors   [${tokens.join(', ')}]`
      : wrong
        ? `Copied Q offset lands halfway through O row ${Math.floor(q[1] / oStride)}`
        : oReady
          ? 'Both addresses now point to the start of R1, row 3.'
          : 'R1 begins at row 3. Where does that row begin in O?';
    api.text(ctx, answer, 960, 948, 42, wrong ? C.pink : C.yellow, 'center');
  });
}
export default {
  id: 'offset-migration',
  draw: drawOffsetMigration,
  cues: [
    'fi-offset-migration-qoffset',
    'offset-question',
    'fi-offset-migration-ooffset',
    'offset-copy',
    'offset-fix',
    'offset-tokens',
  ],
};
