// Scene 23: Follow the actual base checkpoint and supervision through all four stages (DeepSeek-R1 4-stage pipeline)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function r1Pipeline(s, c) {
  const phase = s.value(0);
  const sCold = s.value(0);
  const sRl = s.value(0);
  const sData = s.value(0);
  const sRestart = s.value(0);
  const sFinal = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5414');
  const title = heroTitle(['Four Stages of the', 'DeepSeek-R1 Pipeline'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'COLD START -> RL -> BASE RESTART (800K SFT) -> MIXED RL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sc = Math.max(0.65, sCold.value);
    const sr = Math.max(0.65, sRl.value);
    const sd = Math.max(0.65, sData.value);
    const rs = sRestart.value;
    const sf = Math.max(0.65, sFinal.value);

    const yMain = -70;
    const nodes = [
      // V3-Base origin anchor
      glassCell(-745, yMain, 220, 124, COSMOS.gold, { fill: '#251e0e', glow: 8 }),
      txt('V3-BASE', -745, yMain - 24, 30, COSMOS.gold, 'mono'),
      txt('pretrained', -745, yMain + 22, 26, COSMOS.muted, 'sans'),

      // Stage 1: Cold-start SFT
      glowingArc([-630, yMain], [-485, yMain], -24, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: sc,
      }),
      glassCell(-360, yMain, 240, 124, COSMOS.cyan, {
        fill: '#102138',
        glow: sc > 0.7 ? 8 : 3,
        opacity: sc,
      }),
      txt('STAGE 1', -360, yMain - 30, 26, COSMOS.cyan, 'mono').opacity(sc),
      txt('Cold SFT', -360, yMain + 16, 28, COSMOS.ink, 'sans').opacity(sc),

      // Stage 2: Reasoning GRPO + language consistency
      glowingArc([-235, yMain], [-95, yMain], -24, {
        color: COSMOS.emerald,
        width: 3.4,
        opacity: sr,
      }),
      glassCell(40, yMain, 260, 124, COSMOS.emerald, {
        fill: '#0e2824',
        glow: sr > 0.7 ? 9 : 3,
        opacity: sr,
      }),
      txt('STAGE 2', 40, yMain - 30, 26, COSMOS.emerald, 'mono').opacity(sr),
      txt('GRPO + Lang', 40, yMain + 16, 28, COSMOS.ink, 'sans').opacity(sr),

      // Stage 3: 600K reasoning + 200K general -> 2 SFT epochs FROM V3-BASE!
      glowingArc([175, yMain], [315, yMain], -24, {
        color: COSMOS.violet,
        width: 3.4,
        opacity: sd,
      }),
      glassCell(460, yMain, 280, 124, COSMOS.violet, {
        fill: '#1b1433',
        glow: sd > 0.7 ? 9 : 3,
        opacity: sd,
      }),
      txt('STAGE 3 (800K)', 460, yMain - 30, 26, COSMOS.violet, 'mono').opacity(sd),
      txt('600K + 200K', 460, yMain + 16, 28, COSMOS.ink, 'mono').opacity(sd),

      // Lower restart arrow from V3-Base -> Stage 3 SFT -> Stage 4 Mixed RL
      glowingArc([-745, yMain + 68], [460, yMain + 68], 130, {
        color: rs > 0.3 ? COSMOS.gold : COSMOS.muted,
        width: rs > 0.3 ? 4.4 : 2.6,
        opacity: Math.max(0.7, rs),
      }),
      txt(
        'RESTART FROM V3-BASE -> 2 SFT EPOCHS ON 800K COLLECTED DATA',
        -140,
        142,
        26,
        rs > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
      )
        .glow(rs > 0.3 ? 7 * pulse : 0, COSMOS.gold)
        .opacity(Math.max(0.7, rs)),

      // Stage 4: Rule-based reasoning + learned preference (helpfulness on summary, harmlessness on whole trace)
      glassCell(600, 232, 560, 148, COSMOS.emerald, {
        fill: '#0e2624',
        glow: sf > 0.7 ? 10 * pulse : 4,
        opacity: sf,
      }),
      txt('STAGE 4: FINAL MIXED RL', 600, 190, 26, COSMOS.emerald, 'mono').opacity(sf),
      txt('Rule rewards + Helpfulness (summary)', 600, 238, 26, COSMOS.ink, 'sans').opacity(sf),
      txt('+ Harmlessness (full reasoning trace)', 600, 276, 26, COSMOS.gold, 'sans').opacity(sf),

      glowDot(-820, 240, { radius: 6, color: COSMOS.cyan }),
      txt('Stage 2 lang reward adds slight', -790, 224, 26, COSMOS.muted, 'sans', 'left'),
      txt('capability cost for readability', -790, 260, 26, COSMOS.muted, 'sans', 'left'),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-r1-pipeline-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-cold-r1-pipeline', () => s.play(sCold.to(1, { duration: 0.45 })));
  c.on('vr-rl-r1-pipeline', () => s.play(sRl.to(1, { duration: 0.45 })));
  c.on('vr-r1-pipeline-b1', () => s.play(sData.to(0.6, { duration: 0.35 })));
  c.on('vr-600k-r1-pipeline', () => s.play(sData.to(0.85, { duration: 0.35 })));
  c.on('vr-200k-r1-pipeline', () => s.play(sData.to(1, { duration: 0.4 })));
  c.on('vr-restart-r1-pipeline', () => s.play(sRestart.to(1, { duration: 0.55 })));
  c.on('vr-r1-pipeline-b2', () => s.play(sFinal.to(0.6, { duration: 0.35 })));
  c.on('vr-final-r1-pipeline', () =>
    s.play(sFinal.to(1, { duration: remainDuration(c, 'vr-final-r1-pipeline', 0.45) })),
  );
}
