import { column, indicate, place, row, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';

export default function speculativeBlock(s, c) {
  const [header, body, footer] = area.rows([1, 4.5, 1.2], 'wide');
  const premise = place(note('Each p/q row belongs to its own exact draft prefix'), header);
  const proposal = place(
    tokens(['create', 'a', 'key'], {
      size: 40,
      minWidth: 260,
      states: {
        kept: {},
        accepted: { color: 'cyan', mark: 'check' },
        rejected: { color: 'red', dash: true, mark: 'cross', dim: true },
      },
      rows: {
        prefix: ['prompt', '+ create', '+ create a'],
        p: [0.6, 0.4, '?'],
        q: [0.8, 0.8, '?'],
        uniform: [0.2, 0.8, '?'],
      },
      rowSize: 34,
    }),
    body,
  );
  const output = place(tokens(['create', 'replacement'], { size: 40, minWidth: 300 }), footer);
  const allPass = place(
    tokens(['draft 1', 'draft 2', 'draft 3', 'target draw'], {
      size: 40,
      minWidth: 280,
      rows: { accepted: ['yes', 'yes', 'yes', 'extra position'] },
      rowSize: 34,
    }),
    body,
  );
  const separate = place(
    label('Separate all-pass iteration · up to K + 1 tokens', { color: 'yellow', size: 34 }),
    footer,
  );
  s.add(heading(c.title), [premise, proposal]);
  c.on('speculative-block-build-0', () =>
    s.play(indicate(proposal, { scale: 1, color: 'yellow' })),
  );
  c.after('speculative-block-build-1', () =>
    s.play(
      proposal.mark(0, 'accepted', { duration: 0.7 }),
      proposal.mark([1, 2], 'rejected', { duration: 0.7 }),
    ),
  );
  c.show('speculative-block-build-1', output, { after: true });
  c.swap('speculative-block-build-2', proposal, allPass);
  c.swap('speculative-block-build-2', output, separate);
}
