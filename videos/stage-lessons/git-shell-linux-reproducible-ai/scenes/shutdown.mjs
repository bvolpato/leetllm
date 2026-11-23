import { assertEqual, codeBlock, fitted, lanes, place, table } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { jobPicture, repositoryContext } from '../parts.mjs';
import { job, replacement } from '../../../films/git-shell-linux-reproducible-ai/fixtures.mjs';
import { sameProcess } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

export default function shutdown(s, c) {
  const { main } = repositoryContext(s, c);
  const { flow, commandBand, identityBand, foot } = jobPicture(main, lanes, fitted, 'background');
  const command = place(mono('ps -o user=,pid=,lstart=,args= -p "$job_pid"', { size: 36, color: 'blue' }), commandBand);
  const permissions = place(
    mono('test -r eval/access_requests.jsonl && test -x scripts/run_eval.sh', {
      size: 34,
      color: 'blue',
    }),
    commandBand,
  );
  const identityRow = (id, p) => ({
    id,
    owner: p.owner,
    pid: p.pid,
    start: p.started,
    command: p.command,
  });
  const identity = place(
    table(
      [
        { key: 'id', label: 'observation', sample: 'after wait' },
        { key: 'owner', label: 'owner', mono: true },
        { key: 'pid', label: 'PID', mono: true },
        { key: 'start', label: 'start (time of day)', mono: true },
        { key: 'command', label: 'command', mono: true, sample: job.command },
      ],
      [identityRow('first', job)],
      { width: identityBand.width, size: 34, leading: 1.8, maxRows: 2 },
    ),
    identityBand,
  );
  const term = place(mono('kill -TERM "$job_pid"', { color: 'blue' }), commandBand);
  const poll = place(codeBlock([
    'for _ in {1..10}; do',
    '  kill -0 "$job_pid" 2>/dev/null || break',
    '  sleep 1',
    'done',
  ].join('\n'), { language: 'bash', size: 39, leading: 1.3, panel: false }), identityBand);
  const branch = place(codeBlock([
    'if kill -0 "$job_pid" 2>/dev/null; then',
    '  echo "PID still present. Recheck its identity."',
    'else',
    '  job_status=0; wait "$job_pid" || job_status=$?',
    'fi',
  ].join('\n'), { language: 'bash', size: 37, leading: 1.3, panel: false }), identityBand);
  const running = place(mono('evaluation running', { color: 'blue' }), foot);
  const requested = place(mono('TERM requested', { color: 'yellow' }), foot);
  const flushing = place(mono('final log line written', { color: 'cyan' }), foot);
  const gone = place(mono('PID probe returned 1', { size: 36, color: 'cyan' }), foot);
  const exited = place(mono('job_status = 0', { color: 'green' }), foot);
  const exists = place(
    mono('kill -0 "$job_pid"    →    status 0', { color: 'yellow' }),
    commandBand,
  );
  const stop = place(
    mono('Leave ' + replacement.command + ' running', { color: 'ink' }),
    commandBand,
  );
  assertEqual(sameProcess(job, replacement), false, 'PID reuse');
  s.add(command, identity, running);
  c.take(flow, () => s.play(flow.advance(6, { duration: 0 })));
  c.on('process-identity', () => s.play(identity.light('first')));
  c.swap('file-permissions', command, permissions);
  c.swap('send-term', permissions, term);
  c.on('send-term', () => s.play(flow.advance(7, { duration: 0.8 })));
  c.swap('send-term', running, requested);
  c.swap('grace-period', identity, poll);
  c.after('flush-log', () => s.play(flow.advance(8, { duration: 0.8 })));
  c.swap('flush-log', requested, flushing, { after: true });
  c.after('pid-gone', () => s.play(flow.advance(9.5, { duration: 0.9 })));
  c.swap('deadline-check', poll, branch);
  c.swap('deadline-check', flushing, gone, { after: true });
  c.on('still-present', () => s.play(branch.focus(0, { dim: 0.65 })));
  c.on('collect-exit', () => s.play(branch.focus(3, { dim: 0.54 })));
  c.swap('child-status', gone, exited, { after: true });
  c.swap('pid-exists', [term, branch], [exists, identity]);
  c.on('identity-recheck', () =>
    s.play(identity.append(identityRow('after wait', replacement), { duration: 0.6 })),
  );
  c.swap('leave-replacement', exists, stop);
  c.clear(flow.rails, 0.46, 0.2);
}
