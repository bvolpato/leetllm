import { approvalRoute, replayRecordedTool } from '../model.mjs';

const saved = { name: 'read_policy', args: { version: 7 }, result: 'Retained policy v7' };
const callLabel = (name, args) => name + '(version=' + args.version + ')';

export function drawTraceReplay(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.cue(id)?.phase === 'after';
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  focus.target('trace-replay-mechanism', () => {
    if (state.beat < 2) {
      write('Request 205   ·   payment-tests   ·   SHIP-4412', 145, 295, 48);
      write('ReleaseOps approval on file', 150, 386, 35, C.muted);
      write('None', 720, 386, 39, C.yellow);
      api.line(ctx, 145, 448, 1775, 448, C.muted, 2);
      const controls = [
        ['Historical', 'always serve', 'mv-trace-replay-failure'],
        ['Stable', 'require support', 'replay-stable-route'],
        ['Candidate', 'require support', 'mv-trace-replay-results'],
      ];
      controls.forEach(([program, rule, cue], i) => {
        const y = 550 + i * 155;
        write(program, 150, y, 42, i === 0 ? C.ink : i === 1 ? C.blue : C.cyan);
        write(rule, 563, y, 38, C.muted);
        api.line(ctx, 982, y - 12, 1270, y - 12, C.muted, 3);
        api.circle(ctx, 982 + 288 * focus.progress(cue, 0), y - 12, 12, C.yellow);
        const result = approvalRoute(program.toLowerCase(), false);
        write(
          done(cue) ? result : '?',
          1320,
          y,
          42,
          done(cue) ? (result === 'SERVE' ? C.pink : C.green) : C.muted,
        );
      });
      write(
        'Boolean policy replay   ·   model, corpus and evidence gate held fixed',
        960,
        999,
        30,
        C.muted,
        'center',
      );
      return;
    }
    const changed = done('mv-trace-replay-mismatch');
    const request = { name: 'read_policy', args: { version: changed ? 8 : 7 } };
    const match = replayRecordedTool(saved, request);
    write('Candidate asks for', 155, 335, 38, C.cyan);
    write('Saved invocation', 1090, 335, 38, C.blue);
    api.text(ctx, callLabel(request.name, request.args), 155, 445, 48, C.ink, 'left', 'mono');
    api.text(ctx, callLabel(saved.name, saved.args), 1090, 445, 48, C.ink, 'left', 'mono');
    write('Recorded result', 1090, 580, 35, C.muted);
    write(saved.result, 1090, 652, 46, C.blue);
    if (!match.matched) {
      api.line(ctx, 935, 592, 935, 687, C.pink, 8);
      write(
        done('reject-tool-replay') ? 'Stop here. No matching result.' : 'Use the saved result?',
        155,
        653,
        41,
        done('reject-tool-replay') ? C.pink : C.yellow,
      );
    } else if (done('mv-trace-replay-match') && match.matched) {
      api.arrow(ctx, 1020, 637, 843, 637, C.green, 5);
      write(match.result, 155, 652, 46, C.green);
    }
    write(
      changed && done('reject-tool-replay')
        ? 'Record the differing call. A version-eight comparison needs an approved source.'
        : 'Replay harness example   ·   retained tool result   ·   production effects disabled',
      960,
      915,
      32,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'trace-replay',
  draw: drawTraceReplay,
  cues: [
    'mv-trace-replay-failure',
    'replay-stable-route',
    'mv-trace-replay-results',
    'mv-trace-replay-match',
    'mv-trace-replay-mismatch',
    'reject-tool-replay',
  ],
};
