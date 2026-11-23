import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawReferences(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('references', state),
    currentBeat = modelState.b;
  {
    api.focus.target('references-owner-metadata', () => {
      text(ctx, api, 'REFERENCE METADATA', 960, 250, 26, themeColors.muted, 'center');
      card(
        ctx,
        api,
        modelState.ownerLost ? 'Driver · owner process lost' : 'Driver · owner metadata',
        210,
        285,
        600,
        modelState.ownerLost ? themeColors.muted : themeColors.yellow,
        100,
      );
      card(
        ctx,
        api,
        modelState.ownerLost ? 'ObjectRef A · metadata unavailable' : 'ObjectRef A · handle',
        1110,
        285,
        600,
        modelState.ownerLost ? themeColors.muted : themeColors.yellow,
        100,
      );
      api.arrow(
        ctx,
        810,
        335,
        1110,
        335,
        modelState.ownerLost ? themeColors.muted : themeColors.yellow,
        4,
      );
      text(
        ctx,
        api,
        modelState.ownerLost ? 'owner link lost' : 'owns',
        960,
        320,
        23,
        modelState.ownerLost ? themeColors.muted : themeColors.yellow,
        'center',
      );
    });
    text(
      ctx,
      api,
      'PHYSICAL BYTES · node-local object stores',
      960,
      465,
      28,
      themeColors.muted,
      'center',
    );
    text(ctx, api, 'Node A', 520, 505, 31, themeColors.blue, 'center');
    text(ctx, api, 'Node B', 1400, 505, 31, themeColors.cyan, 'center');
    api.focus.target('references-producer-result', () =>
      card(ctx, api, 'Producer worker · Node A', 160, 535, 720, themeColors.blue, 100),
    );
    api.focus.target('references-consumer-node-b', () =>
      card(
        ctx,
        api,
        currentBeat === 0 ? 'Remote worker · Node B' : 'Consumer worker · Node B',
        1040,
        535,
        720,
        themeColors.cyan,
        100,
      ),
    );
    api.arrow(ctx, 520, 635, 520, 675, themeColors.cyan, 4);
    api.arrow(ctx, 1400, 635, 1400, 675, themeColors.cyan, 4);
    api.focus.target('references-node-a-copy', () =>
      card(
        ctx,
        api,
        modelState.lost ? 'Node A · copy lost' : 'Node A · object store · 64 bytes',
        160,
        685,
        720,
        modelState.lost ? themeColors.muted : themeColors.blue,
        110,
      ),
    );
    api.focus.target('references-node-b-copy', () =>
      card(
        ctx,
        api,
        modelState.copies > 1 || modelState.lost
          ? 'Node B · object store · 64 bytes'
          : currentBeat === 1
            ? 'Node B · object store · awaiting value'
            : 'Node B · object store · no local copy',
        1040,
        685,
        720,
        modelState.copies > 1 || modelState.lost ? themeColors.cyan : themeColors.muted,
        110,
      ),
    );
    if (currentBeat === 1) {
      api.focus.target('references-copy-transfer', () => {
        if (modelState.secondCopyPresent) {
          api.arrow(ctx, 880, 740, 1040, 740, themeColors.cyan, 4);
          text(ctx, api, 'copy', 960, 715, 21, themeColors.cyan, 'center');
        } else {
          api.arrow(ctx, 1040, 580, 880, 580, themeColors.yellow, 4);
          text(ctx, api, 'fetch request', 960, 555, 21, themeColors.yellow, 'center');
        }
      });
    }
    api.focus.target('references-copy-total', () =>
      text(
        ctx,
        api,
        `Stored-copy payload: ${modelState.copies * modelState.bytesPerCopy} bytes`,
        960,
        885,
        38,
        themeColors.green,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Owner metadata and stored payload have separate lifetimes',
      960,
      985,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'references',
  draw: drawReferences,
  cues: [
    'references-beat-1-focus-1',
    'references-beat-1-focus-2',
    'references-beat-2-focus-1',
    'references-beat-2-focus-2',
    'references-beat-3-focus-1',
    'references-beat-3-focus-2',
  ],
};
