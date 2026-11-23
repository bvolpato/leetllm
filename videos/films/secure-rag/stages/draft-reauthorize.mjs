import { SECURE_SOURCES } from '../fixtures.mjs';
import {
  drawFooter,
  drawHeading,
  drawLine,
  drawRectangle,
  drawSourceRecord,
  drawTag,
  drawText,
} from '../defaults.mjs';
export function drawDraftReauthorize(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-draft-reauthorize-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-draft-reauthorize-mechanism', () => {
    const revoked = currentBeat > 0 && resultComplete('revoke', 1),
      discarded = currentBeat > 0 && resultComplete('repair', 1);
    drawHeading(ctx, api, 'Buffered answer and COMPLETE generation context');
    drawSourceRecord(
      ctx,
      api,
      {
        ...SECURE_SOURCES[1],
      },
      170,
      365,
      430,
      discarded ? themeColors.muted : themeColors.blue,
    );
    drawSourceRecord(
      ctx,
      api,
      {
        ...SECURE_SOURCES[2],
        grant: revoked ? null : SECURE_SOURCES[2].grant,
      },
      720,
      365,
      430,
      revoked ? themeColors.pink : themeColors.blue,
    );
    drawRectangle(ctx, api, 1310, 350, 430, 260, themeColors.yellow);
    drawText(
      ctx,
      api,
      discarded ? 'Old draft discarded' : 'Buffered draft',
      1335,
      410,
      29,
      discarded ? themeColors.pink : themeColors.yellow,
    );
    drawText(ctx, api, 'Citation: FAQ only', 1335, 485, 27, themeColors.green);
    if (resultComplete('manifest', 0) || currentBeat > 0) {
      drawLine(ctx, api, 600, 520, 1440, 645, themeColors.blue);
      drawLine(ctx, api, 1040, 520, 1520, 645, revoked ? themeColors.pink : themeColors.blue);
      drawText(ctx, api, 'Manifest: FAQ + key', 1450, 700, 27, themeColors.yellow, 'center');
    }
    if (currentBeat === 1 && resultComplete('deny', 1) && !discarded)
      drawText(
        ctx,
        api,
        'Revoked uncited key blocks WHOLE draft',
        960,
        810,
        34,
        themeColors.pink,
        'center',
      );
    if (discarded) {
      drawSourceRecord(
        ctx,
        api,
        {
          ...SECURE_SOURCES[1],
        },
        170,
        755,
        430,
        themeColors.green,
      );
      drawTag(
        ctx,
        api,
        'New authorized context',
        'Regenerate or refuse',
        720,
        755,
        1020,
        themeColors.green,
      );
    }
    if (currentBeat === 2) {
      const q = Q('buffer', 2);
      drawRectangle(ctx, api, 170, 925, 1560, 60, themeColors.pink);
      drawText(
        ctx,
        api,
        q > 0 ? 'Already delivered bytes cannot be recalled' : 'Whole-answer gate needs buffering',
        950,
        965,
        28,
        themeColors.pink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'A citation edit cannot erase influence from revoked context. Caller must supply a genuinely current authorized-ID set.',
    );
  });
}
export default {
  id: 'draft-reauthorize',
  draw: drawDraftReauthorize,
  cues: [
    'sr-draft-reauthorize-0',
    'sr-draft-reauthorize-manifest',
    'sr-draft-reauthorize-1',
    'sr-draft-reauthorize-revoke',
    'sr-draft-reauthorize-deny',
    'sr-draft-reauthorize-repair',
    'sr-draft-reauthorize-2',
    'sr-draft-reauthorize-buffer',
  ],
};
