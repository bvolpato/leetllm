// Scene 05: Where does the next training reply come from? (Offline DPO fixed file vs Online PPO rollout loop)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function methods(s, c) {
  const phase = s.value(0);
  const sPair = s.value(0);
  const sReuse = s.value(0);
  const sWrite = s.value(0);
  const sScore = s.value(0);
  const sCollect = s.value(0);

  const bgAura = aura(0, 30, 620, '#123d4f28', '#2f1a4d18');
  const title = heroTitle(['Where Does the Next', 'Training Reply Come From?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'OFFLINE DPO vs ONLINE RLHF (PPO) · DATA SOURCE & EXPLORATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const pr = Math.max(0.75, sPair.value);
    const ru = sReuse.value;
    const wr = Math.max(0.72, sWrite.value);
    const sc = sScore.value;
    const co = sCollect.value;

    const nodes = [
      // TOP LANE: Offline DPO
      txt('OFFLINE DPO  ·  FIXED COMPARISON FILE', -855, -246, 28, COSMOS.cyan, 'mono', 'left'),

      glassCell(-655, -82, 380, 128, COSMOS.cyan, { fill: '#0f2138', glow: 6, opacity: pr }),
      txt('DISK ARCHIVE', -655, -108, 26, COSMOS.cyan, 'mono'),
      txt('P-7: Ticket > Grant', -655, -58, 26, COSMOS.ink, 'sans'),

      line([-460, -82], [-290, -82], { stroke: COSMOS.cyan, width: 3.2 }),
      glowDot(-460 + ((p * 85) % 170), -82, { radius: 6, color: COSMOS.cyan }),

      glassCell(-70, -82, 430, 128, COSMOS.gold, { fill: '#221c0e', glow: 6, opacity: pr }),
      txt('SCORE FIXED PAIR', -70, -108, 26, COSMOS.gold, 'mono'),
      txt('Policy pi_theta + Ref pi_ref', -70, -58, 26, COSMOS.ink, 'sans'),

      line([150, -82], [320, -82], { stroke: COSMOS.emerald, width: 3.2 }),
      glowDot(150 + ((p * 85) % 170), -82, { radius: 6, color: COSMOS.emerald }),

      glassCell(580, -82, 510, 128, COSMOS.emerald, {
        fill: '#0e2824',
        glow: ru > 0.3 ? 11 * pulse : 5,
      }),
      txt(
        ru > 0.3 ? 'PASS 2: POLICY CHANGED' : 'UPDATE POLICY',
        580,
        -108,
        26,
        COSMOS.emerald,
        'mono',
      ),
      txt(
        ru > 0.3 ? 'Same words on disk (offline)' : 'Fit recorded vote directly',
        580,
        -58,
        26,
        COSMOS.ink,
        'sans',
      ),
    ];

    // Reuse loop arc for Pass 2
    if (ru > 0.1) {
      nodes.push(
        glowingArc([580, -152], [-655, -152], -46, {
          color: COSMOS.cyan,
          width: 3.2,
          opacity: ru,
          glow: 8,
        }),
        txt('REUSE SAME ARCHIVE', 120, -214, 26, COSMOS.cyan, 'mono').opacity(ru),
      );
    }

    // BOTTOM LANE: Online PPO
    nodes.push(
      txt(
        'ONLINE RLHF (PPO)  ·  FRESH ROLLOUT EACH STEP',
        -560,
        88,
        28,
        COSMOS.violet,
        'mono',
        'left',
      ),

      glassCell(-655, 206, 380, 128, COSMOS.violet, { fill: '#221438', glow: 6, opacity: wr }),
      txt('LIVE ACTOR pi_theta', -655, 180, 26, COSMOS.violet, 'mono'),
      txt('Writes fresh P-7 reply', -655, 230, 26, COSMOS.ink, 'sans'),

      line([-460, 206], [-290, 206], { stroke: COSMOS.violet, width: 3.2 }),
      glowDot(-460 + ((p * 85 + 60) % 170), 206, { radius: 6, color: COSMOS.violet }),

      glassCell(-70, 206, 430, 128, sc > 0.2 ? COSMOS.amber : COSMOS.dim, {
        fill: '#261a10',
        glow: sc > 0.2 ? 9 * pulse : 4,
        opacity: Math.max(0.75, sc),
      }),
      txt('REWARD MODEL + KL', -70, 180, 26, COSMOS.amber, 'mono'),
      txt('Score new text + ref drift', -70, 230, 26, COSMOS.ink, 'sans'),

      line([150, 206], [320, 206], { stroke: COSMOS.amber, width: 3.2 }),
      glowDot(150 + ((p * 85 + 60) % 170), 206, { radius: 6, color: COSMOS.amber }),

      glassCell(580, 206, 510, 128, sc > 0.2 ? COSMOS.gold : COSMOS.dim, {
        fill: '#221c0e',
        glow: sc > 0.2 ? 8 : 4,
        opacity: Math.max(0.75, sc),
      }),
      txt('PPO ACTOR UPDATE', 580, 180, 26, COSMOS.gold, 'mono'),
      txt('Sees failures actor just made', 580, 230, 26, COSMOS.ink, 'sans'),
    );

    // Iterative refresh bridge
    if (co > 0.1) {
      nodes.push(
        glowingArc([-655, 134], [-655, -12], 0, {
          color: COSMOS.gold,
          width: 4.0,
          opacity: co,
          glow: 10,
        }),
        glowDot(-655, 42, { radius: 7, color: COSMOS.gold, opacity: co }),
      );
    }

    nodes.push(
      txt(
        co > 0.3
          ? 'Iterative bridge: sample fresh reply -> collect vote -> append to DPO file'
          : 'Offline trains on stored pairs; online scores fresh rollouts from the live actor',
        0,
        388,
        28,
        co > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('methods-pair', () =>
    s.play(sPair.to(1, { duration: remainDuration(c, 'methods-pair', 0.5) })),
  );
  c.on('methods-reuse', () =>
    s.play(sReuse.to(1, { duration: remainDuration(c, 'methods-reuse', 0.6) })),
  );
  c.on('methods-write', () =>
    s.play(sWrite.to(1, { duration: remainDuration(c, 'methods-write', 0.55) })),
  );
  c.on('methods-score', () =>
    s.play(sScore.to(1, { duration: remainDuration(c, 'methods-score', 0.55) })),
  );
  c.on('methods-collect', () =>
    s.play(sCollect.to(1, { duration: remainDuration(c, 'methods-collect', 0.6) })),
  );
}
