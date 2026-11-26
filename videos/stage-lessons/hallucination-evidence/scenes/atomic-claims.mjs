// Scene 2: What exactly are we checking? (Atomic claim decomposition)
import {
  COSMOS,
  EVIDENCE,
  aura,
  draftClaims,
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

export default function atomicClaims(s, c) {
  const phase = s.value(0);
  const showSplit = s.value(0);
  const showThree = s.value(0);
  const showMissing = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['What Exactly Are', 'We Checking?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'ATOMIC CLAIM DECOMPOSITION · FOUR INDEPENDENT TRUTH CONDITIONS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showSplit.value;
    const s3 = showThree.value;
    const sm = showMissing.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('4 ATOMIC CLAIMS FROM DRAFT', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      txt('ADMITTED RUNBOOK FIELDS', 130, -205, 26, COSMOS.emerald, 'mono', 'left'),
    ];

    const labels = [
      ['1. service', draftClaims[0].value, EVIDENCE.facts.service, true],
      ['2. event', draftClaims[1].value, EVIDENCE.facts.last_event, true],
      ['3. event_time', draftClaims[2].value, EVIDENCE.facts.last_event_at, true],
      ['4. recovery_eta', draftClaims[3].value, '(NO FIELD IN RECORD)', false],
    ];

    labels.forEach(([key, val, evVal, ok], i) => {
      const y = -112 + i * 116;
      const col = !ok
        ? sm > 0.3
          ? COSMOS.rose
          : COSMOS.amber
        : s3 > 0.3
          ? COSMOS.emerald
          : COSMOS.cyan;
      nodes.push(
        glassCell(-460, y, 780, 92, col, {
          fill: !ok && sm > 0.3 ? '#29111a' : '#10182d',
          glow: (!ok && sm > 0.3) || (ok && s3 > 0.3) ? 8 * pulse : 3,
        }),
        txt(key, -820, y - 16, 26, col, 'mono', 'left'),
        txt(val, -820, y + 18, 26, COSMOS.ink, 'sans', 'left'),

        glowingArc([-64, y], [118, y], ok ? -12 : 12, {
          color: col,
          width: 3.4,
          opacity: Math.max(0.55, ss),
        }),

        glassCell(495, y, 740, 92, ok ? COSMOS.emerald : COSMOS.rose, {
          fill: ok ? '#0e2624' : '#29111a',
          glow: !ok && sm > 0.3 ? 9 * pulse : 3,
        }),
        txt(evVal, 495, y + 2, 26, ok ? COSMOS.emerald : COSMOS.rose, 'mono'),
      );
    });

    nodes.push(
      glowDot(-840, 358, { radius: 6, color: sm > 0.3 ? COSMOS.rose : COSMOS.gold }),
      txt(
        sm > 0.3
          ? 'Three true details make a paragraph sound solid, yet provide zero evidence for the 4th claim'
          : 'Flip 1 word ("completed" -> "failed") and the claim reverses despite high token overlap',
        -812,
        360,
        28,
        sm > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('split-claims', () => s.play(showSplit.to(1, { duration: 0.45 })));
  c.on('three-matches', () => s.play(showThree.to(1, { duration: 0.45 })));
  c.on('missing-field', () =>
    s.play(showMissing.to(1, { duration: remainDuration(c, 'missing-field', 0.45) })),
  );
}
