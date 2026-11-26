// Scene 4: What if the service recovers after the snapshot? (Groundedness vs World Factuality)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function supportVersusTruth(s, c) {
  const phase = s.value(0);
  const showSnap = s.value(0);
  const showWorld = s.value(0);
  const showLucky = s.value(0);
  const showAxes = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Groundedness vs', 'World Factuality'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SNAPSHOT TIME vs REAL WORLD · STALE SUPPORT & LUCKY GUESSES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showSnap.value;
    const sw = showWorld.value;
    const sl = showLucky.value;
    const sa = showAxes.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top timeline: 10:00 snapshot vs 11:00 real recovery
      txt('TIMELINE OF SNAPSHOT vs REALITY', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      line([-780, -108], [780, -108], { stroke: COSMOS.muted, width: 3.4 }),
      glowDot(-520, -108, { radius: 11, color: COSMOS.cyan }),
      txt('10:00 UTC · SNAPSHOT', -520, -152, 26, COSMOS.cyan, 'mono'),
      txt('status = investigating', -520, -64, 26, COSMOS.ink, 'mono'),

      glowDot(40, -108, { radius: 11, color: sw > 0.3 ? COSMOS.emerald : COSMOS.muted }),
      txt(
        '11:00 UTC · WORLD RECOVERS',
        40,
        -152,
        26,
        sw > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
      txt(
        'Old 10:00 snap is now STALE!',
        40,
        -64,
        26,
        sw > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
      ),

      glowDot(600, -108, { radius: 11, color: sl > 0.3 ? COSMOS.rose : COSMOS.muted }),
      txt('14:30 UTC · LUCKY GUESS', 600, -152, 26, sl > 0.3 ? COSMOS.rose : COSMOS.muted, 'mono'),
      txt(
        'Still unsupported at issue!',
        600,
        -64,
        26,
        sl > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ),

      // Bottom 2x2 separation cards
      glassCell(-455, 130, 810, 240, ss > 0.3 || sw > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#1e1910',
        glow: sw > 0.3 ? 8 * pulse : 3,
      }),
      txt('GROUNDED, YET STALE', -825, 48, 28, COSMOS.amber, 'mono', 'left'),
      txt(
        '10:00 snapshot still supports "investigating"',
        -825,
        96,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Saying "investigating" at 11:00 misleads readers',
        -825,
        136,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),
      txt('Fix: fetch a fresh, authorized record', -825, 184, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(455, 130, 810, 240, sl > 0.3 || sa > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sl > 0.3 ? 8 * pulse : 3,
      }),
      txt('TRUE BY LUCK, YET UNGROUNDED', 85, 48, 28, COSMOS.rose, 'mono', 'left'),
      txt('Guessed ETA 14:30 happens to come true', 85, 96, 26, COSMOS.ink, 'sans', 'left'),
      txt('Zero support existed when answer was issued', 85, 136, 26, COSMOS.amber, 'sans', 'left'),
      txt('Groundedness != World Factuality', 85, 184, 26, COSMOS.cyan, 'mono', 'left'),

      glowDot(-840, 345, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Both matter: verify admitted record freshness & authority for world truth, and entailment for grounding',
        -812,
        347,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('support-versus-truth-b1', () => s.play(showSnap.to(1, { duration: 0.45 })));
  c.on('world-status-changes', () => s.play(showWorld.to(1, { duration: 0.45 })));
  c.on('lucky-guess', () => s.play(showLucky.to(1, { duration: 0.45 })));
  c.on('support-versus-truth-b2', () =>
    s.play(showAxes.to(1, { duration: remainDuration(c, 'support-versus-truth-b2', 0.45) })),
  );
}
