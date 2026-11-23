import { codeBlock, fitted, lanes, place, terminal } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { command } from '../checkout.mjs';
import { jobPicture, repositoryContext } from '../parts.mjs';

export default function remoteJobs(s, c) {
  const { main } = repositoryContext(s, c);
  const { flow, commandBand, identityBand, foot } = jobPicture(main, lanes, fitted, 'tmux');
  const { flow: backgroundFlow } = jobPicture(main, lanes, fitted, 'background');
  const scriptName = place(mono('scripts/eval_loop.sh', { color: 'cyan' }), commandBand);
  const script = place(codeBlock([
    'checks=0',
    'trap \'echo "Final log line"; exit 0\' TERM',
    'while :; do',
    '  ./repro.sh || exit "$?"',
    '  checks=$((checks + 1))',
    '  echo "check $checks"',
    '  sleep 1',
    'done',
  ].join('\n'), { language: 'bash', size: 44, panel: false }), main);
  const session = place(mono("tmux new -s eval 'bash scripts/eval_loop.sh'", { color: 'blue' }), commandBand);
  const reattach = place(mono('tmux attach -t eval', { color: 'blue' }), commandBand);
  const background = place(terminal([
    command('mkdir -p runs'),
    command('nohup bash scripts/eval_loop.sh >runs/eval.log 2>&1 </dev/null &'),
    command('job_pid=$!'),
  ], { title: 'Noninteractive loop', size: 34, shown: false }), identityBand);
  const nice = place(mono('Inside tmux:  nice -n 10 bash scripts/eval_loop.sh', { size: 38, color: 'blue' }), foot);
  s.add(scriptName, script);
  c.swap('start-session', [scriptName, script], [session, flow]);
  c.on('start-session', () => s.play(flow.advance(1.5, { duration: 0.8 })), 0.45);
  c.on('ssh-detach', () => s.play(flow.advance(3, { duration: 1.1 })));
  c.after('log-continues', () => s.play(flow.advance(4.5, { duration: 1.1 })));
  c.swap('session-reattach', session, reattach);
  c.on('session-reattach', () => s.play(flow.advance(6, { duration: 1.1 })));
  c.swap('launch-loop', reattach, background);
  c.hide('launch-loop', flow);
  c.on('launch-loop', () => s.play(background.type(0, { duration: 0.5 })), 0.35);
  c.on('nohup-command', () => s.play(background.type(1, { duration: 1.2 })));
  c.show('nohup-command', backgroundFlow);
  c.on('save-pid', () => s.play(background.type(2, { duration: 0.5 })));
  c.after('save-pid', () => s.play(backgroundFlow.advance(6, { duration: 3.5 })));
  c.show('nice-priority', nice);
  c.keep(backgroundFlow);
}
