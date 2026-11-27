// Scene 08: Which requests can a bank serve together? Shared-memory 8-way conflict, +1 padding fix, and same-word broadcast.
import {
  BROADCAST_REQ,
  COSMOS,
  PADDED_REQ,
  STRIDED_REQ,
  afterDuration,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function banks(s, c) {
  const mode = s.value(0); // 0=conflict (stride 32), 1=padded (stride 33), 2=broadcast (word 0)
  const routeProg = s.value(0);
  const padVerdict = s.value(0);
  const bcastVerdict = s.value(0);

  const bgAura = aura(0, 40, 560, '#ffd16620', '#5ce1e614');

  const title = heroTitle(['Shared-Memory Banks:', 'Conflict, Pad, Broadcast'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: '32 SHARED-MEMORY BANKS · 4-BYTE WORDS',
  });

  const bankEq = glowTex('\\text{bank} = \\text{word index} \\bmod 32', {
    x: 560,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const rp = routeProg.value;
    const req = m === 0 ? STRIDED_REQ : m === 1 ? PADDED_REQ : BROADCAST_REQ;

    const header =
      m === 0
        ? 'Stride 32 · 8 distinct words all map to bank 0'
        : m === 1
          ? 'Add 1 padding column -> stride 33 · consecutive lanes hit banks 0..7'
          : 'Broadcast replay · all 8 lanes request the exact same word 0';

    const headerCol = m === 0 ? COSMOS.rose : m === 1 ? COSMOS.cyan : COSMOS.emerald;
    const nodes = [txt(header, -855, -205, 28, headerCol, 'sans', 'left')];

    const laneY = -65;
    const bankY = 195;
    const xStart = -735;
    const stepX = 210;

    // 8 warp lanes
    req.rows.forEach((row, i) => {
      const lx = xStart + i * stepX;
      const lit = rp * 8 >= i + 0.3;
      const stroke = m === 0 ? COSMOS.rose : m === 1 ? COSMOS.cyan : COSMOS.emerald;
      nodes.push(
        glassCell(lx, laneY, 178, 92, lit ? stroke : COSMOS.rule, {
          fill: '#10182b',
          glow: lit ? 7 : 0,
        }),
        txt(`L${i}`, lx, laneY - 68, 26, COSMOS.muted, 'mono'),
        txt(
          lit ? `word ${row.word}` : '·',
          lx,
          laneY + 4,
          28,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Destination banks
    if (m === 1) {
      // 8 distinct banks 0..7
      for (let b = 0; b < 8; b++) {
        const bx = xStart + b * stepX;
        const lit = rp * 8 >= b + 0.4;
        nodes.push(
          glassCell(bx, bankY, 178, 92, lit ? COSMOS.emerald : COSMOS.rule, {
            fill: '#0e2424',
            glow: lit ? 8 : 0,
          }),
          txt(`bank ${b}`, bx, bankY + 4, 28, lit ? COSMOS.emerald : COSMOS.dim, 'mono'),
        );
        if (lit) {
          nodes.push(
            glowingArc([bx, laneY + 50], [bx, bankY - 50], 0, {
              color: COSMOS.cyan,
              width: 3.2,
              opacity: 0.88,
            }),
          );
        }
      }
    } else {
      // Single bank 0 (either 8-way conflict or 1-word broadcast)
      const isBcast = m === 2;
      const bankCol = isBcast ? COSMOS.emerald : COSMOS.rose;
      nodes.push(
        glassCell(0, bankY, 700, 102, bankCol, {
          fill: isBcast ? '#0e2620' : '#26111c',
          glow: 10,
        }),
        txt(
          isBcast ? 'bank 0 · 1 shared word (word 0)' : 'bank 0 · 8 distinct words',
          0,
          bankY + 4,
          28,
          bankCol,
          'mono',
        ),
      );
      req.rows.forEach((_, i) => {
        const lx = xStart + i * stepX;
        if (rp * 8 >= i + 0.3) {
          const tx = isBcast ? 0 : -154 + i * 44;
          nodes.push(
            glowingArc([lx, laneY + 50], [tx, bankY - 58], -14, {
              color: bankCol,
              width: 3.0,
              opacity: 0.85,
            }),
          );
        }
      });
    }

    // Bottom verdict bar (withhold padded & broadcast verdicts until after their cues)
    let verdict = 'Max distinct words per bank: 8  ·  8-way serialized conflict';
    let vCol = COSMOS.rose;
    if (m === 1) {
      if (padVerdict.value > 0.5) {
        verdict = 'Max distinct words per bank: 1  ·  served in parallel (conflict-free)';
        vCol = COSMOS.emerald;
      } else {
        verdict = 'Rerouting stride 33 across banks...';
        vCol = COSMOS.gold;
      }
    } else if (m === 2) {
      if (bcastVerdict.value > 0.5) {
        verdict = 'Max distinct words per bank: 1  ·  broadcast serves all 8 lanes together';
        vCol = COSMOS.emerald;
      } else {
        verdict = 'Tracing 8 requests for the same address (word 0)...';
        vCol = COSMOS.gold;
      }
    }

    nodes.push(
      glassCell(0, 365, 1660, 96, vCol, { fill: '#101627', glow: 8 }),
      txt(verdict, 0, 368, 30, vCol, 'mono').glow(6, vCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, bankEq, live);

  c.on('bank-conflict', () => s.play(routeProg.to(1, { duration: 0.85 })));
  c.on('pad-banks', () => {
    s.play(mode.to(1, { duration: 0.05 }));
    s.play(routeProg.to(0.1, { duration: 0.05 }));
    s.play(routeProg.to(1, { duration: 0.8 }));
  });
  c.after('pad-banks', () =>
    s.play(padVerdict.to(1, { duration: afterDuration(c, 'pad-banks', 0.4) })),
  );
  c.on('broadcast-word', () => {
    s.play(mode.to(2, { duration: 0.05 }));
    s.play(routeProg.to(0.1, { duration: 0.05 }));
    s.play(routeProg.to(1, { duration: remainDuration(c, 'broadcast-word', 0.8) }));
  });
  c.after('broadcast-word', () =>
    s.play(bcastVerdict.to(1, { duration: afterDuration(c, 'broadcast-word', 0.4) })),
  );
}
