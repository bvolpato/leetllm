// Scene 16: required-packer: "Place protected evidence before optional material"
// Required-first priority ordering -> 3,000-unit budget rail: alert (180) + trace (420) = 600,
// runbook (1,800) -> 2,400, 8,200 export overflows (raises error if marked required).
// B2 sequential swap: 4,096 total minus reserves (420 + 180 + 1,024) = 2,472 leaving 72 unused.
import {
  CONTEXT_REQUIRED,
  COSMOS,
  PACK_3000,
  PACK_RESERVED,
  RESERVED_BUDGET,
  RESERVES,
  ROLE,
  aura,
  chip,
  crossMark,
  ease,
  fmt,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  limitMarker,
  playCue,
  swapVis,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function requiredPacker(s, c) {
  const vPack = s.value(1);
  const vReserve = s.value(0);
  const showSort = s.value(0.25);
  const packReq = s.value(0);
  const packRun = s.value(0);
  const errDump = s.value(0);
  const showResBudget = s.value(0);
  const showRem = s.value(0);

  const bgAura = aura(0, 0, 820, '#14335c2a', '#2c142622');
  const title = heroTitle(['Place protected evidence', 'before optional material'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.evidence,
  });

  const eqRes = glowTex(
    String.raw`4{,}096 - 420 - 180 - 1{,}024 = 2{,}472\;\longrightarrow\; 2{,}472 - 2{,}400 = 72`,
    { x: 0, y: 230, size: 36, color: ROLE.note, glow: 8 },
  );

  // View 1 (B0-B1): Required-first packing into 3,000-unit allocation
  const packLayer = guardedDynamic(vPack, (alpha) => {
    const srt = ease(showSort.value);
    const rq = ease(packReq.value);
    const rn = ease(packRun.value);
    const er = ease(errDump.value);

    const x0 = -855;
    const railW = 1480;
    const budget = PACK_3000.budget;
    const maxScale = 3600;
    const limitX = x0 + (budget / maxScale) * railW;

    const segs = [
      { units: 180, color: ROLE.evidence, alpha: 0.45 + 0.55 * rq },
      { units: 420, color: ROLE.cache, alpha: 0.45 + 0.55 * rq },
      { units: 1800, color: ROLE.note, alpha: 0.25 + 0.75 * rn },
    ];
    if (er > 0.2) {
      segs.push({ units: 1200, color: ROLE.poison, alpha: er, outline: true });
    }

    const used = rn > 0.5 ? PACK_3000.used : rq > 0.5 ? 600 : 0;

    const nodes = [
      txt(
        'SORT ORDER:  required = true FIRST, THEN DESCENDING PRIORITY (TIES KEEP INPUT ORDER)',
        x0,
        -250,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * srt)),

      // Four ordered candidate chips
      chip('1. alert (180, req)', -665, -165, {
        color: ROLE.evidence,
        size: 26,
        minW: 360,
        opacity: alpha,
      }),
      chip('2. trace (420, req)', -250, -165, {
        color: ROLE.cache,
        size: 26,
        minW: 360,
        opacity: alpha,
      }),
      chip('3. runbook (1800, opt)', 195, -165, {
        color: ROLE.note,
        size: 26,
        minW: 410,
        opacity: alpha,
      }),
      chip(er > 0.3 ? '4. dump (8200, REQ!)' : '4. export (8200, opt)', 645, -165, {
        color: er > 0.3 ? ROLE.poison : ROLE.dim,
        size: 26,
        minW: 400,
        opacity: alpha,
      }),

      // Packing rail
      txt('3,000-UNIT ALLOCATION RAIL', x0, -45, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      tokenRail({
        x0,
        y: 30,
        width: railW,
        total: maxScale,
        height: 68,
        segments: segs,
        opacity: alpha,
      }),
      limitMarker(limitX, -25, 95, ROLE.units, 'Budget: 3,000', { size: 28, opacity: alpha }),

      // Live accounting readout
      txt(
        `Used: ${fmt(used)} / ${fmt(budget)}`,
        x0,
        175,
        46,
        er > 0.3 ? ROLE.poison : ROLE.note,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        rq > 0.4
          ? 'Required alert (180) + trace (420) = 600'
          : 'Validate non-negative integer sizes & unique names',
        x0,
        255,
        29,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    if (er > 0.3) {
      nodes.push(
        crossMark(-10, 175, 32, ROLE.poison, alpha * er),
        txt('ValueError: required 8,200 dump > 3,000!', 35, 175, 30, ROLE.poison, 'mono', 'left')
          .glow(8, ROLE.poison)
          .opacity(alpha * er),
      );
    } else if (rn > 0.4) {
      nodes.push(
        txt(
          'Runbook (+1,800) -> 2,400; 8,200 skipped',
          35,
          175,
          28,
          ROLE.note,
          'mono',
          'left',
        ).opacity(alpha * rn),
      );
    }

    nodes.push(
      txt(
        er > 0.3
          ? 'Stop with an explicit error rather than silently sending an incomplete required set.'
          : 'Walk the sorted list and admit each optional item only if the new total fits.',
        0,
        385,
        30,
        er > 0.3 ? ROLE.poison : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  // View 2 (B2): Reserves subtracted from 4,096 total window
  const reserveLayer = guardedDynamic(vReserve, (alpha) => {
    const rb = ease(showResBudget.value);
    const rm = ease(showRem.value);

    const x0 = -855;
    const railW = 1710;
    const nodes = [
      txt(
        'RESERVE FIXED OVERHEAD BEFORE PACKING EVIDENCE (4,096 TOTAL)',
        x0,
        -240,
        26,
        ROLE.units,
        'mono',
        'left',
      ).opacity(alpha),
      tokenRail({
        x0,
        y: -145,
        width: railW,
        total: RESERVES.total,
        height: 70,
        segments: [
          { units: RESERVES.instructions, color: ROLE.tool },
          { units: RESERVES.framing, color: ROLE.units },
          { units: RESERVES.output, color: ROLE.poison },
          { units: PACK_3000.used, color: ROLE.note, alpha: 0.55 + 0.45 * rb },
          { units: PACK_RESERVED.remaining, color: ROLE.evidence, alpha: 0.45 + 0.55 * rm },
        ],
        opacity: alpha,
      }),

      // Segment legends cleanly spaced in a single row
      chip(`Instr: ${RESERVES.instructions}`, -705, -20, {
        color: ROLE.tool,
        size: 26,
        minW: 260,
        opacity: alpha,
      }),
      chip(`Frame: ${RESERVES.framing}`, -405, -20, {
        color: ROLE.units,
        size: 26,
        minW: 260,
        opacity: alpha,
      }),
      chip(`Output: ${fmt(RESERVES.output)}`, -95, -20, {
        color: ROLE.poison,
        size: 26,
        minW: 280,
        opacity: alpha,
      }),
      chip(`Packed: ${fmt(PACK_3000.used)}`, 245, -20, {
        color: ROLE.note,
        size: 26,
        minW: 310,
        opacity: alpha,
      }),
      chip(rm > 0.3 ? `Free: ${PACK_RESERVED.remaining}` : 'Free: ?', 595, -20, {
        color: ROLE.evidence,
        size: 26,
        minW: 240,
        opacity: alpha,
      }),

      txt(
        rb > 0.3
          ? `Available for records after reserves: ${fmt(RESERVED_BUDGET)} units`
          : 'Computing record budget after reserves...',
        0,
        105,
        36,
        ROLE.units,
        'mono',
        'center',
      ).opacity(alpha),

      eqRes.opacity(alpha * (0.45 + 0.55 * rm)),

      txt(
        'Reserve instructions, framing, and output/reasoning allowance before packing records.',
        0,
        375,
        32,
        rm > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, packLayer, reserveLayer);

  playCue(s, c, 'ce-required-packer-1', (d) => s.play(showSort.to(0.6, { duration: d })));
  playCue(s, c, 'ce-pack-order', (d) => s.play(showSort.to(1, { duration: d })));
  playCue(s, c, 'ce-required-packer-2', (d) => s.play(packReq.to(0.6, { duration: d })));
  playCue(s, c, 'ce-pack-600', (d) => s.play(packReq.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-pack-2400', (d) => s.play(packRun.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-pack-error', (d) => s.play(errDump.to(1, { duration: d })));

  // B2 sequential swap to reserves view
  playCue(s, c, 'ce-required-packer-3', (d) => s.play(swapVis(vPack, vReserve, d)));
  playCue(s, c, 'ce-pack-reserve', (d) => s.play(showResBudget.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'ce-pack-remaining', (d) => s.play(showRem.to(1, { duration: d })));
}
