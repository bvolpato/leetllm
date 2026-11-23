import { enumeratedAccesses, tailSummary, vectorLane } from '../arithmetic.mjs';
import { after, text } from '../defaults.mjs';

const width = 256;
const addresses = [254, 255, 256, 257, 258, 259];

function drawIndexCheck(ctx, api) {
  const { C, focus } = api;
  const extended = after(api, 'tail-257');
  const length = extended ? 257 : 256;
  const fixed = after(api, 'fix-guard');
  const tail = tailSummary(length, width);
  const accessed = enumeratedAccesses(length, width, !fixed);
  const checked = extended
    ? after(api, fixed ? 'fixed-counts' : 'bad-inclusive')
    : after(api, 'full-pass');
  focus.target('tail-positions', () => {
    text(ctx, api, 'CPU enumeration', 145, 252, 37, C.ink);
    text(ctx, api, 'Block width 256', 1765, 252, 32, C.muted, 'right');
    text(ctx, api, 'n = ' + length, 145, 356, 52, C.ink);
    text(ctx, api, fixed ? 'i < n' : 'i <= n', 950, 356, 52, C.yellow);
    const x = (i) => 540 + (i - 254) * 220;
    text(ctx, api, 'Candidate index', 145, 507, 32, C.cyan);
    text(ctx, api, 'Output slot', 145, 682, 32, C.ink);
    for (const i of addresses) {
      const cx = x(i);
      if (i < tail.positions) {
        const color = checked && accessed.includes(i) ? (i < length ? C.green : C.pink) : C.muted;
        api.rect(ctx, cx - 95, 437, 190, 100, C.panel, color, 4);
        text(ctx, api, i, cx, 505, 45, color, 'center');
      }
      if (i < length) {
        api.rect(ctx, cx - 95, 620, 190, 92, C.panel, C.cyan, 4);
        text(ctx, api, 'out[' + i + ']', cx, 680, 32, C.ink, 'center');
      }
    }
    const edge = x(length) - 110;
    api.line(ctx, edge, 586, edge, 733, C.yellow, 4);
    text(ctx, api, 'End of array', edge + 19, 753, 27, C.yellow);
    let status =
      tail.blocks +
      (tail.blocks === 1 ? ' block' : ' blocks') +
      '  ·  ' +
      tail.positions +
      ' candidate positions';
    if (checked) {
      if (!extended) status = 'PASS   ·   indices 0–255 exactly once';
      else if (!fixed) status = 'FAIL   ·   first extra index ' + accessed.find((i) => i >= length);
      else
        status =
          'PASS   ·   ' +
          accessed.length +
          ' valid  +  ' +
          (tail.positions - accessed.length) +
          ' masked';
    }
    text(ctx, api, status, 145, 890, 42, checked && extended && !fixed ? C.pink : C.ink);
    text(
      ctx,
      api,
      'Check the full sequence of admitted indices against 0 through n − 1.',
      145,
      989,
      29,
      C.muted,
    );
  });
}

function drawOutputCheck(ctx, api) {
  const { C, focus } = api;
  const skipped = after(api, 'missed-store');
  focus.target('poison-output', () => {
    text(
      ctx,
      api,
      'CUDA output check   ·   detail of one possible skipped store',
      145,
      278,
      35,
      C.ink,
    );
    const xs = [505, 715, 925, 1135, 1345, 1555];
    for (const [i, cx] of xs.entries()) {
      text(ctx, api, 'out[' + i + ']', cx, 397, 28, C.muted, 'center');
      text(ctx, api, vectorLane(i).sum, cx, 493, 39, C.cyan, 'center');
      const finite = skipped && i < xs.length - 1;
      const color = skipped && !finite ? C.pink : C.ink;
      api.rect(ctx, cx - 85, 545, 170, 93, C.panel, color, 4);
      if (focus.visible('poison-write'))
        text(ctx, api, finite ? vectorLane(i).sum : 'NaN', cx, 606, 39, color, 'center');
    }
    text(ctx, api, 'Reference', 145, 493, 32, C.cyan);
    text(ctx, api, 'Output', 145, 606, 32, C.ink);
    if (skipped)
      text(ctx, api, 'out[5] is still NaN. The finiteness check fails.', 145, 760, 35, C.pink);
  });
  focus.target('wrapper-guards', () => {
    text(ctx, api, 'Triton wrapper', 145, 920, 32, C.cyan);
    if (focus.visible('wrapper-guards'))
      text(
        ctx,
        api,
        'Check devices, shape, dtype, autograd and strides before launch.',
        445,
        920,
        30,
        C.ink,
      );
  });
}

export function drawOwnershipBoundaries(ctx, scene, state, api) {
  if (state.beat < 2) return drawIndexCheck(ctx, api);
  if (state.beat === 2) return drawOutputCheck(ctx, api);
  const { C, focus } = api;
  const length = 2 ** 31 - 1;
  const tail = tailSummary(length, width);
  const fmt = (n) => n.toLocaleString('en-US');
  focus.target('wide-arithmetic', () => {
    text(ctx, api, 'n = ' + fmt(length) + '    ·    block width 256', 150, 282, 44, C.ink);
    if (focus.visible('wide-overflow')) {
      text(ctx, api, 'n + 255 exceeds the signed 32-bit limit', 150, 411, 39, C.pink);
      text(ctx, api, 'Divide first', 150, 561, 35, C.cyan);
      text(
        ctx,
        api,
        fmt(Math.floor(length / width)) + ' full blocks, remainder ' + (length % width),
        550,
        561,
        38,
        C.ink,
      );
    }
    if (after(api, 'wide-ceiling')) {
      text(ctx, api, 'Add the tail block', 150, 701, 35, C.cyan);
      text(
        ctx,
        api,
        fmt(tail.blocks) + ' blocks × 256 = ' + fmt(tail.positions) + ' positions',
        550,
        701,
        38,
        C.ink,
      );
      text(
        ctx,
        api,
        'One masked lane. The padded count needs a wide integer.',
        150,
        880,
        38,
        C.yellow,
      );
    }
    text(
      ctx,
      api,
      'Integer arithmetic only. This calculation allocates no buffer.',
      150,
      999,
      28,
      C.muted,
    );
  });
}

export default {
  id: 'ownership-boundaries',
  draw: drawOwnershipBoundaries,
  cues: [
    'full-shape',
    'full-pass',
    'tail-257',
    'second-block',
    'bad-inclusive',
    'fix-guard',
    'fixed-counts',
    'poison-write',
    'missed-store',
    'wrapper-guards',
    'wide-overflow',
    'wide-ceiling',
  ],
};
