import { rms, warpSectors } from '../arithmetic.mjs';
import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawPublicRefinement(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('public-refinement', state);
  api.focus.target('public-refinement-construction', () => {
    if (currentBeat === 0) {
      const revised = at('packed', 0),
        m = warpSectors(revised ? 1 : 8);
      drawTitle(
        ctx,
        api,
        'Move neighboring loads together',
        'One warp, 32 lanes, four bytes per lane',
      );
      drawChapterText(
        ctx,
        api,
        revised ? 'K2   Contiguous loads' : 'K1   Spaced loads',
        960,
        405,
        33,
        revised ? themeColors.green : themeColors.blue,
        'center',
      );
      drawRow(
        ctx,
        api,
        m.addresses.slice(0, 8).map(String),
        250,
        485,
        1420,
        revised ? themeColors.green : themeColors.blue,
      );
      drawChapterText(
        ctx,
        api,
        'Byte offsets for the first eight lanes',
        960,
        625,
        29,
        themeColors.muted,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        m.sectors.length + ' sectors requested by the warp',
        960,
        745,
        35,
        themeColors.yellow,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'Weighted RMSNorm reference    ' +
          rms([3, 4], [1, 2], 1e-5)
            .outputs.map((v) => v.toFixed(4))
            .join(' / '),
        960,
        840,
        31,
        themeColors.cyan,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Compare both outputs with the reference, then time the completed calls',
      );
    } else if (currentBeat === 1) {
      const ready = progress > 0.5;
      drawTitle(
        ctx,
        api,
        'A consumer waits for its actual producer',
        'Supplied dependency trace · inspect instructions before changing communication',
      );
      drawRow(ctx, api, ['load into r9'], 320, 440, 500, themeColors.blue);
      drawRow(ctx, api, ['use r9'], 1150, 440, 500, ready ? themeColors.green : themeColors.muted);
      api.line(ctx, 850, 476, 1110, 476, themeColors.blue, 4);
      const end = 850 + 260 * Math.min(1, progress * 2);
      api.circle(ctx, end, 476, 9, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        ready ? 'r9 ready → consumer can issue' : 'r9 pending → dependent use waits',
        960,
        665,
        34,
        ready ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawRow(
        ctx,
        api,
        ['shared-memory producer', 'barrier waits for sibling warp'],
        270,
        790,
        1380,
        themeColors.pink,
      );
      drawNote(
        ctx,
        api,
        'Long scoreboard (L1TEX)     ·     Short scoreboard (MIO)     ·     Barrier (warp arrival)',
      );
    } else {
      const retire = at('retire', 2);
      drawTitle(
        ctx,
        api,
        'Freeze the acceptance tuple before private feedback',
        'Keep public repair budget and private acceptance separate',
      );
      drawRow(
        ctx,
        api,
        ['K2', 'dispatch D1', 'reference R1', 'policy P1'],
        240,
        460,
        1440,
        themeColors.blue,
      );
      drawRow(
        ctx,
        api,
        [retire ? 'holdout H1 RETIRED' : 'holdout H1'],
        400,
        680,
        1120,
        retire ? themeColors.pink : themeColors.green,
      );
      if (progress > 0.35)
        drawChapterText(
          ctx,
          api,
          'feedback used to repair → candidate K3',
          960,
          620,
          32,
          themeColors.pink,
          'center',
        );
      if (retire)
        drawChapterText(
          ctx,
          api,
          'K3 requires fresh holdout H2',
          960,
          865,
          35,
          themeColors.green,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Logs are untrusted data · redact tensors and account for repeated-feedback leakage',
      );
    }
  });
}
export default {
  id: 'public-refinement',
  draw: drawPublicRefinement,
  cues: [
    'kg-public-refinement-voice-0',
    'kg-public-refinement-packed',
    'kg-public-refinement-voice-1',
    'kg-public-refinement-voice-2',
    'kg-public-refinement-retire',
  ],
};
