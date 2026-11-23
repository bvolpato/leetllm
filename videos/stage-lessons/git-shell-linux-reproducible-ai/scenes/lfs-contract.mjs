import { arrayCells, arrow, assertEqual, boxOf, column, place, table } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';
import {
  lfsDigest,
  lfsPayload,
  lfsPointer,
} from '../../../films/git-shell-linux-reproducible-ai/fixtures.mjs';

export default function lfsContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [objectBand, selectionBand, foot] = main.rows([5, 2, 1], 'wide');
  const [pointerArea, gap, payloadArea] = objectBand.columns([2, 1, 2], 'normal');
  const bytes = Array.from(lfsPayload),
    declaredSize = Number(lfsPointer.match(/size (\d+)/)[1]);
  assertEqual(bytes.length, declaredSize, 'pointer names payload size');
  const pointer = place(
    column(
      [
        label('Git LFS pointer', { color: 'cyan' }),
        mono('oid sha256:', { size: 34, color: 'cyan' }),
        ...lfsDigest.match(/.{1,16}/g).map((part) => mono(part, { size: 31, color: 'cyan' })),
        mono(`size ${declaredSize}`, { size: 34, color: 'cyan' }),
      ],
      { gap: 'normal', align: 'left' },
    ),
    pointerArea,
  );
  const payload = place(
    column(
      [
        label('checkout payload', { color: 'blue' }),
        ...[bytes.slice(0, 4), bytes.slice(4)].map((part) =>
          arrayCells(
            part.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')),
            { cell: 80, gap: 16, size: 34, indices: false, color: 'blue' },
          ),
        ),
        note(`${bytes.length} supplied bytes`),
      ],
      { gap: 'normal' },
    ),
    payloadArea,
  );
  const absent = place(
    namedBox('payload absent', {
      width: payloadArea.width,
      height: payloadArea.height * 0.7,
      dash: true,
      color: 'red',
    }),
    payloadArea,
  );
  const binding = arrow(boxOf(pointer).point('right'), boxOf(payload).point('left'), {
    stroke: 'cyan',
    pad: 24,
    width: 5,
  });
  const selection = place(
    table(
      [
        { key: 'id', label: 'artifact selection', mono: true, sample: 'model.gguf' },
        { key: 'attributes', label: 'LFS pattern', mono: true, sample: '*.gguf' },
        { key: 'ignore', label: 'ignore match', mono: true, sample: '*.gguf' },
        { key: 'add', label: 'ordinary add', sample: 'ignored', marks: true },
      ],
      [{ id: 'model.gguf', attributes: '*.gguf', ignore: '?', add: { value: '?', state: 'pending' } }],
      { width: selectionBand.width, size: 34 },
    ),
    selectionBand,
  );
  const needBytes = place(
    note('Pointer identity and payload availability are separate checks.'),
    foot,
  );
  const skeleton = place(
    mono('git add .gitignore .gitattributes', { size: 36, color: 'blue' }),
    foot,
  );
  const pull = place(mono('git lfs pull', { color: 'blue' }), foot);
  const contract = place(note('Include every required nonsecret input in setup.'), foot);
  s.add(pointer, selection);
  c.show('lfs-pointer-object', needBytes);
  c.show('lfs-missing-object', absent);
  c.hide('lfs-fetch-required', absent);
  c.swap('lfs-fetch-required', needBytes, pull);
  c.show('lfs-fetch-required', [binding, payload], { after: true });
  c.swap('lfs-no-tool', pull, skeleton);
  c.hide('lfs-no-tool', [pointer, binding, payload]);
  c.after('lfs-ignore-rule', () => s.play(selection.setCell('model.gguf', 'ignore', '*.gguf')));
  c.after('lfs-ignore-conflict', () =>
    s.play(
      selection.setCell('model.gguf', 'add', { value: 'ignored', state: 'fail' }),
      selection.light('model.gguf'),
    ),
  );
  c.swap('lfs-artifact-selection', skeleton, contract);
  c.after('lfs-trackable', () => s.play(selection.setCell('model.gguf', 'ignore', 'none'), selection.setCell('model.gguf', 'add', { value: 'trackable', state: 'pass' })));
}
