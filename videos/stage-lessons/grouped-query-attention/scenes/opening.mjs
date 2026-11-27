// Scene 01: opening - Dual luminous MHA vs GQA head-routing chambers with streaming photons.
import {
  COSMOS,
  HEADS,
  ROLE,
  cinemaAtmosphere,
  conduitPts,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  kvGroupForQuery,
  line,
  lumBar,
  playCue,
  range,
  rect,
  rule,
  txt,
} from '../parts.mjs';

export default function opening(s, c) {
  const showFell = s.value(0);
  const privateWritten = s.value(0);
  const showPrivateTotal = s.value(0);
  const pairFocus = s.value(0);
  const activeGroup = s.value(-1);
  const askState = s.value(0);
  const sharedWritten = s.value(0);
  const showGqaName = s.value(0);

  const title = heroTitle(['How many pairs does', 'one word add?'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: ROLE.query,
    eyebrow: 'KV CACHE · HEAD SHARING',
  });

  const live = guardedDynamic(1, () => {
    const fellOp = showFell.value;
    const privW = privateWritten.value;
    const privTot = showPrivateTotal.value;
    const pf = pairFocus.value;
    const grp = activeGroup.value;
    const ask = askState.value;
    const shW = sharedWritten.value;
    const named = showGqaName.value;
    const nodes = [];

    // Left token rail (Rain persistent, fell arriving on 'next')
    nodes.push(
      txt('TOKENS', -775, -180, 26, COSMOS.muted, 'mono', 'center'),
      lumBar(-775, -15, 160, 68, { color: ROLE.key, fillOpacity: 0.24, glow: 7, radius: 10 }),
      txt('Rain', -775, -15, 36, COSMOS.ink, 'serif', 'center'),
    );
    if (fellOp > 0.02) {
      nodes.push(
        lumBar(-775, 165, 160, 68, {
          color: ROLE.gold,
          fillOpacity: 0.28,
          glow: 10,
          radius: 10,
          opacity: fellOp,
        }),
        txt('fell', -775, 165, 36, ROLE.gold, 'serif', 'center').opacity(fellOp),
      );
    }

    // Two side-by-side luminous chambers: Left = MHA (8 KV), Right = Shared/GQA (2 KV)
    const chambers = [
      { cx: -215, kvHeads: HEADS.mhaKV, shared: false, written: privW },
      { cx: 515, kvHeads: HEADS.gqaKV, shared: true, written: shW },
    ];

    const chamberW = 630;
    const qY = -195;
    const wireTopY = -162;
    const rainY = -15;
    const fellY = 165;
    const pairW = 62;
    const stripH = 22;

    // Subtle vertical separator between chambers
    nodes.push(rule(150, -290, 150, 355, COSMOS.rule, 1.8).opacity(0.65));

    for (const ch of chambers) {
      const leftX = ch.cx - chamberW / 2;
      const rightX = ch.cx + chamberW / 2;
      const headLabel = ch.shared
        ? named > 0.5
          ? 'Grouped-query attention'
          : 'Shared histories'
        : 'Multi-head attention';
      const headCol = ch.shared ? (named > 0.5 ? ROLE.query : ROLE.gold) : COSMOS.ink;

      nodes.push(
        txt(headLabel, ch.cx, -278, 34, headCol, 'serif', 'center').glow(
          ch.shared && named > 0.5 ? 7 : 0,
          headCol,
        ),
      );

      // Compute KV column X positions
      const kvCenters = range(ch.kvHeads).map((k) => leftX + ((k + 0.5) / ch.kvHeads) * chamberW);

      // Query ports + glowing routing wires + traveling photons
      for (let i = 0; i < HEADS.queries; i++) {
        const qx = leftX + ((i + 0.5) / HEADS.queries) * chamberW;
        const owner = kvGroupForQuery(i, HEADS.queries, ch.kvHeads);
        const tx = kvCenters[owner];
        const isHi = ch.shared && grp >= 0 && Math.round(grp) === owner;
        const col = isHi ? ROLE.gold : ROLE.query;
        const pts = conduitPts([qx, wireTopY], [tx, rainY - 42]);

        nodes.push(
          txt(`Q${i}`, qx, qY, 26, col, 'mono', 'center').opacity(isHi ? 1 : 0.85),
          glowingTrail(pts, {
            color: col,
            width: isHi ? 4.2 : 2.6,
            glow: isHi ? 10 : 5,
            core: isHi,
            opacity: isHi ? 1 : 0.78,
          }),
          glowDot(qx, wireTopY, { radius: isHi ? 5.5 : 4, color: col, glow: isHi ? 10 : 5 }),
        );
      }

      // Row 0: Rain (already stored)
      for (const kx of kvCenters) {
        nodes.push(
          lumBar(kx, rainY - 15, pairW, stripH, {
            color: ROLE.key,
            fillOpacity: 0.46,
            strokeWidth: 1.8,
            glow: 5,
            radius: 4,
          }),
          lumBar(kx, rainY + 15, pairW, stripH, {
            color: ROLE.value,
            fillOpacity: 0.46,
            strokeWidth: 1.8,
            glow: 5,
            radius: 4,
          }),
        );
      }

      // Row 1: fell slots (ghost outlines + animated writes)
      for (let k = 0; k < ch.kvHeads; k++) {
        const kx = kvCenters[k];
        nodes.push(
          rect(pairW + 6, stripH * 2 + 16, {
            fill: '#0c1324',
            stroke: '#253358',
            width: 1.6,
            radius: 6,
            dash: [6, 5],
          })
            .at(kx, fellY)
            .opacity(0.75),
        );
        const frac = Math.max(0, Math.min(1, ch.written - k));
        if (frac > 0.01) {
          const w = Math.max(4, pairW * frac);
          const lx = kx - pairW / 2 + w / 2;
          nodes.push(
            lumBar(lx, fellY - 15, w, stripH, {
              color: ROLE.key,
              fillOpacity: 0.52,
              strokeWidth: 2,
              glow: 7,
              radius: 4,
            }),
            lumBar(lx, fellY + 15, w, stripH, {
              color: ROLE.value,
              fillOpacity: 0.52,
              strokeWidth: 2,
              glow: 7,
              radius: 4,
            }),
          );
        }
      }

      // Subtle hairline baseline beneath fell row
      nodes.push(
        line([leftX + 10, fellY + 52], [rightX - 10, fellY + 52], {
          stroke: COSMOS.rule,
          width: 1.6,
        }),
      );

      // Pair inspection focus ring on MHA head 0
      if (!ch.shared && pf > 0.02) {
        nodes.push(
          rect(pairW + 20, stripH * 2 + 28, {
            fill: null,
            stroke: ROLE.gold,
            width: 3.4,
            radius: 10,
          })
            .at(kvCenters[0], fellY)
            .glow(12, ROLE.gold)
            .opacity(pf),
        );
      }

      // Bottom numeric verdict (strictly withheld on shared side until c.after('write')!)
      if (!ch.shared && privTot > 0.02) {
        nodes.push(
          txt('8 new pairs', ch.cx, 285, 42, COSMOS.ink, 'mono', 'center').opacity(privTot),
        );
      }
      if (ch.shared) {
        if (shW >= HEADS.gqaKV - 0.1) {
          nodes.push(
            txt('2 new pairs', ch.cx, 285, 44, ROLE.gold, 'mono', 'center').glow(10, ROLE.gold),
          );
        } else if (ask > 0.02) {
          nodes.push(
            txt('How many new pairs?', ch.cx, 285, 36, ROLE.gold, 'serif', 'center')
              .glow(8, ROLE.gold)
              .opacity(ask),
          );
        }
      }
    }

    // Bottom floating legend (zero box chrome)
    nodes.push(
      lumBar(-250, 415, 34, 18, { color: ROLE.key, fillOpacity: 0.55, glow: 6, radius: 4 }),
      txt('Key for matching', -215, 415, 28, ROLE.key, 'sans', 'left'),
      lumBar(120, 415, 34, 18, { color: ROLE.value, fillOpacity: 0.55, glow: 6, radius: 4 }),
      txt('Value to mix', 155, 415, 28, ROLE.value, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.gold), title, live);

  playCue(s, c, 'next', (d) => s.play(showFell.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'private-write', (d) => s.play(privateWritten.to(HEADS.mhaKV, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'private-total', (d) => s.play(showPrivateTotal.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'pair', (d) => s.play(pairFocus.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'first-group',
    (d) =>
      s.play(pairFocus.to(0, { duration: Math.min(0.25, d) }), activeGroup.to(0, { duration: d })),
    { dur: 0.35 },
  );
  playCue(s, c, 'second-group', (d) => s.play(activeGroup.to(1, { duration: d })), { dur: 0.35 });
  playCue(
    s,
    c,
    'ask',
    (d) => s.play(activeGroup.to(-1, { duration: 0.2 }), askState.to(1, { duration: d })),
    { dur: 0.4 },
  );
  playCue(s, c, 'write', (d) => s.play(sharedWritten.to(HEADS.gqaKV, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'name', (d) => s.play(showGqaName.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
}
