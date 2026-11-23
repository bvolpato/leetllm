import { referenceHistory } from '../arithmetic.mjs';
import { sceneClock } from '../clock.mjs';
import { architecture, bytesPerToken, GiB, KiB, referencePoolBytes } from '../fixtures.mjs';

const stops = [4096, 16384, 32768, 65536, 131072];
const steps = ['sixteen', 'thirty-two', 'sixty-four', 'longest'];
const poolGiB = Number((referencePoolBytes / GiB).toFixed(4));
const number = (n) => n.toLocaleString('en-US');

function checkpointComparison(ctx, api, clock) {
  const { C } = api;
  const introduced = clock.progress('geometry') > 0;
  const layers70 = 80;
  const bytes70 = (bytesPerToken / architecture.layers) * layers70;
  const single70 = (8192 * bytes70) / GiB;
  const cards = [
    {
      name: '8B geometry',
      x: 145,
      layers: architecture.layers,
      bytes: bytesPerToken,
      color: C.blue,
    },
    {
      name: introduced ? '70B geometry' : 'Comparison geometry pending',
      x: 1000,
      layers: introduced ? layers70 : 0,
      bytes: bytes70,
      color: C.cyan,
    },
  ];
  for (const { name, x, layers, bytes, color } of cards) {
    api.text(ctx, name, x, 278, 40, color);
    if (!layers) continue;
    const visible =
      layers === layers70
        ? architecture.layers +
          Math.round((layers70 - architecture.layers) * clock.progress('geometry'))
        : layers;
    for (let i = 0; i < visible; i++) {
      const row = Math.floor(i / 8);
      api.rect(ctx, x + (i % 8) * 83, 570 - row * 24, 75, 17, color, undefined, 0);
    }
    api.text(ctx, visible + ' layers × 8 heads × 128 × 2 arrays × 2 B', x, 668, 30);
    if (visible === layers) {
      api.text(ctx, bytes / KiB + ' KiB / retained position', x, 728, 35, color);
    }
  }
  if (clock.after('request')) {
    api.text(
      ctx,
      '8,192 positions  ×  320 KiB  =  ' + single70 + ' GiB per 70B history',
      145,
      858,
      37,
      C.ink,
    );
  }
  if (clock.after('many')) {
    api.text(
      ctx,
      '64 histories  ×  ' + single70 + ' GiB  =  ' + 64 * single70 + ' GiB of KV alone',
      145,
      944,
      40,
      C.pink,
    );
  }
}

function growHistory(beat, clock) {
  let positions = stops[0];
  for (const [i, name] of steps.entries()) {
    const onBeat = [1, 2, 2, 3][i];
    const progress = beat < onBeat ? 0 : beat > onBeat ? 1 : clock.progress(name);
    positions += 1024 * Math.floor(((stops[i + 1] - stops[i]) / 1024) * progress);
  }
  return referenceHistory(positions);
}

function fillPool(ctx, api, y, history, count, color) {
  const { C } = api;
  const x = 620,
    width = 1000;
  const cell = (history.gib / poolGiB) * width;
  api.rect(ctx, x, y, width, 50, C.panel, C.muted, 0);
  if (count > 0) {
    const occupied = ((count * history.gib) / poolGiB) * width;
    api.rect(ctx, x, y, occupied, 50, color, undefined, 0);
    for (let i = 1; i < count; i++) {
      api.line(ctx, x + i * cell, y + 1, x + i * cell, y + 49, C.bg, 2);
    }
  }
}

export function drawArchitectureResidency(ctx, scene, state, api) {
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const beat = state.beat ?? 0;
  if (beat === 0) {
    focus.target('architecture-residency-mechanism', () => checkpointComparison(ctx, api, clock));
    return;
  }

  const short = referenceHistory(stops[0]);
  const live = growHistory(beat, clock);
  const packed = clock.progress('capacity');
  const copies = Math.floor(live.count * packed);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);

  focus.target('history-size', () => {
    label('Llama 3.1 8B  ·  128K', 140, 254, 37, C.ink);
    if (clock.after('context')) label('Original Llama 3  ·  8K limit', 140, 306, 29, C.muted);
    label('One FP16 history', 620, 232, 32, C.cyan);
    label(
      number(live.positions) + ' positions   ·   ' + live.gib + ' GiB',
      1620,
      232,
      36,
      C.ink,
      'right',
    );
    const width = (live.gib / 16) * 1000;
    api.rect(ctx, 620, 264, 1000, 46, C.panel, undefined, 0);
    api.rect(ctx, 620, 264, width, 46, C.cyan, undefined, 0);
    for (let i = 1; i * 4096 < live.positions; i++) {
      const x = 620 + (i / 32) * 1000;
      api.line(ctx, x, 265, x, 309, C.bg, 2);
    }
  });

  focus.target('pool-comparison', () => {
    label('Fixed KV pool  ·  ' + poolGiB.toFixed(2) + ' GiB', 1620, 380, 32, C.yellow, 'right');
    label('Short history', 140, 438, 33, C.muted);
    label(number(short.positions) + ' positions', 140, 481, 29, C.muted);
    const baselineCopies = Math.floor(short.count * packed);
    fillPool(ctx, api, 405, short, baselineCopies, C.green);
    if (packed > 0)
      label(baselineCopies + (packed < 1 ? ' placed' : ' fit'), 1650, 444, 34, C.green);
    label('Growing history', 140, 548, 36, C.cyan);
    label(number(live.positions) + ' positions', 140, 593, 29, C.muted);
    fillPool(ctx, api, 515, live, copies, C.cyan);
    if (packed > 0) {
      const tryingFourth = live.positions === stops.at(-1) && !clock.after('wait');
      label(
        copies + (packed < 1 ? ' placed' : tryingFourth ? ' here' : ' fit'),
        1650,
        554,
        40,
        C.cyan,
      );
    }
    api.line(ctx, 1620, 394, 1620, 581, C.yellow, 4);
    label('Each division holds one whole request', 620, 619, 29, C.muted);
  });

  if (beat >= 3) {
    focus.target('next-history', () => {
      const trial = clock.progress('fourth');
      if (clock.progress('arrives') > 0) {
        const x = 620 + trial * (live.occupied / poolGiB) * 1000;
        const w = (live.gib / poolGiB) * 1000;
        const inside = Math.min(w, 1620 - x);
        api.rect(ctx, x, 670, inside, 44, C.cyan, undefined, 0);
        if (w > inside) api.rect(ctx, 1620, 670, w - inside, 44, C.pink, undefined, 0);
        api.line(ctx, 1620, 643, 1620, 730, C.yellow, 4);
        label(
          clock.after('wait') ? 'Queue the fourth request' : 'Fourth request',
          140,
          706,
          39,
          clock.after('wait') ? C.pink : C.ink,
        );
        label(
          live.gib + ' GiB needed   /   ' + live.free.toFixed(2) + ' GiB free',
          620,
          770,
          34,
          C.yellow,
        );
      } else {
        label('Next request', 140, 706, 33, C.muted);
      }
    });
  }

  if (clock.after('capacity')) {
    const settled = stops.filter((length) => live.positions >= length);
    for (const [i, length] of settled.entries()) {
      const history = referenceHistory(length);
      const x = 140 + i * 338;
      const color = length === live.positions ? C.cyan : C.muted;
      label(number(length) + ' positions', x, 850, 32, color);
      label(history.gib + ' GiB each', x, 901, 30, color);
      if (length < stops.at(-1) || clock.after('wait')) {
        label(history.count + ' whole requests', x, 960, 34, color);
      }
    }
  }
}
export default { id: 'architecture-residency', draw: drawArchitectureResidency };
