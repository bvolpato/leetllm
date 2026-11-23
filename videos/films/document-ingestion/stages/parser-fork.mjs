import { connectRoute, labelCard, optionalFocusTarget, text } from '../defaults.mjs';
export function drawParserFork(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.08, 0.9);
  {
    const labels = [
      ['Native PDF', 'Positioned text', 'Text + reading order'],
      ['Scanned page', 'OCR recognition', 'Candidate + page image'],
      ['HTML page', 'Main-content parser', 'Text without navigation'],
      ['Markdown', 'Heading + fence parser', 'Sections + commands'],
    ];
    optionalFocusTarget(ctx, api, 'parser-fork-simulation-12', () =>
      labels.forEach(([source, parser, output], i) => {
        const y = 350 + i * 130,
          a = optionalFocusTarget(ctx, api, 'parser-fork-object-source-13', () =>
            labelCard(ctx, api, source, 150, y, 330, themeColors.blue, 1, 85),
          ),
          z = labelCard(
            ctx,
            api,
            parser,
            655,
            y,
            490,
            i === 1 ? themeColors.pink : themeColors.cyan,
            phaseForBeat(0),
            85,
          ),
          out = labelCard(
            ctx,
            api,
            output,
            1320,
            y,
            450,
            i === 1 ? themeColors.pink : themeColors.green,
            phaseForBeat(1),
            85,
            29,
          );
        connectRoute(ctx, api, a, z, phaseForBeat(0));
        connectRoute(
          ctx,
          api,
          z,
          out,
          phaseForBeat(1),
          i === 1 ? themeColors.pink : themeColors.green,
        );
      }),
    );
    components.fade(phaseForBeat(2), () =>
      text(
        ctx,
        api,
        'Shared record: identity · type · locator · parser · quality · text · checksum',
        960,
        945,
        29,
        themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'parser-fork',
  draw: drawParserFork,
  cues: [
    'parser-fork-beat-1-focus-1',
    'parser-fork-beat-2-focus-1',
    'parser-fork-beat-3-focus-1',
    'parser-fork-beat-3-focus-2',
  ],
};
