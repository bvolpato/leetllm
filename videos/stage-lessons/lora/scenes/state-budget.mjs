// Scene 22: A small adapter leaves the base and runtime bill: Honest decimal-GB bars for 70B (840/1120/140 GB) -> 65B (780/130/33.53 GB on 48 GB GPU).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  NESTED_QUANT,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function stateBudget(s, c) {
  const phase = s.value(0);
  const show70B = s.value(1);
  const show12B = s.value(0);
  const showMaster = s.value(0);
  const freeze70B = s.value(0);
  const show65B = s.value(0);
  const show4BitScene = s.value(0);
  const showRaw4 = s.value(0);
  const showNested = s.value(0);
  const showRoom = s.value(0);

  const bgAura = aura(0, 10, 620, '#60a5fa1e', '#6ee7b718');
  const title = heroTitle(['Model-State Bill:', '70B and 65B Scale'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'DECIMAL GB · EXCLUDES ACTIVATIONS & TEMPS',
  });

  // Part 1: 70B (12-byte = 840 GB, +master = 1120 GB, frozen = 140 GB) + 65B (780 -> 130 GB)
  const partFull = guardedDynamic(show70B, (a) => {
    const p12 = show12B.value;
    const pm = showMaster.value;
    const fr = freeze70B.value;
    const s65 = show65B.value;

    const x0 = -835;
    const gbScale = 1.42; // 1120 GB = 1590 px
    const drawSegBar = (y, label, segs, totalNote, noteCol) => {
      const out = [txt(label, x0, y - 62, 28, COSMOS.ink, 'sans', 'left').opacity(a)];
      let curX = x0;
      for (const seg of segs) {
        const w = seg.gb * gbScale;
        if (w > 2) {
          out.push(
            rect(w, 60, { fill: seg.color, stroke: '#070910', width: 2, radius: 5 })
              .at(curX + w * 0.5, y)
              .glow(6, seg.color)
              .opacity(a * (seg.op ?? 0.92)),
          );
          if (w >= 95 && seg.tag) {
            out.push(txt(seg.tag, curX + w * 0.5, y, 26, '#070910', 'mono').opacity(a));
          }
          curX += w;
        }
      }
      if (totalNote) {
        out.push(txt(totalNote, x0, y + 58, 30, noteCol, 'mono', 'left').opacity(a));
      }
      return out;
    };

    const keepFrac = 1 - fr;
    const nodes = [
      ...drawSegBar(
        -150,
        fr > 0.2
          ? '70B LoRA: freeze base -> drop base grads & Adam moments'
          : '70B full 12-byte recipe: 2B weights + 2B grads + 8B Adam (m, v)',
        [
          { gb: 140, color: COSMOS.blue, tag: '140' },
          { gb: 140 * p12 * keepFrac, color: COSMOS.rose, tag: '140' },
          { gb: 280 * p12 * keepFrac, color: COSMOS.gold, tag: '280' },
          { gb: 280 * p12 * keepFrac, color: COSMOS.cyan, tag: '280' },
        ],
        fr > 0.5
          ? 'Frozen FP16 base floor = 140 GB  (+ adapter + activations)'
          : p12 > 0.5
            ? '70B × 12 bytes = 840 GB model state'
            : '140 GB FP16 weights alone',
        fr > 0.5 ? COSMOS.blue : COSMOS.ink,
      ),
    ];

    if (pm > 0.05 && fr < 0.2) {
      nodes.push(
        ...drawSegBar(
          75,
          'Separate 16-byte recipe: add 4-byte FP32 master copy (+280 GB)',
          [
            { gb: 140, color: COSMOS.blue, tag: '140' },
            { gb: 140, color: COSMOS.rose, tag: '140' },
            { gb: 280, color: COSMOS.gold, tag: '280' },
            { gb: 280, color: COSMOS.cyan, tag: '280' },
            { gb: 280 * pm, color: COSMOS.emerald, tag: '280' },
          ],
          pm > 0.45 ? '840 + 280 = 1,120 GB' : null,
          COSMOS.emerald,
        ),
      );
    }

    if (s65 > 0.05) {
      nodes.push(
        ...drawSegBar(
          115,
          'QLoRA paper 65B scale (same 12-byte recipe)',
          [
            { gb: 130, color: COSMOS.blue, tag: '130' },
            { gb: 650 * s65, color: '#3b4a6e', tag: '650 dropped', op: 0.6 },
          ],
          '65B full = 780 GB   ·   FP16 frozen base = 130 GB',
          COSMOS.cyan,
        ),
      );
    }

    nodes.push(
      glassCell(0, 355, 1660, 114, COSMOS.muted, { fill: '#10182d', glow: 4, opacity: a }),
      txt(
        'Honest shared scale · activations, KV cache, and temporary buffers must still be added',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: 65B 4-bit QLoRA on a single 48 GB GPU
  const part4Bit = guardedDynamic(show4BitScene, (a) => {
    const r4 = showRaw4.value;
    const ns = showNested.value;
    const rm = showRoom.value;

    const x0 = -780;
    const totalW = 1560; // 48 GB -> 32.5 px per GB
    const px = totalW / 48;
    const rawGB = NESTED_QUANT.rawFourBitGB; // 32.5
    const scaleGB = NESTED_QUANT.nestedTotalGB; // ~1.0315
    const baseTotalGB = rawGB + scaleGB; // ~33.5315
    const remGB = 48 - baseTotalGB; // ~14.4685

    const nodes = [
      txt(
        '65B MODEL IN 4-BIT NF4 ON ONE 48 GB GPU',
        855,
        -375,
        26,
        COSMOS.emerald,
        'mono',
        'right',
      ).opacity(a),

      // 48 GB GPU container frame
      rect(totalW, 124, { fill: '#11182c', stroke: COSMOS.muted, width: 2.5, radius: 10 })
        .at(0, -55)
        .opacity(a),
      txt('0 GB', x0, -145, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('48 GB GPU CAPACITY', x0 + totalW, -145, 26, COSMOS.ink, 'mono', 'right').opacity(a),

      // 32.5 GB packed 4-bit weights
      rect(rawGB * px * Math.max(0.05, r4), 116, {
        fill: COSMOS.blue,
        stroke: '#ffffff',
        width: 1.2,
        radius: 7,
      })
        .at(x0 + rawGB * px * Math.max(0.05, r4) * 0.5, -55)
        .glow(10, COSMOS.blue)
        .opacity(r4 * a),
      txt(
        '32.5 GB packed 4-bit weights',
        x0 + rawGB * px * 0.5,
        -55,
        30,
        '#070910',
        'mono',
      ).opacity(r4 * a),

      // +1.0315 GB nested scales
      rect(scaleGB * px * ns, 116, { fill: COSMOS.gold, stroke: null, radius: 3 })
        .at(x0 + rawGB * px + scaleGB * px * ns * 0.5, -55)
        .glow(10, COSMOS.gold)
        .opacity(ns * a),

      // ~14.47 GB remaining headroom
      rect(remGB * px * rm, 116, { fill: '#10342f', stroke: COSMOS.emerald, width: 2.4, radius: 7 })
        .at(x0 + baseTotalGB * px + remGB * px * rm * 0.5, -55)
        .glow(10, COSMOS.emerald)
        .opacity(rm * a),
      ...(rm > 0.78
        ? [
            txt(
              '~14.5 GB left',
              x0 + baseTotalGB * px + remGB * px * 0.5,
              -55,
              28,
              COSMOS.emerald,
              'mono',
            ).opacity(((rm - 0.78) / 0.22) * a),
          ]
        : []),

      // Three clean readouts below the bar
      glassCell(-550, 195, 515, 165, COSMOS.blue, { fill: '#101d35', glow: 8, opacity: a }),
      txt('4-BIT WEIGHT PAYLOAD', -550, 152, 26, COSMOS.muted, 'mono').opacity(a),
      txt(r4 > 0.3 ? '32.5 GB' : '?', -550, 218, 44, COSMOS.blue, 'mono').opacity(a),

      glassCell(0, 195, 515, 165, COSMOS.gold, { fill: '#221c10', glow: 8, opacity: a }),
      txt('+ NESTED BLOCK SCALES', 0, 152, 26, COSMOS.muted, 'mono').opacity(a),
      txt(ns > 0.3 ? '≈ 33.53 GB total' : '?', 0, 218, 38, COSMOS.gold, 'mono').opacity(a),

      glassCell(550, 195, 515, 165, COSMOS.emerald, { fill: '#0e2528', glow: 9, opacity: a }),
      txt('REMAINING ON 48 GB GPU', 550, 152, 26, COSMOS.muted, 'mono').opacity(a),
      txt(rm > 0.3 ? '≈ 14.47 GB' : '?', 550, 218, 44, COSMOS.emerald, 'mono').opacity(a),

      txt(
        'Activations, trainable LoRA adapters, and temporary buffers must share that ~14.5 GB',
        0,
        368,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, partFull, part4Bit);
  runPhase(s, c, phase, 14);

  c.on('state-budget-1', () => s.play(show70B.to(1, { duration: 0.2 })));
  c.on('state-twelve', () => s.play(show12B.to(1, { duration: 0.5 })));
  c.on('state-master', () => s.play(showMaster.to(1, { duration: 0.5 })));
  c.on('state-budget-2', () => s.play(showMaster.to(0, { duration: 0.25 })));
  c.on('state-freeze', () => s.play(freeze70B.to(1, { duration: 0.55 })));
  c.on('state-sixty-five', () => s.play(show65B.to(1, { duration: 0.45 })));
  c.on('state-budget-3', () => {
    s.play(
      par(show70B.to(0, { duration: 0.16 }), delay(show4BitScene.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('state-four-bit', () => s.play(showRaw4.to(1, { duration: 0.45 })));
  c.on('state-nested', () => s.play(showNested.to(1, { duration: 0.4 })));
  c.on('state-room', () =>
    s.play(showRoom.to(1, { duration: remainDuration(c, 'state-room', 0.45) })),
  );
}
