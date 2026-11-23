import { sha, tally } from '../arithmetic.mjs';
import {
  candidateInvariants,
  pythonFixtureJSONL,
  referenceBytes,
  referenceCandidate,
  referenceDigest,
} from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
const revisedRejects = referenceCandidate.rejected.map((row) =>
  row.ticket_id === 404 ? { ...row, reason: 'label_conflict' } : row,
);
const oldReasons = tally(referenceCandidate.rejected, 'reason');
const newReasons = tally(revisedRejects, 'reason');
const oldRejectDigest = sha(pythonFixtureJSONL(referenceCandidate.rejected));
const newRejectDigest = sha(pythonFixtureJSONL(revisedRejects));

function drawRejectChange(ctx, api) {
  const { C, text, line, focus } = api;
  const edited = focus.progress('contract-reason-edit') > 0;
  const verified = focus.progress('contract-reason-check') > 0;
  text(ctx, 'Ticket 404   ·   rejection log', 150, 298, 37, C.blue);
  text(ctx, 'Recorded reason', 150, 396, 30, C.muted);
  text(ctx, 'Reason on disk', 1010, 396, 30, C.muted);
  text(ctx, 'invalid_label', 150, 478, 52, C.ink, 'left', 'mono');
  text(
    ctx,
    edited ? 'label_conflict' : 'invalid_label',
    1010,
    478,
    52,
    edited ? C.yellow : C.ink,
    'left',
    'mono',
  );
  line(ctx, 150, 531, 1770, 531, C.muted, 2);
  const counts = edited ? newReasons : oldReasons;
  const records = [
    ['Dataset SHA-256', referenceDigest, referenceDigest],
    ['Rejection log SHA-256', oldRejectDigest, edited ? newRejectDigest : oldRejectDigest],
    ['Rows with an invalid label', oldReasons.invalid_label, counts.invalid_label ?? 0],
    ['Rows with conflicting labels', oldReasons.label_conflict, counts.label_conflict],
    ['Total rejected rows', referenceCandidate.rejected.length, revisedRejects.length],
  ];
  text(ctx, 'Check', 150, 607, 30, C.muted);
  text(ctx, 'Manifest', 830, 607, 30, C.muted);
  text(ctx, 'Observed', 1310, 607, 30, C.muted);
  records.forEach(([label, old, next], i) => {
    const yy = 684 + i * 74;
    const printed = (value) =>
      typeof value === 'string' ? value.slice(0, 12) + '…' : String(value);
    text(ctx, label, 150, yy, 33, C.ink);
    text(ctx, printed(old), 830, yy, 35, C.ink, 'left', 'mono');
    text(
      ctx,
      verified ? printed(next) : '?',
      1310,
      yy,
      35,
      verified ? (old === next ? C.green : C.pink) : C.yellow,
      'left',
      'mono',
    );
  });
}
export function drawCandidateContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = currentBeat === 0 ? drawConstructionP(ctx, api, 'candidate-contract-voice-1') : 0;
  api.focus.target('candidate-contract-construction', () => {
    if (currentBeat === 2 || currentBeat === 3) return drawRejectChange(ctx, api);
    const base = referenceCandidate,
      copy = [
        ...base.kept,
        {
          ...base.kept[0],
          ticket_id: 999,
          split: 'test',
        },
      ],
      isByte = currentBeat === 1 && drawConstructionP(ctx, api, 'contract-byte-operation') > 0,
      isCopy =
        currentBeat === 1 && drawConstructionP(ctx, api, 'contract-copy-operation') > 0 && !isByte;
    const tests = isByte
      ? candidateInvariants(base.kept, base.rejected, {
          bytes: referenceBytes + '\n',
        })
      : isCopy
        ? candidateInvariants(copy, base.rejected, {
            bytes: referenceBytes,
          })
        : candidateInvariants(base.kept, base.rejected);
    drawConstructionText(
      ctx,
      api,
      currentBeat === 0
        ? 'Actual downstream verifier'
        : currentBeat === 1
          ? isByte
            ? 'Restore rows, then append one LF byte'
            : 'Copy 401’s group into test as 999'
          : 'Verify the release record with the publisher’s trusted key',
      160,
      300,
      32,
      themeColors.cyan,
    );
    if (currentBeat === 0) {
      const labels = [
        ['groups', 'group isolation + split rule'],
        ['bytes', 'dataset + reject-log digests'],
        ['schema', 'required row values'],
        ['fingerprints', 'normalized text fingerprints'],
        ['unique', 'unique IDs + normalized texts'],
        ['counts', 'total, split + reason counts'],
      ];
      labels.forEach(([key, label], i) => {
        const yy = 405 + i * 86;
        drawConstructionText(ctx, api, label, 190, yy, 31, themeColors.ink);
        const known = v > (i + 1) / 8;
        if (known)
          drawConstructionText(
            ctx,
            api,
            tests[key] ? 'pass' : 'FAIL',
            1590,
            yy,
            35,
            tests[key] ? themeColors.green : themeColors.pink,
            'center',
          );
        else drawConstructionText(ctx, api, '?', 1590, yy, 35, themeColors.muted, 'center');
      });
      drawConstructionNote(ctx, api, 'Passing these checks does not approve semantic labels.');
    } else if (currentBeat === 1) {
      const causeDone = isByte ? done('contract-byte') : done('contract-copy');
      if (isByte) {
        drawConstructionText(
          ctx,
          api,
          'Restore all six rows before changing the file bytes',
          180,
          405,
          29,
          themeColors.cyan,
        );
        const addition = done('contract-byte-operation') ? '⏎' : '';
        drawConstructionText(
          ctx,
          api,
          referenceBytes.slice(-26).replaceAll('\n', '⏎') + addition,
          180,
          525,
          29,
          themeColors.yellow,
          'left',
          true,
        );
        drawConstructionText(ctx, api, 'expected SHA-256', 180, 660, 27, themeColors.muted);
        drawConstructionText(
          ctx,
          api,
          referenceDigest.slice(0, 20) + '…',
          180,
          715,
          29,
          themeColors.blue,
          'left',
          true,
        );
        if (addition) {
          drawConstructionText(ctx, api, 'observed SHA-256', 180, 800, 27, themeColors.muted);
          drawConstructionText(
            ctx,
            api,
            sha(referenceBytes + '\n').slice(0, 20) + '…',
            180,
            855,
            29,
            themeColors.pink,
            'left',
            true,
          );
        }
        drawConstructionText(
          ctx,
          api,
          'byte length: ' +
            Buffer.byteLength(referenceBytes) +
            ' → ' +
            (Buffer.byteLength(referenceBytes) + Number(Boolean(addition))),
          180,
          935,
          30,
          themeColors.yellow,
        );
      } else {
        drawConstructionSheet(
          ctx,
          api,
          'retained 401 · c-a',
          'train · build is still failing',
          180,
          415,
          850,
          135,
          themeColors.blue,
        );
        const p = drawConstructionP(ctx, api, 'contract-copy-operation');
        if (p > 0) {
          drawConstructionSheet(
            ctx,
            api,
            'copied 999 · c-a',
            'test · build is still failing',
            180,
            650,
            850,
            135,
            themeColors.pink,
          );
          drawConstructionArrow(ctx, api, 605, 565, 605, 635, themeColors.pink);
          api.circle(ctx, 605, 565 + 70 * p, 7, themeColors.pink);
        }
        drawConstructionText(
          ctx,
          api,
          'same conversation · same normalized text',
          605,
          855,
          28,
          themeColors.yellow,
          'center',
        );
        if (causeDone)
          drawConstructionText(
            ctx,
            api,
            '7 loaded rows ≠ 6 recorded rows',
            605,
            935,
            34,
            themeColors.pink,
            'center',
          );
      }
      const labels = [
        ['groups', 'group/split'],
        ['bytes', 'byte digests'],
        ['schema', 'row schema'],
        ['fingerprints', 'fingerprints'],
        ['unique', 'unique text'],
        ['counts', 'manifest counts'],
      ];
      labels.forEach(([key, label], i) => {
        const yy = 425 + i * 87;
        drawConstructionText(ctx, api, label, 1190, yy, 28, themeColors.ink);
        drawConstructionText(
          ctx,
          api,
          causeDone ? (tests[key] ? 'pass' : 'FAIL') : '?',
          1690,
          yy,
          31,
          causeDone ? (tests[key] ? themeColors.green : themeColors.pink) : themeColors.muted,
          'center',
        );
      });
      drawConstructionNote(
        ctx,
        api,
        isByte
          ? 'An invisible byte can change identity without changing parsed row meaning.'
          : 'The copied group crosses the split and repeats normalized text.',
      );
    } else {
      const compared = done('contract-trust');
      drawConstructionSheet(
        ctx,
        api,
        'Signed record  ·  expected SHA-256',
        oldRejectDigest.slice(0, 16) + '…',
        160,
        410,
        730,
        150,
        themeColors.blue,
      );
      drawConstructionSheet(
        ctx,
        api,
        'Rejection log  ·  SHA-256 on disk',
        newRejectDigest.slice(0, 16) + '…',
        1030,
        410,
        730,
        150,
        themeColors.yellow,
      );
      drawConstructionText(
        ctx,
        api,
        referenceCandidate.rejected.length + ' rejections',
        180,
        635,
        37,
      );
      drawConstructionText(ctx, api, revisedRejects.length + ' rejections', 1050, 635, 37);
      if (compared) {
        drawConstructionText(
          ctx,
          api,
          oldRejectDigest === newRejectDigest ? '=' : '≠',
          960,
          505,
          68,
          themeColors.pink,
          'center',
        );
        drawConstructionText(
          ctx,
          api,
          'Hold the load. The rejection log differs from the signed record.',
          960,
          840,
          40,
          themeColors.pink,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'candidate-contract',
  draw: drawCandidateContract,
  cues: [
    'candidate-contract-b1',
    'candidate-contract-voice-1',
    'contract-counts',
    'candidate-contract-b2',
    'candidate-contract-voice-2',
    'contract-copy',
    'contract-byte',
    'contract-copy-operation',
    'contract-byte-operation',
    'candidate-contract-b3',
    'candidate-contract-voice-3',
    'contract-trust',
    'contract-reason-edit',
    'contract-reason-check',
  ],
};
