import { taskScopeCheck } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawTag, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';
export function drawTaskHmac(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const cue = voice(scene, state);
  const done = (name) => cue('sr-task-hmac-' + name).phase === 'after';
  api.focus.target('sr-task-hmac-mechanism', () => {
    const fields = [
      ['tenant', 'A'],
      ['user', 'analyst'],
      ['query digest', 'digest(Q)'],
      ['audience', 'retrieval'],
      ['expiry', '120'],
      ['nonce', 'nonce-1'],
    ];
    drawHeading(ctx, api, 'One retrieval request');
    fields.forEach(([n, v], i) => {
      if (cue('sr-task-hmac-fields').progress * fields.length >= i + 1)
        drawTag(
          ctx,
          api,
          n,
          v,
          170 + (i % 3) * 550,
          345 + Math.floor(i / 3) * 145,
          470,
          themeColors.blue,
        );
    });
    if (done('mac'))
      drawTag(
        ctx,
        api,
        'HMAC covers all six fields together',
        'Issuer and verifier share the secret',
        430,
        660,
        1080,
        themeColors.yellow,
      );
    if (currentBeat === 1) {
      const wrong = done('wrong'),
        first = done('first'),
        replay = done('replay');
      const used = new Set(),
        scope = {
          tenant: 'A',
          user: 'analyst',
          query: 'Q',
          audience: 'retrieval',
          expiry: 120,
          nonce: 'nonce-1',
        },
        request = {
          tenant: 'A',
          user: 'analyst',
          query: 'Q',
          audience: 'retrieval',
        };
      const values = [];
      if (wrong)
        values.push(
          taskScopeCheck(
            scope,
            {
              ...request,
              query: 'other',
            },
            100,
            used,
          ),
        );
      if (first) values.push(taskScopeCheck(scope, request, 100, used));
      if (replay) {
        values.push(taskScopeCheck(scope, request, 99, used));
        values.push(taskScopeCheck(scope, request, 120, new Set()));
      }
      const labels = ['wrong query', 'first match', 'replay', 'at expiry'];
      values.forEach((v, i) => {
        drawTag(
          ctx,
          api,
          labels[i],
          v ? 'ACCEPT' : 'DENY',
          170 + i * 420,
          805,
          350,
          v ? themeColors.green : themeColors.pink,
        );
      });
      drawText(
        ctx,
        api,
        'Used nonces: {' + (used.has('nonce-1') ? 'nonce-1' : '') + '}',
        960,
        970,
        28,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      drawTag(ctx, api, 'Task token', 'accepted request scope', 170, 805, 690, themeColors.green);
      if (done('acl'))
        drawTag(
          ctx,
          api,
          'Document ACL',
          'security runbook still DENIED',
          1050,
          805,
          690,
          themeColors.pink,
        );
    }
    if (currentBeat === 2)
      drawFooter(ctx, api, 'Across servers, record the first use of a nonce atomically.');
  });
}
export default {
  id: 'task-hmac',
  draw: drawTaskHmac,
  cues: [
    'sr-task-hmac-0',
    'sr-task-hmac-fields',
    'sr-task-hmac-mac',
    'sr-task-hmac-1',
    'sr-task-hmac-check',
    'sr-task-hmac-wrong',
    'sr-task-hmac-first',
    'sr-task-hmac-replay',
    'sr-task-hmac-2',
    'sr-task-hmac-acl',
  ],
};
