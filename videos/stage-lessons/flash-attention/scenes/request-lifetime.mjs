// Scene 02: Follow the word "test": Query 2 lifecycle -> scalar output + saved LSE -> decode Query 3.
import {
  COSMOS,
  DENSE_OUTPUT,
  LSE_ROW,
  PROMPT_3,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function requestLifetime(s, c) {
  const trackQ2 = s.value(0);
  const showCoord = s.value(0);
  const showLse = s.value(0);
  const appended = s.value(0);
  const decodeFan = s.value(0);

  const bgAura = aura(120, 40, 560, '#5ce1e622', '#ffd16612');
  const title = heroTitle(['Follow Query 2:', '“test”'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'RUNNING EXAMPLE · SINGLE HEAD',
  });

  const live = guardedDynamic(1, () => {
    const q2 = trackQ2.value;
    const sc = showCoord.value;
    const lse = showLse.value;
    const app = appended.value;
    const dec = decodeFan.value;

    const slots = [
      { idx: 0, word: PROMPT_3[0], x: -460 },
      { idx: 1, word: PROMPT_3[1], x: -120 },
      { idx: 2, word: PROMPT_3[2], x: 220 },
      { idx: 3, word: 'next', x: 560 },
    ];
    const keyY = -125;
    const queryY = 175;

    const nodes = [txt('KEY / VALUE CACHE POSITIONS', -460, -245, 26, COSMOS.cyan, 'mono', 'left')];

    for (let i = 0; i < 4; i++) {
      const sl = slots[i];
      const vis = i < 3 ? 1 : app;
      if (vis < 0.02) continue;
      const isQ2 = i === 2 && q2 > 0.3 && dec < 0.5;
      const isQ3 = i === 3 && dec > 0.3;
      const col = isQ3 ? COSMOS.emerald : isQ2 ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        txt(`pos ${sl.idx}`, sl.x, keyY - 72, 26, COSMOS.muted, 'mono').opacity(vis),
        glassCell(sl.x, keyY, 240, 96, col, {
          fill: '#10192e',
          glow: isQ2 || isQ3 ? 10 : 5,
          opacity: vis,
        }),
        txt(sl.word, sl.x, keyY, 34, col, 'mono').opacity(vis),
      );
    }

    // Active query node
    const qx = 220 + dec * 340;
    const qLabel = dec > 0.5 ? 'Query 3 (decode)' : 'Query 2 ("test")';
    const qCol = dec > 0.5 ? COSMOS.emerald : COSMOS.gold;
    nodes.push(
      glassCell(qx, queryY, 310, 92, qCol, { fill: '#1d1a14', glow: 10 }),
      txt(qLabel, qx, queryY, 30, qCol, 'mono'),
    );

    // Glowing attention arcs from active query to every allowed key
    const kCount = dec > 0.5 ? 4 : 3;
    for (let i = 0; i < kCount; i++) {
      const kx = slots[i].x;
      const arcCol = dec > 0.5 ? COSMOS.emerald : COSMOS.cyan;
      nodes.push(
        glowingArc([qx, queryY - 48], [kx, keyY + 50], -35 - i * 8, {
          color: arcCol,
          width: 3.4,
          opacity: 0.72 + 0.25 * q2,
        }),
      );
    }

    // Output vector coordinate + saved training statistic (LSE)
    if (sc > 0.02) {
      nodes.push(
        glassCell(-580, 175, 520, 118, COSMOS.emerald, { fill: '#0d2224', glow: 8, opacity: sc }),
        txt('1 OUTPUT COORDINATE', -580, 142, 26, COSMOS.muted, 'mono').opacity(sc),
        txt(`o₂ ≈ ${DENSE_OUTPUT.toFixed(1)} (scaled)`, -580, 194, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(sc),
      );
    }

    if (lse > 0.02) {
      nodes.push(
        glassCell(-580, 345, 520, 104, COSMOS.violet, { fill: '#191433', glow: 8, opacity: lse }),
        txt('SAVED TRAINING STATISTIC', -580, 316, 26, COSMOS.violet, 'mono').opacity(lse),
        txt(`LSE₂ = ${LSE_ROW.toFixed(3)} (1/row)`, -580, 366, 28, COSMOS.ink, 'mono').opacity(lse),
      );
    }

    if (dec > 0.02) {
      nodes.push(
        txt('Query position 3 → reads keys 0, 1, 2, 3', 200, 355, 30, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(dec),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('track-test', () =>
    s.play(trackQ2.to(1, { duration: remainDuration(c, 'track-test', 0.5) })),
  );
  c.on('one-coordinate', () =>
    s.play(showCoord.to(1, { duration: remainDuration(c, 'one-coordinate', 0.5) })),
  );
  c.on('save-stat', () => s.play(showLse.to(1, { duration: remainDuration(c, 'save-stat', 0.5) })));
  c.on('append-key', () =>
    s.play(appended.to(1, { duration: remainDuration(c, 'append-key', 0.5) })),
  );
  c.on('decode-row', () =>
    s.play(decodeFan.to(1, { duration: remainDuration(c, 'decode-row', 0.6) })),
  );
}
