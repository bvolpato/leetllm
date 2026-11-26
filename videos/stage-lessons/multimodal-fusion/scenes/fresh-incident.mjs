// Scene 26: fresh-incident: Case C28 fresh transfer check (4x448px = 6,152 vs 2,184 & 273 MiB, API p95 legend, 220s vs 221s -> 220s tie).
import {
  CONTEXT_LIMIT,
  COSMOS,
  FRESH_BASE,
  ROLE,
  aura,
  chipPill,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  rect,
  seq,
  swapVis,
  txt,
} from '../parts.mjs';

export default function freshIncident(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showSetup = s.value(0);
  const showDirect = s.value(0);
  const showReduced = s.value(0);
  const showCache = s.value(0);
  const showLostName = s.value(0);
  const showApiKey = s.value(0);
  const showOrder = s.value(0);
  const shiftClock = s.value(0);
  const showTie = s.value(0);

  const bgAura = aura(0, 0, 780, '#14335c2a', '#16383026');
  const title = heroTitle(['Case C28 Fresh Check:', 'Did API Latency Rise After Deploy?'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const su = showSetup.value;
    const dr = showDirect.value;
    const rd = showReduced.value;
    const ch = showCache.value;

    const barX = -460;
    const maxW = 1140;
    const scale = maxW / 6400;
    const limitX = barX + CONTEXT_LIMIT * scale;

    const nodes = [
      txt(
        '4 VIEWS x 448px (@ 14px PATCH)  +  1,800 TEXT  +  256 RESERVE  |  4,096 WINDOW',
        -855,
        -245,
        26,
        su > 0.2 ? ROLE.gold : ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),

      // Vertical 4,096 limit segments (gapped around status text rows)
      line([limitX, -122], [limitX, -58], { stroke: ROLE.gold, width: 3.2 })
        .glow(10, ROLE.gold)
        .opacity(alpha),
      line([limitX, 48], [limitX, 112], { stroke: ROLE.gold, width: 3.2 })
        .glow(10, ROLE.gold)
        .opacity(alpha),
      txt('4,096 LIMIT', limitX, -162, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      // Row 1: Direct bridge (withheld until mm-fresh-direct!)
      txt('Direct Bridge', -855, -105, 30, ROLE.vision, 'mono', 'left').opacity(alpha),
      txt('(1 state/patch)', -855, -62, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(
        barX,
        -90,
        dr > 0.4 ? FRESH_BASE.direct.total * scale : 240,
        42,
        dr > 0.4 ? ROLE.warn : ROLE.vision,
        { opacity: alpha, maxTrackW: maxW },
      ),
      txt(
        dr > 0.4
          ? `4 x 1,024 = 4,096 vis alone -> ${FRESH_BASE.direct.total.toLocaleString()} total (OVER!)`
          : '4 x (448/14)^2 + 2,056 fixed = ? total',
        barX,
        -28,
        28,
        dr > 0.4 ? ROLE.warn : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 2: Reducer bridge (withheld until mm-fresh-reduced!)
      txt('Reducer Bridge', -855, 65, 30, ROLE.ok, 'mono', 'left').opacity(alpha),
      txt('(32 states/view)', -855, 108, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(
        barX,
        80,
        rd > 0.4 ? FRESH_BASE.reduced.total * scale : 240,
        42,
        rd > 0.4 ? ROLE.ok : ROLE.bridge,
        { opacity: alpha, maxTrackW: maxW },
      ),
      txt(
        rd > 0.4
          ? `4 x 32 = 128 vis -> ${FRESH_BASE.reduced.total.toLocaleString()} total -> FITS!`
          : '4 x 32 + 2,056 fixed = ? total',
        barX,
        142,
        28,
        rd > 0.4 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Bottom cache bill readout (withheld until mm-fresh-cache!)
      chipPill(
        ch > 0.4
          ? `2,184 tokens x 128 KiB = ${FRESH_BASE.reduced.kvMiB} MiB logical KV cache -> ADMITTED!`
          : rd > 0.4
            ? 'Reduced route fits (2,184 <= 4,096) -> checking logical KV cache bill...'
            : dr > 0.4
              ? 'Direct route overflows (6,152 > 4,096) -> checking reduced route...'
              : 'Which route fits the 4,096-token window?',
        0,
        285,
        {
          w: 1480,
          h: 74,
          color: ch > 0.4 || rd > 0.4 ? ROLE.ok : ROLE.gold,
          fill: ch > 0.4 ? '#0f2d24' : '#10182d',
          size: 28,
          glow: ch > 0.4 ? 14 : 6,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const ln = showLostName.value;
    const ak = showApiKey.value;
    const od = showOrder.value;
    const sh = shiftClock.value;
    const ti = showTie.value;

    // Magnified UTC ruler from 195s to 255s mapped onto [-780, +780]
    const rx = (sec) => -780 + ((sec - 195) / 60) * 1560;
    const riseStart = 221 - sh; // 221 -> 220

    const nodes = [
      // Top row: Legend recovery
      chipPill('32-state view: green rises, name LOST', -420, -215, {
        w: 840,
        h: 66,
        color: ROLE.gold,
        glow: 4 + 8 * ln,
        size: 26,
        opacity: alpha,
      }),
      chipPill(
        ak > 0.4 ? 'Original Legend -> API p95 (VERIFIED)' : 'Authorized original lookup...',
        455,
        -215,
        {
          w: 750,
          h: 66,
          color: ak > 0.4 ? ROLE.ok : '#384c76',
          fill: ak > 0.4 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: ak > 0.4 ? 12 : 4,
          opacity: alpha,
        },
      ),

      // Magnified UTC clock ruler
      txt(
        'MAGNIFIED UTC RULER (SECONDS 200 TO 250)',
        0,
        -142,
        26,
        ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),
      line([rx(195), 110], [rx(255), 110], { stroke: '#4a628f', width: 3.2 }).opacity(alpha),
      ...[200, 210, 220, 230, 240, 250].flatMap((sec) => [
        line([rx(sec), 98], [rx(sec), 122], { stroke: '#6c85b5', width: 2.2 }).opacity(alpha),
        txt(
          `${sec}s`,
          rx(sec),
          150,
          26,
          sec === 220 ? ROLE.gold : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      ]),

      // Deploy bar [200, 220]
      rect(rx(220) - rx(200), 54, {
        fill: '#183766',
        stroke: ROLE.text,
        width: 3,
        radius: 8,
      })
        .at((rx(200) + rx(220)) * 0.5, -35)
        .glow(8, ROLE.text)
        .opacity(alpha),
      txt(
        'Deploy [200s, 220s]',
        (rx(200) + rx(220)) * 0.5,
        -35,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      // Rise bar [221, 250] -> shifts to [220, 250]
      rect(rx(250) - rx(riseStart), 54, {
        fill: '#0f362b',
        stroke: ti > 0.4 ? ROLE.warn : ROLE.ok,
        width: 3,
        radius: 8,
      })
        .at((rx(riseStart) + rx(250)) * 0.5, 42)
        .glow(10, ti > 0.4 ? ROLE.warn : ROLE.ok)
        .opacity(alpha),
      txt(
        `API Rise [${Math.round(riseStart)}s, 250s]`,
        (rx(riseStart) + rx(250)) * 0.5,
        42,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      // Vertical marker at 220s boundary
      line([rx(220), -66], [rx(220), 90], {
        stroke: ti > 0.4 ? ROLE.warn : ROLE.gold,
        width: 3,
      })
        .glow(10, ti > 0.4 ? ROLE.warn : ROLE.gold)
        .opacity(alpha),
    ];

    if (ti > 0.4) {
      nodes.push(
        glowDot(rx(220), 4, { radius: 11, color: ROLE.warn, glow: 16, opacity: alpha }),
        txt('220s TOUCH!', rx(220), -98, 28, ROLE.warn, 'mono', 'center')
          .glow(10, ROLE.warn)
          .opacity(alpha),
      );
    } else if (od > 0.4 && sh < 0.3) {
      nodes.push(
        txt('1s GAP (220 < 221)', rx(220.5), -98, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      );
    }

    // Strict prediction withholding #2: reveal tie verdict ONLY after mm-fresh-touch!
    let verdict = 'Compare inclusive endpoints on the same UTC clock';
    let vCol = ROLE.vision;
    if (ti > 0.4) {
      verdict =
        '220s touches! Tie possible -> cite API rise; tighter clock needed for deploy order';
      vCol = ROLE.warn;
    } else if (sh > 0.4) {
      verdict = 'Rise moved -1s to [220s, 250s]: can we still say API rise came AFTER deploy?';
      vCol = ROLE.gold;
    } else if (od > 0.4) {
      verdict = '220s < 221s (1 full second gap) -> API rise FOLLOWED the deploy';
      vCol = ROLE.ok;
    }

    nodes.push(
      chipPill(verdict, 0, 285, {
        w: 1620,
        h: 74,
        color: vCol,
        fill: ti > 0.4 ? '#2c1422' : od > 0.4 && sh < 0.4 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: 10,
        opacity: alpha,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'mm-fresh-incident-0', (d) => s.play(showSetup.to(1, { duration: d })));
  // Strict prediction withholding #1: reveal 6,152 / 2,184 / 273 MiB only after Beat 1 cues!
  playCue(s, c, 'mm-fresh-direct', (d) => s.play(showDirect.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'mm-fresh-reduced', (d) => s.play(showReduced.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'mm-fresh-cache', (d) => s.play(showCache.to(1, { duration: d })), { after: true });
  playCue(
    s,
    c,
    'mm-fresh-incident-2',
    (d) =>
      s.play(seq(swapVis(view1Vis, view2Vis, d * 0.7), showLostName.to(1, { duration: d * 0.3 }))),
    { dur: 0.9 },
  );
  playCue(s, c, 'mm-fresh-key', (d) => s.play(showApiKey.to(1, { duration: d })));
  playCue(s, c, 'mm-fresh-order', (d) => s.play(showOrder.to(1, { duration: d })));
  playCue(s, c, 'mm-fresh-correct-clock', (d) => s.play(shiftClock.to(1, { duration: d })), {
    dur: 0.85,
  });
  // Strict prediction withholding #2: reveal tie verdict only after mm-fresh-touch!
  playCue(s, c, 'mm-fresh-touch', (d) => s.play(showTie.to(1, { duration: d })), { after: true });
}
