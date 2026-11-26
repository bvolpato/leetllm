// Scene 22: A checkpoint needs the next document too: Immutable shard manifest + cursor restored to position 2 -> next block E.
import {
  COSMOS,
  LINEAGE_ORDER,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function lineage(s, c) {
  const phase = s.value(0);
  const manifestLit = s.value(0);
  const cursorPos = s.value(0); // Advances 0 -> 2
  const cursorLit = s.value(0);
  const nextReveal = s.value(0);
  const policyLit = s.value(0);

  const bgAura = aura(0, 0, 640, '#16274e2a', '#ffd16614');
  const title = heroTitle(['Resumable Shards', '& Manifest Identity'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'REPRODUCIBLE DATA STREAM · IMMUTABLE MANIFEST',
  });

  const live = guardedDynamic(s.value(1), () => {
    const mf = manifestLit.value;
    const cp = cursorPos.value;
    const cl = cursorLit.value;
    const nr = nextReveal.value;
    const pl = policyLit.value;
    const ph = phase.value;

    const leftX = -625;
    const pitch = 250;
    const rowY = -30;
    const curX = leftX + cp * pitch - pitch * 0.5;

    const nodes = [
      // Manifest identity header pills (top-right)
      glassCell(410, -360, 880, 108, COSMOS.cyan, {
        fill: '#0e1c30',
        glow: 5 + mf * 6,
        opacity: 0.95,
      }),
      txt('MANIFEST ARTIFACT · SHA-256 + TOKENIZER + POLICY', 410, -384, 26, COSMOS.cyan, 'mono'),
      txt('Immutable shard bytes + deterministic permutation', 410, -334, 26, COSMOS.ink, 'sans'),

      // Glowing shard sequence track
      ...photonStream([leftX - 80, rowY], [leftX + 5 * pitch + 80, rowY], 0, ph, {
        color: COSMOS.blue,
        count: 5,
        opacity: 0.55,
        trail: false,
      }),
    ];

    LINEAGE_ORDER.forEach((id, i) => {
      const cx = leftX + i * pitch;
      const consumed = i < Math.floor(cp + 0.01);
      const isNext = nr > 0.5 && i === 2;
      const col = isNext ? COSMOS.emerald : consumed ? COSMOS.dim : COSMOS.blue;
      nodes.push(
        txt(`idx ${i}`, cx, rowY - 88, 26, COSMOS.dim, 'mono'),
        glassCell(cx, rowY, 206, 112, col, {
          fill: isNext ? '#0e2824' : consumed ? '#0b0f1a' : '#101a32',
          glow: isNext ? 12 : consumed ? 0 : 6,
          opacity: consumed ? 0.45 : 0.96,
          dash: consumed ? [8, 6] : undefined,
        }),
        txt(id, cx, rowY - 12, 46, col, 'mono'),
        txt(
          isNext ? 'NEXT' : consumed ? 'consumed' : 'queued',
          cx,
          rowY + 34,
          26,
          isNext ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Glowing consumed cursor laser (below ribbon so moving sweep never crosses box text)
    const labelX = Math.max(-660, curX);
    nodes.push(
      glowingTrail(
        [
          [curX, rowY + 66],
          [curX, rowY + 135],
        ],
        { color: COSMOS.gold, width: 5, glow: 12 },
      ),
      glowDot(curX, rowY + 135, { radius: 8, color: COSMOS.gold, glow: 12 }),
      txt(`CONSUMED CURSOR = ${Math.round(cp)}`, labelX, rowY + 185, 34, COSMOS.gold, 'mono').glow(
        8,
        COSMOS.gold,
      ),
    );

    // Restored next-block readout (withheld until cursor reveal!)
    nodes.push(
      glassCell(0, 265, 1140, 102, nr > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: nr > 0.5 ? '#0e2422' : '#1a1822',
        glow: 8 + cl * 4,
        opacity: 0.95,
      }),
      txt(
        nr > 0.5
          ? 'Restored cursor 2 -> next block is E (zero replay of A, C)'
          : 'Save sampler cursor + worker offset + RNG state (seed alone is not enough)',
        0,
        267,
        30,
        nr > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ),
    );

    if (pl > 0.02) {
      nodes.push(
        txt(
          'Keep held-out evals separate · use group splits for related docs · version privacy & licenses',
          0,
          400,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(pl),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('lineage-b1-1', () => {
    const dur = remainDuration(c, 'lineage-b1-1', 1.2);
    s.play(manifestLit.to(1, { duration: 0.6 }));
    s.play(cursorPos.to(2, { duration: dur }));
  });
  c.on('lineage-b2-1', () =>
    s.play(cursorLit.to(1, { duration: remainDuration(c, 'lineage-b2-1', 0.5) })),
  );
  c.on('lineage-b2-2', () =>
    s.play(cursorPos.to(2, { duration: remainDuration(c, 'lineage-b2-2', 0.3) })),
  );
  c.after('pt-lineage-cursor', () =>
    s.play(nextReveal.to(1, { duration: remainAfterDuration(c, 'pt-lineage-cursor', 0.45) })),
  );
  c.on('lineage-b3-1', () =>
    s.play(policyLit.to(1, { duration: remainDuration(c, 'lineage-b3-1', 0.6) })),
  );
}
