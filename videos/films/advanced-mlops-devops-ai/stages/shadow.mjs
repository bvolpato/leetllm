import { cueClock } from '../cue-clock.mjs';

export function drawShadow(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueClock(scene, state);
  const canary = state.beat === 1;
  const text = (value, x, y, size, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, value, x, y, size, color, align, font);

  const requestY = canary ? 585 : 550;
  const requestX = 120;
  const question = canary && p('follow-up') > 0 ? 'And tomorrow?' : 'When can we deploy?';
  text(canary ? 'Canary conversation' : 'Sampled request', requestX, requestY - 103, 37, C.blue);
  const bubble = api.rect(ctx, requestX, requestY - 70, 475, 126, C.panel, C.blue, 24);
  api.container(ctx, bubble, () =>
    text(question, requestX + 238, requestY + 8, 38, C.ink, 'center'),
  );

  function route(y, name, color, arrived, answer, delivery, destination) {
    const path = [
      { x: 617, y: requestY },
      { x: 670, y: requestY },
      { x: 773, y },
      { x: 833, y },
    ];
    api.trace(ctx, path, arrived, color, 6);
    text(name, 860, y - 23, 43, color);
    if (answer) text(answer, 860, y + 61, 60);
    if (delivery > 0) api.arrow(ctx, 1140, y, 1140 + 173 * delivery, y, color, 6);
    if (delivery === 1) text(destination, 1355, y + 15, 53, color);
  }

  if (!canary) {
    focus.target('live-route', () =>
      route(
        390,
        'Live release',
        C.green,
        p('live-reply'),
        p('live-reply') === 1 && '09:00',
        p('live-delivery'),
        'User',
      ),
    );
    focus.target('candidate-route', () =>
      route(
        700,
        'Candidate',
        C.yellow,
        p('copy-request'),
        p('shadow-reply') === 1 && '13:00',
        p('log-delivery'),
        'Shadow log',
      ),
    );
    focus.target('shadow-settings', () => {
      if (p('shadow-tools') > 0)
        text('Recorded tool results   /   isolated credentials', 860, 927, 32, C.muted);
    });
    return;
  }

  const followUp = p('follow-up');
  focus.target('candidate-route', () => {
    // A new turn follows the saved route. Its answer has not been observed.
    route(
      requestY,
      'Candidate',
      C.yellow,
      followUp || p('canary-route'),
      !followUp && p('canary-route') === 1 && '13:00',
      followUp ? 0 : p('canary-delivery'),
      'User',
    );
  });
  focus.target('assignment', () => {
    if (p('save-assignment') > 0) {
      text('Saved with this conversation', requestX, 805, 35, C.blue);
      text('release-a91', requestX, 895, 54, C.ink, 'left', 'mono');
      if (followUp > 0) text('release-a91', 860, 690, 35, C.blue, 'left', 'mono');
    }
  });
}

export default {
  id: 'shadow',
  draw: drawShadow,
  cues: [
    'live-reply',
    'live-delivery',
    'copy-request',
    'shadow-reply',
    'log-delivery',
    'shadow-tools',
    'canary-route',
    'canary-delivery',
    'save-assignment',
    'follow-up',
  ],
};
