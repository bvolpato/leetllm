// Scene 25: What changed when the rewards were random? (Spurious rewards: Qwen2.5-Math +21.4 vs +29.1 = +7.7 delta)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function spuriousRewards(s, c) {
  const phase = s.value(0);
  const sRand = s.value(0);
  const sTruth = s.value(0);
  const sDelta = s.value(0);
  const sOther = s.value(0);
  const sCtrl = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['What Changed When', 'Rewards Were Random?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'REWARD SIGNAL ABLATION · RANDOM vs GROUND TRUTH',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sr = Math.max(0.65, sRand.value);
    const st = Math.max(0.65, sTruth.value);
    const sd = sDelta.value;
    const so = Math.max(0.65, sOther.value);
    const sc = Math.max(0.65, sCtrl.value);

    const bx = -760;
    const scale = 26; // 1 pp = 26px -> 29.1 pp = 757px (clears right panel cleanly)
    const wRand = 21.4 * scale;
    const wTruth = 29.1 * scale;

    const nodes = [
      txt(
        'QWEN 2.5-MATH 7B GAIN ON MATH-500 (PERCENTAGE POINTS)',
        bx,
        -196,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Bar 1: Random rewards (+21.4 pp)
      txt('RANDOM REWARDS', bx, -124, 26, COSMOS.amber, 'mono', 'left').opacity(sr),
      rect(wRand, 66, { fill: '#3a2610', stroke: COSMOS.amber, width: 2.6, radius: 8 })
        .at(bx + wRand * 0.5, -62)
        .glow(sr > 0.7 ? 8 : 3, COSMOS.amber)
        .opacity(sr),
      txt('+21.4 pp', bx + wRand + 22, -60, 34, COSMOS.amber, 'mono', 'left').opacity(sr),

      // Bar 2: Ground-truth rewards (+29.1 pp)
      txt('GROUND-TRUTH REWARDS', bx, 20, 26, COSMOS.emerald, 'mono', 'left').opacity(st),
      rect(wTruth, 66, { fill: '#103c33', stroke: COSMOS.emerald, width: 2.6, radius: 8 })
        .at(bx + wTruth * 0.5, 82)
        .glow(st > 0.7 ? 9 * pulse : 3, COSMOS.emerald)
        .opacity(st),
      txt('+29.1 pp', bx + wTruth + 22, 84, 34, COSMOS.emerald, 'mono', 'left').opacity(st),

      // Delta bracket (+7.7 pp gap)
      txt(
        sd > 0.3 ? 'Ground-truth advantage:  +7.7 pp above random' : 'Compare bar endpoints',
        bx,
        162,
        30,
        sd > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(sd > 0.3 ? 7 : 0, COSMOS.gold)
        .opacity(Math.max(0.65, sd)),

      // Right/bottom panels: Model-family dependence & controlled ablation protocol
      glassCell(555, -16, 560, 210, COSMOS.rose, {
        fill: '#25111a',
        glow: so > 0.7 ? 8 : 3,
        opacity: so,
      }),
      txt('MODEL-DEPENDENT EFFECT', 555, -80, 26, COSMOS.rose, 'mono').opacity(so),
      txt('Llama 3 & OLMo 2 variants:', 555, -24, 28, COSMOS.ink, 'sans').opacity(so),
      txt('Little benefit or HURT', 555, 24, 30, COSMOS.rose, 'mono').opacity(so),
      txt('under random rewards', 555, 64, 26, COSMOS.muted, 'sans').opacity(so),

      glowDot(-820, 275, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Controlled test: hold base model, data, sampling, clip & compute FIXED; swap only reward signal',
        -790,
        277,
        26,
        sc > 0.7 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ).opacity(sc),
      txt(
        'Evaluate both runs on the same held-out prompts & track instruction following separately',
        -790,
        326,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(sc),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-spurious-rewards-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-random-spurious-rewards', () => s.play(sRand.to(1, { duration: 0.45 })));
  c.on('vr-truth-spurious-rewards', () => s.play(sTruth.to(1, { duration: 0.45 })));
  c.on('vr-spurious-rewards-b1', () => s.play(sDelta.to(0.6, { duration: 0.35 })));
  c.on('vr-scope-spurious-rewards', () => s.play(sDelta.to(1, { duration: 0.45 })));
  c.on('vr-other-spurious-rewards', () => s.play(sOther.to(1, { duration: 0.45 })));
  c.on('vr-spurious-rewards-b2', () => s.play(sCtrl.to(0.6, { duration: 0.35 })));
  c.on('vr-control-spurious-rewards', () =>
    s.play(sCtrl.to(1, { duration: remainDuration(c, 'vr-control-spurious-rewards', 0.45) })),
  );
}
