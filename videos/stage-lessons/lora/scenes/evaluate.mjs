// Scene 33: Let the task decide the useful rank: Glowing training / held-out task / regression loss trails + final LoRA causal equation.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function evaluate(s, c) {
  const trainProg = s.value(0);
  const showTrainLabel = s.value(0);
  const heldProg = s.value(0);
  const regProg = s.value(0);
  const showCausal = s.value(0);

  const bgAura = aura(-100, 10, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['Let the Task Decide', 'the Useful Rank'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'EVALUATION · HELD-OUT TASK & REGRESSION',
  });

  const eq = glowTex(String.raw`\Delta W = \frac{\alpha}{r} B A`, {
    x: 495,
    y: -365,
    size: 46,
    color: COSMOS.gold,
  });

  const plotX = -810;
  const plotY = -175;
  const plotW = 860;
  const plotH = 510;

  const sampleCurve = (fn, frac) => {
    const count = Math.max(2, Math.floor(60 * frac));
    return Array.from({ length: count }, (_, i) => {
      const u = (i / 59) * frac;
      return [plotX + u * plotW, fn(u)];
    });
  };

  const live = guardedDynamic(1, () => {
    const tp = Math.max(0.18, trainProg.value);
    const hp = heldProg.value;
    const rp = regProg.value;
    const sc = showCausal.value;

    const trainPts = sampleCurve((u) => plotY + 60 + 380 * (1 - Math.exp(-u * 4.0)), tp);
    const heldPts =
      hp > 0.05
        ? sampleCurve(
            (u) =>
              plotY + 90 + 260 * (1 - Math.exp(-u * 4.0)) - 170 * Math.max(0, u - 0.5) ** 2 * 4,
            hp,
          )
        : null;
    const regPts = rp > 0.05 ? sampleCurve((u) => plotY + 310 - 235 * u ** 3, rp) : null;

    const nodes = [
      // Plot axes & grid
      line([plotX, plotY], [plotX, plotY + plotH], { stroke: '#4c6294', width: 3 }),
      line([plotX, plotY + plotH], [plotX + plotW, plotY + plotH], { stroke: '#4c6294', width: 3 }),
      txt('SCHEMATIC LOSS CURVES', plotX + plotW * 0.5, plotY - 34, 26, COSMOS.muted, 'mono'),
      txt('loss', plotX - 38, plotY + 18, 26, COSMOS.muted, 'mono', 'right'),
      txt('training steps ->', plotX + plotW * 0.5, plotY + plotH + 44, 26, COSMOS.muted, 'mono'),

      // Training loss curve (blue)
      glowingTrail(trainPts, { color: COSMOS.blue, width: 5, glow: 10 }),
      glowDot(trainPts.at(-1)[0], trainPts.at(-1)[1], { radius: 7, color: COSMOS.blue }),

      // Right legend & causal map
      glassCell(495, -130, 680, 96, COSMOS.blue, {
        fill: '#101d35',
        glow: showTrainLabel.value > 0.2 ? 9 : 4,
      }),
      glowDot(195, -130, { radius: 8, color: COSMOS.blue }),
      txt('Training loss (examples fitted)', 225, -130, 28, COSMOS.blue, 'sans', 'left'),

      glassCell(495, -12, 680, 96, hp > 0.2 ? COSMOS.gold : '#334268', {
        fill: '#221c10',
        glow: hp > 0.2 ? 9 : 2,
        opacity: Math.max(0.4, hp),
      }),
      glowDot(195, -12, { radius: 8, color: COSMOS.gold, opacity: Math.max(0.4, hp) }),
      txt('Held-out task checks (new skill)', 225, -12, 28, COSMOS.gold, 'sans', 'left').opacity(
        Math.max(0.4, hp),
      ),

      glassCell(495, 106, 680, 96, rp > 0.2 ? COSMOS.rose : '#334268', {
        fill: '#261220',
        glow: rp > 0.2 ? 9 : 2,
        opacity: Math.max(0.4, rp),
      }),
      glowDot(195, 106, { radius: 8, color: COSMOS.rose, opacity: Math.max(0.4, rp) }),
      txt('Regression set (existing skills)', 225, 106, 28, COSMOS.rose, 'sans', 'left').opacity(
        Math.max(0.4, rp),
      ),

      glassCell(495, 315, 680, 162, sc > 0.2 ? COSMOS.emerald : '#334268', {
        fill: '#0e2428',
        glow: sc > 0.2 ? 10 : 3,
      }),
      txt('CAUSAL MAP', 495, 268, 26, COSMOS.emerald, 'mono'),
      txt('rank · scale · targets · memory · eval', 495, 320, 28, COSMOS.ink, 'mono'),
      txt('Measured behavior earns deployment', 495, 364, 26, COSMOS.muted, 'sans'),
    ];

    if (heldPts) {
      nodes.push(
        glowingTrail(heldPts, { color: COSMOS.gold, width: 5, glow: 10 }),
        glowDot(heldPts.at(-1)[0], heldPts.at(-1)[1], { radius: 7, color: COSMOS.gold }),
      );
    }

    if (regPts) {
      nodes.push(
        glowingTrail(regPts, { color: COSMOS.rose, width: 5, glow: 10 }),
        glowDot(regPts.at(-1)[0], regPts.at(-1)[1], { radius: 7, color: COSMOS.rose }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('evaluate-b1-1', () => s.play(trainProg.to(1, { duration: 1.0 })));
  c.on('evaluate-b2-1', () => s.play(showTrainLabel.to(1, { duration: 0.35 })));
  c.on('evaluate-b2-2', () => s.play(heldProg.to(1, { duration: 0.7 })));
  c.on('evaluate-b2-3', () => s.play(regProg.to(1, { duration: 0.7 })));
  c.on('evaluate-b3-1', () =>
    s.play(showCausal.to(1, { duration: remainDuration(c, 'evaluate-b3-1', 0.45) })),
  );
}
