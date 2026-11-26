// Scene 08: Grade actual behavior outside the candidate process (Host tests, exact int, microVM/gVisor, wall-time)
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

export default function trustedExecution(s, c) {
  const phase = s.value(0);
  const sType = s.value(0);
  const sClaim = s.value(0);
  const sBound = s.value(0);
  const sSleep = s.value(0);
  const sDesc = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3c1b4a14');
  const title = heroTitle(['Grade Actual Behavior', 'Outside Candidate Process'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'CODE VERIFIERS · TRUST BOUNDARY & WALL-TIME LIMITS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const st = Math.max(0.55, sType.value);
    const sc = Math.max(0.5, sClaim.value);
    const sb = Math.max(0.55, sBound.value);
    const sl = sSleep.value;
    const sd = sDesc.value;

    const nodes = [
      // Left zone: Untrusted candidate sandbox
      glassCell(-465, 20, 740, 420, COSMOS.rose, {
        fill: '#1b0f18',
        dash: [10, 7],
        glow: sb > 0.7 ? 9 : 4,
        opacity: sb,
      }),
      txt('SANDBOXED CANDIDATE (UNTRUSTED)', -465, -148, 26, COSMOS.rose, 'mono').opacity(sb),
      txt('Firecracker KVM microVM  /  gVisor Sentry', -465, -96, 26, COSMOS.muted, 'mono').opacity(
        sb,
      ),

      txt(
        sc > 0.3 ? 'Self-claim JSON {"score": 1} -> IGNORED' : 'stdout / return value only',
        -465,
        -24,
        28,
        sc > 0.3 ? COSMOS.rose : COSMOS.ink,
        'mono',
      ).opacity(sc),

      txt('Caps: CPU · wall · RAM · FS · net · out', -465, 48, 26, COSMOS.amber, 'mono').opacity(
        sb,
      ),

      txt(
        sl > 0.3 ? 'sleep(999): 0% CPU -> caught by WALL-TIME cap' : 'Watch for sleeping processes',
        -465,
        118,
        26,
        sl > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.5, sl)),

      txt(
        sd > 0.3
          ? 'Kill entire process tree (including descendants!)'
          : 'Clean up sandbox after run',
        -465,
        178,
        26,
        sd > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.5, sd)),

      // Vertical trust boundary wall
      line([0, -200], [0, 250], { stroke: COSMOS.gold, width: 4, dash: [12, 8] }).glow(
        8,
        COSMOS.gold,
      ),
      txt('BOUNDARY', 0, -228, 26, COSMOS.gold, 'mono'),

      // Right zone: Trusted host grader
      glassCell(465, 20, 740, 420, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 8 * pulse,
      }),
      txt('TRUSTED HOST GRADER', 465, -148, 26, COSMOS.emerald, 'mono'),
      txt('Owns hidden tests, gold values & secrets', 465, -96, 28, COSMOS.ink, 'sans'),

      glassCell(465, 2, 620, 108, st > 0.7 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#102138',
        glow: st > 0.7 ? 9 : 3,
        opacity: st,
      }),
      txt('EXACT TYPE CHECK', 465, -24, 26, COSMOS.cyan, 'mono').opacity(st),
      txt('type(out) is int  ->  True != 1', 465, 24, 30, COSMOS.gold, 'mono').opacity(st),

      txt('Host failure -> record UNSCORED (quarantine)', 465, 148, 26, COSMOS.rose, 'sans'),

      glowingArc([-90, 2], [150, 2], -36, { color: COSMOS.cyan, width: 3.6 }),
      glowDot(30, -16, { radius: 6, color: COSMOS.gold }),
      txt(
        'Local subprocess != production sandbox · configure host & allowed interfaces explicitly',
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-trusted-execution-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-type-trusted-execution', () => s.play(sType.to(1, { duration: 0.45 })));
  c.on('vr-claim-trusted-execution', () => s.play(sClaim.to(1, { duration: 0.45 })));
  c.on('vr-trusted-execution-b1', () => s.play(sBound.to(0.6, { duration: 0.35 })));
  c.on('vr-boundary-trusted-execution', () => s.play(sBound.to(1, { duration: 0.45 })));
  c.on('vr-trusted-execution-b2', () => s.play(sSleep.to(0.6, { duration: 0.35 })));
  c.on('vr-sleep-trusted-execution', () => s.play(sSleep.to(1, { duration: 0.45 })));
  c.on('vr-descendant-trusted-execution', () =>
    s.play(sDesc.to(1, { duration: remainDuration(c, 'vr-descendant-trusted-execution', 0.5) })),
  );
}
