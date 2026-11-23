import { job, replacement } from '../fixtures.mjs';
import { shutdownFrame } from '../model.mjs';
import { caption, mark, terminal, text } from '../defaults.mjs';
export function drawShutdown(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    modelState = shutdownFrame(state);
  if (currentBeat === 0) {
    mark(api, 'process-row', () =>
      terminal(
        ctx,
        api,
        'Illustrative process listing · verify your actual authorized job',
        [
          '$ ps -o user,pid,lstart,cmd -p "$job_pid"',
          'OWNER    PID   START      COMMAND',
          `${job.owner}  ${job.pid}  ${job.started}   ${job.command}`,
        ],
        150,
        330,
        1620,
        300,
        {
          size: 32,
          lineHeight: 65,
        },
      ),
    );
    mark(api, 'permission-check', () =>
      terminal(
        ctx,
        api,
        'Check the exact capabilities the command needs',
        ['test -r eval/access_requests.jsonl → yes', 'test -x scripts/eval_loop.sh → yes'],
        250,
        720,
        1420,
        200,
        {
          size: 33,
          color: api.C.green,
        },
      ),
    );
  } else if (currentBeat === 1) {
    mark(api, 'shutdown-action', () =>
      terminal(
        ctx,
        api,
        'Request and completion are separate',
        [
          modelState.term > 0 ? '$ kill -TERM "$job_pid"' : 'TERM not requested yet',
          modelState.collected === 1
            ? '$ wait "$job_pid" → exit 0'
            : modelState.term > 0
              ? 'bounded wait: cleanup pending'
              : 'evaluation running',
        ],
        150,
        340,
        1620,
        245,
        {
          color: modelState.collected === 1 ? api.C.green : api.C.yellow,
          size: 38,
        },
      ),
    );
    mark(api, 'shutdown-log', () =>
      terminal(
        ctx,
        api,
        'runs/eval.log',
        [
          modelState.log,
          modelState.collected === 1
            ? 'evaluation process exited'
            : modelState.term > 0
              ? 'evaluation process still shutting down'
              : 'evaluation process running',
        ],
        150,
        670,
        1620,
        210,
        {
          color: api.C.cyan,
          size: 36,
        },
      ),
    );
  } else
    mark(api, 'replacement-process', () => {
      terminal(
        ctx,
        api,
        'Later existence check · same number, compare identity again',
        [
          '$ kill -0 "$job_pid" → status 0',
          '$ ps -o user,pid,lstart,cmd -p "$job_pid"',
          modelState.recheck > 0
            ? `${replacement.owner}  ${replacement.pid}  ${replacement.started}   ${replacement.command}`
            : 'identity inspection pending',
        ],
        150,
        340,
        1620,
        350,
        {
          color: api.C.pink,
          size: 33,
          lineHeight: 73,
        },
      );
      text(
        ctx,
        api,
        modelState.recheck === 1
          ? 'Different start and command · no signal sent'
          : 'Read the replacement identity before considering a signal',
        960,
        835,
        40,
        api.C.yellow,
        'center',
      );
      caption(
        ctx,
        api,
        'The original evaluation already exited · PID existence alone carries no process identity',
      );
    });
}
export default {
  id: 'shutdown',
  draw: drawShutdown,
  cues: [
    'process-identity',
    'file-permissions',
    'send-term',
    'flush-log',
    'collect-exit',
    'identity-recheck',
  ],
};
