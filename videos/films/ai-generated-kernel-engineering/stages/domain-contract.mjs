import { validEpsilon } from '../arithmetic.mjs';
import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawDomainContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('domain-contract', state);
  api.focus.target('domain-contract-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'A tensor’s logical shape is an input contract',
        'The public domain includes empty outer axes and read-only views',
      );
      const cases = [
          {
            shape: [2, 4],
            stride: [4, 1],
            name: 'ordinary',
            ok: true,
          },
          {
            shape: [0, 4],
            stride: [4, 1],
            name: 'empty outer',
            ok: true,
          },
          {
            shape: [3, 4],
            stride: [0, 1],
            name: 'expanded read-only',
            ok: true,
          },
          {
            shape: [2, 0],
            stride: [1, 1],
            name: 'zero feature width',
            ok: false,
          },
        ],
        r = cases[Math.min(3, Math.floor(progress * 4))];
      drawRow(ctx, api, r.shape, 300, 440, 620, themeColors.blue);
      drawRow(ctx, api, r.stride, 1060, 440, 620, themeColors.cyan);
      drawChapterText(ctx, api, 'shape', 610, 405, 29, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'strides', 1370, 405, 29, themeColors.cyan, 'center');
      drawChapterText(ctx, api, r.name, 960, 650, 35, themeColors.ink, 'center');
      drawChapterText(
        ctx,
        api,
        r.ok ? 'valid public input' : 'invalid public input',
        960,
        805,
        38,
        r.ok ? themeColors.green : themeColors.pink,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Input and feature weights share dtype/device · weight width matches the final axis',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Validate epsilon after conversion to float32',
        'Ordinary Python integer/float values · Boolean excluded',
      );
      const eps = [1e-5, true, 1e-50, Infinity];
      eps.forEach((v, i) => {
        const y = 425 + i * 110;
        drawChapterText(
          ctx,
          api,
          typeof v === 'boolean' ? 'True' : String(v),
          340,
          y + 38,
          31,
          themeColors.blue,
        );
        drawChapterText(ctx, api, '→', 750, y + 38, 32, themeColors.muted);
        drawChapterText(
          ctx,
          api,
          typeof v === 'boolean'
            ? 'Boolean rejected'
            : Number.isFinite(Math.fround(v))
              ? Math.fround(v).toExponential(6)
              : String(Math.fround(v)),
          1120,
          y + 38,
          31,
          themeColors.cyan,
        );
        if (i < Math.ceil(4 * progress))
          drawChapterText(
            ctx,
            api,
            validEpsilon(v) ? 'VALID' : 'REJECT',
            1630,
            y + 38,
            29,
            validEpsilon(v) ? themeColors.green : themeColors.pink,
            'right',
          );
      });
      drawNote(
        ctx,
        api,
        'Tiny positive source epsilon may round to zero · finite and positive must survive conversion',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'A narrow fast path sits inside the valid public domain',
        'Unsupported valid calls keep a verified reference route',
      );
      const cases = [
          ['CUDA contiguous H256', true],
          ['CUDA expanded view', false],
          ['active backward', false],
          ['CPU supported input', false],
        ],
        n = Math.ceil(progress * 4);
      cases.forEach(([name, fast], i) => {
        drawChapterText(ctx, api, name, 250, 445 + i * 115, 31, themeColors.blue);
        drawRow(
          ctx,
          api,
          [i < n ? (fast ? 'FAST' : 'REFERENCE') : '?'],
          1170,
          395 + i * 115,
          510,
          i < n && fast ? themeColors.green : themeColors.yellow,
        );
      });
      drawNote(
        ctx,
        api,
        'Invalid public inputs raise their declared error · other transform support stays explicit',
      );
    }
  });
}
export default {
  id: 'domain-contract',
  draw: drawDomainContract,
  cues: [
    'kg-domain-contract-voice-0',
    'kg-domain-contract-voice-1',
    'kg-domain-contract-epsilon',
    'kg-domain-contract-voice-2',
  ],
};
