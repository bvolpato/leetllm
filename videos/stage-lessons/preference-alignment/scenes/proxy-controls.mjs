// Scene 26: A controlled rewrite can test the scorer shortcut (Preamble Delta r + perturbation probes + ln 2 triage)
import {
  COSMOS,
  LOGIT_TRACE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function proxyControls(s, c) {
  const phase = s.value(0);
  const sBase = s.value(0);
  const sPre = s.value(0);
  const sProbes = s.value(0);
  const sStuck = s.value(0);
  const sTriage = s.value(0);

  const bgAura = aura(0, 20, 620, '#3c1b2a24', '#14385c24');
  const title = heroTitle(['A Controlled Rewrite Can', 'Test the Scorer Shortcut'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'REWARD HACKING DIAGNOSTICS · PREAMBLE PROBE & STUCK-LOSS TRIAGE',
  });

  const step1 = LOGIT_TRACE[1];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const bs = Math.max(0.75, sBase.value);
    const pr = sPre.value;
    const pb = sProbes.value;
    const sk = sStuck.value;
    const tr = sTriage.value;

    const nodes = [
      // TOP: Preamble perturbation test
      txt(
        '1. CONTROLLED PREAMBLE PERTURBATION (ACTION HELD IDENTICAL)',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-440, -124, 800, 96, COSMOS.emerald, { fill: '#0e2824', glow: 5, opacity: bs }),
      txt(
        'BASE REPLY A: "Open a reviewer ticket and cite P-7."',
        -805,
        -122,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glassCell(440, -124, 800, 96, pr > 0.2 ? COSMOS.gold : COSMOS.dim, {
        fill: pr > 0.2 ? '#231c0e' : '#12182b',
        glow: pr > 0.2 ? 10 * pulse : 3,
        opacity: Math.max(0.75, pr),
      }),
      txt(
        pr > 0.2
          ? '"Policy-safe answer:" + A   ->   Delta r > 0 ?'
          : 'Prepend cosmetic preamble -> rescore same action',
        75,
        -122,
        26,
        pr > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),

      // MIDDLE: 4 Controlled Probes
      txt('2. FOUR CONTROLLED REWARD-HACKING PROBES', -855, -26, 26, COSMOS.violet, 'mono', 'left'),

      ...[
        { name: 'LENGTH-MATCHED', desc: 'Separate detail from fluff', col: COSMOS.cyan },
        { name: 'FORMAT vs PLAIN', desc: 'Catch markdown gaming', col: COSMOS.emerald },
        { name: 'FALSE USER CLAIM', desc: 'Detect sycophancy', col: COSMOS.rose },
        { name: 'KNOWN-HARD Qs', desc: 'Check overconfidence', col: COSMOS.amber },
      ].flatMap((item, i) => {
        const cx = -638 + i * 425;
        return [
          glassCell(cx, 56, 395, 108, item.col, {
            fill: '#12182c',
            glow: pb > 0.2 ? 7 : 3,
            opacity: Math.max(0.75, pb),
          }),
          txt(item.name, cx, 32, 26, item.col, 'mono'),
          txt(item.desc, cx, 78, 26, COSMOS.ink, 'sans'),
        ];
      }),

      // BOTTOM: Stuck-at-ln(2) & online drift triage
      glassCell(0, 266, 1680, 174, tr > 0.2 || sk > 0.2 ? COSMOS.rose : COSMOS.dim, {
        fill: '#191426',
        glow: tr > 0.2 ? 9 * pulse : 4,
        opacity: Math.max(0.75, sk),
      }),
      txt('3. FAILURE TRIAGE PLAYBOOK', -805, 212, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        `Loss stuck near 0.693? Check weight steps (z: 0 -> +/-${step1.logits[0].toFixed(1)}, L: 0.693 -> ${step1.loss.toFixed(3)}), contradictions & ties.`,
        -805,
        264,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Tone rises while P-7 fails -> inspect labels & template. Reward rises + repetitive output -> HOLD promotion.',
        -805,
        316,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  const eqDelta = glowTex(
    '\\Delta r = r(\\text{prefix} + A) - r(A) > 0 \\implies \\text{shortcut}',
    {
      x: 430,
      y: -348,
      size: 30,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqDelta);
  runPhase(s, c, phase, 14);

  c.on('proxy-controls-b0', () =>
    s.play(sBase.to(1, { duration: remainDuration(c, 'proxy-controls-b0', 0.45) })),
  );
  c.on('pa-proxy-preamble', () =>
    s.play(sPre.to(1, { duration: remainDuration(c, 'pa-proxy-preamble', 0.55) })),
  );
  c.on('proxy-controls-b1', () =>
    s.play(sProbes.to(1, { duration: remainDuration(c, 'proxy-controls-b1', 0.5) })),
  );
  c.on('proxy-controls-b2', () =>
    s.play(sStuck.to(1, { duration: remainDuration(c, 'proxy-controls-b2', 0.5) })),
  );
  c.on('pa-proxy-triage', () =>
    s.play(sTriage.to(1, { duration: remainDuration(c, 'pa-proxy-triage', 0.55) })),
  );
}
