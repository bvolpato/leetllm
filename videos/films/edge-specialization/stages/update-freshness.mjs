import { bundle, manifest } from '../fixtures.mjs';
import { hash } from '../construction.mjs';
import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawUpdateFreshness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('update-freshness', state),
    { b: currentBeat, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-update-freshness-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Match the file to its signed manifest'
        : currentBeat === 1
          ? 'Valid signature and acceptable freshness are separate checks'
          : 'Retain storage without loading both full models',
    );
    if (currentBeat === 0) {
      const n = 12;
      for (let i = 0; i < n; i++)
        drawEdgeCard(
          ctx,
          api,
          bundle[i].toString(16).padStart(2, '0'),
          160 + i * 130,
          430,
          110,
          i < Math.floor(progress('bytes') * n) ? themeColors.blue : themeColors.muted,
          85,
        );
      drawEdgeText(ctx, api, 'Signed manifest', 163, 662, 38, themeColors.yellow);
      drawEdgeText(ctx, api, 'Staged file', 163, 804, 38, themeColors.ink);
      drawEdgeText(
        ctx,
        api,
        manifest.length + ' bytes   /   SHA-256 ' + manifest.sha256.slice(0, 24) + '…',
        600,
        662,
        37,
        themeColors.ink,
      );
      if (done('bytes')) {
        const digest = hash(bundle);
        const matches = bundle.length === manifest.length && digest === manifest.sha256;
        drawEdgeText(
          ctx,
          api,
          bundle.length + ' bytes   /   SHA-256 ' + digest.slice(0, 24) + '…',
          600,
          804,
          37,
          matches ? themeColors.green : themeColors.pink,
        );
        drawEdgeText(
          ctx,
          api,
          matches ? 'Length and full digest match' : 'File mismatch',
          960,
          914,
          40,
          matches ? themeColors.green : themeColors.pink,
          'center',
        );
      }
    }
    if (currentBeat === 1) {
      drawEdgeRow(
        ctx,
        api,
        ['candidate', 'signature', 'version ≥ minimum', 'expiry > now'],
        150,
        350,
        1600,
        90,
        themeColors.cyan,
      );
      const cases = [
        ['old', 'valid', 'below minimum', 'future'],
        ['expired', 'valid', 'at minimum', 'at now'],
        ['current', 'valid', 'at minimum', 'future'],
      ];
      cases.forEach((r, i) => {
        drawEdgeRow(
          ctx,
          api,
          r,
          150,
          500 + i * 135,
          1600,
          90,
          done(i === 0 ? 'version' : 'expiry')
            ? i < 2
              ? themeColors.pink
              : themeColors.green
            : themeColors.blue,
        );
      });
      if (done('expiry'))
        drawEdgeText(
          ctx,
          api,
          'Old and expired candidates still fail',
          960,
          975,
          32,
          themeColors.pink,
          'center',
        );
    }
    if (currentBeat === 2) {
      drawEdgeRow(
        ctx,
        api,
        ['storage A: approved', 'storage B: inactive candidate'],
        150,
        370,
        1600,
        110,
        themeColors.blue,
      );
      const clear = done('session');
      drawEdgeCard(
        ctx,
        api,
        clear ? 'new session · incompatible KV cleared' : 'old session KV',
        150,
        620,
        700,
        clear ? themeColors.green : themeColors.yellow,
        120,
      );
      drawEdgeCard(ctx, api, 'one resident model budget', 1050, 620, 700, themeColors.cyan, 120);
      if (done('resident'))
        drawEdgeText(
          ctx,
          api,
          'Two files on storage do not require two full resident models',
          960,
          900,
          32,
          themeColors.yellow,
          'center',
        );
    }
    if (currentBeat === 0) note('First twelve bytes of the update file');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'update-freshness',
  draw: drawUpdateFreshness,
  cues: [
    'edge-update-freshness-op-0',
    'edge-update-freshness-bytes',
    'edge-update-freshness-op-1',
    'edge-update-freshness-version',
    'edge-update-freshness-expiry',
    'edge-update-freshness-op-2',
    'edge-update-freshness-session',
    'edge-update-freshness-resident',
  ],
};
