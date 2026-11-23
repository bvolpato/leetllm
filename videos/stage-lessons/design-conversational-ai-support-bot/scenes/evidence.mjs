import { assertEqual, dynamic, fitted, place, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, hash, open } from '../parts.mjs';
import { sampleModel } from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function evidence(s, c) {
  open(s, c, 'contract-and-fallback');
  const [contractBand, matrixArea, documentArea, outcomeArea] = MAIN.rows(
    [0.8, 3, 2, 0.8],
    'normal',
  );
  const contract = place(
    label('US · duplicate-credit · current published policy', { size: 36, color: 'green' }),
    contractBand,
  );
  const canadian = place(
    label('CA · duplicate-credit · current published policy', { size: 36, color: 'yellow' }),
    contractBand,
  );
  const checks = ['publication', 'region', 'topic', 'version', 'digest'];
  const normal = sampleModel('evidence', { beat: 0 });
  const columns = [
    { key: 'doc', label: 'document' },
    ...checks.map((key) => ({
      key,
      label: key === 'publication' ? 'published' : key,
      sample: 'yes',
      marks: true,
    })),
  ];
  const matrix = place(
    fitted(matrixArea, (width) =>
      table(
        columns,
        normal.rows.map((doc, i) => ({
          id: String(i),
          doc: doc.id,
          ...Object.fromEntries(checks.map((key) => [key, { value: '', state: 'pending' }])),
        })),
        { width, size: 30, leading: 1.9 },
      ),
    ),
    matrixArea,
  );
  const originalDoc = normal.rows[0];
  const editedDoc = sampleModel('evidence', { beat: 1 }).rows[0];
  assertEqual(
    hash(originalDoc.text),
    originalDoc.digest,
    'Original document bytes match the stored digest.',
  );
  assertEqual(
    hash(editedDoc.text) === originalDoc.digest,
    false,
    'Editing the bytes breaks the digest.',
  );
  const edited = s.value(0);
  const [excerptArea, digestArea] = documentArea.rows([1, 1.8], 'normal');
  const excerpt = dynamic(() =>
    place(
      label((edited.value > 0.5 ? editedDoc : originalDoc).text, {
        size: 30,
        color: edited.value > 0.5 ? 'red' : 'green',
      }),
      excerptArea,
    ),
  );
  const digests = place(
    fitted(digestArea, (width) =>
      table(
        [
          { key: 'stored', label: 'Stored SHA-256 prefix' },
          { key: 'computed', label: 'Computed prefix', sample: 'aaaaaaaaaaaa', marks: true },
        ],
        [
          {
            id: 'bytes',
            stored: originalDoc.digest.slice(0, 12),
            computed: { value: '', state: 'pending' },
          },
        ],
        { width, size: 30, leading: 1.8 },
      ),
    ),
    digestArea,
  );
  const reset = place(
    label('Reset: original corpus restored', { size: 36, color: 'green' }),
    outcomeArea,
  );
  const admitted = place(label('ADMIT: US-v3', { color: 'green' }), outcomeArea);
  const changed = place(label('Changed bytes: no admitted policy', { color: 'red' }), outcomeArea);
  const missing = place(
    label('ABSTAIN: no published Canadian policy', { color: 'red' }),
    outcomeArea,
  );
  const foot = place(
    note('A digest checks byte identity. Trusted publication and review establish suitability.'),
    FOOT,
  );
  s.add(contract, matrix, excerpt, digests, foot);
  const fill = (beat, which = checks) => {
    const model = sampleModel('evidence', { beat });
    s.play(
      ...model.rows.flatMap((doc, i) =>
        which.map((key) =>
          matrix.setCell(
            String(i),
            key,
            {
              value: doc.errors.includes(key) ? 'no' : 'yes',
              state: doc.errors.includes(key) ? 'fail' : 'pass',
            },
            { duration: 0.45 },
          ),
        ),
      ),
    );
  };
  c.on('admit-policy', () => {
    fill(0, ['region', 'topic', 'version']);
  });
  c.on('published-check', () => {
    fill(0, ['publication']);
  });
  c.on('content-check', () => {
    fill(0, ['digest']);
    s.play(
      digests.setCell('bytes', 'computed', {
        value: hash(originalDoc.text).slice(0, 12),
        state: 'pass',
      }),
    );
  });
  c.show('content-check', admitted, { after: true });
  c.on('changed-bytes', () =>
    s.play(
      edited.to(1, { duration: 0.1 }),
      matrix.light('0', 'digest'),
      digests.setCell('bytes', 'computed', {
        value: hash(editedDoc.text).slice(0, 12),
        state: 'pending',
      }),
    ),
  );
  c.after('digest-fails', () => {
    fill(1, ['digest']);
    s.play(digests.setCell('bytes', 'computed', { state: 'fail' }));
  });
  c.swap('digest-fails', admitted, changed, { after: true });
  c.on('original-corpus', () => {
    fill(0);
    s.play(
      edited.to(0, { duration: 0.1 }),
      matrix.light(null),
      digests.setCell('bytes', 'computed', {
        value: hash(originalDoc.text).slice(0, 12),
        state: 'pass',
      }),
    );
  });
  c.swap('original-corpus', changed, reset);
  c.swap('missing-region', contract, canadian);
  c.hide('missing-region', reset);
  c.on('missing-region', () => s.play(matrix.light(null, 'region')));
  c.after('missing-region', () => {
    fill(2);
  });
  c.show('region-disposition', missing, { after: true });
}
