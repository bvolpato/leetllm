import {
  cueProgress,
  line,
  readoutCell,
  rectangle,
  retainedDrawCard,
  retainedDrawText,
  taskHeader,
  text,
} from '../defaults.mjs';
import { evaluationEpisode, freshScopedControls, routeSurface } from '../model.mjs';
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
    if (beat > 0) {
      const visible = (id) => beat > 1 || api.focus.visible(id),
        count = visible('measure-forbidden')
          ? 5
          : visible('choose-and-measure-b2-1')
            ? 4
            : visible('measure-annotated-clicks')
              ? 3
              : 0,
        f = evaluationEpisode(count);
      retainedDrawText(
        ctx,
        api,
        'Authored episode E1 · RUN-78432 · goal: save the parser traceback locally',
        960,
        280,
        30,
        themeColors.cyan,
        'center',
      );
      f.rows.forEach((row) =>
        api.focus.target(
          row.forbidden
            ? 'episode-forbidden'
            : row.kind === 'save-local-draft'
              ? 'episode-goal'
              : 'episode-clicks',
          () => {
            const y = 345 + (row.step - 1) * 115,
              color =
                row.executed || row.decision === 'saved-locally'
                  ? themeColors.green
                  : themeColors.pink;
            components.panel({
              x: 125,
              y,
              width: 1060,
              height: 95,
              fill: themeColors.panel,
              stroke: color,
              radius: 12,
            });
            retainedDrawText(
              ctx,
              api,
              `${row.step}. ${row.target}`,
              150,
              y + 36,
              28,
              themeColors.ink,
            );
            retainedDrawText(
              ctx,
              api,
              row.executed
                ? `Seen ${row.frame} · host → ${row.nextFrame}`
                : `Seen ${row.frame} · host ${row.nextFrame} held`,
              150,
              y + 75,
              23,
              themeColors.muted,
            );
            if (row.click) {
              api.rect(ctx, 630, y + 23, 125, 52, themeColors.bg, themeColors.blue, 4, 2);
              api.circle(
                ctx,
                630 + (125 * (row.point.x - row.annotation.x)) / row.annotation.width,
                y + 23 + (52 * (row.point.y - row.annotation.y)) / row.annotation.height,
                6,
                themeColors.yellow,
              );
              retainedDrawText(
                ctx,
                api,
                'annotated target',
                692,
                y + 89,
                16,
                themeColors.blue,
                'center',
              );
            }
            retainedDrawText(ctx, api, row.decision, 1155, y + 58, 26, color, 'right');
          },
        ),
      );
      const metric = (cue, target, title, value, y, color) =>
        api.focus.reveal(cue, () =>
          api.focus.target(target, () => {
            components.panel({
              x: 1290,
              y,
              width: 510,
              height: 125,
              fill: themeColors.panel,
              stroke: color,
              radius: 12,
            });
            retainedDrawText(ctx, api, title, 1545, y + 42, 25, themeColors.muted, 'center');
            retainedDrawText(ctx, api, value, 1545, y + 94, 32, color, 'center');
          }),
        );
      metric(
        'measure-annotated-clicks',
        'click-metric',
        'Dispatched clicks on annotated target',
        `${f.targetHits} / ${f.dispatchedClicks}`,
        350,
        themeColors.blue,
      );
      metric(
        'choose-and-measure-b2-1',
        'goal-metric',
        'Final state matches local-draft goal',
        f.goal ? 'YES · exact traceback saved' : 'Pending',
        510,
        themeColors.green,
      );
      metric(
        'measure-forbidden',
        'forbidden-metric',
        'Forbidden attempts / executions',
        `${f.forbiddenAttempts} / ${f.forbiddenExecutions}`,
        670,
        themeColors.pink,
      );
      metric(
        'measure-step-count',
        'steps-metric',
        'Proposed action steps',
        String(f.steps),
        830,
        themeColors.yellow,
      );
      if (f.state.draft)
        api.focus.target('episode-goal', () =>
          retainedDrawText(
            ctx,
            api,
            `Local artifact: ${f.state.draft}`,
            960,
            1020,
            28,
            themeColors.green,
            'center',
          ),
        );
      return;
    }
    const apiPath = api.focus.target('typed-api', () =>
      retainedDrawCard(
        ctx,
        api,
        'Status API\ntyped lookup',
        130,
        345,
        500,
        themeColors.blue,
        155,
        27,
      ),
    );
    const guiPath = api.focus.target('visual-evidence', () =>
      retainedDrawCard(
        ctx,
        api,
        'Legacy traceback\nvisual evidence',
        130,
        630,
        500,
        themeColors.yellow,
        155,
        27,
      ),
    );
    const router = api.focus.target('chosen-surface', () =>
      retainedDrawCard(
        ctx,
        api,
        beat === 0 ? 'Choose surface' : 'Task-specific route',
        720,
        500,
        500,
        themeColors.cyan,
        145,
        30,
      ),
    );
    const result = api.focus.target('measurement-gate', () =>
      retainedDrawCard(
        ctx,
        api,
        'Measure\ntarget + policy',
        1320,
        500,
        480,
        themeColors.green,
        145,
        29,
      ),
    );
    route(
      apiPath,
      router,
      themeColors.blue,
      routeSurface('read-status', true) === 'typed-api' ? q : 0,
    );
    route(
      guiPath,
      router,
      themeColors.yellow,
      routeSurface('read-legacy-traceback', false) === 'computer-use' ? q : 0,
    );
    route(router, result, themeColors.green, beat >= 1 ? q : 0, beat >= 1 ? 1 : 0);
  }
}
export function drawChooseAndMeasure(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const completed = (id, f) =>
    state.cues?.[id]?.phase === 'after' || (!state.cues?.[id] && cueProgress(ctx, api, id, f) >= 1);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    const reject = completed('fresh-stale-reject', q(3, 0.25, 0.4)),
      resolved = completed('fresh-resolve-control', q(3, 0.6, 0.75)),
      scope = freshScopedControls();
    taskHeader(ctx, api);
    rectangle(ctx, api, 160, 390, 750, 560, themeColors.blue);
    text(ctx, api, 'CI PORTAL · session9 / frame8', 185, 445, 28, themeColors.blue);
    line(ctx, api, 180, 470, 890, 470, themeColors.muted);
    scope.controls.forEach((control, i) => {
      const y = 490 + i * 220,
        kept = scope.matches.some((match) => match.id === control.id),
        col = resolved ? (kept ? themeColors.green : themeColors.muted) : themeColors.yellow;
      rectangle(ctx, api, 185, y, 700, 190, col);
      text(ctx, api, control.run + ' · ' + control.parent, 535, y + 35, 28, col, 'center');
      readoutCell(ctx, api, control.label, 210, y + 60, 280, col, 70);
      text(
        ctx,
        api,
        resolved
          ? kept
            ? 'KEEP · parent run matches'
            : 'EXCLUDE · different parent run'
          : 'Parent scope not yet applied',
        535,
        y + 170,
        27,
        col,
        'center',
      );
    });
    readoutCell(ctx, api, 'proposal observation: frame7', 1040, 420, 720, themeColors.blue);
    readoutCell(
      ctx,
      api,
      reject ? 'REJECT stale proposal' : 'Predict: may the click dispatch?',
      1040,
      610,
      720,
      reject ? themeColors.pink : themeColors.yellow,
    );
    readoutCell(
      ctx,
      api,
      'Required parent: ' + scope.intendedRun,
      1040,
      785,
      720,
      themeColors.blue,
      95,
    );
    if (resolved)
      text(
        ctx,
        api,
        'Captured frame8 · scoped run · one actionable target',
        1400,
        935,
        28,
        themeColors.green,
        'center',
      );
    text(
      ctx,
      api,
      'A local draft can be complete while an incident update stays outside task scope',
      960,
      1020,
      31,
      themeColors.yellow,
      'center',
    );
  };
  api.focus.target('choose-and-measure-construction', body);
}
export default {
  id: 'choose-and-measure',
  draw: drawChooseAndMeasure,
  cues: [
    'choose-and-measure-b1-1',
    'choose-and-measure-b1-2',
    'choose-and-measure-b2-1',
    'measure-step-count',
    'measure-forbidden',
    'measure-annotated-clicks',
    'choose-and-measure-b3-1',
    'choose-and-measure-construct-3',
    'fresh-stale-reject',
    'fresh-resolve-control',
  ],
};
