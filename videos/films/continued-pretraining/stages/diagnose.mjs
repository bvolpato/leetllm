import { cueBegun } from '../construction.mjs';
import { replayGradient } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawDiagnose(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.93);
  const alpha = 0;
  const gradient = replayGradient(alpha);
  {
    const symptoms = api.focus.target('retrieve-path', () =>
        card(ctx, api, 'Missing current fact', 230, 315, 420, themeColors.blue),
      ),
      retrieve = api.focus.target('retrieve-path', () =>
        card(ctx, api, 'Retrieve evidence', 1270, 315, 420, themeColors.cyan),
      );
    const domain = api.focus.target('domain-path', () =>
        card(ctx, api, 'Domain-text gap', 230, 480, 420, themeColors.yellow),
      ),
      cpt = api.focus.target('domain-path', () =>
        card(ctx, api, 'Continue pretraining', 1270, 480, 420, themeColors.green),
      );
    const format = api.focus.target('supervised-path', () =>
        card(ctx, api, 'Answer-format gap', 230, 645, 420, themeColors.pink),
      ),
      sft = api.focus.target('supervised-path', () =>
        card(ctx, api, 'Supervised examples', 1270, 645, 420, themeColors.blue),
      );
    api.connect(ctx, api.groupBounds(symptoms), api.groupBounds(retrieve), {
      color: themeColors.cyan,
      gap: 10,
    });
    const domainRoute = api.connect(ctx, api.groupBounds(domain), api.groupBounds(cpt), {
      color: themeColors.green,
      gap: 24,
      width: 3,
    });
    api.connect(ctx, api.groupBounds(format), api.groupBounds(sft), {
      color: themeColors.pink,
      gap: 10,
    });
    components.particle({
      points: [domainRoute.from, domainRoute.to],
      progress: phaseForBeat(1),
      radius: 8,
      fill: themeColors.yellow,
    });
    if (
      currentBeat > 1 ||
      (currentBeat === 1 && cueBegun(state.cues, 'diagnose-preference-comparison', progress > 0.5))
    )
      api.focus.target('preference-path', () => {
        const pair = components.panel({
          x: 180,
          y: 800,
          width: 800,
          height: 175,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          padding: 20,
        });
        text(
          ctx,
          api,
          'What is a reef? · two acceptable replies',
          580,
          840,
          26,
          themeColors.cyan,
          'center',
        );
        text(
          ctx,
          api,
          'A: A reef is a ridge of rock or coral.',
          580,
          895,
          25,
          themeColors.ink,
          'center',
        );
        text(
          ctx,
          api,
          'B: It is a shallow underwater ridge.',
          580,
          945,
          25,
          themeColors.ink,
          'center',
        );
        const method = card(
          ctx,
          api,
          'Reviewer: A preferred to B',
          1270,
          835,
          470,
          themeColors.yellow,
        );
        api.connect(ctx, pair, method, {
          color: themeColors.yellow,
          gap: 15,
          width: 3,
        });
        text(ctx, api, 'Preference comparison signal', 1505, 985, 25, themeColors.yellow, 'center');
      });
  }
}
export default {
  id: 'diagnose',
  draw: drawDiagnose,
  cues: [
    'diagnose-b1-1',
    'diagnose-b1-2',
    'diagnose-b2-1',
    'diagnose-preference-comparison',
    'diagnose-b3-1',
  ],
};
