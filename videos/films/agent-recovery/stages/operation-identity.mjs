import { card, text } from '../defaults.mjs';
export function drawOperationIdentity(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 8) =>
    api.teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      width: 3,
      progress,
      gap: 28,
      margin: 4,
      particle: {
        radius,
        fill: color,
      },
    });
  {
    const replayProgress = beat === 2 ? api.focus.progress('same-key-replay', q) : 0;
    const changeProgress = beat === 2 ? api.focus.progress('changed-target', q) : 0;
    const replayed = beat === 2 && replayProgress === 1,
      changed = beat === 2 && changeProgress > 0,
      conflict = beat === 2 && changeProgress === 1;
    const accepted = beat > 1 || (beat === 1 && api.focus.progress('accepted-job', q) === 1);
    const op = api.focus.target('operation-identity-op', () =>
      card(ctx, api, 'Operation key\nrb-842-1', 170, 340, 430, themeColors.yellow, 150, 32),
    );
    const attempt1 = api.focus.target('operation-identity-attempt1', () =>
      card(ctx, api, 'Attempt ID\nattempt-1', 740, 275, 390, themeColors.blue, 145, 30),
    );
    const attempt2 = api.focus.target('operation-identity-attempt2', () =>
      card(ctx, api, 'Attempt ID\nattempt-2', 740, 485, 390, themeColors.cyan, 145, 30),
    );
    const job = api.focus.target('operation-identity-job', () =>
      card(
        ctx,
        api,
        replayed
          ? 'Controller job\njob-1 returned'
          : accepted
            ? 'Controller job\njob-1 accepted'
            : 'Controller job\nnot yet identified',
        1320,
        375,
        400,
        accepted ? themeColors.green : themeColors.muted,
        165,
        32,
      ),
    );
    route(op, attempt1, themeColors.blue, beat === 0 ? q : 1);
    route(op, attempt2, themeColors.cyan, beat >= 1 ? q : 0, beat >= 1 ? 1 : 0);
    route(attempt2, job, themeColors.cyan, replayProgress, beat === 2 ? 1 : 0);
    api.focus.target('operation-identity-same-key-same-payload-one-logical-operation', () =>
      text(
        ctx,
        api,
        'Same key + same payload → one logical operation',
        960,
        705,
        37,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('operation-identity-retained-payload', () =>
      card(ctx, api, 'Retained: RUN-842 · rev 17', 170, 755, 650, themeColors.blue, 86, 30),
    );
    api.focus.target('operation-identity-proposed-payload', () =>
      card(
        ctx,
        api,
        'Proposed: RUN-842 · rev ' + (changed ? '18' : '17'),
        1040,
        755,
        700,
        changed ? themeColors.yellow : themeColors.cyan,
        86,
        30,
      ),
    );
    if (changed) api.line(ctx, 1390, 845, 1390, 872, themeColors.yellow, 3);
    api.focus.target('operation-identity-job-count', () =>
      text(
        ctx,
        api,
        accepted ? 'Jobs: 1' : 'Jobs: ?',
        960,
        885,
        31,
        accepted ? themeColors.green : themeColors.muted,
        'center',
      ),
    );
    api.focus.target('operation-identity-readout', () =>
      card(
        ctx,
        api,
        conflict
          ? 'Same key + changed rev 18 → conflict; retained job-1 stays'
          : changed
            ? 'Compare proposed revision 18 with retained revision 17'
            : replayed
              ? 'Unchanged replay returns the original job-1'
              : 'Retain the exact operation key and target payload',
        260,
        930,
        1400,
        conflict ? themeColors.pink : themeColors.muted,
        75,
        29,
      ),
    );
  }
}
export default {
  id: 'operation-identity',
  draw: drawOperationIdentity,
  cues: [
    'logical-key',
    'same-payload',
    'attempt-traces',
    'accepted-job',
    'same-key-replay',
    'changed-target',
  ],
};
