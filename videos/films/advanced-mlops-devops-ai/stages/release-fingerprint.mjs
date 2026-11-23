import { releaseFingerprintFixture } from '../protocols.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawReleaseFingerprint(ctx, scene, state, api) {
  if (paintReleaseFingerprint(ctx, scene, state, api)) return;
}
function paintReleaseFingerprint(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) =>
      releaseSentenceProgress(state, 'release-fingerprint', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('release-fingerprint-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    const f = releaseFingerprintFixture();
    drawReleaseHeading(
      ctx,
      api,
      currentBeat < 2
        ? 'Actual Python five-field JSON · sorted keys and ordinary separator spacing'
        : 'Different payload schemas and serializations have distinct digest domains',
    );
    if (currentBeat < 2) {
      const keys = Object.keys(f.baseline).sort();
      [
        ['Baseline', f.baseline, f.left, themeColors.blue],
        ['Candidate', f.candidate, f.right, themeColors.pink],
      ].forEach(([name, record, hashed, col], j) => {
        const x = 140 + j * 900;
        drawReleaseText(ctx, api, name, x + 365, 355, 36, col, 'center');
        keys.forEach((key, i) => {
          if (currentBeat > 0 || cueProgress(0, 0) > i / 5) {
            drawReleaseText(
              ctx,
              api,
              key.replaceAll('_', ' '),
              x,
              445 + i * 73,
              26,
              themeColors.muted,
            );
            drawReleaseBox(
              ctx,
              api,
              j === 1 && cueProgress(0, 1) === 0 ? f.baseline[key] : record[key],
              x + 250,
              400 + i * 73,
              440,
              62,
              key === 'feature_view' ? col : themeColors.blue,
              27,
            );
          }
        });
        const ready = j === 0 ? resultComplete(1, 0) : resultComplete(1, 1);
        drawReleaseText(
          ctx,
          api,
          ready ? hashed.digest.slice(0, 32) : 'SHA-256 pending',
          x + 365,
          850,
          26,
          ready ? col : themeColors.muted,
          'center',
        );
        if (ready)
          drawReleaseText(ctx, api, hashed.digest.slice(32), x + 365, 900, 26, col, 'center');
      });
      if (resultComplete(1, 2))
        drawReleaseText(
          ctx,
          api,
          '64 hexadecimal characters retained · first 10 are display labels',
          960,
          980,
          29,
          themeColors.yellow,
          'center',
        );
    } else {
      const domains = [
        ['Five-field Python JSON', '89b2794cde… / 7c6edf0ae2…'],
        ['Compact SQLite manifest', 'different schema + separators'],
        ['Feature transform only', 'ce667443… / 660645c4…'],
      ];
      domains.forEach(([name, value], i) => {
        if (cueProgress(2, Math.min(i, 3)) > 0) {
          drawReleaseBox(ctx, api, name, 150, 365 + i * 190, 680, 105, themeColors.blue, 30);
          drawReleaseBox(
            ctx,
            api,
            value,
            1040,
            365 + i * 190,
            700,
            105,
            i === 2 ? themeColors.yellow : themeColors.cyan,
            29,
          );
          drawReleaseArrow(ctx, api, 855, 417 + i * 190, 1010, 417 + i * 190, themeColors.muted);
        }
      });
      drawReleaseFooter(
        ctx,
        api,
        'Equality compares full digests inside one declared serialization contract',
      );
    }
  }
}
export default {
  id: 'release-fingerprint',
  draw: drawReleaseFingerprint,
  cues: [
    'release-fingerprint-b1',
    'release-fingerprint-s0-0',
    'release-fingerprint-s0-1',
    'release-fingerprint-s0-2',
    'release-fingerprint-b2',
    'release-fingerprint-s1-0',
    'release-fingerprint-s1-1',
    'release-fingerprint-s1-2',
    'release-fingerprint-s1-3',
    'release-fingerprint-s1-4',
    'release-fingerprint-b3',
    'release-fingerprint-s2-0',
    'release-fingerprint-s2-1',
    'release-fingerprint-s2-2',
    'release-fingerprint-s2-3',
    'release-fingerprint-s2-4',
  ],
};
