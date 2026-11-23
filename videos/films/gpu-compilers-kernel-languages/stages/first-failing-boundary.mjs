import { enumeratedAccesses, tailSummary } from '../arithmetic.mjs';
import { after, arrow, text } from '../defaults.mjs';

const n = 769;
const width = 128;
const tail = tailSummary(n, width);
const strict = enumeratedAccesses(n, width, false);
const inclusive = enumeratedAccesses(n, width, true);
const tailStart = (tail.blocks - 1) * width;
const full = enumeratedAccesses(tailStart, width, true);
const firstIllegal = inclusive.find((i) => i >= n);
const exact = strict.length === n && strict.every((index, i) => index === i);

function drawDiagnosis(ctx, api) {
  const { C, focus } = api;
  const stages = [
    ['Python API', 'Pallas call rejected', 'Pin JAX and backend. Migrate the call.'],
    ['Frontend', 'IR unavailable', 'Reduce the source and save the compiler log.'],
    ['Assembler', 'PTX available', 'Compare the PTX header and assembler version.'],
    ['Loader', 'Package available', 'Compare its images with the device and driver.'],
    ['Kernel', 'Kernel launched', 'Compare cubins and profile on the target.'],
  ];
  const active = ['runtime-stop', 'loader-stop', 'assembler-stop', 'frontend-stop'].find((id) =>
    focus.visible(id),
  );
  const selected = active
    ? ['api-rejection', 'frontend-stop', 'assembler-stop', 'loader-stop', 'runtime-stop'].indexOf(
        active,
      )
    : 0;
  focus.target('failure-boundaries', () => {
    for (let i = 0; i < stages.length; i++) {
      const [name, evidence, action] = stages[i];
      const y = 312 + i * 142;
      const color = i === selected ? C.yellow : C.muted;
      api.circle(ctx, 180, y - 12, 12, i <= selected ? C.cyan : C.panel, C.muted);
      if (i < stages.length - 1) api.line(ctx, 180, y + 4, 180, y + 113, C.muted, 2);
      text(ctx, api, name, 225, y, 36, color);
      if (i > selected) continue;
      text(ctx, api, evidence, 550, y, 30, color);
      if (i === selected) text(ctx, api, action, 985, y, 29, C.ink);
    }
  });
}

function drawTail(ctx, state, api) {
  const { C, focus } = api;
  const extended = state.beat >= 2 || after(api, 'fresh-change');
  const length = extended ? n : tailStart;
  const bad = after(api, 'fresh-illegal');
  const repaired = after(api, 'fresh-repair');
  const classified = after(api, 'fresh-tail-complete');
  const checked = after(api, 'check-all');
  const accesses = repaired ? strict : inclusive;
  const center = (index) => 245 + (index - tailStart + 2) * 159;
  const boundary = (center(length - 1) + center(length)) / 2;
  const legalStores = focus.progress('fresh-store');
  const mask = repaired ? '<' : '<=';
  focus.target('fresh-tail', () => {
    text(
      ctx,
      api,
      'Contiguous float32  ·  length ' + length + '  ·  ' + width + ' offsets per block',
      145,
      232,
      31,
      C.ink,
    );
    text(ctx, api, 'Guard on both loads and the store', 145, 335, 32, C.ink);
    api.rect(ctx, 816, 267, 338, 98, C.panel, repaired ? C.green : C.yellow, 8);
    text(ctx, api, 'i ' + mask + ' n', 985, 335, 55, repaired ? C.green : C.yellow, 'center');
    if (after(api, 'fresh-seven')) {
      text(
        ctx,
        api,
        tail.blocks + ' × ' + width + ' = ' + tail.positions + ' positions',
        1765,
        331,
        31,
        C.cyan,
        'right',
      );
    }
    text(ctx, api, 'End of block 5', center(766) - 66, 438, 28, C.muted);
    if (extended)
      text(ctx, api, 'First eight offsets of block 6', center(768) - 66, 438, 28, C.cyan);
    if (classified)
      text(
        ctx,
        api,
        'Beyond this view: remaining ' + (width - 8) + ' lanes also masked',
        1765,
        440,
        27,
        C.muted,
        'right',
      );
    for (let i = tailStart - 2; i < (extended ? tailStart + 8 : tailStart); i++) {
      const cx = center(i);
      const invalid = i === firstIllegal && bad && !repaired;
      const writing = i === tailStart && legalStores === 1;
      const color = invalid ? C.pink : writing ? C.green : C.muted;
      api.rect(ctx, cx - 65, 476, 130, 86, C.panel, color, 5);
      text(ctx, api, i, cx, 535, 40, color, 'center');
      if (writing) {
        arrow(ctx, api, cx, 578, cx, 693, C.green);
      } else if (i === tailStart && legalStores > 0.1) {
        arrow(ctx, api, cx, 578, cx, 578 + 115 * legalStores, C.green);
      } else if (invalid && accesses.includes(i)) {
        arrow(ctx, api, cx, 578, cx, 685, C.pink);
        api.line(ctx, cx - 12, 707, cx + 12, 731, C.pink, 5);
        api.line(ctx, cx - 12, 731, cx + 12, 707, C.pink, 5);
      } else if (repaired && !accesses.includes(i)) {
        api.line(ctx, cx - 15, 598, cx + 15, 598, C.muted, 4);
      }
    }
    for (let i = tailStart - 2; i < length; i++) {
      const cx = center(i);
      api.rect(
        ctx,
        cx - 65,
        707,
        130,
        81,
        C.panel,
        i === tailStart && legalStores === 1 ? C.green : C.muted,
        5,
      );
      text(ctx, api, 'out[' + i + ']', cx, 758, 26, C.ink, 'center');
    }
    api.line(ctx, boundary, 645, boundary, 800, C.yellow, 4);
    text(ctx, api, 'End of allocated output', boundary + 230, 768, 31, C.yellow);

    let verdict = '';
    if (!extended && after(api, 'fresh-full') && full.length === length)
      verdict = 'PASS   ·   indices 0–767 exactly once';
    if (extended && !bad)
      verdict = focus.visible('fresh-question')
        ? 'Which index would this guard admit outside the output?'
        : 'One more output requires another block.';
    if (bad) verdict = '<= admits index ' + firstIllegal + ' illegally';
    if (repaired)
      verdict = classified
        ? '< repaired: ' + tail.lastValid + ' valid + ' + tail.masked + ' masked in last block'
        : 'The strict guard keeps the last legal slot.';
    if (verdict) text(ctx, api, verdict, 145, 895, 40, repaired ? C.green : bad ? C.pink : C.ink);
    if (checked && exact)
      text(
        ctx,
        api,
        'CPU check passed   ·   indices 0–768 exactly once',
        145,
        974,
        29,
        C.ink,
      );
    if (focus.visible('gpu-test'))
      text(ctx, api, 'GPU test   ·   compare outputs and run memcheck', 1765, 974, 29, C.cyan, 'right');
  });
}

export function drawFirstFailingBoundary(ctx, scene, state, api) {
  if (state.beat >= 2 || api.focus.visible('fresh-premises')) drawTail(ctx, state, api);
  else drawDiagnosis(ctx, api);
}

export default {
  id: 'first-failing-boundary',
  draw: drawFirstFailingBoundary,
  cues: [
    'api-rejection',
    'frontend-stop',
    'assembler-stop',
    'loader-stop',
    'runtime-stop',
    'fresh-premises',
    'fresh-full',
    'fresh-change',
    'fresh-start',
    'fresh-question',
    'fresh-illegal',
    'fresh-store',
    'fresh-seven',
    'fresh-repair',
    'fresh-tail-complete',
    'check-all',
    'gpu-test',
  ],
};
