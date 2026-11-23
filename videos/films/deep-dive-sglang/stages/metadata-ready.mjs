import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { arrow, box, clock, footer, title } from '../defaults.mjs';
export function drawMetadataReady(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('metadata-ready-mechanism', () => {
    title(ctx, api, 'Batch B is usable when its attached state is current');
    const late = currentBeat === 1 && sgBegun(state, 'metadata-late', q > 0.2);
    clock(
      ctx,
      api,
      [
        {
          id: 'host',
          label: 'host plan B',
        },
        {
          id: 'gpu',
          label: 'GPU A then B',
        },
      ],
      [
        {
          id: 'plan',
          lane: 'host',
          start: 1,
          end: 2,
          color: themeColors.pink,
        },
        {
          id: 'a',
          lane: 'gpu',
          start: 1,
          end: 5,
          color: themeColors.blue,
        },
        {
          id: 'b',
          lane: 'gpu',
          start: 5,
          end: 9,
          color: late ? themeColors.muted : themeColors.pink,
        },
      ],
      [0, 10],
      5,
      345,
      260,
      [0, 1, 2, 5, 9, 10],
    );
    box(
      ctx,
      api,
      'Batch B · R42\npositions [4,5] · KV [12,13]\ngrammar revision 2',
      280,
      700,
      740,
      160,
      themeColors.pink,
      29,
    );
    arrow(ctx, api, 1030, 780, 1180, 780, late ? themeColors.pink : themeColors.green);
    box(
      ctx,
      api,
      late
        ? 'consumer requires revision 3\nHOLD at GPU launch'
        : 'consumer expects revision 2\nready at launch',
      1200,
      715,
      550,
      130,
      late ? themeColors.pink : themeColors.green,
      28,
    );
    footer(
      ctx,
      api,
      'Planning overlap hides time only after the first consumer’s dependencies are ready',
    );
  });
}
export default {
  id: 'metadata-ready',
  draw: drawMetadataReady,
  cues: ['sg-metadata-ready-beat-0', 'sg-metadata-ready-beat-1', 'sg-metadata-late'],
};
