import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('intro', state);
  const transfer = (source, target, color = themeColors.cyan, p = modelState.q) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      progress: p,
      color,
      particle: {
        radius: 8,
        fill: color,
      },
    });
  {
    const names = ['Authenticate', 'Place', 'Prepare guest', 'Run bounded job'];
    const nodes = names.map((name, i) =>
      api.focus.target('intro-name', () =>
        drawLegacyCard(
          ctx,
          api,
          name,
          140 + i * 440,
          400,
          330,
          i <= modelState.stage ? themeColors.cyan : themeColors.muted,
          120,
          30,
        ),
      ),
    );
    nodes.slice(0, -1).forEach((node, i) => transfer(node, nodes[i + 1], themeColors.cyan));
    ['Filesystem scope', 'Egress authority', 'CPU / memory / time'].forEach((name, i) =>
      drawLegacyCard(ctx, api, name, 170 + i * 560, 740, 460, themeColors.yellow, 105, 30),
    );
    drawLegacyText(
      ctx,
      api,
      'Interactive warm-start requirement · measure the actual host, image and load',
      960,
      985,
      29,
      themeColors.muted,
      'center',
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-beat-1-focus-1', 'intro-beat-2-focus-1'],
};
