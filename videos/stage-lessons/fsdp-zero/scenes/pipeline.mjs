// Scene 20: Trade activation retention without erasing the bubble: 4 stages x 8 microbatches (1F1B maxLive [4,3,2,1] vs GPipe 8; bubble 7/32=21.88%, idle 7/39=17.95%).
import {
  COSMOS,
  PIPE_1F1B,
  PIPE_GPIPE,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pipeline(s, c) {
  const phase = s.value(0);
  const beatIdx = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['1F1B Pipeline:', 'Retention vs Bubble'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grads,
    eyebrow: '4 STAGES × 8 MICROBATCHES · GPIPE vs 1F1B',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const bi = Math.round(beatIdx.value);
    const ticks = PIPE_1F1B.ticks; // 22
    const cellW = 58;
    const x0 = -640;

    const nodes = [
      txt('1F1B SCHEDULE (4 STAGES × 8 MICROBATCHES · 22 TICKS)', 0, -210, 28, ROLE.grads, 'mono'),
    ];

    // Draw 4 stage rows from real PIPE_1F1B.events!
    for (let st = 0; st < 4; st++) {
      const y = -125 + st * 78;
      nodes.push(
        txt(`S${st}`, -730, y, 26, COSMOS.ink, 'mono'),
        txt(`max ${PIPE_1F1B.maxLive[st]}`, 735, y, 26, ROLE.good, 'mono'),
      );
    }

    PIPE_1F1B.events.forEach((ev) => {
      const cx = x0 + ev.tick * cellW;
      const cy = -125 + ev.stage * 78;
      const isF = ev.kind === 'F';
      const col = isF ? ROLE.weights : ROLE.grads;
      nodes.push(
        rect(cellW - 6, 56, {
          fill: isF ? '#12294a' : '#251540',
          stroke: col,
          width: 2.0,
          radius: 6,
        }).at(cx, cy),
        txt(`${ev.kind}${ev.microbatch}`, cx, cy, 26, col, 'mono'),
      );
    });

    // Bottom comparison cards (Peak Live Activations vs Bubble Formula)
    nodes.push(
      glassCell(-430, 228, 740, 148, bi >= 1 ? ROLE.good : COSMOS.dim, {
        fill: '#0d2424',
        glow: bi >= 1 ? 8 : 3,
      }),
      txt('PEAK LIVE ACTIVATIONS (S0..S3)', -430, 186, 26, ROLE.good, 'mono'),
      txt(
        `1F1B [${PIPE_1F1B.maxLive.join(',')}] vs GPipe [${PIPE_GPIPE.maxLive.join(',')}]`,
        -430,
        246,
        28,
        COSMOS.ink,
        'mono',
      ),

      glassCell(430, 228, 740, 148, bi >= 2 ? COSMOS.gold : COSMOS.dim, {
        fill: '#221c10',
        glow: bi >= 2 ? 9 : 3,
      }),
      txt('8 STAGES, 32 MICROBATCHES BUBBLE', 430, 186, 26, COSMOS.gold, 'mono'),
      txt('Bubble 7/32 (21.9%) · Idle 7/39 (18.0%)', 430, 246, 26, COSMOS.gold, 'mono'),

      glowDot(x0 + ((p * 0.55) % 1) * (ticks * cellW), 348, { radius: 6, color: ROLE.grads }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  c.onBeat(1, () => s.play(beatIdx.to(1, { duration: 0.4 })));
  c.onBeat(2, () => s.play(beatIdx.to(2, { duration: 0.4 })));
}
