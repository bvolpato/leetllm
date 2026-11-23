import { cueProgress } from '../construction.mjs';
import { caption, mark, terminal } from '../defaults.mjs';
export function drawRemoteJobs(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    detached = cueProgress(state, 'ssh-detach', 0),
    log = cueProgress(state, 'log-continues', 0, 0.35, 0.6),
    reattached = cueProgress(state, 'session-reattach', 0, 0.72, 0.92);
  if (currentBeat === 0) {
    mark(api, 'session-state', () =>
      terminal(
        ctx,
        api,
        'tmux session: eval',
        [
          '$ tmux new -s eval',
          '$ ./scripts/eval_loop.sh',
          detached === 1 && reattached < 1
            ? 'SSH disconnected · session running'
            : reattached === 1
              ? '$ tmux attach -t eval'
              : 'SSH attached',
        ],
        150,
        335,
        1620,
        275,
        {
          size: 34,
        },
      ),
    );
    mark(api, 'job-log', () =>
      terminal(
        ctx,
        api,
        'Same evaluation · runs/eval.log',
        [
          'check 1: 2/3 · exit 0',
          ...(log === 1 ? ['check 2: 2/3 · exit 0'] : ['next evaluation in progress']),
        ],
        150,
        680,
        1620,
        200,
        {
          size: 36,
          color: api.C.green,
        },
      ),
    );
  } else {
    const launched = cueProgress(state, 'nohup-command', 1),
      priority = cueProgress(state, 'nice-priority', 1, 0.7, 0.9);
    mark(api, 'launch-command', () =>
      terminal(
        ctx,
        api,
        'Noninteractive alternative',
        [
          '$ nohup ./scripts/eval_loop.sh > runs/eval.log 2>&1 < /dev/null &',
          ...(launched === 1
            ? ['$ job_pid=$!', '$ tail -n 2 runs/eval.log']
            : ['launch and redirections pending']),
          ...(priority > 0 ? ['$ nice -n 10 ./repro.sh'] : []),
        ],
        150,
        340,
        1620,
        415,
        {
          size: 30,
          lineHeight: 75,
        },
      ),
    );
    caption(ctx, api, 'nohup: ignore hangup · tmux: reattach · nice: CPU scheduling priority');
  }
}
export default {
  id: 'remote-jobs',
  draw: drawRemoteJobs,
  cues: ['ssh-detach', 'log-continues', 'session-reattach', 'nohup-command', 'nice-priority'],
};
