// Scene 21: Will the next gather fit on this rank? 36-elem allowance: 4 shard + 16 compute + 12 acts = 32 (4 left!) + 8 prefetch = 40 (OOM by 4!) -> delay prefetch -> 32 fits!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function livePeak(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=4 shard, 2=+16 full, 3=+12 acts (32 -> hold!), 4=+8 prefetch (40), 5=verdict OOM(+4), 6=delay prefetch (32), 7=fits!

  const bgAura = aura(0, 20, 620, '#fb71851c', '#6ee7b718');
  const title = heroTitle(['Will the Next Gather', 'Fit on This Rank?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: '36-ELEMENT BUDGET · PREFETCH OVERLAP PEAK',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;

    // Ruler: 0..42 elements -> x in [-760, 710] (35 px per element)
    const x0 = -760;
    const px = 35;
    const limX = x0 + 36 * px; // +500
    const barY = -40;
    const barH = 92;

    const showShard = st >= 1;
    const showFull = st >= 2;
    const showActs = st >= 3;
    const showPref = st >= 4 && st < 6;
    const showOver = st >= 5 && st < 6;
    const showRoom = st >= 7;

    const total =
      (showShard ? 4 : 0) + (showFull ? 16 : 0) + (showActs ? 12 : 0) + (showPref ? 8 : 0);

    const nodes = [
      txt('SIMULTANEOUS LIVE ALLOCATIONS AT MODULE ENTRY', 0, -218, 28, COSMOS.gold, 'mono'),
      // 36-element allowance ticks above & below bar (never crosses bar text)
      line([limX, -155], [limX, -98], { stroke: COSMOS.gold, width: 3.4, dash: [8, 6] }).glow(
        6,
        COSMOS.gold,
      ),
      line([limX, 20], [limX, 75], { stroke: COSMOS.gold, width: 3.4, dash: [8, 6] }).glow(
        6,
        COSMOS.gold,
      ),
      txt('36-ELEM LIMIT', limX, -182, 26, COSMOS.gold, 'mono'),

      // Background capacity bar (36 elems)
      rect(36 * px, barH, { fill: '#0b1324', stroke: COSMOS.muted, width: 2.0, radius: 10 }).at(
        x0 + 18 * px,
        barY,
      ),
    ];

    let cur = x0;
    const addSeg = (elems, label, col, fill) => {
      const w = elems * px;
      nodes.push(
        rect(w - 4, barH - 6, { fill, stroke: col, width: 2.8, radius: 8 })
          .at(cur + w * 0.5, barY)
          .glow(8, col),
        txt(label, cur + w * 0.5, barY, 26, COSMOS.ink, 'mono'),
      );
      cur += w;
    };

    if (showShard) addSeg(4, '4', ROLE.orig, '#12284a');
    if (showFull) addSeg(16, '16 compute', ROLE.copy, '#0e2834');
    if (showActs) addSeg(12, '12 acts', ROLE.grad, '#231642');
    if (showPref) addSeg(8, '+8 pref!', ROLE.bad, '#331120');

    // Breakdown legend + Verdict card
    nodes.push(
      glassCell(-390, 165, 800, 152, ROLE.orig, { fill: '#10182b', glow: 6 }),
      txt('CURRENT ALLOCATION SUBTOTAL', -390, 122, 26, COSMOS.muted, 'mono'),
      txt(
        showPref
          ? '4 shard + 16 full + 12 acts + 8 pref = 40'
          : showActs
            ? '4 shard + 16 full + 12 acts = 32'
            : `Live on ruler: ${total} elements`,
        -390,
        180,
        28,
        showPref ? ROLE.bad : COSMOS.ink,
        'mono',
      ),

      glassCell(430, 165, 760, 152, showOver ? ROLE.bad : showRoom ? ROLE.good : COSMOS.dim, {
        fill: showOver ? '#2d1222' : showRoom ? '#0d2924' : '#0a0f1c',
        glow: showOver || showRoom ? 10 : 2,
      }),
      txt('HEADROOM VERDICT', 430, 122, 26, COSMOS.muted, 'mono'),
      txt(
        showOver
          ? '40 > 36  ->  EXCEEDS BY 4!'
          : showRoom
            ? '32 <= 36  ->  FITS (4 slots free)'
            : st >= 3
              ? 'Predict: how many slots remain?'
              : 'Stacking allocations...',
        430,
        180,
        28,
        showOver ? ROLE.bad : showRoom ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 290, { radius: 6, color: showOver ? ROLE.bad : ROLE.good }),
      txt(
        showRoom
          ? 'Delaying prefetch cuts peak to 32, but can leave compute waiting · profile memory + comm together'
          : 'Owned shard stays 4; simultaneous overlap at module entry caused the peak overflow',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('peak-shard', () => s.play(step.to(1, { duration: remainDuration(c, 'peak-shard', 0.35) })));
  c.on('peak-full', () => s.play(step.to(2, { duration: remainDuration(c, 'peak-full', 0.35) })));
  c.on('peak-acts', () => s.play(step.to(3, { duration: remainDuration(c, 'peak-acts', 0.35) })));
  c.on('peak-prefetch', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'peak-prefetch', 0.4) })),
  );
  c.after('peak-over', () =>
    s.play(step.to(5, { duration: remainDuration(c, 'peak-over', 0.35) })),
  );
  c.on('peak-delay', () => s.play(step.to(6, { duration: remainDuration(c, 'peak-delay', 0.4) })));
  c.after('peak-room', () =>
    s.play(step.to(7, { duration: remainDuration(c, 'peak-room', 0.35) })),
  );
}
