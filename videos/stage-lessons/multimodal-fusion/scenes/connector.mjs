// Scene 06: connector: Per-patch projection ([1,2,3]->[4,-1], 576 kept), Q-Former 32, Perceiver 64, and 32-state readback probe.
import {
  COSMOS,
  ROLE,
  VISUAL_TOKENS_336,
  arrow,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  originalKey,
  playCue,
  rect,
  seq,
  swapVis,
  txt,
} from '../parts.mjs';

export default function connector(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showProj = s.value(0);
  const showKeep576 = s.value(0);
  const showQFormer = s.value(0);
  const showPerceiver = s.value(0);
  const showTrace = s.value(0);
  const showBlurred = s.value(0);
  const showCrop = s.value(0);
  const showCheckout = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c2a', '#29184a26');
  const title = heroTitle(['What Reaches the', 'Language Model?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  const eq = glowTex(String.raw`[1, 2, 3]\,W = [4, -1]`, {
    x: 420,
    y: -395,
    size: 38,
    color: ROLE.vision,
    glow: 7,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const pj = showProj.value;
    const k576 = showKeep576.value;
    const qf = showQFormer.value;
    const pr = showPerceiver.value;

    const nodes = [
      // Row 1: Direct per-patch width projection (576 -> 576)
      txt(
        '1. LINEAR / MLP CONNECTOR: CHANGES WIDTH, KEEPS ALL 576 POSITIONS',
        -855,
        -240,
        26,
        ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('576 rows x [1, 2, 3]', -610, -145, {
        w: 470,
        h: 74,
        color: ROLE.vision,
        size: 28,
        opacity: alpha,
      }),
      arrow([-355, -145], [-210, -145], { stroke: ROLE.vision, width: 3.2, head: 12 }).opacity(
        alpha,
      ),
      chipPill('W (3 -> 2)', -80, -145, {
        w: 220,
        h: 74,
        color: pj > 0.3 ? ROLE.gold : ROLE.bridge,
        size: 28,
        glow: pj > 0.3 ? 12 : 6,
        opacity: alpha,
      }),
      arrow([45, -145], [185, -145], { stroke: ROLE.ok, width: 3.2, head: 12 }).opacity(alpha),
      chipPill(k576 > 0.3 ? `${VISUAL_TOKENS_336} rows x [4, -1]` : '1+3=4, 2-3=-1', 490, -145, {
        w: 560,
        h: 74,
        color: k576 > 0.3 ? ROLE.ok : ROLE.vision,
        fill: k576 > 0.3 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: k576 > 0.3 ? 14 : 6,
        opacity: alpha,
      }),

      // Row 2: Q-Former (BLIP-2: 32 learned queries)
      txt(
        '2. Q-FORMER (BLIP-2): 32 LEARNED QUERIES READ ALL 576 PATCHES',
        -855,
        -25,
        26,
        qf > 0.3 ? ROLE.bridge : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * qf)),
      chipPill('576 Patch Bank', -655, 60, {
        w: 380,
        h: 72,
        color: ROLE.vision,
        size: 28,
        opacity: alpha * (0.55 + 0.45 * qf),
      }),
      arrow([-450, 60], [-250, 60], { stroke: ROLE.bridge, width: 3.2, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * qf),
      ),
      chipPill('32 Learned Queries', -30, 60, {
        w: 400,
        h: 72,
        color: qf > 0.3 ? ROLE.bridge : '#384c76',
        fill: qf > 0.3 ? '#211842' : '#10182d',
        size: 28,
        glow: qf > 0.3 ? 14 : 4,
        opacity: alpha * (0.55 + 0.45 * qf),
      }),
      arrow([185, 60], [320, 60], { stroke: ROLE.gold, width: 3.2, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * qf),
      ),
      chipPill('32 Output States', 555, 60, {
        w: 420,
        h: 72,
        color: qf > 0.3 ? ROLE.gold : '#384c76',
        size: 28,
        glow: qf > 0.3 ? 12 : 4,
        opacity: alpha * (0.55 + 0.45 * qf),
      }),

      // Row 3: Perceiver Resampler (Flamingo: 64 latent slots)
      txt(
        '3. PERCEIVER RESAMPLER (FLAMINGO): 64 LATENT SLOTS BOUND BANK',
        -855,
        170,
        26,
        pr > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.52 + 0.48 * pr)),
      chipPill('576 Patch Bank', -655, 255, {
        w: 380,
        h: 72,
        color: ROLE.vision,
        size: 28,
        opacity: alpha * (0.52 + 0.48 * pr),
      }),
      arrow([-450, 255], [-250, 255], { stroke: ROLE.ok, width: 3.2, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * pr),
      ),
      chipPill('64 Latent Slots', -30, 255, {
        w: 400,
        h: 72,
        color: pr > 0.3 ? ROLE.ok : '#384c76',
        fill: pr > 0.3 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: pr > 0.3 ? 14 : 4,
        opacity: alpha * (0.52 + 0.48 * pr),
      }),
      arrow([185, 255], [320, 255], { stroke: ROLE.ok, width: 3.2, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * pr),
      ),
      chipPill('64 Output States', 555, 255, {
        w: 420,
        h: 72,
        color: pr > 0.3 ? ROLE.ok : '#384c76',
        size: 28,
        glow: pr > 0.3 ? 12 : 4,
        opacity: alpha * (0.52 + 0.48 * pr),
      }),
      txt(
        'Note: the vision encoder still processes every admitted patch upstream',
        0,
        350,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const tr = showTrace.value;
    const bl = showBlurred.value;
    const cr = showCrop.value;
    const ch = showCheckout.value;

    const nodes = [
      // Left: 32-state compressed readback
      txt('32-STATE COMPRESSED READBACK', -430, -235, 28, ROLE.bridge, 'mono', 'center').opacity(
        alpha,
      ),
      rect(760, 390, {
        fill: '#0e162b',
        stroke: ROLE.bridge,
        width: 2.6,
        radius: 14,
      })
        .at(-430, -10)
        .opacity(alpha),

      chipPill('Green trace: 5.2 @ 3pm -> 9.0 @ 6pm', -430, -105, {
        w: 670,
        h: 78,
        color: ROLE.ok,
        fill: '#0f2d24',
        size: 28,
        glow: tr > 0.3 ? 14 : 6,
        opacity: alpha,
      }),
      chipPill(bl > 0.3 ? 'Series Name:  [ UNREADABLE ]' : 'Series Name:  [ ? ]', -430, 20, {
        w: 670,
        h: 78,
        color: ROLE.warn,
        fill: '#2c1422',
        size: 28,
        glow: bl > 0.3 ? 12 : 5,
        opacity: alpha,
      }),
      txt(
        ch > 0.4
          ? 'Report green rise; verify name from original crop!'
          : 'What can you report from this 32-state view?',
        -430,
        130,
        26,
        ch > 0.4 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),

      // Right: Original legend crop verification (strictly withheld until connector-check-source / connector-name!)
      txt(
        cr > 0.3 ? 'VERIFIED ORIGINAL LEGEND CROP' : 'ORIGINAL SOURCE LEGEND (HELD)',
        430,
        -235,
        28,
        cr > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      rect(760, 390, {
        fill: '#0b1224',
        stroke: ch > 0.4 ? ROLE.ok : '#2c3d68',
        width: ch > 0.4 ? 3 : 2.2,
        radius: 14,
      })
        .at(430, -10)
        .glow(ch > 0.4 ? 12 : 0, ROLE.ok)
        .opacity(alpha),

      // Swatches
      ...[
        { color: ROLE.text, name: originalKey[0] },
        { color: ROLE.ok, name: originalKey[1] },
        { color: ROLE.warn, name: originalKey[2] },
      ].flatMap((sw, idx) => {
        const y = -115 + idx * 102;
        const isTarget = idx === 1;
        return [
          line([120, y], [210, y], {
            stroke: sw.color,
            width: isTarget && ch > 0.4 ? 10 : 7,
          }).opacity(alpha * (0.45 + 0.55 * cr)),
          txt(
            cr > 0.45
              ? isTarget && ch > 0.4
                ? `${sw.name}  (VERIFIED)`
                : sw.name
              : '[ withheld ]',
            245,
            y,
            isTarget && ch > 0.4 ? 38 : 32,
            cr > 0.45 ? sw.color : COSMOS.muted,
            'mono',
            'left',
          )
            .glow(isTarget && ch > 0.4 ? 10 : 0, sw.color)
            .opacity(alpha),
        ];
      }),

      txt(
        ch > 0.4
          ? 'Test tiny-label recovery before shrinking prefix or visual memory'
          : 'Encoder still processes all 576 patches even with a 32-state bridge',
        0,
        285,
        28,
        ch > 0.4 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, view1, view2);
  playCue(s, c, 'connector-project-width', (d) => s.play(showProj.to(1, { duration: d })));
  playCue(s, c, 'connector-preserve-positions', (d) => s.play(showKeep576.to(1, { duration: d })));
  playCue(s, c, 'connector-read-queries', (d) => s.play(showQFormer.to(1, { duration: d })));
  playCue(s, c, 'connector-configured-resampler', (d) =>
    s.play(showPerceiver.to(1, { duration: d })),
  );
  playCue(
    s,
    c,
    'connector-probe-trace',
    (d) =>
      s.play(seq(swapVis(view1Vis, view2Vis, d * 0.65), showTrace.to(1, { duration: d * 0.35 }))),
    { dur: 0.9 },
  );
  playCue(s, c, 'connector-probe-key', (d) => s.play(showBlurred.to(1, { duration: d })));
  // Strict prediction withholding: reveal original legend & Checkout only after Beat 4 cues!
  playCue(s, c, 'connector-check-source', (d) => s.play(showCrop.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'connector-name', (d) => s.play(showCheckout.to(1, { duration: d })), {
    after: true,
  });
}
