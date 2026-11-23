import assert from 'node:assert/strict';
import { drawConcept } from '../lib/concepts.mjs';

export const KV_EXAMPLE = Object.freeze({
  layers: 32,
  kvHeads: 8,
  queryHeads: 32,
  headDim: 128,
  bytes: 2,
  positions: 4096,
});
export const BLOCK_SIZE = 4;
export const PHYSICAL_TABLE = Object.freeze([7, 2, 5]);
export function resolvePosition(position, table = PHYSICAL_TABLE, length = 9) {
  if (!Number.isInteger(position) || position < 0 || position >= length)
    throw new RangeError('position must name valid cached history');
  return {
    logical: Math.floor(position / BLOCK_SIZE),
    physical: table[Math.floor(position / BLOCK_SIZE)],
    offset: position % BLOCK_SIZE,
  };
}
export function cacheBytes({ layers, kvHeads, headDim, bytes }, positions, batch = 1) {
  return 2 * layers * kvHeads * headDim * bytes * positions * batch;
}
const cueProgress = (state, id, fallback) => {
  const cue = state.cues?.[id];
  return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
};
export function gatherState(state) {
  const fallback =
    Math.min(4, Math.floor(Math.max(0, Math.min(1, (state.beatP - 0.05) / 0.9)) * 4.999)) + 1;
  const count = state.cues
    ? cueProgress(state, 'second-block-gather', 0) > 0
      ? 5
      : Math.ceil(cueProgress(state, 'first-block-gather', 0) * 4)
    : fallback;
  const weights = [0.1, 0.2, 0.15, 0.25, 0.3],
    values = [2, 1, 4, 3, 5];
  return {
    count,
    scan: Math.max(0, count - 1),
    sum: weights.slice(0, count).reduce((sum, weight, i) => sum + weight * values[i], 0),
  };
}
export function batchBoundary(state) {
  const beat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, (state.beatP - 0.06) / 0.88));
  if (beat > 0) return 3 + Math.floor(progress * 3);
  if (!state.cues) return Math.floor(progress * 3);
  if (cueProgress(state, 'admit-new', 0) > 0) return 3;
  if (cueProgress(state, 'request-finish', 0) > 0) return 2;
  return Math.floor(cueProgress(state, 'live-boundaries', 0));
}
export function allocationState(state) {
  const holes = cueProgress(state, 'fragmented-holes', state.beatP > 0.15 ? 1 : 0) > 0;
  const uniform = cueProgress(
    state,
    'uniform-blocks',
    Math.max(0, Math.min(1, (state.beatP - 0.55) / 0.35)),
  );
  const owners = ['A', 'A', 'X', 'X', 'X', 'X', 'B', 'B', 'Y', 'Y', 'Y', 'Y'];
  const freeSlots = [2, 3, 4, 5, 8, 9, 10, 11];
  if (holes || uniform > 0) for (const slot of freeSlots) owners[slot] = null;
  const requested = 6,
    claimed = Math.ceil(uniform * requested);
  for (const slot of freeSlots.slice(0, claimed)) owners[slot] = 'C';
  let run = 0,
    largestRun = 0;
  for (const owner of owners) {
    run = owner === null ? run + 1 : 0;
    largestRun = Math.max(largestRun, run);
  }
  return {
    owners,
    holes,
    uniform,
    requested,
    claimed,
    free: owners.filter((owner) => owner === null).length,
    largestRun,
  };
}
export function conclusionSnapshot(beat = 0, beatP = 0, cues) {
  const current = { beat, beatP: Math.max(0, Math.min(1, beatP)), cues };
  const b = Math.max(0, Math.floor(beat));
  const p = current.beatP;
  const reached = (id, fallback) => cueProgress(current, id, fallback ? 1 : 0) > 0;
  const mapped = b > 1 || (b === 1 && reached('position-four-result', p >= 0.5));
  const appended = b > 1 || (b === 1 && reached('append-today', p >= 0.8));
  const eosEmitted = b > 2 || (b === 2 && reached('a-emits-eos', p >= 0.18));
  const gpuComplete = b > 2 || (b === 2 && reached('gpu-work-completes', p >= 0.45));
  const released = b > 2 || (b === 2 && reached('a-releases-block-two', p >= 0.68));
  const admitted = b > 2 || (b === 2 && reached('c-claims-block-two', p >= 0.9));
  const address = resolvePosition(4, PHYSICAL_TABLE, 5);
  assert(
    !appended || mapped,
    'the token cannot be appended before its logical-to-physical address is known',
  );
  assert(!released || gpuComplete, 'a page cannot be reused before its GPU work completes');
  assert(!admitted || released, 'request C cannot claim the page before request A releases it');
  return {
    position: 4,
    logical: address.logical,
    physical: address.physical,
    offset: address.offset,
    mapped,
    appended,
    eosEmitted,
    gpuComplete,
    released,
    admitted,
    sharedBlockOwners: released ? 'B' : 'A+B',
    privateBlockOwner: admitted ? 'C' : released ? 'free' : 'A',
  };
}
export function validateModel() {
  assert.equal(cacheBytes(KV_EXAMPLE, 1), 128 * 1024);
  assert.equal(cacheBytes(KV_EXAMPLE, 4096), 512 * 1024 ** 2);
  assert.deepEqual(resolvePosition(4, PHYSICAL_TABLE, 5), { logical: 1, physical: 2, offset: 0 });
  for (let i = 0; i < 9; i++) {
    const r = resolvePosition(i);
    assert.equal(r.logical * BLOCK_SIZE + r.offset, i);
    assert.equal(r.physical, PHYSICAL_TABLE[r.logical]);
  }
  assert.throws(() => resolvePosition(5, PHYSICAL_TABLE, 5), RangeError);
  const weights = [0.1, 0.2, 0.15, 0.25, 0.3],
    values = [2, 1, 4, 3, 5];
  assert(Math.abs(weights.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.equal(
    weights.reduce((sum, w, i) => sum + w * values[i], 0),
    3.25,
  );
  const prompt = conclusionSnapshot(0, 0.99),
    mapped = conclusionSnapshot(1, 0.6),
    appended = conclusionSnapshot(1, 0.9, {
      'position-four-result': { phase: 'after', progress: 1 },
      'append-today': { phase: 'after', progress: 1 },
    }),
    eos = conclusionSnapshot(2, 0.2),
    complete = conclusionSnapshot(2, 0.5),
    released = conclusionSnapshot(2, 0.8),
    admitted = conclusionSnapshot(2, 0.95);
  assert.equal(prompt.mapped, false);
  assert.equal(prompt.appended, false);
  assert.deepEqual([mapped.logical, mapped.physical, mapped.offset], [1, 2, 0]);
  assert.equal(mapped.appended, false);
  assert.equal(appended.appended, true);
  assert.equal(eos.eosEmitted, true);
  assert.equal(eos.gpuComplete, false);
  assert.equal(eos.privateBlockOwner, 'A');
  assert.equal(complete.sharedBlockOwners, 'A+B');
  assert.equal(released.sharedBlockOwners, 'B');
  assert.equal(released.privateBlockOwner, 'free');
  assert.equal(admitted.privateBlockOwner, 'C');
  assert.equal(admitted.sharedBlockOwners, 'B');
  return true;
}

export function draw(ctx, scene, state, api) {
  const { C, lerp, clamp, phase } = api;
  const b = state.beat ?? 0,
    p = clamp(state.beatP ?? 0, 0, 1);
  const stage = (n, from = 0.05, to = 0.9) => (b < n ? 0 : b > n ? 1 : phase(p, from, to));
  const text = (s, x, y, size = 32, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, s, x, y, size, color, align, font);
  const math = (s, x, y, size = 45, color = C.ink, align = 'left') =>
    api.math(ctx, s, x, y, size, color, align);
  const rect = (x, y, w, h, fill = C.panel, stroke, radius = 12) =>
    api.rect(ctx, x, y, w, h, fill, stroke, radius);
  const line = (x1, y1, x2, y2, color = C.muted, width = 3) =>
    api.line(ctx, x1, y1, x2, y2, color, width);
  const fade = api.components.fade;
  const label = (s, x, y, color = C.ink, w = 140, h = 66, size = 30, fill = C.panel) => {
    return api.components.card({
      label: s,
      x,
      y,
      width: w,
      height: h,
      fill,
      stroke: color,
      radius: 10,
      padding: 8,
      fontSize: size,
      textColor: color,
      baselineOffset: size * 0.34,
    });
  };
  const tile = (value, x, y, color = C.cyan, w = 92, h = 72, size = 30) =>
    label(String(value), x, y, color, w, h, size);
  const colors = [C.cyan, C.blue, C.yellow, C.pink, C.green, C.red];
  const dot = (x, y, color = C.cyan, r = 7) => api.circle(ctx, x, y, r, color);
  const rail = (points, amount = 1, color = C.cyan, width = 4) =>
    api.trace(ctx, points, amount, color, width);
  const footer = (s, color = C.muted) => text(s, 960, 970, 29, color, 'center');
  const block = (
    id,
    x,
    y,
    values,
    color = C.cyan,
    { w = 520, h = 76, active = -1, name = true } = {},
  ) => {
    const shape = rect(x, y, w, h, C.panel, color, 11);
    api.container(
      ctx,
      shape,
      () => {
        const slotW = (w - 34) / 4;
        for (let i = 0; i < 4; i++) {
          const xx = x + 14 + i * slotW,
            valid = values[i] !== null && values[i] !== undefined;
          const child = rect(
            xx,
            y + 13,
            slotW - 7,
            h - 26,
            valid ? color + '30' : '#8d9cb908',
            active === i ? C.yellow : valid ? color : '#8d9cb94a',
            6,
          );
          api.container(
            ctx,
            child,
            () => {
              if (valid)
                text(String(values[i]), xx + (slotW - 7) / 2, y + h / 2 + 10, 28, color, 'center');
              else line(xx + 12, y + h - 27, xx + slotW - 20, y + 26, '#8d9cb94a', 2);
            },
            { padding: 5 },
          );
        }
      },
      { padding: 10, id: `physical-${id}` },
    );
    if (name) text(String(id), x + w + 24, y + h / 2 + 11, 30, color, 'left', 'mono');
    return shape;
  };
  const memoryPool = (
    assignments,
    active,
    { x = 1180, y = 310, pitch = 78, w = 520, h = 64 } = {},
  ) => {
    const nodes = {};
    for (let id = 0; id < 8; id++) {
      const a = assignments[id];
      nodes[id] = block(id, x, y + id * pitch, a?.values ?? [], a?.color ?? '#8d9cb960', {
        w,
        h,
        active: active?.physical === id ? active.offset : -1,
      });
    }
    return nodes;
  };

  switch (scene.id) {
    case 'intro': {
      api.focus.target('intro-one-document', () => text('ONE DOCUMENT', 150, 285, 30, C.muted));

      const unfold = stage(0, 0.01, 0.4);
      for (let i = 0; i < 22; i++) {
        const start = i / 24;
        fade(b === 0 ? phase(unfold, start, start + 0.08) : 0, () => {
          const x = 150 + (i % 11) * 143,
            y = 335 + Math.floor(i / 11) * 96;
          rect(x, y, 125, 64, C.panel, colors[i % 6], 9);
          for (let j = 0; j < 4; j++)
            rect(x + 12 + j * 26, y + 20, 16, 24, colors[i % 6] + '90', undefined, 3);
        });
      }
      const count = Math.min(
        3,
        Math.ceil(api.focus.progress('token-answer', stage(0, 0.4, 0.9)) * 3),
      );
      api.focus.target('intro-answer', () => text('ANSWER', 150, 635, 30, C.muted));

      const words = ['The', 'bird', 'sings'];
      for (let i = 0; i < count; i++)
        api.focus.target('intro-readout', () =>
          tile(words[i], 350 + i * 410, 588, colors[i], 330, 88, 36),
        );
      if (b === 0) {
        for (let i = 0; i < count; i++) {
          api.focus.target('intro-replay', () =>
            text('replay?', 515 + i * 410, 750, 30, C.yellow, 'center'),
          );
          for (let j = 0; j < 11; j++)
            rect(360 + i * 410 + j * 25, 785, 17, 28, '#8d9cb930', undefined, 2);
        }
      } else {
        api.focus.target('intro-cache-object', () =>
          drawConcept(ctx, api, 'cache', 750, 730, 88, {
            label: 'Saved K/V history',
            labelPosition: 'right',
            labelSize: 32,
            labelGap: 18,
            labelColor: C.cyan,
          }),
        );
        const join = stage(1, 0.05, 0.55),
          spread = phase(join, 0, 0.6),
          collapse = phase(join, 0.6, 1);
        for (let i = 0; i < 22; i++) {
          const x = lerp(150 + (i % 11) * 143, 360 + i * 54, spread),
            y = lerp(335 + Math.floor(i / 11) * 96, 480, collapse);
          rect(
            x,
            y,
            lerp(125, 40, spread),
            lerp(64, 66, spread),
            colors[i % 6] + '90',
            undefined,
            6,
          );
        }
        api.focus.reveal('attention-memory', () =>
          api.focus.target('intro-reusable-attention-state', () =>
            text('REUSABLE ATTENTION STATE', 960, 915, 34, C.cyan, 'center'),
          ),
        );
      }
      break;
    }
    case 'causal': {
      const gather = api.focus.progress('weighted-gather', stage(1, 0.12, 0.9));
      const weights = [0.15, 0.2, 0.1, 0.55],
        values = [2, 1, 4, 3],
        completed = b === 0 ? 0 : Math.min(4, Math.floor(gather * 4 + 1e-9));
      api.focus.target('causal-four-positions-one-attention-head', () =>
        text('FOUR POSITIONS · ONE ATTENTION HEAD', 960, 270, 30, C.muted, 'center'),
      );
      const query = api.focus.target('causal-query', () =>
        tile('query', 1420, 345, C.yellow, 220, 80, 36),
      );
      const out = api.focus.target('causal-out', () =>
        tile(
          b === 0
            ? 'blend'
            : `Σ = ${weights
                .slice(0, completed)
                .reduce((sum, w, i) => sum + w * values[i], 0)
                .toFixed(2)}`,
          1420,
          780,
          C.green,
          220,
          80,
          36,
        ),
      );
      const keys = [],
        vals = [];
      for (let i = 0; i < 4; i++) {
        const x = 200 + i * 260;
        api.focus.target('causal-readout', () => tile(`token ${i}`, x, 345, colors[i], 200, 70));
        const reveal = state.cues
          ? b > 0 || api.focus.progress('cached-keys', 0) > i / 4
            ? 1
            : 0
          : stage(0, 0.1 + i * 0.1, 0.38 + i * 0.1);
        fade(reveal, () => {
          keys.push(
            api.focus.target('causal-readout-2', () => tile(`key ${i}`, x, 490, C.cyan, 200, 70)),
          );
        });
        fade(
          state.cues ? (b > 0 || api.focus.progress('cached-values', 0) > i / 4 ? 1 : 0) : reveal,
          () => {
            vals.push(
              api.focus.target('causal-readout-3', () =>
                tile(`v${i} = ${values[i]}`, x, 780, C.blue, 200, 80),
              ),
            );
          },
        );
        if (reveal > 0.4) {
          api.arrow(ctx, x + 100, 428, x + 100, 470, colors[i], 3);
          if (b > 0) {
            if (i < completed)
              rect(
                x + 35,
                700 - weights[i] * 190,
                130,
                weights[i] * 190,
                C.yellow + '70',
                undefined,
                5,
              );
            api.focus.target('causal-readout-4', () =>
              text(weights[i].toFixed(2), x + 100, 750, 31, C.yellow, 'center', 'mono'),
            );
          }
        }
      }
      if (b > 0) {
        const index = Math.min(3, Math.floor(gather * 4)),
          qx = 300 + index * 260;
        rail(
          [
            { x: 1530, y: 441 },
            { x: 1530, y: 600 },
            { x: qx, y: 600 },
            { x: qx, y: 576 },
          ],
          1,
          C.yellow,
          3,
        );
        dot(lerp(1530, qx, phase(gather, index / 4, (index + 1) / 4)), 600, C.yellow);
        const from = api.anchor(vals[index], { x: 300 + index * 260, y: 950 }, 10);
        const to = api.anchor(out, { x: 1530, y: 950 }, 10);
        const points = [from, { x: from.x, y: 885 }, { x: to.x, y: 885 }, to];
        api.path(ctx, points, { color: C.green, width: 3 });
        const pt = api.pointAlongPath(points, phase(gather, index / 4, (index + 1) / 4));
        if (pt) dot(pt.x, pt.y, C.green);
        api.focus.target('causal-readout-5', () =>
          text(
            `${completed}/4 gathered · supplied normalized weights`,
            960,
            925,
            28,
            C.muted,
            'center',
          ),
        );
      }
      api.focus.target('causal-readout-6', () =>
        math(
          String.raw`\operatorname{softmax}\!\left(\frac{q_t K_{0:t}^{\mathsf T}}{\sqrt{d_k}}\right)V_{0:t}`,
          960,
          990,
          36,
          C.ink,
          'center',
        ),
      );
      void query;
      break;
    }
    case 'reuse': {
      api.focus.target('reuse-rebuild-every-prefix', () =>
        text('REBUILD EVERY PREFIX', 425, 280, 32, C.muted, 'center'),
      );
      api.focus.target('reuse-write-each-position-once', () =>
        text('WRITE EACH POSITION ONCE', 1380, 280, 32, C.cyan, 'center'),
      );
      const step = Math.min(5, Math.floor(stage(b, 0.08, 0.92) * 5.99));
      api.focus.target('projection-ledger', () => {
        for (let row = 0; row < 6; row++) {
          api.focus.target('reuse-readout', () =>
            text(String(row + 1), 160, 380 + row * 76, 30, C.muted, 'center', 'mono'),
          );
          for (let col = 0; col <= row; col++) {
            const alpha = b === 0 ? (row <= step ? 1 : 0.12) : 0.2;
            fade(alpha, () =>
              api.focus.target('reuse-readout-2', () =>
                tile(col, 210 + col * 94, 337 + row * 76, colors[col], 76, 58, 25),
              ),
            );
          }
        }
      });
      const cacheCount = b === 0 ? 0 : step + 1;
      for (let i = 0; i < 6; i++) {
        const x = 1030 + i * 122;
        api.focus.target('reuse-readout-3', () =>
          text(String(i), x + 46, 375, 28, C.muted, 'center'),
        );
        api.focus.target('reuse-k', () =>
          tile('K', x, 430, i < cacheCount ? colors[i] : '#8d9cb94a', 92, 90, 36),
        );
        api.focus.target('reuse-v', () =>
          tile('V', x, 542, i < cacheCount ? colors[i] : '#8d9cb94a', 92, 90, 36),
        );
      }
      if (b > 0) {
        const x = 1076 + step * 122;
        api.focus.target('reuse-readout-4', () =>
          math(String.raw`q_t`, x, 740, 44, C.yellow, 'center'),
        );
        const read = phase((p * 6) % 1, 0.1, 0.9);
        rail(
          [
            { x, y: 696 },
            { x, y: 662 },
            { x: 1076, y: 662 },
          ],
          read,
          C.yellow,
          4,
        );
        api.focus.target('reuse-readout-5', () =>
          text(`${cacheCount} stored pairs`, 1380, 830, 35, C.cyan, 'center'),
        );
      }
      api.focus.target('reuse-1-2-3-4-5-6-21', () =>
        math('1+2+3+4+5+6=21', 450, 905, 44, C.muted, 'center'),
      );
      api.focus.target('reuse-1-1-1-1-1-1-6', () =>
        math('1+1+1+1+1+1=6', 1375, 905, 44, C.cyan, 'center'),
      );
      api.focus.target('reuse-full-six-position-projection-totals', () =>
        text('Full six-position projection totals', 960, 995, 28, C.muted, 'center'),
      );
      break;
    }
    case 'phases': {
      const step = b === 0 || p < 0.43 ? 0 : p < 0.72 ? 1 : 2;
      const completed = b > 0 && p >= [0.28, 0.6, 0.88][step];
      api.focus.target('phases-prefill', () => text('PREFILL', 390, 280, 35, C.blue, 'center'));
      api.focus.target('phases-decode', () => text('DECODE', 1250, 280, 35, C.yellow, 'center'));
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 5; col++) {
          const allowed = col <= row;
          fade(allowed ? stage(0, 0.14 + row * 0.018, 0.25 + row * 0.038) : 1, () =>
            rect(
              180 + col * 82,
              360 + row * 82,
              65,
              65,
              allowed ? C.blue + '80' : '#8d9cb912',
              undefined,
              7,
            ),
          );
        }
      api.focus.target('phases-known-prompt-positions', () =>
        text('known prompt positions', 390, 840, 31, C.blue, 'center'),
      );
      for (let i = 0; i < 8; i++) {
        const has = i < 5 || (b > 0 && p >= [0.28, 0.6, 0.88][i - 5]);
        api.focus.target('phases-readout', () =>
          tile(
            i < 5 ? `p${i}` : `a${i - 5}`,
            800 + i * 115,
            565,
            has ? (i < 5 ? C.blue : C.cyan) : '#8d9cb94a',
            94,
            100,
            30,
          ),
        );
      }
      if (b > 0) {
        const current = 5 + step,
          xx = 847 + current * 115;
        api.focus.target('phases-process', () => text('process', xx, 488, 28, C.cyan, 'center'));
        api.arrow(ctx, xx, 510, xx, 549, C.cyan, 4);
        api.focus.target('phases-readout-2', () =>
          tile(`a${completed ? step + 1 : step}`, 1190, 790, C.yellow, 150, 75, 34),
        );
        api.focus.target('phases-readout-3', () =>
          text(
            completed ? 'choose next token' : 'selected input',
            1265,
            920,
            32,
            C.yellow,
            'center',
          ),
        );
        rail(
          [
            { x: xx, y: 681 },
            { x: xx, y: 730 },
            { x: 1265, y: 730 },
            { x: 1265, y: 775 },
          ],
          phase(p, [0.22, 0.53, 0.81][step], [0.28, 0.6, 0.88][step]),
          C.yellow,
          4,
        );
      } else {
        fade(stage(0, 0.6, 0.7), () => {
          api.focus.target('phases-a0', () => tile('a0', 1190, 790, C.yellow, 150, 75, 34));
          api.focus.target('phases-last-prompt-state-first-answer', () =>
            text('last prompt state → first answer', 1265, 920, 31, C.yellow, 'center'),
          );
        });
      }
      break;
    }
    case 'bytes': {
      api.focus.target('bytes-readout', () =>
        math(String.raw`M=2\,L\,H_{\mathrm{KV}}\,d_h\,s\,T\,B`, 960, 330, 64, C.ink, 'center'),
      );
      const labels = [
        'K and V',
        'layers',
        'KV heads',
        'head size',
        'bytes/value',
        'positions',
        'requests',
      ];
      const batchCount = b > 0 ? 1 + Math.floor(stage(1, 0.53, 0.83) * 3) : 1;
      const vals = [
        2,
        KV_EXAMPLE.layers,
        KV_EXAMPLE.kvHeads,
        KV_EXAMPLE.headDim,
        KV_EXAMPLE.bytes,
        KV_EXAMPLE.positions,
        batchCount,
      ].map(String);
      for (let i = 0; i < labels.length; i++) {
        const x = 155 + i * 235;
        fade(stage(0, i * 0.06, 0.35 + i * 0.06), () => {
          api.focus.target('bytes-readout-2', () =>
            text(labels[i], x + 100, 435, 28, C.muted, 'center'),
          );
          api.focus.target('bytes-readout-3', () =>
            tile(vals[i], x, 475, i === 2 ? C.cyan : C.blue, 200, 80, 35),
          );
        });
      }
      if (b > 0) {
        const expand = stage(1, 0.12, 0.53);
        api.focus.target('bytes-readout-4', () =>
          text(`${cacheBytes(KV_EXAMPLE, 1) / 1024} KiB / token`, 170, 655, 36, C.cyan),
        );
        for (let i = 0; i < 16; i++)
          rect(170 + i * 91, 700, 75, lerp(12, 75, expand), C.cyan + '90', undefined, 5);
        api.focus.target('bytes-readout-5', () =>
          text(
            `${KV_EXAMPLE.positions} positions → ${cacheBytes(KV_EXAMPLE, KV_EXAMPLE.positions) / 1024 ** 2} MiB / request`,
            960,
            850,
            40,
            C.cyan,
            'center',
          ),
        );
        for (let i = 0; i < batchCount; i++)
          rect(170 + i * 350, 890, 320, 22, C.blue + '80', undefined, 4);
        fade(stage(1, 0.83, 0.95), () =>
          footer('32 query heads share 8 KV heads in this chosen GQA shape', C.yellow),
        );
      } else {
        footer('Tensor payload only · model shape is fixed');
      }
      break;
    }
    case 'reservations': {
      const allocation = b > 0 ? allocationState(state) : null;
      const page = b === 0 ? 0 : allocation.uniform;
      api.focus.target('reservations-readout', () =>
        text(
          b === 0
            ? 'MAXIMUM-LENGTH RESERVATIONS'
            : page > 0
              ? 'UNIFORM BLOCKS USE SEPARATED HOLES'
              : allocation.holes
                ? 'X AND Y FINISH · TWO SEPARATED FREE RUNS'
                : 'SEPARATE VARIABLE-ALLOCATION EXAMPLE: A / X / B / Y',
          960,
          300,
          b === 0 ? 34 : 30,
          C.ink,
          'center',
        ),
      );
      for (let i = 0; i < 12; i++) {
        const reservedOwner = i < 6 ? 'A' : 'B';
        const liveBefore = i < 2 || i === 6 || i === 7;
        const newOwner = allocation ? allocation.owners[i] : liveBefore ? reservedOwner : null;
        const col = i % 6,
          row = Math.floor(i / 6),
          x = 170 + col * 270,
          y = 405 + row * 210;
        const c =
          newOwner === 'A'
            ? C.cyan
            : newOwner === 'B'
              ? C.blue
              : newOwner === 'C'
                ? C.yellow
                : newOwner === 'X'
                  ? C.pink
                  : newOwner === 'Y'
                    ? C.green
                    : b === 0
                      ? reservedOwner === 'A'
                        ? C.cyan
                        : C.blue
                      : C.muted;
        const live = !!newOwner;
        api.focus.target(b > 0 && !live ? 'reservations-free-hole' : 'reservations-pool', () => {
          const box = rect(x, y, 225, 145, live ? c + '35' : C.panel, c, 12);
          api.container(
            ctx,
            box,
            () => {
              api.focus.target('reservations-readout-2', () =>
                text(
                  b === 0 ? reservedOwner : (newOwner ?? 'free'),
                  x + 112,
                  y + 64,
                  38,
                  c,
                  'center',
                ),
              );
              api.focus.target('reservations-readout-3', () =>
                text(
                  live
                    ? 'live state'
                    : b === 0
                      ? 'reserved tail'
                      : page > 0
                        ? 'available'
                        : 'free hole',
                  x + 112,
                  y + 115,
                  25,
                  live ? c : C.muted,
                  'center',
                ),
              );
            },
            { padding: 12 },
          );
        });
      }
      if (b === 0)
        api.focus.target('reservations-readout-4', () =>
          text('C waits outside the pool', 960, 920, 37, C.yellow, 'center'),
        );
      else
        api.focus.target('reservations-constraint', () =>
          text(
            page > 0
              ? `A: 2   B: 2   C: ${allocation.claimed} / ${allocation.requested}   free: ${allocation.free}${allocation.claimed === allocation.requested ? ' · admitted' : ''}`
              : `free: ${allocation.free}   largest run: ${allocation.largestRun}   C needs: ${allocation.requested} · contiguous denied`,
            960,
            920,
            32,
            page > 0 ? C.green : C.yellow,
            'center',
          ),
        );
      break;
    }
    case 'mapping': {
      api.focus.target('mapping-logical-history', () =>
        text('LOGICAL HISTORY', 350, 275, 30, C.cyan, 'center'),
      );
      api.focus.target('mapping-block-table', () =>
        text('BLOCK TABLE', 850, 275, 30, C.yellow, 'center'),
      );
      api.focus.target('mapping-physical-blocks', () =>
        text('PHYSICAL BLOCKS', 1450, 275, 30, C.muted, 'center'),
      );
      const probe = b === 0 ? -1 : 4;
      const active = probe >= 0 ? resolvePosition(probe, PHYSICAL_TABLE, 5) : null;
      const assignments = {
        7: { values: [0, 1, 2, 3], color: C.cyan },
        2: { values: [4], color: C.cyan },
        4: { values: ['B0', 'B1'], color: C.blue },
      };
      const pool = memoryPool(assignments, active);
      const logical0 = api.focus.target('mapping-logical0', () =>
        block('logical0', 130, 390, [0, 1, 2, 3], C.cyan, {
          w: 420,
          h: 100,
          name: false,
          active: active?.logical === 0 ? active.offset : -1,
        }),
      );
      const logical1 = api.focus.target('mapping-logical1', () =>
        block('logical1', 130, 650, [4], C.cyan, {
          w: 420,
          h: 100,
          name: false,
          active: active?.logical === 1 ? active.offset : -1,
        }),
      );
      const table0 = api.focus.target('mapping-table0', () =>
        tile('0 → 7', 690, 390, C.yellow, 300, 100, 40),
      );
      const table1 = api.focus.target('mapping-table1', () =>
        tile('1 → 2', 690, 650, C.yellow, 300, 100, 40),
      );
      api.connect(ctx, logical0, table0, { color: C.cyan, gap: 12, width: 3 });
      api.connect(ctx, logical1, table1, { color: C.cyan, gap: 12, width: 3 });
      const routes = [
        [table0, pool[7], 1080],
        [table1, pool[2], 1130],
      ].map(([source, target, aisle]) => {
        const from = api.anchor(source, { x: 1800, y: source.y + source.height / 2 }, 12);
        const to = api.anchor(target, { x: 0, y: target.y + target.height / 2 }, 12);
        return [from, { x: aisle, y: from.y }, { x: aisle, y: to.y }, to];
      });
      routes.forEach((points, i) => {
        api.path(ctx, points, {
          color: active && active.logical !== i ? '#f4d47735' : C.yellow,
          width: active?.logical === i ? 5 : 3,
        });
        if (active?.logical === i) {
          const at = api.pointAlongPath(points, stage(1, 0.15, 0.8));
          dot(at.x, at.y, C.yellow, 7);
        }
      });
      api.focus.target('mapping-positions-0-3', () =>
        text('positions 0–3', 340, 540, 29, C.cyan, 'center'),
      );
      api.focus.target('mapping-position-4-three-tail-slots', () =>
        text('position 4 · three tail slots', 340, 800, 28, C.muted, 'center'),
      );
      if (active) {
        api.focus.target('mapping-readout', () =>
          math(String.raw`j=\lfloor i/4\rfloor,\quad r=i\bmod4`, 580, 885, 42, C.ink, 'center'),
        );
        api.focus.target('mapping-readout-2', () =>
          text(
            `i=${probe}    j=${active.logical}    physical=${active.physical}    offset=${active.offset}`,
            580,
            950,
            31,
            C.yellow,
            'center',
            'mono',
          ),
        );
      }
      break;
    }
    case 'valid-length': {
      const gathered = gatherState(state),
        scan = gathered.scan;
      const weights = [0.1, 0.2, 0.15, 0.25, 0.3],
        values = [2, 1, 4, 3, 5];
      api.focus.target('valid-length-valid-length-5', () =>
        text('VALID LENGTH = 5', 960, 285, 44, C.yellow, 'center'),
      );
      api.focus.target('valid-length-block-table-7-2', () =>
        text('block table: [7, 2]', 960, 355, 34, C.muted, 'center', 'mono'),
      );
      api.focus.target('valid-length-position-toy-value', () =>
        text('position : toy value', 720, 430, 28, C.muted, 'center'),
      );
      const top = api.focus.target('valid-length-top', () =>
        block(7, 220, 470, ['0:2', '1:1', '2:4', '3:3'], C.cyan, {
          w: 1000,
          h: 125,
          active: b === 1 && gathered.count && scan < 4 ? scan : -1,
        }),
      );
      const bottom = api.focus.target('valid-length-bottom', () =>
        block(2, 220, 700, ['4:5'], C.cyan, {
          w: 1000,
          h: 125,
          active: b === 1 && gathered.count && scan === 4 ? 0 : -1,
        }),
      );
      api.focus.target('valid-length-three-unused-slots', () =>
        text('three unused slots', 805, 885, 32, C.muted, 'center'),
      );
      if (b > 0) {
        const sum = gathered.sum;
        api.focus.target('valid-length-gather-in-logical-order', () =>
          text('GATHER IN LOGICAL ORDER', 1530, 445, 28, C.muted, 'center'),
        );
        api.focus.target('valid-length-readout', () =>
          math(String.raw`\sum_i \alpha_i v_i`, 1530, 560, 55, C.green, 'center'),
        );
        api.focus.target('valid-length-readout-2', () =>
          text(sum.toFixed(2), 1530, 700, 75, C.green, 'center', 'mono'),
        );
        api.focus.target('valid-length-readout-3', () =>
          text(scan === 4 ? 'complete blend' : 'partial sum', 1530, 780, 30, C.green, 'center'),
        );
        api.focus.target('valid-length-readout-4', () =>
          text(
            `${weights[scan].toFixed(2)} × ${values[scan]}`,
            1530,
            855,
            35,
            C.yellow,
            'center',
            'mono',
          ),
        );
        footer('Supplied attention weights sum to one · only valid positions contribute');
        const src = scan < 4 ? top : bottom;
        const dst = rect(1410, 610, 240, 125, '#8cdeb50b', C.green, 12);
        if (gathered.count) api.connect(ctx, src, dst, { color: C.green, gap: 12, width: 3 });
      } else {
        api.focus.target('valid-length-read-only-positions', () =>
          text('read only positions', 1530, 530, 32, C.ink, 'center'),
        );
        api.focus.target('valid-length-readout-5', () =>
          math(String.raw`0\leq i<5`, 1530, 620, 56, C.yellow, 'center'),
        );
      }
      break;
    }
    case 'grow-release': {
      const n =
        b === 0 ? 5 + [0.101, 0.152, 0.203, 0.334].filter((threshold) => p >= threshold).length : 9;
      const release = stage(1, 0.255, 0.3),
        reclaim = stage(1, 0.405, 0.472);
      api.focus.target('grow-release-readout', () =>
        text(
          b === 0
            ? 'APPEND ONLY AT THE NEXT VALID POSITION'
            : release < 1
              ? 'FINISH PENDING GPU READS'
              : 'OWNERSHIP RETURNS TO THE POOL',
          960,
          275,
          32,
          C.muted,
          'center',
        ),
      );
      const assignments = { 4: { values: ['B0', 'B1'], color: C.blue } };
      for (let k = 0; k < 3; k++) {
        const values = Array.from({ length: 4 }, (_, j) => (k * 4 + j < n ? k * 4 + j : null));
        if (k * 4 < n && release < 1) assignments[PHYSICAL_TABLE[k]] = { values, color: C.cyan };
      }
      if (reclaim > 0) assignments[2] = { values: ['C0', 'C1'], color: C.yellow };
      const nodes = memoryPool(assignments, b === 0 ? resolvePosition(n - 1) : null, {
        x: 1000,
        y: 310,
        w: 650,
      });
      api.focus.target('grow-release-a', () => text('A', 230, 420, 62, C.cyan));
      api.focus.target('grow-release-readout-2', () =>
        text(release >= 1 ? 'finished' : `${n} valid positions`, 230, 490, 35, C.cyan),
      );
      api.focus.target('grow-release-readout-3', () =>
        text(
          release >= 1 ? 'table released' : `table [7, 2${n > 8 ? ', 5' : ''}]`,
          230,
          555,
          31,
          C.muted,
          'left',
          'mono',
        ),
      );
      api.focus.target('grow-release-b-keeps-block-4', () =>
        text('B keeps block 4', 230, 690, 35, C.blue),
      );
      if (b > 0) {
        if (release < 1) {
          const reader = api.focus.target('grow-release-reader', () =>
            tile('in-flight GPU read', 230, 750, C.yellow, 420, 90, 31),
          );
          const from = api.anchor(nodes[2], { x: 0, y: 498 }, 12);
          const to = api.anchor(reader, { x: 1800, y: 795 }, 12);
          const route = [from, { x: 900, y: from.y }, { x: 900, y: to.y }, to];
          api.path(ctx, route, { color: C.cyan, width: 3 });
          const at = api.pointAlongPath(route, stage(1, 0.145, 0.247));
          dot(at.x, at.y, C.cyan, 9);
        } else
          api.focus.target('grow-release-readout-4', () =>
            text(
              reclaim > 0 ? 'C reuses block 2' : '3 A blocks available',
              230,
              825,
              36,
              reclaim > 0 ? C.yellow : C.green,
            ),
          );
      }
      break;
    }
    case 'sharing': {
      const copy = stage(1, 0.18, 0.33),
        write = stage(1, 0.423, 0.51);
      const relocated = stage(1, 0.342, 0.39) >= 1;
      api.focus.target('sharing-a-shared-partial-block', () =>
        text('A shared partial block', 960, 280, 35, C.ink, 'center'),
      );
      const a = api.focus.target('sharing-a', () =>
        tile('branch A', 180, 390, C.cyan, 300, 90, 38),
      );
      const bb = api.focus.target('sharing-bb', () =>
        tile('branch B', 180, 700, C.blue, 300, 90, 38),
      );
      if (copy > 0 && copy < 1)
        for (let i = 0; i < 3; i++) {
          const xx = 1164 + i * 126,
            yy = lerp(703, 393, copy);
          rect(xx, yy, 119, 84, C.cyan + '45', undefined, 6);
        }
      const oldValues = [10, 20, 30, write > 0.85 ? 80 : null];
      const old = api.focus.target('sharing-old', () =>
        block(7, 1150, 690, oldValues, C.blue, { w: 540, h: 110 }),
      );
      api.focus.target('sharing-readout', () =>
        text(relocated ? 'refs: 1' : 'refs: 2', 1800, 840, 28, C.blue, 'right'),
      );
      let fresh;
      if (copy > 0) {
        const newValues = [10, 20, 30, write > 0.45 ? 90 : null];
        fresh = api.focus.target('sharing-readout-2', () =>
          block(2, 1150, 380, copy >= 1 ? newValues : [], C.cyan, { w: 540, h: 110 }),
        );
        api.focus.target('sharing-refs-1', () => text('refs: 1', 1800, 530, 28, C.cyan, 'right'));
      }
      api.connect(ctx, a, relocated ? fresh : old, { color: C.cyan, width: 4, gap: 14 });
      api.connect(ctx, bb, old, { color: C.blue, width: 4, gap: 14 });
      if (copy > 0 && copy < 1)
        api.focus.target('sharing-copy-valid-prefix-before-writing', () =>
          text('copy valid prefix before writing', 770, 315, 29, C.yellow, 'center'),
        );
      footer(
        write > 0.85
          ? 'A: [10,20,30,90]     B: [10,20,30,80]'
          : 'The prefix is shared until an append needs private storage',
        write > 0.85 ? C.green : C.muted,
      );
      break;
    }
    case 'prefix': {
      api.focus.target('prefix-reuse-requires-compatible-history', () =>
        text('REUSE REQUIRES COMPATIBLE HISTORY', 960, 280, 32, C.muted, 'center'),
      );
      const tokenBlocks = [
        ['11 28 3 9', '8 4 17 2', '7 24 19 6', '30 5 12 4'],
        ['11 28 3 9', '8 4 17 2', '7 10 21 6', '18 9 2 14'],
      ];
      const earlierMismatch = b === 0 && p < 0.65;
      if (earlierMismatch) tokenBlocks[1][0] = '11 28 3 5';
      api.focus.target('prefix-token-ids-four-positions-per-block', () =>
        text('token IDs · four positions per block', 960, 335, 27, C.muted, 'center'),
      );
      for (let r = 0; r < 2; r++) {
        api.focus.target('prefix-readout', () =>
          text(
            r === 0 ? 'earlier request' : 'new request',
            140,
            430 + r * 190,
            30,
            r === 0 ? C.cyan : C.blue,
          ),
        );
        for (let i = 0; i < 4; i++)
          api.focus.target('prefix-readout-2', () =>
            tile(
              tokenBlocks[r][i],
              450 + i * 300,
              375 + r * 190,
              earlierMismatch && r === 1 && i < 2
                ? C.red
                : i < 2
                  ? C.cyan
                  : r === 0
                    ? C.pink
                    : C.yellow,
              245,
              88,
              27,
            ),
          );
      }
      if (earlierMismatch)
        api.focus.target('prefix-same-second-block-different-earlier-context-different-sta', () =>
          text(
            'same second block + different earlier context → different state',
            960,
            735,
            29,
            C.red,
            'center',
          ),
        );
      const reuse = stage(1, 0.05, 0.65);
      if (reuse > 0) {
        for (let i = 0; i < 2; i++) {
          const x = 572 + i * 300;
          rail(
            [
              { x, y: 475 },
              { x, y: 552 },
            ],
            reuse,
            C.green,
            5,
          );
          if (reuse > 0.9)
            api.focus.target('prefix-reuse', () => text('reuse', x, 735, 30, C.green, 'center'));
        }
        api.focus.reveal('fresh-suffix', () =>
          api.focus.target('prefix-compute-suffix-privately', () =>
            text('compute suffix privately', 1470, 735, 32, C.yellow, 'center'),
          ),
        );
      }
      api.focus.target('prefix-readout-3', () =>
        math(
          String.raw`h_j=\operatorname{hash}(h_{j-1},\ \mathrm{tokens}_j,\ \mathrm{identity})`,
          960,
          835,
          46,
          C.ink,
          'center',
        ),
      );
      footer('Full prefix · model / adapter · positions · isolation key', C.muted);
      break;
    }
    case 'batching': {
      const boundary = batchBoundary(state);
      api.focus.target('batching-iteration-boundaries', () =>
        text('ITERATION BOUNDARIES', 1100, 280, 32, C.muted, 'center'),
      );
      for (let i = 0; i < 7; i++) {
        const x = 480 + i * 195;
        line(x, 320, x, 840, '#8d9cb929', 2);
        api.focus.target('batching-readout', () =>
          text(String(i), x, 910, 29, C.muted, 'center', 'mono'),
        );
      }
      const lanes = [
        { name: 'A', y: 410, color: C.cyan, start: 0, end: 2 },
        { name: 'B', y: 610, color: C.blue, start: 0, end: 6 },
        { name: 'C', y: 810, color: C.yellow, start: 3, end: 6 },
      ];
      for (const lane of lanes) {
        api.focus.target('batching-readout-2', () =>
          text(lane.name, 190, lane.y + 13, 50, lane.color),
        );
        for (let i = lane.start; i <= lane.end; i++) {
          if (i > boundary) continue;
          const x = 480 + i * 195;
          api.focus.target(
            lane.name === 'A' && i === 2
              ? 'batching-eos'
              : lane.name === 'C' && i === 3
                ? 'batching-admission'
                : 'batching-step',
            () => {
              rect(x - 55, lane.y - 42, 110, 84, lane.color + '30', lane.color, 11);
              api.focus.target('batching-readout-3', () =>
                text(
                  lane.name === 'C' && i === 3
                    ? 'prefill'
                    : lane.name === 'A' && i === 2
                      ? 'EOS'
                      : 'step',
                  x,
                  lane.y + 11,
                  27,
                  lane.color,
                  'center',
                ),
              );
            },
          );
        }
      }
      if (boundary >= 3)
        api.focus.target('batching-a-retires-storage-available-c-admitted', () =>
          text('A retires → storage available → C admitted', 960, 980, 31, C.green, 'center'),
        );
      else footer('Each lane owns a separate growing block table');
      break;
    }
    case 'bandwidth': {
      const length = 2 + Math.min(10, Math.floor(stage(0, 0.05, 0.95) * 10.999));
      api.focus.target('bandwidth-one-decode-step', () =>
        text('ONE DECODE STEP', 960, 280, 34, C.muted, 'center'),
      );
      api.focus.target('bandwidth-new-k-v-write', () =>
        text('new K/V write', 170, 430, 34, C.cyan),
      );
      api.focus.target('bandwidth-1-pair', () => tile('1 pair', 170, 480, C.cyan, 260, 90, 42));
      api.focus.target('bandwidth-history-read', () =>
        text('history read', 660, 430, 34, C.yellow),
      );
      const n = b === 0 ? length : 12;
      for (let i = 0; i < n; i++)
        api.focus.target('bandwidth-readout', () =>
          tile(i, 660 + (i % 6) * 175, 480 + Math.floor(i / 6) * 120, C.yellow, 140, 90, 36),
        );
      api.focus.target('bandwidth-readout-2', () =>
        math(String.raw`\text{attention per step}\ \propto\ T`, 960, 810, 50, C.ink, 'center'),
      );
      if (b > 0) {
        const configs = [
          { kvHeads: 8, bytes: 2 },
          { kvHeads: 2, bytes: 2 },
          { kvHeads: 2, bytes: 1 },
        ];
        configs.forEach((config, i) =>
          api.focus.target('bandwidth-readout-3', () =>
            tile(
              `${config.kvHeads} KV × ${config.bytes} B: ${cacheBytes({ ...KV_EXAMPLE, ...config }, 12) / 1024} KiB`,
              150 + i * 555,
              865,
              [C.blue, C.cyan, C.green][i],
              520,
              62,
              25,
            ),
          ),
        );
        footer('Capacity: occupied bytes     Latency: work + traffic + waiting', C.green);
      } else footer('Longer retained history means more attention reads');
      break;
    }
    case 'conclusion': {
      const s = conclusionSnapshot(b, p, state.cues);
      api.focus.target('conclusion-request-a', () =>
        text('Request A appends after a shared four-token prefix', 960, 270, 36, C.ink, 'center'),
      );
      api.focus.target('conclusion-token-positions', () =>
        api.teaching.grid({
          x: 220,
          y: 320,
          width: 1480,
          height: 150,
          rows: 2,
          columns: 5,
          labels: [
            ['0', '1', '2', '3', '4'],
            ['The', 'bird', 'sings', 'softly', 'today'],
          ],
          fontSize: 32,
          fill: C.panel,
          stroke: C.blue,
          textColor: C.ink,
          cellFocusTarget: (row, column) =>
            column === 4 ? 'conclusion-position-four' : 'conclusion-prefix-tokens',
        }),
      );
      api.focus.target('conclusion-a-and-b-share-prefix', () =>
        text('A and B share physical block 7', 960, 505, 31, C.cyan, 'center'),
      );
      api.focus.target('conclusion-logical-map', () =>
        api.teaching.grid({
          x: 250,
          y: 550,
          width: 430,
          height: 180,
          rows: 4,
          columns: 2,
          labels: [
            ['Logical', 'Physical'],
            ['0', '7'],
            ['1', '2'],
            ['2', '5'],
          ],
          fontSize: 29,
          fill: C.panel,
          stroke: C.blue,
          textColor: C.ink,
          cellFocusTarget: (row) =>
            row === 2 ? 'conclusion-position-four-result' : 'conclusion-address-table',
        }),
      );
      api.focus.target('conclusion-address-formula', () =>
        math(
          s.mapped
            ? 'i=4: \\lfloor4/4\\rfloor=1, \\quad 4\\bmod4=0'
            : 'i=4: \\lfloor4/4\\rfloor=?, \\quad 4\\bmod4=?',
          1080,
          620,
          44,
          C.yellow,
          'center',
        ),
      );
      const block7 = api.focus.target('conclusion-physical-seven', () =>
        block(7, 220, 785, ['The', 'bird', 'sings', 'softly'], C.cyan, { w: 650, h: 96 }),
      );
      const block2Values = s.appended && !s.released ? ['today', null, null, null] : [];
      const block2 = api.focus.target('conclusion-physical-two', () =>
        block(2, 1080, 785, block2Values, C.yellow, {
          w: 520,
          h: 96,
          active: s.mapped && !s.released ? 0 : -1,
        }),
      );
      api.focus.target('conclusion-shared-owner', () =>
        text('Owners: ' + s.sharedBlockOwners, 1330, 740, 27, C.cyan, 'center'),
      );
      api.focus.target('conclusion-private-owner', () =>
        text(
          'Owner: ' + s.privateBlockOwner,
          1790,
          835,
          28,
          s.privateBlockOwner === 'A' ? C.yellow : s.privateBlockOwner === 'C' ? C.green : C.muted,
          'center',
        ),
      );
      if (s.mapped) {
        const amount = b === 1 ? api.focus.progress('position-four-result', 1) : 1;
        api.focus.target('conclusion-address-route', () =>
          rail(
            [
              { x: 680, y: 650 },
              { x: 850, y: 650 },
              { x: 1000, y: 735 },
              { x: 1095, y: 785 },
            ],
            amount,
            C.yellow,
            5,
          ),
        );
        api.focus.target('conclusion-address-arrow', () =>
          api.arrow(ctx, 1050, 758, 1095, 785, C.yellow, 4),
        );
      }
      if (s.eosEmitted)
        api.focus.target('conclusion-eos', () =>
          text('EOS emitted', 960, 930, 30, C.pink, 'center'),
        );
      if (s.gpuComplete)
        api.focus.target('conclusion-gpu-complete', () =>
          text('GPU work complete', 960, 965, 29, C.green, 'center'),
        );
      const status = !s.mapped
        ? 'Predict the logical block and offset for position 4'
        : !s.appended
          ? 'Logical 1 maps to physical 2 · offset 0 · append today next'
          : !s.eosEmitted
            ? 'A appended today · B keeps shared block 7'
            : !s.gpuComplete
              ? 'A emitted EOS · its cache is still in use'
              : !s.released
                ? 'GPU complete · A still owns private block 2'
                : !s.admitted
                  ? 'A released block 2 · B keeps shared block 7'
                  : 'C claims block 2 · B keeps shared block 7';
      api.focus.target('conclusion-status', () =>
        text(status, 960, 1030, 29, s.admitted ? C.green : C.ink, 'center'),
      );
      void block7;
      void block2;
      break;
    }
    default:
      throw new Error(`Unknown KV cache scene: ${scene.id}`);
  }
}
