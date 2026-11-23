import { PROBES } from '../fixtures.mjs';
import { completed, logicalState, probeFrame, voice } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawRedTeam(ctx, scene, state, api) {
  state = logicalState('red-team', state);
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const observations = [
      'probe-first',
      'probe-second',
      'probe-third',
      'probe-fourth',
      'probe-fifth',
    ];
    const f = probeFrame(currentBeat, progress, {
      visible: observations.filter((id) => voice(state, id, 0) > 0).length,
      focus: voice(state, 'red-team-b2-2', 1) > 0 ? 'disclosure' : 'refusal',
      runtimeDenied: voice(state, 'red-team-b3-1', 2) > 0,
    });
    const countPermitted = voice(state, 'red-team-b2-1', 1) > 0;
    const countDenied = voice(state, 'red-team-b2-2', 1) > 0;
    drawText(
      ctx,
      api,
      'Model replies and application permissions',
      960,
      305,
      26,
      themeColors.muted,
      'center',
    );
    PROBES.forEach((row, i) => {
      const y = 345 + i * 90,
        observed = i < f.visible,
        bad = row.permitted ? row.refused : row.disclosed;
      components.panel({
        x: 140,
        y,
        width: 1640,
        height: 74,
        fill: themeColors.panel,
        stroke: observed ? (bad ? themeColors.pink : themeColors.green) : themeColors.line,
      });
      api.focus.target('probe-requests', () =>
        drawText(
          ctx,
          api,
          row.id + ' · ' + row.request,
          170,
          y + 46,
          26,
          observed ? themeColors.ink : themeColors.muted,
        ),
      );
      const counted =
        currentBeat === 1 && (countDenied ? !row.permitted : countPermitted && row.permitted);
      api.focus.target(counted ? 'counted-permission' : 'permission-status', () => {
        if (counted) api.rect(ctx, 752, y + 8, 222, 58, '#393223', undefined, 8);
        drawText(
          ctx,
          api,
          row.permitted ? 'PERMITTED' : 'DENIED',
          780,
          y + 46,
          25,
          counted ? themeColors.yellow : themeColors.ink,
        );
      });
      api.focus.target('response-' + (i + 1), () =>
        drawText(
          ctx,
          api,
          observed ? row.response : 'Awaiting observed response',
          1050,
          y + 46,
          26,
          observed ? (bad ? themeColors.pink : themeColors.green) : themeColors.muted,
        ),
      );
    });
    if (currentBeat < 2) {
      api.focus.target('false-refusals', () =>
        drawCard(
          ctx,
          api,
          completed(state, 'refusal-count', 1)
            ? 'False refusals: ' + f.falseRefusals + ' / ' + f.permitted + ' permitted'
            : countPermitted
              ? 'False refusals: ? / ' + f.permitted + ' permitted'
              : 'False refusals: ? / ?',
          160,
          850,
          760,
          countPermitted && !countDenied ? themeColors.yellow : themeColors.muted,
          95,
        ),
      );
      api.focus.target('unsafe-disclosures', () =>
        drawCard(
          ctx,
          api,
          completed(state, 'disclosure-count', 1)
            ? 'Unsafe disclosures: ' + f.disclosures + ' / ' + f.forbidden + ' denied'
            : countDenied
              ? 'Unsafe disclosures: ? / ' + f.forbidden + ' denied'
              : 'Unsafe disclosures: ? / ?',
          1000,
          850,
          760,
          countDenied ? themeColors.yellow : themeColors.muted,
          95,
        ),
      );
      drawText(
        ctx,
        api,
        currentBeat === 0 && f.visible === PROBES.length
          ? 'Which requests belong in the false-refusal count?'
          : 'Replies observed    ' + f.visible + ' / ' + PROBES.length,
        960,
        1000,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      const request = drawCard(
        ctx,
        api,
        'D1 replay · proposed read',
        150,
        845,
        480,
        themeColors.blue,
        92,
      );
      const gate = api.focus.target('trusted-denial', () =>
        drawCard(ctx, api, 'Trusted permission: DENY', 720, 845, 540, themeColors.yellow, 92),
      );
      api.connect(ctx, api.groupBounds(request), api.groupBounds(gate), {
        color: themeColors.yellow,
        gap: 20,
      });
      components.fade(f.runtimeDenied ? 1 : 0, () =>
        drawCard(ctx, api, 'No private data fetched', 1350, 845, 420, themeColors.pink, 92),
      );
      drawText(
        ctx,
        api,
        f.runtimeDenied
          ? 'Application enforcement holds even when the observed model response fails'
          : 'Application checks the current incident scope before retrieval',
        960,
        1005,
        27,
        themeColors.ink,
        'center',
      );
    }
  }
}
export default {
  id: 'red-team',
  draw: drawRedTeam,
  cues: [
    'probe-first',
    'probe-second',
    'probe-third',
    'probe-fourth',
    'probe-fifth',
    'red-team-b2-1',
    'red-team-b2-2',
    'refusal-count',
    'disclosure-count',
    'red-team-b3-1',
  ],
};
