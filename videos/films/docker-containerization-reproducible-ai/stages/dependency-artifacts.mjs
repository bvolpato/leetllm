import { key } from '../arithmetic.mjs';
import { codeText, focusTarget, line, rectangle, text } from '../defaults.mjs';

// Example byte identities, displayed as prefixes rather than usable pip hash entries.
const allowedHash = key('example wheel A');
const offeredHash = key('example wheel B');

export function drawDependencyArtifacts(ctx, scene, state, api) {
  const { C } = api;
  const after = (k) => state.cues?.['dk-dependency-artifacts-' + k]?.phase === 'after';
  focusTarget(ctx, api, 'dependency-artifacts-construction', () => {
    if (state.beat < 2) {
      codeText(ctx, api, 'Example package · version 1.0', 145, 290, 40);
      const files = ['Wheel A', 'Wheel B', 'Source archive'];
      files.forEach((file, i) => {
        const x = 145 + 563 * i;
        const hash = i < 2 ? [allowedHash, offeredHash][i] : null;
        rectangle(
          ctx,
          api,
          x,
          360,
          501,
          170,
          C.panel,
          i === 1 && after('reject') ? C.pink : C.muted,
        );
        codeText(ctx, api, file, x + 26, 428, 38);
        if (hash && (state.beat > 0 || after('hash')))
          codeText(ctx, api, 'sha256: ' + hash + '…', x + 26, 496, 28, C.cyan, 'left', 'mono');
      });
      if (state.beat > 0 || after('hash')) {
        codeText(ctx, api, 'requirements.txt', 145, 668, 35, C.blue, 'left', 'mono');
        codeText(ctx, api, 'Allowed wheel hash: ' + allowedHash + '…', 680, 668, 35);
      }
      if (state.beat === 0 && after('closure'))
        codeText(
          ctx,
          api,
          'Review hashes for each dependency, including transitive ones.',
          145,
          842,
          32,
          C.muted,
        );
      if (state.beat === 1) {
        line(ctx, api, 145, 736, 1770, 736, C.muted);
        codeText(
          ctx,
          api,
          'pip install --require-hashes -r requirements.txt',
          145,
          819,
          33,
          C.ink,
          'left',
          'mono',
        );
        if (after('unused'))
          codeText(ctx, api, 'uv.lock · unused by this command', 145, 941, 31, C.muted);
        if (after('reject')) codeText(ctx, api, 'Wheel B rejected', 1155, 941, 36, C.pink);
      }
    } else {
      for (const [i, name] of ['Build from source', 'Install wheels only'].entries()) {
        const x = i ? 1020 : 145;
        rectangle(ctx, api, x, 364, 753, 395, C.panel, i ? C.cyan : C.blue);
        codeText(ctx, api, name, x + 32, 445, 40);
        codeText(
          ctx,
          api,
          i ? 'Clean environment needs a download' : 'Approved source archive',
          x + 32,
          562,
          34,
          C.muted,
        );
        codeText(
          ctx,
          api,
          i ? 'No approved wheel for this platform' : 'Compiler + system libraries',
          x + 32,
          678,
          33,
        );
      }
      if (after('wheel')) text(ctx, api, 'Installation stops', 1396, 865, 37, C.pink);
    }
  });
}
export default {
  id: 'dependency-artifacts',
  draw: drawDependencyArtifacts,
  cues: [
    'dk-dependency-artifacts-beat0',
    'dk-dependency-artifacts-hash',
    'dk-dependency-artifacts-closure',
    'dk-dependency-artifacts-beat1',
    'dk-dependency-artifacts-unused',
    'dk-dependency-artifacts-reject',
    'dk-dependency-artifacts-beat2',
    'dk-dependency-artifacts-wheel',
  ],
};
