import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawOwnershipAudit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('ownership-audit', state);
  api.focus.target('ownership-audit-construction', () => {
    const original = [1, 2, 3, 4],
      mutated = [2, 2, 3, 4];
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Snapshot caller-owned bytes and metadata',
        'The output is checked separately from unchanged input state',
      );
      drawRow(ctx, api, original, 320, 430, 1280, themeColors.blue);
      const bytes = Array.from(new Uint8Array(new Float32Array(original).buffer));
      drawRow(
        ctx,
        api,
        bytes.map((x) => x.toString(16).padStart(2, '0')),
        220,
        620,
        1480,
        themeColors.cyan,
      );
      drawChapterText(
        ctx,
        api,
        'shape[1,4] · stride[4,1] · offset0 · float32 · CPU · pointer A',
        960,
        840,
        29,
        themeColors.muted,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Logical byte snapshot · unused storage and concurrent/device effects need separate checks',
      );
    } else if (currentBeat === 1) {
      const empty = progress > 0.65;
      drawTitle(
        ctx,
        api,
        empty
          ? 'Empty storage still has object identity'
          : 'Correct output can coexist with mutated caller storage',
        'Supplied ownership witness · candidate behavior must satisfy both obligations',
      );
      drawRow(ctx, api, empty ? ['empty input A'] : original, 320, 430, 1280, themeColors.blue);
      drawRow(
        ctx,
        api,
        empty ? ['returns the same object A'] : mutated,
        320,
        650,
        1280,
        themeColors.pink,
      );
      drawChapterText(
        ctx,
        api,
        empty
          ? 'A is A → reject even with zero element bytes'
          : 'first caller value changed1 →2 → reject',
        960,
        850,
        34,
        themeColors.pink,
        'center',
      );
      drawNote(
        ctx,
        api,
        'A functional promise includes fresh identity and preserved caller inputs',
      );
    } else {
      const matched = at('restore', 2);
      drawTitle(
        ctx,
        api,
        'Two snapshots of the caller’s input',
        'One observation before the call and one after it returns',
      );
      drawChapterText(ctx, api, 'Before', 255, 495, 42, themeColors.blue);
      drawChapterText(ctx, api, 'After', 255, 690, 42, themeColors.cyan);
      drawRow(ctx, api, original.map(String), 550, 440, 1040, themeColors.blue);
      drawRow(ctx, api, original.map(String), 550, 635, 1040, themeColors.cyan);
      if (matched) drawChapterText(ctx, api, 'Caller bytes match at return', 960, 863, 43, themeColors.green, 'center');
      drawNote(ctx, api, 'Exercise concurrent calls on an isolated device worker');
    }
  });
}
export default {
  id: 'ownership-audit',
  draw: drawOwnershipAudit,
  cues: [
    'kg-ownership-audit-voice-0',
    'kg-ownership-audit-voice-1',
    'kg-ownership-audit-mutate',
    'kg-ownership-audit-empty',
    'kg-ownership-audit-voice-2',
    'kg-ownership-audit-restore',
  ],
};
