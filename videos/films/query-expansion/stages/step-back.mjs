import { spoken } from '../construction.mjs';

const request = { id: 'R17', endpoint: 'E2', tier: 2, perWindow: 120, code: 429 };
const rule = { id: 'P4', endpoint: 'E2', tier: 2, limit: 100 };
export function drawStepBack(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const gotRule = spoken(state, 1, 'stepback-policy') === 1;
  const joined = spoken(state, 1, 'stepback-join') === 1;
  label('Why did this request receive HTTP ' + request.code + '?', 135, 273, 50);
  label('Request ' + request.id, 135, 413, 34, C.blue);
  label(
    request.endpoint +
      '  ·  tier ' +
      request.tier +
      '  ·  ' +
      request.perWindow +
      ' requests from this client in 60 s',
    528,
    413,
    37,
  );
  focus.target('stepback-evidence', () => {
    label('Policy lookup', 135, 528, 34, C.yellow);
    label(
      gotRule
        ? rule.id +
            '  ·  ' +
            rule.endpoint +
            '  ·  tier ' +
            rule.tier +
            '  ·  limit ' +
            rule.limit +
            ' per client in 60 s'
        : 'Which burst rule applies to E2 on this tier?',
      528,
      528,
      37,
    );
  });
  const x = (n) => 188 + n * 10;
  const y = 738;
  api.line(ctx, x(0), y, x(146), y, C.muted, 3);
  label('Requests in the same 60-second window', 135, 655, 31, C.muted);
  api.rect(ctx, x(0), y - 22, request.perWindow * 10, 36, C.blue);
  label(request.perWindow, x(request.perWindow), y + 86, 42, C.blue, 'center');
  focus.target('stepback-join', () => {
    if (gotRule) {
      api.line(ctx, x(rule.limit), y - 50, x(rule.limit), y + 35, C.yellow, 6);
      label(rule.limit, x(rule.limit), y + 86, 42, C.yellow, 'center');
    }
    label(
      joined
        ? request.perWindow -
            rule.limit +
            ' above the limit   ·   check R17’s limiter log for the cause.'
        : 'Which rule was in force for this request?',
      960,
      958,
      38,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'step-back',
  draw: drawStepBack,
  cues: ['stepback-question', 'stepback-policy', 'stepback-join'],
};
