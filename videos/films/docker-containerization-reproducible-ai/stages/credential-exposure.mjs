import { codeText, focusTarget, line, rectangle } from '../defaults.mjs';

export function drawCredentialExposure(ctx, scene, state, api) {
  const { C } = api;
  const after = (k) => state.cues?.['dk-credential-exposure-' + k]?.phase === 'after';
  focusTarget(ctx, api, 'credential-exposure-construction', () => {
    if (state.beat === 0) {
      codeText(ctx, api, 'Stored layers', 145, 310, 41, C.blue);
      codeText(ctx, api, 'Visible directory', 1110, 310, 41, C.cyan);
      const deleted = after('delete');
      rectangle(ctx, api, 145, 660, 744, 157, C.panel, C.blue);
      codeText(ctx, api, 'Layer 1', 176, 721, 30, C.muted);
      if (after('write'))
        codeText(ctx, api, 'debug.txt     SAMPLE', 176, 782, 35, C.ink, 'left', 'mono');
      if (deleted) {
        rectangle(ctx, api, 145, 487, 744, 151, C.panel, C.blue);
        codeText(ctx, api, 'Layer 2', 176, 545, 30, C.muted);
        codeText(ctx, api, 'deletion of debug.txt', 176, 603, 34);
      }
      rectangle(ctx, api, 1108, 487, 651, 330, C.panel, C.cyan);
      codeText(ctx, api, '/app/', 1140, 564, 40, C.cyan, 'left', 'mono');
      if (after('write'))
        codeText(
          ctx,
          api,
          deleted ? 'no debug.txt entry' : 'debug.txt     SAMPLE',
          1140,
          691,
          33,
          deleted ? C.muted : C.ink,
          'left',
          'mono',
        );
      if (after('layer')) codeText(ctx, api, 'SAMPLE remains in Layer 1', 145, 911, 36, C.yellow);
      if (after('arg'))
        codeText(
          ctx,
          api,
          'Build arguments can also appear in history or provenance.',
          145,
          992,
          29,
          C.muted,
        );
    } else if (state.beat === 1) {
      codeText(ctx, api, 'One private-package install', 145, 304, 40);
      const paths = [
        ['Input during RUN', 'temporary secret file'],
        ['Intended output', 'installed package'],
        ['Other output to inspect', 'logs and debug files'],
      ];
      paths.forEach(([heading, value], i) => {
        const y = 482 + i * 155;
        line(ctx, api, 146, y + 46, 1770, y + 46, C.muted);
        codeText(ctx, api, heading, 147, y, 37, C.muted);
        if (i < 2 || after('leak'))
          codeText(ctx, api, value, 967, y, 39, i === 2 ? C.yellow : C.ink);
      });
      if (after('required'))
        codeText(
          ctx,
          api,
          'required=true checks delivery when the instruction executes',
          145,
          981,
          33,
          C.cyan,
        );
    } else {
      rectangle(ctx, api, 145, 451, 746, 295, C.panel, C.blue);
      codeText(ctx, api, 'Host file', 178, 523, 41, C.blue);
      codeText(ctx, api, 'secrets/access_api_key.txt', 178, 625, 31, C.ink, 'left', 'mono');
      rectangle(ctx, api, 1060, 451, 711, 295, C.panel, C.cyan);
      codeText(ctx, api, 'Future API client', 1093, 523, 41, C.cyan);
      codeText(ctx, api, '/run/secrets/access_api_key', 1093, 625, 31, C.ink, 'left', 'mono');
      api.arrow(ctx, 917, 596, 1034, 596, C.cyan, 4);
      if (after('host'))
        codeText(ctx, api, 'Host storage and file permissions still apply.', 145, 897, 36);
    }
  });
}
export default {
  id: 'credential-exposure',
  draw: drawCredentialExposure,
  cues: [
    'dk-credential-exposure-beat0',
    'dk-credential-exposure-write',
    'dk-credential-exposure-delete',
    'dk-credential-exposure-layer',
    'dk-credential-exposure-arg',
    'dk-credential-exposure-beat1',
    'dk-credential-exposure-leak',
    'dk-credential-exposure-required',
    'dk-credential-exposure-beat2',
    'dk-credential-exposure-host',
  ],
};
