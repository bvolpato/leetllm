import { sources } from '../fixtures.mjs';
import { completeWorkerBoundary } from '../handoff.mjs';
import { caseClock, casePage } from '../case-file.mjs';

const byteLimit = 1600;
const baseBytes = byteLimit - 1;
const sourceId = 'trace-17';

export function inspectStatusEnvelope(status, extraSpaces = 0) {
  const body = JSON.stringify({
    claim: 'HTTP ' + status,
    source_ids: [sourceId],
    next_check: 'Inspect callback dependency',
  });
  const padding = baseBytes - Buffer.byteLength(body, 'utf8') + extraSpaces;
  const wire = Buffer.from(body + ' '.repeat(padding), 'utf8');
  const receipt = completeWorkerBoundary(wire, new Set([sourceId]), byteLimit);
  const record = receipt.accepted ? sources[receipt.item.source_ids[0]] : null;
  // This verifier handles a single literal HTTP-status claim in the teaching fixture.
  const supported = record === null ? null : receipt.item.claim === 'HTTP ' + record.status;
  return { wire, receipt, record, supported, padding };
}

function byteRuler(page, envelope, decided) {
  const { text, rule, box, C } = page;
  const { bytes, limit } = envelope.receipt;
  const from = limit - 4;
  const x = 317,
    width = 175;
  text('Last byte positions on the wire', 150, 317, 34, C.muted);
  for (let i = 0; i < 7; i++) {
    const pos = from + i;
    const left = x + i * width;
    const filled = pos <= bytes;
    const excess = decided && pos > limit;
    box(left, 406, width - 9, 102, C.panel, filled ? (excess ? C.pink : C.blue) : C.muted);
    text(pos.toLocaleString('en-US'), left + (width - 9) / 2, 382, 28, C.muted, 'center');
    if (filled)
      text('space', left + (width - 9) / 2, 471, 34, excess ? C.pink : C.ink, 'center', 'mono');
  }
  const boundary = x + (limit - from + 1) * width - 4;
  rule(boundary, 396, boundary, 538, C.yellow, 4);
  text('1,600-byte limit', boundary, 587, 31, C.yellow, 'center');
  text('JSON object + trailing spaces', 150, 691, 37);
  text(bytes.toLocaleString('en-US') + ' bytes received', 150, 775, 55, C.blue, 'left', 'serif');
}

export function drawStrictHandoff(ctx, scene, state, api) {
  const page = casePage(ctx, api);
  const { text, rule, box, focus, C } = page;
  const clock = caseClock(scene, state);
  const padded = clock.done('handoff-add') && !clock.done('handoff-undo');
  const corrected = clock.done('handoff-correct');
  const envelope = inspectStatusEnvelope(corrected ? 403 : 200, padded ? 2 : 0);
  const { receipt, record, supported } = envelope;
  if (!clock.done('handoff-undo')) {
    focus('handoff-bytes', () => byteRuler(page, envelope, clock.done('handoff-stop')));
    focus('handoff-decision', () => {
      let verdict = 'The wire limit applies before decoding.';
      if (clock.started('handoff-question')) verdict = 'Will the receiver open this copy?';
      if (clock.done('handoff-stop'))
        verdict = receipt.size
          ? 'Within the byte limit'
          : 'Stop before UTF-8 decoding or JSON parsing.';
      text(verdict, 150, 954, 42, clock.done('handoff-stop') ? C.pink : C.yellow);
    });
    return;
  }

  focus('handoff-object', () => {
    text(
      'Opened envelope     /     ' + receipt.bytes.toLocaleString('en-US') + ' bytes',
      155,
      291,
      32,
      C.muted,
    );
    [
      ['claim', receipt.item.claim],
      ['source_ids', JSON.stringify(receipt.item.source_ids)],
      ['next_check', receipt.item.next_check],
    ].forEach(([field, value], i) => {
      text(field, 155, 404 + i * 102, 34, C.blue, 'left', 'mono');
      text(value, 453, 404 + i * 102, i === 2 ? 33 : 43, C.ink);
    });
    rule(150, 640, 995, 640, C.muted);
    text('3 fields   ·   source in authorized set', 155, 706, 32, C.cyan);
  });
  focus('handoff-record', () => {
    text('Cited record', 1115, 291, 32, C.muted);
    box(1110, 336, 635, 363, C.panel, C.blue);
    text(sourceId, 1150, 408, 40, C.blue, 'left', 'mono');
    if (clock.started('handoff-open')) {
      text(record.trace + '    ' + record.path, 1150, 502, 39);
      text('HTTP ' + record.status, 1150, 627, 67, C.ink, 'left', 'serif');
    } else text('Ready for lookup', 1150, 511, 36, C.muted);
  });
  focus('handoff-decision', () => {
    let message = 'The receiver can now inspect the cited record.';
    if (clock.started('handoff-compare'))
      message = 'Can the lead record HTTP 200 for this request?';
    if (clock.done('handoff-reject') && !supported)
      message = 'Withhold HTTP 200. The trace records HTTP ' + record.status + '.';
    if (corrected) message = 'Check the revised finding against the same record.';
    if (clock.done('handoff-promote') && supported)
      message =
        'Lead note     /     ' +
        record.trace +
        ' returned ' +
        receipt.item.claim +
        '     ·     ' +
        receipt.item.source_ids[0];
    text(message, 150, 920, 45, clock.done('handoff-promote') ? C.green : C.yellow);
  });
}

export default {
  id: 'strict-handoff',
  draw: drawStrictHandoff,
  cues: [
    'handoff-add',
    'handoff-question',
    'handoff-stop',
    'handoff-undo',
    'handoff-open',
    'handoff-compare',
    'handoff-reject',
    'handoff-correct',
    'handoff-promote',
  ],
};
