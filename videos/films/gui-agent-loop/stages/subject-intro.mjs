import { retainedDrawCard, retainedDrawText } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 2,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    components.panel(
      {
        x: 140,
        y: 330,
        width: 1640,
        height: 530,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 22,
      },
      () => {
        retainedDrawText(ctx, api, 'CI PORTAL', 180, 387, 29, themeColors.blue);
        retainedDrawText(ctx, api, 'RUN-78432  /  main', 520, 387, 30, themeColors.ink);
        retainedDrawText(ctx, api, 'Restricted session', 1735, 387, 25, themeColors.muted, 'right');
        api.line(ctx, 175, 410, 1745, 410, themeColors.muted, 2);
        ['Overview', 'Jobs', 'Failed tests', 'Artifacts'].forEach((label, i) =>
          retainedDrawCard(
            ctx,
            api,
            label,
            180,
            445 + i * 88,
            270,
            i === 2 ? themeColors.yellow : themeColors.muted,
            62,
            25,
          ),
        );
        components.panel(
          {
            x: 505,
            y: 445,
            width: 810,
            height: 365,
            fill: themeColors.bg,
            stroke: themeColors.yellow,
            padding: 24,
          },
          () => {
            api.focus.target('failed-test', () =>
              retainedDrawText(
                ctx,
                api,
                'FAILED TEST  /  report parser',
                540,
                495,
                27,
                themeColors.yellow,
              ),
            );
            retainedDrawText(
              ctx,
              api,
              'ReportParser::rejectsFailure',
              540,
              560,
              29,
              themeColors.ink,
            );
            retainedDrawText(ctx, api, 'parser.py  line 18', 540, 625, 25, themeColors.muted);
            api.focus.target('parser-traceback', () =>
              retainedDrawText(ctx, api, "KeyError: 'status'", 540, 685, 35, themeColors.pink),
            );
            retainedDrawText(ctx, api, 'Expected a <failure> child', 540, 755, 27, themeColors.ink);
          },
        );
        const deploy = api.focus.target('deployment-effect', () =>
          retainedDrawCard(ctx, api, 'Deploy production', 1370, 445, 355, themeColors.pink, 95, 25),
        );
        const scope = api.focus.target('task-scope', () =>
          retainedDrawCard(
            ctx,
            api,
            beat === 0 ? 'Read-only task' : 'Deploy blocked',
            1370,
            610,
            355,
            beat === 0 ? themeColors.yellow : themeColors.pink,
            80,
            27,
          ),
        );
        if (beat > 0) route(deploy, scope, themeColors.pink, q);
        api.focus.target('local-draft', () =>
          retainedDrawCard(
            ctx,
            api,
            beat < 2 ? 'Local draft empty' : 'Local draft saved',
            1370,
            755,
            355,
            beat < 2 ? themeColors.muted : themeColors.green,
            65,
            25,
          ),
        );
      },
    );
    retainedDrawText(
      ctx,
      api,
      beat < 2
        ? 'Read the evidence under the current task scope'
        : 'Verified result: traceback saved in a local draft',
      960,
      920,
      33,
      beat < 2 ? themeColors.ink : themeColors.green,
      'center',
    );
  }
}
export function drawSubjectIntro(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {};
  api.focus.target('subject-intro-construction', body);
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['subject-intro-b1-1', 'subject-intro-b2-1', 'subject-intro-b3-1', 'subject-intro-b3-2'],
};
