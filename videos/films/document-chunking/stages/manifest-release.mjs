import { extendedFrame } from '../construction.mjs';
import { manifestChecksums } from '../model.mjs';
import { extendedArrow, extendedNote, extendedText } from '../defaults.mjs';
export function drawManifestRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('manifest-release', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('manifest-release-operation', () => {
    if (currentBeat === 0) {
      extendedText(
        ctx,
        api,
        'A prior evidence decision precedes metadata filtering',
        960,
        280,
        34,
        themeColors.ink,
        'center',
      );
      const columns = ['text', 'source', 'locator', 'heading', 'checksum', 'prior quality'];
      columns.forEach((label, i) =>
        extendedText(
          ctx,
          api,
          label,
          430 + i * 235,
          420,
          24,
          i === 5 ? themeColors.yellow : themeColors.cyan,
          'center',
        ),
      );
      ['complete rollback', 'deadline fragment'].forEach((label, row) => {
        const y = 540 + row * 220;
        extendedText(ctx, api, label, 140, y + 20, 26, colors[row]);
        for (let i = 0; i < 5; i++) {
          api.rect(ctx, 380 + i * 235, y - 25, 100, 53, colors[row], undefined, 4);
          extendedText(ctx, api, 'present', 430 + i * 235, y + 12, 22, themeColors.bg, 'center');
        }
        extendedText(
          ctx,
          api,
          row ? 'review' : 'ready',
          1605,
          y + 20,
          31,
          row ? themeColors.pink : themeColors.green,
          'center',
        );
      });
      if (begun('manifest-ready'))
        extendedText(
          ctx,
          api,
          'Index complete rule · block fragment',
          960,
          925,
          38,
          themeColors.green,
          'center',
        );
      extendedNote(
        ctx,
        api,
        'The gate checks a prior quality flag; it does not calculate or authenticate answerability.',
      );
    } else if (currentBeat === 1) {
      const changed = begun('manifest-edit');
      const checks = manifestChecksums(),
        hash = changed ? checks.editedHash : checks.originalHash;
      extendedText(ctx, api, 'Chunk text bytes', 960, 310, 34, themeColors.blue, 'center');
      extendedText(
        ctx,
        api,
        changed ? '15 minutes → 20 minutes' : '15 minutes',
        960,
        450,
        44,
        changed ? themeColors.pink : themeColors.blue,
        'center',
      );
      extendedText(
        ctx,
        api,
        hash.slice(0, 32),
        960,
        575,
        31,
        changed ? themeColors.pink : themeColors.blue,
        'center',
      );
      extendedText(
        ctx,
        api,
        hash.slice(32),
        960,
        635,
        31,
        changed ? themeColors.pink : themeColors.blue,
        'center',
      );
      extendedText(
        ctx,
        api,
        'SHA-256 of the complete chunk text',
        960,
        720,
        30,
        themeColors.cyan,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Source ingestion checksum and immutable version stay separate.',
        960,
        825,
        30,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'A checksum is not semantic quality or producer authenticity. Retain source span and splitter configuration.',
      );
    } else {
      const fields = [
        ['source version', 'immutable v3'],
        ['span + splitter', 'chars + config'],
        ['quality decision', 'reviewed against a question'],
        ['trust scope', 'permitted source'],
        ['authorization', 'final expanded context'],
      ];
      fields.forEach(([name, value], i) => {
        const y = 365 + i * 110;
        extendedText(ctx, api, name, 300, y, 30, themeColors.cyan);
        extendedArrow(ctx, api, 720, y - 10, 1000, y - 10, themeColors.muted, 2);
        extendedText(
          ctx,
          api,
          value,
          1110,
          y,
          30,
          i === 3 ? themeColors.yellow : themeColors.green,
        );
      });
      extendedNote(
        ctx,
        api,
        'Quarantined evidence stays blocked. Added retrieval complexity requires measured failures and improvement.',
      );
    }
  });
}
export default {
  id: 'manifest-release',
  draw: drawManifestRelease,
  cues: [
    'manifest-release-0',
    'manifest-ready',
    'manifest-release-1',
    'manifest-edit',
    'manifest-release-2',
  ],
};
