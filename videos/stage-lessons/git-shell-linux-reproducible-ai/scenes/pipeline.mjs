import { arrow, beside, boxOf, column, dot, place, to } from 'vizmatic/stage';
import { display, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';
import { pipelineResult } from '../../../films/git-shell-linux-reproducible-ai/model.mjs';

export default function pipelineScene(s, c) {
  const { main } = repositoryContext(s, c);
  const [commandBand, processBand, errorBand, resultBand] = main.rows([1, 4, 2, 1], 'wide');
  const command = place(
    mono('grep restored eval/missing.jsonl | wc -l', { size: 40, color: 'blue' }),
    commandBand,
  );
  const [left, gap, right] = processBand.columns([2, 1, 2], 'normal');
  const [grepBody, grepStatus] = left.rows([2, 1], 'wide');
  const [wcBody, wcStatus] = right.rows([2, 1], 'wide');
  const grep = place(
    namedBox('grep', { width: grepBody.width, height: 160, color: 'blue', size: 58 }),
    grepBody,
  );
  const wc = place(
    namedBox('wc -l', { width: wcBody.width, height: 160, color: 'blue', size: 58 }),
    wcBody,
  );
  const plain = pipelineResult(false),
    strict = pipelineResult(true);
  const failed = place(mono(`exit ${plain.upstream.status}`, { color: 'red' }), grepStatus);
  const success = place(mono(`exit ${plain.downstream.status}`, { color: 'green' }), wcStatus);
  const pipeLabel = gap.rows([1, 2], 'none')[0];
  const output = place(note('stdout → stdin'), pipeLabel);
  const empty = place(note('0 bytes', { color: 'cyan' }), pipeLabel);
  const pipe = arrow(boxOf(grep).point('right'), boxOf(wc).point('left'), {
    stroke: 'cyan',
    pad: 14,
    width: 5,
  });
  const stderr = place(
    column(
      [
        label('stderr', { color: 'red' }),
        mono('eval/missing.jsonl', { size: 34, color: 'red' }),
        note('No such file or directory', { color: 'red' }),
      ],
      { gap: 'tight' },
    ),
    errorBand.columns([2, 1, 2], 'normal')[0],
  );
  const errorRoute = arrow(boxOf(grep).point('bottom left'), boxOf(stderr).point('top left'), {
    stroke: 'red',
    pad: 18,
  });
  const zero = place(
    column([display(plain.downstream.stdout, { color: 'cyan' }), note('printed by wc')], {
      gap: 'tight',
    }),
    errorBand.columns([2, 1, 2], 'normal')[2],
  );
  const defaultResult = place(
    mono(`default pipeline: exit ${plain.status}`, { color: 'green' }),
    resultBand,
  );
  const strictResult = place(
    mono(`pipefail pipeline: exit ${strict.status}`, { color: 'red' }),
    resultBand,
  );
  const enable = place(mono('set -o pipefail', { color: 'blue' }), resultBand);
  const lamp = beside(dot(15, 'yellow'), failed, 'under', 'normal');
  const selectorTarget = boxOf(lamp).point('center');
  beside(lamp, success, 'under', 'normal');
  s.add(command, grep, wc, pipe, output, errorRoute, stderr);
  c.show('pipe-stream', failed);
  c.swap('pipe-empty', output, empty);
  c.show('wc-finished', [success, zero], { after: true });
  c.show('last-status', [defaultResult, lamp], { after: true });
  c.swap('enable-pipefail', defaultResult, enable);
  c.on('pipefail-result', () =>
    s.play(to(lamp, (n) => n.moveTo(selectorTarget), { duration: 1.0 })),
  );
  c.swap('pipefail-result', enable, strictResult, { after: true });
  c.clear([pipe, errorRoute], 0.46, 0.2);
}
