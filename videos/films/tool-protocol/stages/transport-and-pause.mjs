import { filmPainter } from '../defaults.mjs';
import { pauseRecord } from '../fixtures.mjs';

function drawTransportAndPause(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, dot, target, started, finished, progress } = filmPainter(ctx, api);
  const left = 385,
    right = 1515;
  label('Host and client', left, 266, 42, C.blue);
  label('Deployments server', right, 266, 42, C.cyan);
  line(left, 310, left, 752, C.blue, 3);
  line(right, 310, right, 752, C.cyan, 3);
  function message(y, forward, amount, title, color) {
    const from = forward ? left : right;
    const to = forward ? right : left;
    const tip = from + (to - from) * amount;
    if (amount > 0) line(from, y, tip, y, color, 4);
    dot(tip, y, color, 11);
    label(title, 950, y - 23, 34, color);
  }
  if (state.beat === 0) {
    target('stdio-request', () =>
      message(
        430,
        true,
        progress('t-transport-and-pause-stdio'),
        'stdin   ·   JSON request + newline',
        C.blue,
      ),
    );
    target('stdio-reply', () => {
      if (started('stdio-stdout'))
        message(590, false, progress('stdio-stdout'), 'stdout   ·   JSON reply + newline', C.cyan);
    });
    label('stderr   ·   diagnostic log', 950, 770, 33, C.muted);
    return;
  }
  message(385, true, 1, '20   ·   rollback v17   ·   form support', C.blue);
  target('pause-response', () => {
    if (started('pause-input')) {
      message(
        525,
        false,
        progress('pause-input'),
        '20   ·   input_required   ·   ' + pauseRecord.state,
        C.cyan,
      );
    }
  });
  target('retry-packet', () => {
    if (started('pause-resume')) {
      message(
        708,
        true,
        progress('pause-send'),
        '21   ·   rollback v17   ·   reason + ' + pauseRecord.state,
        C.blue,
      );
      if (finished('t-transport-and-pause-host')) {
        label('host scope + approval checked', left, 810, 29, C.green);
      } else label('Prepared at host', left, 810, 30, C.yellow);
    }
  });
  target('effect-count', () => {
    const admitted = finished('t-transport-and-pause-server');
    if (admitted) label('server permission rechecked', right, 810, 30, C.green);
    const count = admitted
      ? '1 authorized traffic effect'
      : state.beat === 2
        ? '0 traffic effects'
        : 'Traffic changes so far?';
    label(count, 950, 929, 45, admitted ? C.green : C.ink);
  });
}

export default {
  id: 'transport-and-pause',
  draw: drawTransportAndPause,
  cues: [
    't-transport-and-pause-stdio',
    'stdio-stdout',
    'pause-input',
    'pause-resume',
    't-transport-and-pause-host',
    'pause-send',
    't-transport-and-pause-server',
  ],
};
