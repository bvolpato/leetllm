import { executeHostKernelCase, mix, sum, tolerance } from '../arithmetic.mjs';
import { hostKernelFixtures } from '../fixtures.mjs';
import { sceneClock, storageStrip, worksheetRow } from '../worksheet.mjs';

const runs = hostKernelFixtures.map(executeHostKernelCase);
const publicCues = ['kg-hidden-base', 'kg-hidden-large', 'kg-hidden-small', 'kg-hidden-negate'];
const publicLabels = ['Original', '× 10', '× 0.01', 'Negated'];

export function drawHidden(ctx, scene, state, api) {
  const { C } = api, { beat } = state;
  const { progress, after } = sceneClock(state);
  const transforms = publicCues.map((id, i) => progress(id, 0, 0.35 + 0.12 * i, 0.43 + 0.12 * i));
  const publicIndex = Math.max(0, transforms.findLastIndex(p => p > 0));
  const packed = beat === 0 || (beat === 1 && !after('kg-hidden-stride', 1, 0.58, 0.77));
  const wide = beat === 4 && after('kg-hidden-wide-view', 4, 0.05, 0.18);
  const restored = after('kg-hidden-restore', 1, 0.32, 0.47);
  const run = packed ? runs[restored ? 0 : publicIndex] : runs[wide ? 4 : 5];
  const { fixture, rows, reference, candidate } = run;
  const row = rows[0];
  const col = wide ? 4 : 2;
  const mean = reference[0].mean;
  const squareSum = sum(row.values.map(v => v * v));
  const ref = reference[0].outputs[col].toFixed(4);
  const actual = candidate[0][col].toFixed(4);
  const check = tolerance(reference[0].outputs[col], candidate[0][col], 1e-6, 1e-5);
  const stepOne = progress('kg-hidden-hop-one', 2, 0.05, 0.17);
  const stepTwo = progress('kg-hidden-hop-two', 2, 0.18, 0.29);
  const five = after('kg-hidden-five', 2, 0.3, 0.4);
  const seven = after('kg-hidden-last', 2, 0.4, 0.48);
  const wideP = progress('kg-hidden-wide', 4, 0.22, 0.32);
  const reads = wide ? Math.floor(wideP * row.values.length) : seven ? 4 : five ? 3 : 2;
  const exposed = packed ? row.values.length : reads;
  const positions = row.addresses.slice(0, exposed);
  const cursor = packed ? undefined : wide ? positions.at(-1) :
    stepTwo > 0 ? mix(row.addresses[1], row.addresses[2], stepTwo) :
    mix(row.addresses[0], row.addresses[1], stepOne);
  const label = (s, x, y, size, color, align = 'left') => api.text(ctx, s, x, y, size, color, align);

  api.focus.target('hidden-map', () => {
    label('Host comparison   ·   ' + fixture.shape.join(' × ') + '   ·   strides [' + fixture.strides.join(', ') + ']', 155, 260, 37, C.ink);
    label(wide ? 'First 5 of 15 storage positions' : 'Same 8 storage positions', 1740, 260, 32, C.blue, 'right');
    storageStrip(ctx, api, wide ? fixture.storage.slice(0, 5) : fixture.storage, positions, cursor);
    label('Row zero', 320, 683, 36, C.cyan, 'right');
    worksheetRow(ctx, api, row.values.map((v, i) => i < exposed ? v : i === col ? '?' : '·'), {
      x: 355, y: 623, width: 980, color: C.cyan, selected: packed ? -1 : col,
    });
    if (!packed) {
      label(wide ? 'Last column' : 'Third column', 1400, 657, 31, C.yellow);
      label('column index ' + col, 1400, 706, 30, C.muted);
    }
  });

  api.focus.target('hidden-comparison', () => {
    if (beat === 0 || (beat === 1 && progress('kg-hidden-freeze', 1, 0.13, 0.19) === 0)) {
      const complete = publicCues.map((id, i) => after(id, 0, 0.35 + 0.12 * i, 0.43 + 0.12 * i));
      const done = complete.filter(Boolean).length;
      for (let i = 0; i < 4; i++) {
        const x = 355 + 337 * i;
        label(publicLabels[i], x, 835, 31, i === publicIndex ? C.yellow : C.muted);
        label(complete[i] ? (runs[i].matches ? 'MATCH' : 'MISMATCH') : '·', x, 901, 37, complete[i] ? C.green : C.muted);
      }
      const matched = runs.slice(0, done).filter(r => r.matches).length;
      label(matched + ' matches in ' + done + ' full-tensor comparisons', 960, 1002, 33, C.ink, 'center');
      return;
    }
    if (packed) {
      label('Freeze the candidate, dispatch, reference and tolerance policy.', 960, 857, 40, C.ink, 'center');
      return;
    }
    const meanReady = wide ? after('kg-hidden-wide-mean', 4, 0.33, 0.43) : after('kg-hidden-mean', 2, 0.49, 0.64);
    const refReady = wide ? after('kg-hidden-wide-reference', 4, 0.44, 0.57) : after('kg-hidden-reference', 2, 0.65, 0.83);
    const actualReady = wide ? after('kg-hidden-wide-zero', 4, 0.58, 0.71) : after('kg-hidden-zero', 3, 0, 0.07);
    if (beat === 1 || (beat === 2 && !five)) {
      label('Row 0 starts at offset 0. Advance 2 positions per feature.', 960, 850, 38, C.ink, 'center');
      label('Which stored value belongs in the third column?', 960, 952, 43, C.yellow, 'center');
      return;
    }
    if (meanReady)
      label('Mean square    ' + squareSum + ' / ' + row.values.length + ' = ' + mean, 155, 807, 36, C.ink);
    label('Weights = 1     ε = 0.00001', 1740, 807, 30, C.muted, 'right');
    label('Reference', 155, 908, 35, C.cyan);
    label(refReady ? row.values[col] + ' / √' + (mean + 1e-5).toFixed(5) + ' ≈ ' + ref : '…', 395, 908, 41, C.cyan);
    label('Frozen candidate', 1075, 908, 35, actualReady ? C.pink : C.muted);
    label(actualReady ? actual : '?', 1445, 908, 44, actualReady ? C.pink : C.muted);
    if (beat === 3 && after('kg-hidden-guard', 3, 0.72, 0.86)) {
      const replay = run.guardedOutput[0][col];
      label('Guarded replay    →    ' + run.guardedRoute + ' returns ' + replay.toFixed(4) + ' on this view',
        960, 1010, 37, C.green, 'center');
    } else if (actualReady && (wide || after('kg-hidden-reject', 3, 0.44, 0.58))) {
      const verdict = run.matches ? 'Accept' : 'Reject';
      label(verdict + '    ·    Error ≈ ' + check.error.toFixed(4) + '    ·    Allowed ≈ ' + check.allowance.toFixed(8), 960, 1010, 36, C.pink, 'center');
    } else if (refReady) {
      label('Allowed error ≈ ' + check.allowance.toFixed(8), 960, 1010, 32, C.muted, 'center');
    }
  });
}

export default {
  id: 'hidden', draw: drawHidden,
  cues: [...publicCues, 'kg-hidden-freeze', 'kg-hidden-restore', 'kg-hidden-stride', 'kg-hidden-hop-one', 'kg-hidden-hop-two', 'kg-hidden-five',
    'kg-hidden-last', 'kg-hidden-mean', 'kg-hidden-reference', 'kg-hidden-zero', 'kg-hidden-reject', 'kg-hidden-guard',
    'kg-hidden-wide-view', 'kg-hidden-wide', 'kg-hidden-wide-mean', 'kg-hidden-wide-reference', 'kg-hidden-wide-zero'],
};
