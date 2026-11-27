// Scene 12: Publish a completed artifact before readers can select it: 8 private bytes -> validate -> atomic publish + lock.
import {
  ARTIFACT,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  publishable,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function publication(s, c) {
  const builtBytes = s.value(3); // animates 3 -> 8
  const published = s.value(0);
  const showLock = s.value(0);
  const showPreserve = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71e', '#5ce1e618');
  const title = heroTitle(['Publish Complete', 'Artifacts Atomically'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.cubin,
    eyebrow: 'PRIVATE TEMP → VALIDATE → ATOMIC RENAME',
  });

  const live = guardedDynamic(1, () => {
    const count = Math.round(builtBytes.value);
    const pub = published.value > 0.5 && publishable(ARTIFACT.slice(0, count));
    const lk = showLock.value;
    const pr = showPreserve.value;

    const nodes = [
      txt(
        `PRIVATE TEMP BUFFER (${count} / ${ARTIFACT.length} bytes)`,
        -430,
        -185,
        26,
        ROLE.ptx,
        'mono',
      ),
    ];

    for (let i = 0; i < ARTIFACT.length; i++) {
      const bx = -760 + i * 102;
      const ready = i < count;
      nodes.push(
        glassCell(bx, -98, 86, 86, ready ? ROLE.ptx : COSMOS.dim, {
          fill: ready ? '#261f10' : '#0b101d',
          glow: ready ? 7 : 0,
        }),
        txt(
          ready ? String(ARTIFACT[i]) : '..',
          bx,
          -98,
          30,
          ready ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Public reader-visible artifact slot
    nodes.push(
      glassCell(460, -98, 660, 128, pub ? ROLE.cubin : COSMOS.dim, {
        fill: pub ? '#0d2924' : '#0b101d',
        dash: pub ? undefined : [10, 6],
        glow: pub ? 11 : 0,
      }),
      txt('PUBLIC CACHE ENTRY', 460, -130, 26, pub ? ROLE.cubin : COSMOS.muted, 'mono'),
      txt(
        pub ? 'COMPLETE 8-BYTE ARTIFACT VISIBLE' : 'ABSENT (readers never see partial bytes)',
        460,
        -76,
        26,
        pub ? ROLE.cubin : COSMOS.amber,
        'mono',
      ),

      glowingArc([18, -98], [126, -98], -14, {
        color: pub ? ROLE.cubin : COSMOS.gold,
        width: 3.6,
        opacity: pub ? 0.95 : 0.45,
      }),

      // Lower two mechanism blocks: Visibility vs Durability & Lock + Forensics
      glassCell(-400, 145, 780, 180, lk > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1b30',
        glow: lk > 0.5 ? 8 : 3,
      }),
      txt('TWO DISTINCT PROBLEMS', -400, 88, 26, ROLE.ir, 'mono'),
      txt('Atomic rename → prevents torn reads', -400, 144, 28, ROLE.cubin, 'sans'),
      txt(
        'Cooperating lock + recheck → cuts duplicate compiles',
        -400,
        196,
        26,
        COSMOS.gold,
        'sans',
      ),

      glassCell(440, 145, 760, 180, pr > 0.5 ? ROLE.warn : COSMOS.dim, {
        fill: '#1e1622',
        glow: pr > 0.5 ? 8 : 3,
      }),
      txt('FAILURE & FORENSICS', 440, 88, 26, pr > 0.5 ? ROLE.warn : COSMOS.muted, 'mono'),
      txt('Visibility ≠ power-loss durability (fsync)', 440, 144, 28, COSMOS.ink, 'sans'),
      txt('Preserve bad bytes + provenance before retrying', 440, 196, 26, ROLE.warn, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('publication-beat-1-focus-1', () => {
    s.play(builtBytes.to(8, { duration: remainDuration(c, 'publication-beat-1-focus-1', 0.45) }));
    s.play(published.to(1, { duration: remainDuration(c, 'publication-beat-1-focus-1', 0.5) }));
  });
  c.on('publication-beat-1-focus-2', () =>
    s.play(showLock.to(1, { duration: remainDuration(c, 'publication-beat-1-focus-2', 0.45) })),
  );
  c.on('publication-beat-2-focus-1', () =>
    s.play(showPreserve.to(1, { duration: remainDuration(c, 'publication-beat-2-focus-1', 0.45) })),
  );
  c.on('publication-beat-2-focus-2', () =>
    s.play(showLock.to(1, { duration: remainDuration(c, 'publication-beat-2-focus-2', 0.4) })),
  );
}
