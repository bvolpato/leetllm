// Scene 08: prefix-order: "Move the changing header behind the reusable prefix"
// Orbiting 3D KV-cache reuse slab + live 2-request token rails where the 12-token volatile header
// slides smoothly behind the 256-token fixed document: common prefix jumps 96 -> 352 (total 364).
import {
  COSMOS,
  PREFIX_FIRST,
  PREFIX_MOVED,
  ROLE,
  aura,
  buildKvRow3d,
  ease,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lerp,
  limitMarker,
  orbitScene,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function prefixOrder(s, c) {
  const showSetup = s.value(0.3);
  const show96 = s.value(0);
  const moveHeader = s.value(0); // 0 = [root 96 | header 12 | doc 256], 1 = [root 96 | doc 256 | header 12]
  const show352 = s.value(0);
  const show364 = s.value(0);
  const showMeasure = s.value(0);

  const bgAura = aura(320, 60, 780, '#122c5c30', '#2a221024');
  const title = heroTitle(['Move the changing header', 'behind the reusable prefix'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.cache,
  });

  const eq = glowTex(
    String.raw`L_{\mathrm{prefix}}:\; 96 \;\longrightarrow\; 96 + 256 = 352\quad (\text{total } 364)`,
    { x: 350, y: -395, size: 32, color: ROLE.units, glow: 7 },
  );

  // Signature orbiting 3D KV-cache prefix slab on lower-right
  const kv3d = buildKvRow3d({
    x: 430,
    y: 175,
    unit: 64,
    total: PREFIX_FIRST.length,
    boundary: () => lerp(PREFIX_FIRST.common, PREFIX_MOVED.common, ease(moveHeader.value)),
    span: 6.2,
    cached: ROLE.cache,
    fresh: ROLE.units,
    theta: -0.62,
    phi: 1.06,
  });
  orbitScene(s, c, kv3d, { theta: -0.2, phi: 0.94, distance: 14.4 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = ease(showSetup.value);
    const s96 = ease(show96.value);
    const mv = ease(moveHeader.value);
    const s352 = ease(show352.value);
    const s364 = ease(show364.value);
    const ms = ease(showMeasure.value);

    const x0 = -855;
    const railW = 1480;
    const total = PREFIX_FIRST.length;
    const scale = railW / total;
    const rootW = 96 * scale;
    const headW = 12 * scale;
    const docW = 256 * scale;

    // Smooth arch lift as header glides past document
    const lift = Math.sin(mv * Math.PI);
    const docX = x0 + rootW + headW * (1 - mv);
    const headX = x0 + rootW + docW * mv;

    const commonTokens = Math.round(lerp(PREFIX_FIRST.common, PREFIX_MOVED.common, mv));
    const cutX = x0 + commonTokens * scale;

    const nodes = [
      eq.opacity(alpha * (0.45 + 0.55 * Math.max(s352, ms))),
      txt(
        'TWO REQUESTS: 96-TOKEN ROOT + 256-TOKEN DOCUMENT, CHANGED 12-TOKEN HEADER (A0 -> B0)',
        x0,
        -285,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // Draw Request 1 and Request 2 aligned vertically
    [
      { label: 'REQ 1 (A0..A11)', y: -158, headLabel: 'A' },
      { label: 'REQ 2 (B0..B11)', y: -22, headLabel: 'B' },
    ].forEach((row) => {
      const hy = row.y + lift * 44;
      nodes.push(
        txt(row.label, x0, row.y - 54, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        // Root (96)
        rect(rootW - 4, 54, { fill: '#12284e', stroke: ROLE.cache, width: 2.4, radius: 7 })
          .at(x0 + rootW / 2, row.y)
          .glow(8, ROLE.cache)
          .opacity(alpha),
        txt('Root 96', x0 + rootW / 2, row.y, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        // Fixed document (256)
        rect(docW - 4, 54, {
          fill: mv > 0.6 ? '#12284e' : '#101d34',
          stroke: mv > 0.6 ? ROLE.cache : ROLE.evidence,
          width: 2.4,
          radius: 7,
        })
          .at(docX + docW / 2, row.y)
          .glow(mv > 0.6 ? 9 : 4, mv > 0.6 ? ROLE.cache : ROLE.evidence)
          .opacity(alpha),
        txt('Fixed document 256', docX + docW / 2, row.y, 28, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
        // Volatile header (12)
        rect(Math.max(46, headW), 54, {
          fill: '#2c1e0e',
          stroke: ROLE.units,
          width: 2.6,
          radius: 7,
        })
          .at(headX + Math.max(46, headW) / 2, hy)
          .glow(9, ROLE.units)
          .opacity(alpha * (0.65 + 0.35 * st)),
        txt(
          row.headLabel,
          headX + Math.max(46, headW) / 2,
          hy,
          26,
          ROLE.units,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Moving cache-reuse boundary laser (fades cleanly while header glides across doc text)
    const cutOp = alpha * Math.max(0, 1 - Math.sin(mv * Math.PI) * 1.6);
    if (cutOp > 0.03) {
      nodes.push(
        limitMarker(cutX, -208, 22, mv > 0.6 ? ROLE.note : ROLE.units, 'Cache cut', {
          size: 26,
          opacity: cutOp,
        }),
      );
    }

    // Lower-left live metrics (balanced beside 3D KV slab on lower-right)
    const commonLabel =
      s352 > 0.4
        ? `${PREFIX_MOVED.common} tokens reused`
        : s96 > 0.4
          ? `${PREFIX_FIRST.common} tokens reused`
          : 'Common prefix: ?';
    nodes.push(
      txt('ELIGIBLE COMMON PREFIX', x0, 115, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(commonLabel, x0, 175, 48, s352 > 0.4 ? ROLE.note : ROLE.cache, 'mono', 'left')
        .glow(9, s352 > 0.4 ? ROLE.note : ROLE.cache)
        .opacity(alpha),
      txt(
        s364 > 0.4
          ? `Total input length: ${PREFIX_FIRST.length} tokens in BOTH orders`
          : 'Total input length stays identical when reordered',
        x0,
        245,
        28,
        s364 > 0.4 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        ms > 0.3
          ? 'Verify bytes locally by hash; read cached_input + latency from provider.'
          : 'Order: stable phase tools -> fixed document -> changing notes.',
        x0,
        320,
        28,
        ms > 0.3 ? ROLE.evidence : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      txt('3D KV-CACHE REUSE SLAB', 430, 420, 26, ROLE.cache, 'mono', 'center').opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, kv3d, layer);

  playCue(s, c, 'ce-prefix-order-1', (d) => s.play(showSetup.to(0.7, { duration: d })));
  playCue(s, c, 'ce-prefix-order-2', (d) => s.play(showSetup.to(1, { duration: d })));
  playCue(s, c, 'ce-prefix-96', (d) => s.play(show96.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-prefix-move', (d) => s.play(moveHeader.to(1, { duration: Math.max(d, 1.1) })));
  playCue(s, c, 'ce-prefix-352', (d) => s.play(show352.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-prefix-364', (d) => s.play(show364.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-prefix-order-3', (d) => s.play(showMeasure.to(1, { duration: d })));
}
