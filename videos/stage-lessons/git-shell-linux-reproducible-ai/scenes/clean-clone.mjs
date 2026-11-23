import { place } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { checkoutPair, command, output, scoreLines } from '../checkout.mjs';
import { fixturePath, repositoryContext } from '../parts.mjs';

export default function cleanClone(s, c) {
  const { main } = repositoryContext(s, c);
  const { titles, original, clone, foot } = checkoutPair(main, [
    command('git ls-files --error-unmatch -- \\'),
    output('    ' + fixturePath, 'blue'),
    output(fixturePath, 'cyan'),
    command('./scripts/install_hooks.sh'),
    command('source activate.sh || exit 1'),
    output('Python executable: …/.venv/bin/python', 'cyan'),
    output('Python: 3.15.0', 'cyan'),
    command('./repro.sh'),
    ...scoreLines,
    command('git status --short'),
  ]);
  const staged = place(mono('Staged   .python-version   requirements.txt   .env.example   activate.sh   README.md',
    { size: 33, color: 'cyan' }), foot);
  const record = place(mono('git add eval/access_requests.jsonl', { color: 'blue' }), foot);
  const commit = place(mono('git commit', { color: 'blue' }), foot);
  const freshDir = place(mono('clone_root=$(mktemp -d)', { size: 36 }), foot);
  const subshell = place(mono('( set -e', { size: 38, color: 'blue' }), foot);
  const cloneCommand = place(
    mono('git clone --no-local "$PWD" "$clone_root/access-rag"', { size: 36 }),
    foot,
  );
  const cd = place(mono('cd "$clone_root/access-rag" || exit 1', { size: 38, color: 'blue' }), foot);
  const membership = place(label('The index lists this path', { size: 38, color: 'cyan' }), foot);
  const installedHook = place(mono('scripts/pre-commit-ai-eval.sh  →  .git/hooks/pre-commit', {
    size: 38, color: 'cyan',
  }), foot);
  const saveStatus = place(mono('); clone_status=$?', { size: 39, color: 'blue' }), foot);
  const printStatus = place(mono(`printf 'Clone check exit status: %s\\n' "$clone_status"`, { size: 37, color: 'blue' }), foot);
  const exit = place(mono('Clone check exit status: 0', { color: 'green' }), foot);
  const host = place(label('Same host   •   same OS, tools and driver', { color: 'yellow' }), foot);
  s.add(titles, original, clone, staged);
  c.onBeat(0, () => s.play(original.showLines({ duration: 0.35 })));
  c.swap('record-contract', staged, record);
  c.swap('commit-setup', record, commit);
  c.swap('empty-directory', commit, freshDir);
  c.swap('start-subshell', freshDir, subshell);
  c.swap('clone-files', subshell, cloneCommand);
  c.swap('enter-clone', cloneCommand, cd);
  c.hide('tracked-input', cd);
  c.on('tracked-input', () => {
    s.play(clone.type(0, { duration: 0.65 }));
    s.play(clone.print({ from: 1, to: 1, duration: 0.35 }));
  });
  c.after('tracked-input', () => s.play(clone.print({ from: 2, to: 2, duration: 0.3 })));
  c.show('tracked-input', membership, { after: true });
  c.swap('clone-setup', membership, installedHook);
  c.on('clone-setup', () => s.play(clone.type(3, { duration: 0.6 })));
  c.on('clone-environment', () => {
    s.play(clone.type(4, { duration: 0.6 }));
    s.play(clone.print({ from: 5, to: 6, duration: 0.4 }));
  });
  c.hide('clone-environment', installedHook, { after: true });
  c.on('clone-run', () => s.play(clone.type(7, { duration: 0.65 })));
  c.on('final-receipt', () => s.play(clone.print({ from: 8, to: 11, duration: 0.65 })));
  c.on('clone-status', () => s.play(clone.type(12, { duration: 0.6 })));
  c.show('save-clone-status', saveStatus);
  c.swap('print-clone-status', saveStatus, printStatus);
  c.swap('clone-exit', printStatus, exit, { after: true });
  c.swap('host-boundary', exit, host);
}
