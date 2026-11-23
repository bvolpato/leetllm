export const RULES = Object.freeze([
  {
    event: 'Rollback failure',
    action: 'Page on-call',
    time: 15,
    unit: 'minutes',
    qualifier: 'Include deploy ID',
  },
  {
    event: 'Routine notes',
    action: 'Archive',
    time: 14,
    unit: 'days',
    qualifier: 'Completed release',
  },
]);
export const sentence = (row) =>
  row.event +
  ': ' +
  row.action.toLowerCase() +
  ' within ' +
  row.time +
  ' ' +
  row.unit +
  '. ' +
  row.qualifier +
  '.';
export const SOURCE_TEXT = 'Release runbook / Rollback\n' + RULES.map(sentence).join('\n');
// Page seven binds the displayed source checksum to actual PDF bytes.
export function sourcePdf(pageText = SOURCE_TEXT) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const pageIds = [];
  for (let page = 1; page <= 7; page++) {
    const pageId = objects.length + 1,
      streamId = pageId + 1;
    pageIds.push(pageId);
    const lines = page === 7 ? pageText.split('\n') : ['Release runbook / page ' + page];
    const escape = (line) => line.replace(/[\\()]/g, (character) => '\\' + character);
    const stream =
      'BT /F1 12 Tf 50 740 Td 18 TL ' +
      lines.map((line, i) => (i ? 'T* ' : '') + '(' + escape(line) + ') Tj').join('\n') +
      ' ET\n';
    objects.push(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ' +
        streamId +
        ' 0 R >>',
    );
    objects.push(
      '<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + 'endstream',
    );
  }
  objects[1] =
    '<< /Type /Pages /Kids [' + pageIds.map((id) => id + ' 0 R').join(' ') + '] /Count 7 >>';
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += index + 1 + ' 0 obj\n' + object + '\nendobj\n';
  });
  const xref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  pdf += offsets
    .slice(1)
    .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
    .join('');
  return Buffer.from(
    pdf +
      'trailer\n<< /Size ' +
      (objects.length + 1) +
      ' /Root 1 0 R >>\nstartxref\n' +
      xref +
      '\n%%EOF\n',
  );
}
export const SOURCE_BYTES = sourcePdf();
export const FENCE = String.fromCharCode(96).repeat(3);
export const MARKDOWN_TEXT =
  SOURCE_TEXT + '\n\n' + FENCE + 'sh\nrollback --deploy RELEASE_ID\n' + FENCE;
export const SOURCES = {
  pdf: SOURCE_BYTES,
  scan: SOURCE_BYTES,
  html: Buffer.from('<nav>Navigation</nav><main>' + SOURCE_TEXT + '</main>'),
  markdown: Buffer.from(MARKDOWN_TEXT),
};
export const PATCH_SCORES = [
  [0.2, 0.91, 0.05],
  [0.1, 0.88, 0.12],
];
export const OLD_VERSION = [
  {
    id: 'rollback',
    text: '6b63',
    access: ['ops', 'security'],
  },
  {
    id: 'archive',
    text: 'a1f0',
    access: ['ops'],
  },
  {
    id: 'pager-test',
    text: '77c2',
    access: ['ops'],
  },
];
export const NEW_VERSION = [
  {
    id: 'rollback',
    text: '6b63',
    access: ['ops'],
  },
  {
    id: 'archive',
    text: '9d41',
    access: ['ops'],
  },
  {
    id: 'freeze',
    text: 'e210',
    access: ['ops'],
  },
];
export const freshBase = {
  text: 'Backup restore failure: notify storage on-call within 2S minutes with restore ID.',
  reviewedText: 'Backup restore failure: notify storage on-call within 25 minutes with restore ID.',
  quality: 'review',
  trust: 'untrusted_source',
  access: ['ops'],
};
