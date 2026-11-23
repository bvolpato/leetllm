import { paginationSnapshot, sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawArgument(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('argument', state);
  {
    const colors = [
      themeColors.pink,
      themeColors.yellow,
      themeColors.cyan,
      themeColors.blue,
      themeColors.green,
      themeColors.muted,
    ];
    const repeated = paginationSnapshot(1, 1);
    const details = [
      [
        'argument-problem-detail',
        `${modelState.project.sources} source integrations`,
        'credential + pagination logic',
      ],
      [
        'argument-constraint-detail',
        'tenant-safe lookup',
        `p95 below ${modelState.project.latencyTargetMs} ms`,
      ],
      ['argument-decision-detail', 'one connector contract', 'source-specific adapters'],
      ['argument-claims-1', 'separate adapter service', 'independent release + isolation'],
      [
        'argument-evidence-detail',
        `repeated cursor ${repeated.nextCursor}`,
        `${repeated.requestId} · ${repeated.sourceId}`,
      ],
      ['argument-alternative-downside', 'remote calls', 'another operational boundary'],
    ];
    modelState.claims.forEach((label, index) =>
      api.focus.target('argument-' + label, () => {
        const x = 150 + (index % 3) * 570,
          y = 325 + Math.floor(index / 3) * 275;
        components.card({
          label,
          x,
          y,
          width: 500,
          height: 210,
          fontSize: 31,
          baselineOffset: -65,
          padding: 16,
          fill: themeColors.panel,
          stroke: colors[index],
          textColor: colors[index],
        });
        api.focus.reveal(details[index][0], () => {
          text(ctx, api, details[index][1], x + 250, y + 115, 27, themeColors.ink, 'center');
          text(ctx, api, details[index][2], x + 250, y + 165, 25, themeColors.ink, 'center');
        });
      }),
    );
    text(
      ctx,
      api,
      'One fictional connector project · each claim has an inspectable role',
      960,
      925,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'argument',
  draw: drawArgument,
  cues: [
    'argument-claims-0',
    'argument-problem-detail',
    'argument-constraint-detail',
    'argument-decision-detail',
    'argument-claims-1',
    'argument-alternative-downside',
    'argument-evidence-detail',
  ],
};
