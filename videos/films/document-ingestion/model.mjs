import {
  FENCE,
  MARKDOWN_TEXT,
  PATCH_SCORES,
  RULES,
  SOURCES,
  SOURCE_BYTES,
  SOURCE_TEXT,
  freshBase,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const sha = (text) => createHash('sha256').update(text).digest('hex');
// Seven actual PDF pages bind the displayed source checksum to the fixture bytes.
export function evidenceRecord(type, text = type === 'markdown' ? MARKDOWN_TEXT : SOURCE_TEXT) {
  const routes = {
    pdf: 'native-pdf',
    scan: 'ocr',
    html: 'main-content',
    markdown: 'heading-fence',
  };
  if (!routes[type]) throw new Error('Unknown source adapter ' + type);
  return {
    source:
      'release-runbook.' +
      {
        pdf: 'pdf',
        scan: 'scan.pdf',
        html: 'html',
        markdown: 'md',
      }[type],
    revision: 7,
    page: type === 'pdf' || type === 'scan' ? 7 : null,
    section: 'Operations / Rollback',
    type,
    parser: routes[type],
    parserVersion: '2.4',
    quality: type === 'scan' ? 'needs-review' : 'reviewed',
    trust: 'external evidence',
    text,
    sourceChecksum: sha(SOURCES[type]),
    extractChecksum: sha(text),
    structure: true,
  };
}
export const RECORDS = ['pdf', 'scan', 'html', 'markdown'].map((type) =>
  type === 'scan'
    ? evidenceRecord(type, SOURCE_TEXT.replace('15 minutes', '1S minutes'))
    : evidenceRecord(type),
);
export function admitted(record) {
  if (!SOURCES[record.type]) return false;
  const reviewedText = record.type === 'markdown' ? MARKDOWN_TEXT : SOURCE_TEXT;
  return (
    record.quality === 'reviewed' &&
    record.structure &&
    record.revision === 7 &&
    record.section === 'Operations / Rollback' &&
    record.sourceChecksum === sha(SOURCES[record.type]) &&
    record.extractChecksum === sha(record.text) &&
    record.text === reviewedText
  );
}
export function makeChunks(record) {
  const first = record.text.indexOf('Rollback failure'),
    overlap = record.text.indexOf('Include deploy ID.');
  return [
    [first, record.text.indexOf('\n', first)],
    [overlap, record.text.length],
  ].map(([start, end]) => ({
    ...record,
    start,
    end,
    text: record.text.slice(start, end),
    parentChecksum: record.extractChecksum,
    extractChecksum: sha(record.text.slice(start, end)),
  }));
}
export function versionDiff(oldRecords, newRecords) {
  const oldMap = new Map(oldRecords.map((row) => [row.id, row])),
    newMap = new Map(newRecords.map((row) => [row.id, row]));
  const added = [...newMap.keys()].filter((id) => !oldMap.has(id)),
    removed = [...oldMap.keys()].filter((id) => !newMap.has(id));
  const shared = [...newMap.keys()].filter((id) => oldMap.has(id));
  return {
    added,
    removed,
    changed: shared.filter((id) => oldMap.get(id).text !== newMap.get(id).text),
    access: shared.filter(
      (id) => JSON.stringify(oldMap.get(id).access) !== JSON.stringify(newMap.get(id).access),
    ),
  };
}
export function lateInteraction(scores) {
  return scores.reduce((sum, row) => sum + Math.max(...row), 0);
}
export function sourceGate(record, reader) {
  const review = record.quality !== 'ready' || record.text !== record.reviewedText;
  return {
    quality: review ? 'review' : 'ready',
    indexable: !review && record.trust === 'untrusted_source',
    readable: !review && record.trust === 'untrusted_source' && record.access.includes(reader),
  };
}
export function freshIngestion(stage) {
  const record = {
    ...freshBase,
    ...(stage > 0
      ? {
          quality: 'ready',
          text: freshBase.reviewedText,
        }
      : {}),
    ...(stage > 1
      ? {
          access: ['incident-commanders'],
        }
      : {}),
  };
  return {
    record,
    ...sourceGate(record, 'ops'),
  };
}
export function introSnapshot(state) {
  const beat = state.beat ?? 0;
  const cues = state.cues ?? {};
  const started = (id) => ['during', 'after'].includes(cues[id]?.phase);
  const saved = beat > 1 || started('open-extract');
  return {
    page: true,
    saved,
    storedRules: saved ? (cues['both-lines']?.phase === 'after' ? RULES : [RULES[1]]) : [],
  };
}
export function validateModel() {
  assert.ok(SOURCE_BYTES.subarray(0, 8).toString().startsWith('%PDF-1.4'));
  assert.ok(
    SOURCE_BYTES.toString().includes('/Count 7') && SOURCE_BYTES.toString().includes('15 minutes'),
  );
  assert.deepEqual(
    RECORDS.map((record) => record.parser),
    ['native-pdf', 'ocr', 'main-content', 'heading-fence'],
  );
  assert.ok(RECORDS[1].text.includes('1S minutes') && !admitted(RECORDS[1]));
  assert.ok(
    !admitted({
      ...RECORDS[1],
      quality: 'reviewed',
    }),
  );
  assert.ok(RECORDS[3].text.includes(FENCE + 'sh') && !RECORDS[2].text.includes('Navigation'));
  assert.deepEqual(
    RECORDS.filter(admitted).map((record) => record.type),
    ['pdf', 'html', 'markdown'],
  );
  assert.ok(
    !admitted({
      ...RECORDS[0],
      text: RECORDS[0].text.replace('15', '150'),
    }),
  );
  assert.ok(
    !admitted({
      ...RECORDS[0],
      quality: 'needs-review',
    }),
  );
  const chunks = makeChunks(RECORDS[0]);
  assert.ok(chunks[0].end > chunks[1].start);
  assert.ok(
    chunks.every(
      (chunk) =>
        chunk.page === 7 &&
        chunk.parentChecksum === RECORDS[0].extractChecksum &&
        SOURCE_TEXT.slice(chunk.start, chunk.end) === chunk.text,
    ),
  );
  assert.ok(
    chunks[0].text.includes('15 minutes') &&
      chunks[0].text.includes('Include deploy ID') &&
      chunks[1].text.includes('14 days'),
  );
  assert.ok(Math.abs(PATCH_SCORES.reduce((sum, row) => sum + Math.max(...row), 0) - 1.79) < 1e-12);
  assert.deepEqual(introSnapshot({ beat: 0 }).storedRules, []);
  assert.deepEqual(introSnapshot({ beat: 2 }).storedRules, [RULES[1]]);
  assert.deepEqual(introSnapshot({ beat: 2, cues: { 'both-lines': { phase: 'after' } } }).storedRules, RULES);
  const obsolete = 'Obsolete rule:\n' + RECORDS[0].text;
  assert.equal(admitted({ ...RECORDS[0], text: obsolete, extractChecksum: sha(obsolete) }), false);
  return true;
}
