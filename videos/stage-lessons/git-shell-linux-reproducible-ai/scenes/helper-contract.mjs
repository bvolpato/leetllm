import { assertEqual, boxOf, codeBlock, column, place, rect, terminal, to } from 'vizmatic/stage';
import { display, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { command, output } from '../checkout.mjs';
import { repositoryContext, rows } from '../parts.mjs';
import { jsonl, newlineCount } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

export default function helperContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [filesBand, codeBand, foot] = main.rows([5, 2, 1], 'wide');
  const [fileArea, argumentArea, countArea] = filesBand.columns([4, 4, 2], 'normal');
  const files = [
    { name: 'access_requests.jsonl', content: jsonl(rows) },
    { name: 'two lines.jsonl', content: 'a\nb\n' },
    { name: 'one\nline.jsonl', content: 'c\n' },
  ];
  const total = files.reduce((n, f) => n + newlineCount(f.content), 0);
  assertEqual(total, 6, 'helper line total');
  const fileRegions = fileArea.rows([1, 2, 2, 2], 'normal');
  const argumentRegions = argumentArea.rows([1, 2, 2, 2], 'normal');
  const [countHeader, ...countRegions] = countArea.rows([1, 2, 2, 2], 'normal');
  const headers = [
    place(note('find: whole filenames'), fileRegions[0]),
    place(mono('-exec … {} +', { size: 31, color: 'blue' }), argumentRegions[0]),
    place(mono('wc -l', { size: 34, color: 'blue' }), countHeader),
  ];
  const sources = files.map((f, i) =>
    place(mono(f.name.replaceAll('\n', '\\n'), { size: 31, color: 'dim' }), fileRegions[i + 1]),
  );
  const slots = files.map((_, i) =>
    place(
      rect(argumentRegions[i + 1].width, 86, { fill: 'surface', stroke: 'blue', radius: 10 }),
      argumentRegions[i + 1],
    ),
  );
  const tokens = files.map((f, i) =>
    place(
      namedBox(f.name.replaceAll('\n', '\\n'), {
        width: fileRegions[i + 1].width,
        height: 86,
        size: 31,
        font: 'mono',
        color: 'cyan',
      }),
      fileRegions[i + 1],
    ),
  );
  const counts = files.map((f, i) =>
    place(display(String(newlineCount(f.content)), { color: 'green' }), countRegions[i]),
  );
  const [byteBand, commandBand] = codeBand.rows(2, 'normal');
  const byte = place(note('\\n = one embedded newline byte (0x0a) inside one filename'), byteBand);
  const transport = place(mono('wc -l < "$file"', { size: 36, color: 'blue' }), commandBand);
  const explicit = place(
    codeBlock('local counts\ncounts=$(find "$target" -type f -name \'*.jsonl\' -exec sh -c \'\n  for file do wc -l < "$file" || exit; done\n\' sh {} +) || return', {
      language: 'bash',
      size: 30,
      panel: false,
    }),
    codeBand,
  );
  const result = place(display(`${total} newlines`, { color: 'yellow' }), foot);
  const readError = place(mono('unreadable', { size: 36, color: 'red' }), countRegions[1]);
  const partial = place(mono('find → nonzero    total withheld', { size: 40, color: 'red' }), foot);
  const [example, outcomes] = main.rows([5, 2], 'wide');
  const absent = place(terminal([
    command('ds absent'),
    output("du: cannot access './absent': No such file or directory", 'red'),
  ], { size: 43, title: 'Directory check' }), example);
  const guard = place(mono('du -sh -- "$target" || return', { size: 49 }), outcomes);

  const [input, body] = main.rows([2, 5], 'wide');
  const read = place(column([
    mono('file="two lines.jsonl"', { size: 54 }),
    label('This file is unreadable', { color: 'red' }),
  ], { gap: 'normal' }), input);
  const alternatives = body.columns(2, 'wide');
  const versions = [
    ['Read inside the declaration', 'local n=$(wc -l < "$file")', 'local returns 0'],
    ['Declare first, then read', 'local n\nn=$(wc -l < "$file") || return', 'helper returns 1'],
  ].map(([title, source, status], i) => {
    const [snippet, result] = alternatives[i].rows([2, 1], 'normal');
    return {
      code: place(column([
        note(title),
        codeBlock(source, { language: 'bash', size: 39 }),
      ], { gap: 'wide' }), snippet),
      status: place(mono(status, { size: 48, color: i ? 'red' : 'yellow' }), result),
    };
  });
  s.add(headers, slots, tokens, transport);
  c.on('helper-read-counts', () => s.play(to(headers[2], (n) => n.color('yellow'))));
  c.show('helper-paths', byte);
  c.hide('helper-preserve', slots, { fade: 0.1 });
  c.show('helper-preserve', sources, { after: true });
  c.on(
    'helper-preserve',
    () =>
      s.play(
        ...tokens.map((token, i) =>
          to(token, (n) => n.moveTo(boxOf(slots[i]).point('center')), { duration: 0.9 }),
        ),
      ),
    0.2,
  );
  c.show('helper-original-count', counts[0], { after: true });
  c.show('helper-space-file', counts[1], { after: true });
  c.show('helper-newline-file', counts[2], { after: true });
  c.show('helper-total', result, { after: true });
  c.hide('helper-bad-file', [result, counts[2]]);
  c.swap('helper-bad-file', counts[1], readError);
  c.show('helper-stop', partial);
  c.swap('helper-stop', [transport, byte], explicit);
  c.swap('helper-failure', [headers, tokens, sources, counts[0], readError, explicit, partial],
    [absent, guard]);
  c.swap('helper-declaration', [absent, guard], [read, versions[0].code]);
  c.show('helper-masked', versions[0].status, { after: true });
  c.show('helper-assignment', versions[1].code);
  c.show('helper-propagated', versions[1].status, { after: true });
}
