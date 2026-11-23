import { pauseRecord } from '../fixtures.mjs';
import { continuationCase } from '../model.mjs';
import { filmPainter } from '../defaults.mjs';

function drawMrtrState(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, chip, panel, target, started, finished, progress } = filmPainter(ctx, api);
  const { beat } = state;
  if (beat === 0 || beat === 5) {
    const answered = beat === 5 || started('mrtr-answer');
    label('Deployments  /  reply 20', 145, 292, 38, C.cyan, 'left');
    target('form-entry', () => {
      panel(145, 345, 760, 381, C.cyan);
      label('rollback_reason', 190, 418, 37, C.cyan, 'left');
      label('Why roll back reranker-v17?', 190, 512, 39, C.ink, 'left');
      label(answered ? 'reason' : 'Accept  /  Decline  /  Cancel', 190, 605, 29, C.muted, 'left');
      if (answered) label('Canary exceeded its error budget.', 190, 672, 35, C.ink, 'left');
    });
    if (beat === 0) {
      target('echo-entry', () => {
        label('Retry 21', 1060, 292, 38, C.blue, 'left');
        panel(1060, 345, 715, 381, C.blue);
        label('inputResponses', 1100, 418, 32, C.muted, 'left');
        if (answered) {
          label('rollback_reason', 1100, 512, 37, C.blue, 'left');
          label('accept   ·   content.reason', 1100, 587, 33, C.ink, 'left');
        }
        label('requestState from server', 190, 806, 32, C.muted, 'left');
        label(pauseRecord.state, 685, 806, 45, C.cyan);
        label('requestState in retry', 1100, 806, 32, C.muted, 'left');
        if (finished('mrtr-echo')) label(pauseRecord.state, 1650, 806, 45, C.blue);
        if (started('mrtr-echo')) {
          const tip = 740 + progress('mrtr-echo') * 305;
          if (tip > 740) line(740, 790, tip, 790, C.cyan, 4);
        }
      });
      label('One server question, one answer under the same key.', 960, 922, 36, C.ink);
    } else {
      target('url-destination', () => {
        label('Sensitive interaction  /  URL mode', 1005, 292, 34, C.yellow, 'left');
        panel(1005, 345, 770, 381, C.yellow);
        label('Destination supplied by the server', 1050, 421, 32, C.muted, 'left');
        label('account.example', 1050, 516, 47, C.ink, 'left');
        if (started('mrtr-url')) {
          label('Open this destination?', 1050, 599, 35, C.yellow, 'left');
          label('Continue   /   Cancel', 1050, 680, 32, C.ink, 'left');
        }
      });
      label('The host applies its action policy to each follow-up request.', 960, 867, 35, C.ink);
    }
    return;
  }

  const wrongRelease =
    beat === 3 ||
    (beat === 2 && started('mrtr-retarget')) ||
    (beat === 4 && !started('mrtr-restore'));
  const expiredPermission = beat === 4 && started('mrtr-revoked');
  const retry = continuationCase({
    target: wrongRelease ? 'reranker-v18' : pauseRecord.target,
    serverAllowed: !expiredPermission,
  });
  const verdictCue = beat === 1 ? 'mrtr-match' : beat === 3 ? 'mrtr-reject' : 'mrtr-deny';
  const decided = beat !== 2 && finished(verdictCue);
  const verdict = {
    'admit under current permission': 'Admit the v17 retry',
    'reject: state binding': 'Reject the retry: target changed',
    'hold: permission': 'Hold the write: permission expired',
  }[retry.outcome];
  const decisionColor = retry.outcome === 'admit under current permission' ? C.green : C.yellow;
  const left = 750,
    right = 1440;
  label('Server record at pause', left, 268, 41, C.cyan);
  label('Incoming retry 21', right, 268, 41, C.blue);
  line(150, 307, 1775, 307, C.muted, 2);
  const rows = [
    ['Opaque state', pauseRecord.state, retry.echo],
    ['Caller', pauseRecord.principal, retry.principal],
    ['Operation', pauseRecord.operation, retry.operation],
    ['Target release', pauseRecord.target, retry.target],
  ];
  rows.forEach(([field, saved, supplied], i) => {
    const y = 389 + i * 106;
    label(field, 150, y, 33, C.muted, 'left');
    const comparingTarget = i === 3 && (beat > 1 || started('mrtr-bind'));
    target(i === 3 ? 'saved-target' : 'saved-state', () => {
      label(saved, left, y, i === 3 ? 49 : 38, C.cyan);
    });
    target(i === 3 ? 'retry-target' : 'retry-state', () => {
      label(supplied, right, y, i === 3 ? 49 : 38, C.blue);
    });
    if (comparingTarget) {
      const amount = beat > 1 ? 1 : progress('mrtr-bind');
      line(967, y - 14, 967 + 228 * amount, y - 14, C.muted, 3);
    }
  });
  target('saved-state', () =>
    label(
      'Pause ' +
        pauseRecord.state +
        '   ·   verified, unused   ·   ' +
        (retry.expires - retry.now) +
        ' min left',
      175,
      801,
      32,
      C.cyan,
      'left',
    ),
  );
  target('current-permission', () =>
    label(
      retry.serverAllowed
        ? 'Host and server permit v17 and v18'
        : 'Host approved   /   server permission expired',
      1750,
      801,
      32,
      expiredPermission ? C.yellow : C.muted,
      'right',
    ),
  );
  target('binding-decision', () => {
    const prompt =
      beat === 2 && finished('mrtr-retarget')
        ? 'Can this retry use the v17 pause?'
        : 'Server decision pending';
    chip(decided ? verdict : prompt, 415, 879, 1090, decided ? decisionColor : C.muted, 82, 40);
  });
}

export default {
  id: 'mrtr-state',
  draw: drawMrtrState,
  cues: [
    'mrtr-question',
    'mrtr-answer',
    'mrtr-echo',
    'mrtr-saved',
    'mrtr-bind',
    'mrtr-match',
    'mrtr-rewind',
    'mrtr-retarget',
    'mrtr-question-target',
    'mrtr-reject',
    'mrtr-compare',
    'mrtr-restore',
    'mrtr-revoked',
    'mrtr-deny',
    'mrtr-single',
    'mrtr-reason',
    'mrtr-url',
  ],
};
