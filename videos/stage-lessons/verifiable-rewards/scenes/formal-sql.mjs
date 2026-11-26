// Scene 11: Own the theorem and preserve query multiplicity (Lean axioms + SQL multiset & ORDER BY)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function formalSql(s, c) {
  const phase = s.value(0);
  const sOwned = s.value(0);
  const sAxiom = s.value(0);
  const sCompile = s.value(0);
  const sMulti = s.value(0);
  const sOrder = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#331d5214');
  const title = heroTitle(['Own the Theorem,', 'Preserve Query Multiplicity'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.violet,
    eyebrow: 'FORMAL PROOFS (LEAN) & SQL EXECUTION VERIFIERS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ow = Math.max(0.6, sOwned.value);
    const ax = sAxiom.value;
    const cm = sCompile.value;
    const ml = Math.max(0.6, sMulti.value);
    const od = sOrder.value;

    const nodes = [
      // Left: Lean formal proof verifier
      glassCell(-440, 20, 760, 420, ax > 0.3 ? COSMOS.rose : COSMOS.violet, {
        fill: '#15122b',
        glow: ax > 0.3 ? 9 * pulse : 5,
        opacity: ow,
      }),
      txt('LEAN PROOF AUDIT', -440, -148, 28, COSMOS.violet, 'mono').opacity(ow),
      txt('Host owns theorem statement & imports', -440, -92, 28, COSMOS.cyan, 'sans').opacity(ow),
      txt(
        'Allowed: Classical.choice · propext · Quot.sound',
        -440,
        -30,
        26,
        COSMOS.emerald,
        'mono',
      ).opacity(ow),
      txt(
        ax > 0.3
          ? 'sorryAx in dependency list -> FAIL AUDIT'
          : 'Check transitive axiom dependencies',
        -440,
        36,
        28,
        ax > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      )
        .glow(ax > 0.3 ? 7 : 0, COSMOS.rose)
        .opacity(Math.max(0.7, ax)),
      txt(
        cm > 0.3
          ? 'File can compile yet inherit unapproved axioms!'
          : 'Native eval also depends on compiler',
        -440,
        112,
        26,
        cm > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.7, cm)),
      txt(
        'Audit exact statement + trusted environment',
        -440,
        174,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(ow),

      // Right: SQL multiset & ordering verifier
      glassCell(440, 20, 760, 420, ml > 0.7 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#0e1f2b',
        glow: ml > 0.7 ? 9 : 4,
        opacity: ml,
      }),
      txt('SQL RESULT COMPARISON', 440, -148, 28, COSMOS.cyan, 'mono').opacity(ml),
      txt('Multiset: [row A, row A]  !=  [row A]', 440, -82, 30, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(ml),
      txt('Preserve duplicates · values · types · NULLs', 440, -20, 26, COSMOS.ink, 'sans').opacity(
        ml,
      ),
      txt(
        od > 0.3
          ? 'No ORDER BY -> SQLite does NOT fix row order'
          : 'Check explicit ORDER BY contract',
        440,
        48,
        26,
        od > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.7, od)),
      txt(
        'Equal sort keys leave tie order unspecified',
        440,
        110,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(ml),
      txt('More DB snapshots != equivalence on all DBs', 440, 174, 26, COSMOS.rose, 'sans').opacity(
        ml,
      ),

      glowDot(0, 325, { radius: 6, color: COSMOS.gold }),
      txt(
        'Both domains require an externally owned specification beyond surface compilation or single-run match',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-formal-sql-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-owned-formal-sql', () => s.play(sOwned.to(1, { duration: 0.45 })));
  c.on('vr-axiom-formal-sql', () => s.play(sAxiom.to(1, { duration: 0.45 })));
  c.on('vr-formal-sql-b1', () => s.play(sCompile.to(0.6, { duration: 0.35 })));
  c.on('vr-compile-formal-sql', () => s.play(sCompile.to(1, { duration: 0.45 })));
  c.on('vr-formal-sql-b2', () => s.play(sMulti.to(0.6, { duration: 0.35 })));
  c.on('vr-multiset-formal-sql', () => s.play(sMulti.to(1, { duration: 0.45 })));
  c.on('vr-order-formal-sql', () =>
    s.play(sOrder.to(1, { duration: remainDuration(c, 'vr-order-formal-sql', 0.45) })),
  );
}
