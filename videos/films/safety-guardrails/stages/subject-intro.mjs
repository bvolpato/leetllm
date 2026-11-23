import { approvalFixture, guardCue, guardDone } from '../model.mjs';

const deploy = approvalFixture([{ hasApproval: false }]).outcomes[0];

export function paintSubjectIntro(ctx, scene, state, api) {
  const { C, text, rect, line, circle, focus } = api;
  const beat = state.beat ?? 0;
  const travel = guardCue(state, 'intro-proposal', 0, 0, 0.35);
  const held = guardDone(state, 'intro-held', 1, 0.02, 0.37);
  const counted = guardDone(state, 'intro-stop', 1, 0.4, 0.55);
  const gate = 1190;
  const width = 625;
  const x = 120 + (gate - width - 12 - 120) * travel;

  focus.target('deploy-route', () => {
    rect(ctx, x, 390, width, 180, C.panel, C.cyan, 8);
    text(ctx, 'Tool proposal', x + 32, 438, 30, C.cyan);
    text(ctx, 'Deploy payment-service', x + 32, 513, 42, C.ink);
  });
  focus.target('approval-record', () => {
    text(ctx, 'Production approval', gate, 265, 30, C.muted, 'center');
    text(ctx, 'No matching record', gate, 328, 42, C.ink, 'center');
    line(ctx, gate, 368, gate, 592, held ? C.yellow : C.muted, 8);
  });
  focus.target('deploy-result', () => {
    text(ctx, 'Production', 1530, 415, 32, C.muted, 'center');
    text(
      ctx,
      counted ? String(deploy.count) : '?',
      1530,
      515,
      88,
      counted ? C.yellow : C.ink,
      'center',
    );
    text(ctx, 'deployments', 1530, 570, 32, C.muted, 'center');
  });
  if (beat === 0 || held)
    focus.target('deploy-question', () => {
      text(
        ctx,
        held ? 'Held for approval' : 'Can the host start this deployment?',
        960,
        664,
        42,
        held ? C.yellow : C.ink,
        'center',
      );
    });

  function route(y, progress, destination, stop, passes) {
    const start = 840;
    const end = 1560;
    line(ctx, start, y, end, y, C.panel, 6);
    line(ctx, stop, y - 15, stop, y + 15, C.muted, 3);
    const pos = start + (stop - start) * progress;
    if (pos > start) line(ctx, start, y, pos, y, C.cyan, 6);
    circle(ctx, pos, y, 12, progress === 1 ? (passes ? C.green : C.yellow) : C.cyan);
    text(ctx, destination, end + 42, y + 11, 33, C.ink);
  }

  if (beat >= 2)
    focus.target('test-route', () => {
      text(ctx, '“How do I run the tests?”', 120, 798, 39, C.ink);
      const review = guardCue(state, 'intro-answer', 2, 0.45, 0.85);
      route(785, review, 'Chat', 1560, true);
      text(
        ctx,
        review === 1 ? 'Reviewed reply' : 'Review reply',
        1200,
        750,
        28,
        review === 1 ? C.green : C.muted,
        'center',
      );
    });
  if (beat >= 3) {
    focus.target('secret-route', () => {
      text(ctx, 'Request for a production key', 120, 943, 39, C.ink);
      const stop = guardCue(state, 'intro-key', 3, 0.17, 0.5);
      route(930, stop, 'Model', 1050, false);
      text(
        ctx,
        stop === 1 ? 'Blocked at input' : 'Input check',
        1050,
        894,
        28,
        stop === 1 ? C.yellow : C.muted,
        'center',
      );
    });
    if (guardCue(state, 'intro-vault', 3, 0.55, 0.85) > 0)
      focus.target('vault-policy', () =>
        text(ctx, 'Host permission: secret export denied', 960, 1017, 30, C.muted, 'center'),
      );
  }
}
export const paintSubjectIntroLegacy = paintSubjectIntro;
export { paintSubjectIntro as drawSubjectIntro };
export default {
  id: 'subject-intro',
  draw: paintSubjectIntro,
  cues: [
    'intro-proposal',
    'intro-record',
    'intro-question',
    'intro-held',
    'intro-stop',
    'intro-test',
    'intro-answer',
    'intro-key',
    'intro-vault',
  ],
};
