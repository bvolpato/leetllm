import { boxOf, codeBlock, column, place, table, to } from 'vizmatic/stage';
import { chip, label, mono, namedBox } from '../../kit-narrated.mjs';
import { fixturePath, repositoryContext, rows, score } from '../parts.mjs';
import { jsonl, newlineCount } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

export default function inputContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [head, body, foot] = main.rows([1, 4.5, 1.4], 'normal');
  const path = place(mono(fixturePath, { color: 'cyan' }), head);
  const fields = place(mono('prompt     expected     prediction', { color: 'cyan' }), foot);
  const checks = place(
    table(
      [
        { key: 'id', label: 'input', sample: 'empty input' },
        { key: 'test', label: 'parser checks', sample: 'nonempty text in all three fields' },
        { key: 'out', label: 'score this?', sample: 'rejected', marks: true },
      ],
      [
        { id: 'request 101', test: 'nonempty text in all three fields', out: '?' },
        { id: '[]', test: 'JSON object', out: '?' },
        { id: 'absent field', test: 'all required fields', out: '?' },
        { id: 'empty input', test: 'at least one valid object', out: '?' },
      ],
      { width: body.width * 0.9, size: 40, leading: 1.85 },
    ),
    body,
  );
  const normalize = place(
    table(
      [
        { key: 'id', label: 'label', sample: 'prediction' },
        { key: 'raw', label: 'in the file', mono: true, sample: '" BLOCKED "' },
        { key: 'compared', label: 'label.strip().lower()', mono: true, sample: 'escalated' },
      ],
      [
        { id: 'expected', raw: '"blocked"', compared: '?' },
        { id: 'prediction', raw: '" BLOCKED "', compared: '?' },
      ],
      { width: body.width * 0.9, size: 44, leading: 2.1 },
    ),
    body,
  );
  const recordAreas = body.rows(rows.length, 'normal');
  const objects = [],
    ends = [];
  for (const [i, record] of rows.entries()) {
    const [name, object, terminator] = recordAreas[i].columns([1, 7, 1], 'normal');
    const id = record.prompt.match(/\d+/)[0];
    objects.push(
      place(mono(id, { size: 42 }), name),
      place(
        namedBox(
          '…,"expected":' +
            JSON.stringify(record.expected) +
            ',"prediction":' +
            JSON.stringify(record.prediction) +
            '}',
          {
            width: object.width,
            height: 100,
            size: 37,
            color: 'ink',
            font: 'mono',
          },
        ),
        object,
      ),
    );
    ends.push(
      place(
        namedBox('0A', { width: terminator.width * 0.64, height: 100, size: 43, color: 'cyan' }),
        terminator,
      ),
    );
  }
  const original = jsonl(rows),
    edited = original.slice(0, -1);
  // These three example records contain ASCII labels and no embedded line separators.
  const result = score(edited.split('\n').map(line => JSON.parse(line)));
  const reader = place(codeBlock([
    'def reject_constant(token):',
    '    raise ValueError(f"invalid JSON constant: {token}")',
    '',
    'with path.open(encoding="utf-8", newline="\\n") as source:',
    '    for n, line in enumerate(source, 1):',
    '        try:',
    '            row = json.loads(line, parse_constant=reject_constant)',
    '        except ValueError as error:',
    '            raise SystemExit(f"line {n}: {error}")',
  ].join('\n'), { language: 'python', size: 33, panel: false }), body);
  const [promptHead, promptRow, captions] = body.rows([1, 2, 1], 'normal');
  const promptTitle = place(label('Inside one prompt string', { size: 44 }), promptHead);
  const slots = promptRow.columns([3, 1, 3], 'tight');
  const first = place(mono('"first', { size: 52 }), slots[0], 'right');
  const separator = place(chip('U+2028', { color: 'yellow' }), slots[1]);
  const second = place(mono('second"', { size: 52 }), slots[2], 'left');
  const promptBytes = [promptTitle, first, separator, second];
  const joined = [first, second].map(node => boxOf(node).point('center'));
  const splitPositions = promptRow.columns(2, 'wide').map(region => region.point('center'));
  const fragments = captions.columns(2, 'wide').map((region, i) =>
    place(mono('fragment ' + (i + 1), { size: 36, color: 'red' }), region),
  );
  const moveParts = positions => [first, second].map((node, i) =>
    to(node, part => part.moveTo(positions[i]), { duration: 0.75 }),
  );
  const split = place(mono('splitlines()   →   first fragment ends inside a string', { size: 40, color: 'red' }), foot);
  const intact = place(mono('LF reader → one JSON object', { size: 40, color: 'green' }), foot);
  const endTitle = place(label('End of request 101', { size: 44 }), promptHead);
  const [recordEnd, lf1, lf2] = promptRow.columns([4, 1, 1], 'normal');
  const recordTail = place(mono('… "prediction":"approved"}', { size: 44 }), recordEnd, 'right');
  const lfMark = region => place(chip('0A', { color: 'cyan' }), region);
  const firstLF = lfMark(lf1);
  const secondLF = lfMark(lf2);
  const [tailNote, firstNote, secondNote] = captions.columns([4, 1, 1], 'normal');
  const bytesKey = place(label('0A = line feed', { size: 34, color: 'dim' }), tailNote, 'right');
  const endOne = place(mono('end line 1', { size: 33 }), firstNote);
  const endTwo = place(mono('end line 2', { size: 33 }), secondNote);
  const blankError = place(label('Line 2 has no JSON value', { size: 40, color: 'red' }), foot);
  const oneLine = [endTitle, recordTail, firstLF, endOne, bytesKey];
  const extra = place(column([
    label('An extra field on request 101', { size: 44 }),
    mono('"cost": NaN', { size: 55, color: 'yellow' }),
  ], { gap: 'wide' }), body);
  const permissive = place(mono('json.loads(line)   →   accepts NaN', { size: 40, color: 'yellow' }), foot);
  const constant = place(mono('bare NaN    →    decoder error before scoring', { size: 37, color: 'red' }), foot);
  const before = place(
    mono('wc -l    ' + newlineCount(original), { color: 'cyan' }),
    foot.columns(3, 'normal')[0],
  );
  const after = place(
    mono('wc -l    ' + newlineCount(edited), { color: 'yellow' }),
    foot.columns(3, 'normal')[0],
  );
  const parsed = place(mono('objects    ' + result.total), foot.columns(3, 'normal')[1]);
  const matches = place(
    mono('matches    ' + result.correct, { color: 'green' }),
    foot.columns(3, 'normal')[2],
  );
  s.add(path, checks);
  c.show('record-valid', fields);
  c.after('record-valid', () =>
    s.play(checks.setCell('request 101', 'out', { value: 'accepted', state: 'pass' })),
  );
  c.after('record-validation', () =>
    s.play(checks.setCell('[]', 'out', { value: 'rejected', state: 'fail' })),
  );
  c.after('record-invalid', () =>
    s.play(
      ...['absent field', 'empty input'].map((id) =>
        checks.setCell(id, 'out', { value: 'rejected', state: 'fail' }),
      ),
    ),
  );
  c.swap('strict-reader', [checks, fields], promptBytes);
  c.hide('split-prompt', separator);
  c.on('split-prompt', () => s.play(...moveParts(splitPositions)));
  c.show('split-prompt', [fragments, split], { after: true });
  c.hide('use-line-feed', [fragments, split]);
  c.on('use-line-feed', () => s.play(...moveParts(joined)));
  c.show('use-line-feed', [separator, intact], { after: true });
  c.swap('final-lf', [promptBytes, intact], oneLine);
  c.show('blank-line', [secondLF, endTwo], { after: true });
  c.show('blank-error', blankError, { after: true });
  c.swap('bare-constant', [oneLine, secondLF, endTwo, blankError], [extra, permissive]);
  c.swap('strict-constant', [extra, permissive], [reader, constant]);
  c.swap('stored-labels', [reader, constant], normalize);
  c.on('normalize-labels', () =>
    s.play(
      normalize.setCell('expected', 'compared', 'blocked'),
      normalize.setCell('prediction', 'compared', 'blocked'),
    ),
  );
  c.on('normalization-miss', () =>
    s.play(
      normalize.setCell('prediction', 'raw', '"escalated"'),
      normalize.setCell('prediction', 'compared', 'escalated'),
    ),
  );
  c.swap('original-bytes', normalize, [objects, ends, before]);
  c.hide('remove-final-newline', [ends.at(-1), before], { after: true });
  c.show('newline-count-reveal', after);
  c.show('record-count-reveal', parsed);
  c.show('match-count-reveal', matches);
}
