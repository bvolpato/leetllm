import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawLink, drawSubtitle } from '../defaults.mjs';
export function drawBringupTriage(ctx, scene, state, api) {
  return api.focus.target('bringup-triage-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('bringup-triage', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Validate the operation before starting a stopwatch'
          : currentBeat === 1
            ? 'Follow the first failed contract'
            : 'Keep topology, environment and timing in the receipt',
      );
      if (currentBeat === 0) {
        const checks = [
          ['Architecture', 'FP4 path → SM100'],
          ['Representation', 'values + scales + stride'],
          ['Layout', 'shape / counts / output'],
          ['Distributed state', 'capacity + participation'],
        ];
        checks.forEach(([name, value], i) => {
          const active = teaching2(0, 0) > i / 4;
          drawBox(
            ctx,
            api,
            name,
            160,
            350 + i * 135,
            580,
            95,
            active ? themeColors.blue : themeColors.muted,
            31,
          );
          drawBox(
            ctx,
            api,
            value,
            1010,
            350 + i * 135,
            750,
            95,
            active ? themeColors.cyan : themeColors.muted,
            30,
          );
          if (active) api.arrow(ctx, 790, 397 + i * 135, 960, 397 + i * 135, themeColors.blue, 3);
        });
      } else if (currentBeat === 1) {
        const symptoms = [
            'Wrong values / order',
            'Slow first call',
            'Mega MoE hang',
            'No layer speedup',
          ],
          targets = [
            'route / scales / strides',
            'JIT miss / compiler',
            'leases / participation',
            'packing + complete critical path',
          ];
        symptoms.forEach((name, i) => {
          const active = i <= Math.floor(teaching2(1, 0) * 4),
            source = drawBox(
              ctx,
              api,
              name,
              150,
              350 + i * 145,
              650,
              100,
              active ? themeColors.pink : themeColors.muted,
              31,
            ),
            target = drawBox(
              ctx,
              api,
              targets[i],
              1080,
              350 + i * 145,
              690,
              100,
              active ? themeColors.yellow : themeColors.muted,
              28,
            );
          if (active) drawLink(ctx, api, source, target, teaching2(1, 0), themeColors.yellow);
        });
      } else {
        const layers = ['Wrapper', 'Heuristics', 'Implementation', 'Scheduler', 'Test receipt'],
          nodes = layers.map((name, i) =>
            drawBox(ctx, api, name, 140 + i * 340, 440, 290, 105, themeColors.blue, 30),
          );
        nodes
          .slice(0, -1)
          .forEach((node, i) =>
            drawLink(ctx, api, node, nodes[i + 1], teaching2(2, 0), themeColors.cyan),
          );
        drawBox(
          ctx,
          api,
          'Cold requests remain in product latency',
          300,
          690,
          1320,
          100,
          themeColors.yellow,
          33,
        );
        drawBox(
          ctx,
          api,
          'Rank / link placement · clocks · power · source pin',
          220,
          870,
          1480,
          90,
          themeColors.cyan,
          31,
        );
      }
    }
  });
}
export default {
  id: 'bringup-triage',
  draw: drawBringupTriage,
  cues: [
    'bringup-triage-b0',
    'dg-bringup-triage-0-0',
    'dg-bringup-triage-0-1',
    'dg-bringup-triage-0-2',
    'dg-bringup-triage-0-3',
    'bringup-triage-b1',
    'dg-bringup-triage-1-0',
    'dg-bringup-triage-1-1',
    'dg-bringup-triage-1-2',
    'dg-bringup-triage-1-3',
    'dg-bringup-triage-1-4',
    'bringup-triage-b2',
    'dg-bringup-triage-2-0',
    'dg-bringup-triage-2-1',
    'dg-bringup-triage-2-2',
    'dg-bringup-triage-2-3',
  ],
};
