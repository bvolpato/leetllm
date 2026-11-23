import { introRecoverySnapshot } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
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
    const snapshot = state.cues
      ? {
          sent: api.focus.progress('send-approved-request', 0) > 0,
          committed: api.focus.progress('durable-job', 0) > 0,
          replyLost: api.focus.progress('lost-reply', 0) > 0,
          timedOut: api.focus.progress('agent-timeout', 0) > 0,
        }
      : introRecoverySnapshot(beat, progress2);
    const approved = api.focus.target('subject-intro-approved', () =>
      card(ctx, api, 'Approved rollback · rev 17', 150, 470, 470, themeColors.yellow, 120),
    );
    const controller = api.focus.target('subject-intro-controller', () =>
      card(
        ctx,
        api,
        snapshot.committed ? 'Controller · job-1 queued' : 'Controller · awaiting request',
        730,
        470,
        480,
        snapshot.committed ? themeColors.green : themeColors.muted,
        120,
      ),
    );
    api.focus.target('subject-intro-agent-observation', () =>
      card(
        ctx,
        api,
        snapshot.timedOut
          ? 'Timeout · outcome unknown'
          : snapshot.sent
            ? 'Waiting for reply'
            : 'Agent · ready to send',
        1300,
        470,
        470,
        snapshot.timedOut ? themeColors.pink : themeColors.blue,
        120,
      ),
    );
    route(approved, controller, themeColors.yellow, beat > 0 ? 1 : phase(progress2, 0.72, 0.96));
    if (snapshot.replyLost) {
      api.line(ctx, 1215, 520, 1255, 520, themeColors.pink, 4);
      api.line(ctx, 1265, 520, 1285, 520, themeColors.pink, 4);
      api.focus.target('subject-intro-reply-lost', () =>
        text(ctx, api, 'reply lost', 1250, 425, 27, themeColors.pink, 'center'),
      );
    }
    api.focus.target('subject-intro-one-operation-two-different-observations', () =>
      text(
        ctx,
        api,
        'One operation · two different observations',
        960,
        755,
        38,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'approved-request',
    'send-approved-request',
    'durable-job',
    'lost-reply',
    'agent-timeout',
    'durable-boundary',
    'final-evidence',
  ],
};
