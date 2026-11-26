// Scene 04: decoded-budget: Upload bytes vs decoded pixel gates, 336px -> 576 patches, and 120 frames -> 30,720 tokens.
import {
  CONTEXT_LIMIT,
  COSMOS,
  ROLE,
  VIDEO_120_TOKENS,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
  arrow,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function decodedBudget(s, c) {
  const showGates = s.value(0);
  const showFormula = s.value(0);
  const show576 = s.value(0);
  const showVideo = s.value(0);
  const show30720 = s.value(0);

  const bgAura = aura(0, 10, 760, '#14335c2a', '#2c163a24');
  const title = heroTitle(['Count Decoded Views,', 'Not Upload Bytes'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.vision,
  });

  const eq = glowTex(String.raw`(336 / 14)^2 = 24^2 = 576`, {
    x: 420,
    y: -395,
    size: 36,
    color: ROLE.gold,
    glow: 7,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const gt = showGates.value;
    const fm = showFormula.value;
    const n576 = show576.value;
    const vid = showVideo.value;
    const n30k = show30720.value;

    const nodes = [
      // Top row: Two differently compressed files -> same decoded grid
      txt(
        'TWO UPLOADS, ONE DECODED VIEW GRID',
        -855,
        -240,
        26,
        ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('12 MB JPEG', -675, -165, {
        w: 350,
        h: 64,
        color: ROLE.text,
        size: 28,
        opacity: alpha,
      }),
      chipPill('400 KB WebP', -675, -80, {
        w: 350,
        h: 64,
        color: ROLE.vision,
        size: 28,
        opacity: alpha,
      }),
      arrow([-485, -165], [-345, -130], { stroke: ROLE.text, width: 2.8, head: 11 }).opacity(alpha),
      arrow([-485, -80], [-345, -115], { stroke: ROLE.vision, width: 2.8, head: 11 }).opacity(
        alpha,
      ),
      chipPill('Byte + Pixel Gates', -150, -122, {
        w: 360,
        h: 82,
        color: gt > 0.3 ? ROLE.warn : ROLE.gold,
        fill: gt > 0.3 ? '#2c1422' : '#10182d',
        size: 28,
        glow: gt > 0.3 ? 14 : 6,
        opacity: alpha,
      }),
      arrow([45, -122], [175, -122], { stroke: ROLE.vision, width: 3, head: 12 }).opacity(alpha),

      // Right-top: 336px patch bank readout
      rect(640, 152, {
        fill: '#0e162c',
        stroke: n576 > 0.3 ? ROLE.ok : fm > 0.3 ? ROLE.vision : '#2c3d68',
        width: n576 > 0.3 ? 3 : 2,
        radius: 14,
      })
        .at(510, -122)
        .glow(n576 > 0.3 ? 12 : 0, ROLE.ok)
        .opacity(alpha),
      txt(
        n576 > 0.3 ? `336px -> ${VISUAL_TOKENS_336} PATCHES (+opt CLS)` : '336px @ 14px PATCH GRID',
        510,
        -150,
        28,
        n576 > 0.3 ? ROLE.ok : ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        fm > 0.3
          ? 'Padded edges use ceil(); unpadded conv drops rim'
          : 'Count the selected processor output',
        510,
        -92,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      // Lower section: Video 60s @ 2fps = 120 frames x 256 = 30,720 tokens
      txt(
        '60s VIDEO @ 2 FPS = 120 FRAMES x 256 PATCHES (224px)',
        -855,
        55,
        26,
        vid > 0.3 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Visual frame stack strip (left-to-right glowing chips representing frames)
      ...Array.from({ length: 12 }, (_, idx) => {
        const fx = -820 + idx * 104;
        return rect(82, 58, {
          fill: idx < 2 + Math.round(10 * vid) ? '#153454' : '#0f1629',
          stroke: n30k > 0.3 ? ROLE.warn : ROLE.vision,
          width: 2,
          radius: 8,
        })
          .at(fx, 130)
          .opacity(alpha * (0.48 + 0.52 * vid));
      }),
      txt('120 frames', 515, 130, 30, ROLE.vision, 'mono', 'left').opacity(
        alpha * (0.52 + 0.48 * vid),
      ),

      // 4K context window ruler vs 30,720 tokens
      txt(`4K window (${CONTEXT_LIMIT})`, -855, 228, 26, ROLE.text, 'mono', 'left').opacity(alpha),
      lumBar(-540, 228, 175, 28, ROLE.text, { opacity: alpha, maxTrackW: 1320 }),

      txt(
        n30k > 0.3
          ? `${VIDEO_120_TOKENS.toLocaleString()} tokens  (7.5 x 4K!)`
          : `120 x ${VISUAL_TOKENS_224} tokens`,
        -855,
        305,
        28,
        n30k > 0.3 ? ROLE.warn : ROLE.gold,
        'mono',
        'left',
      )
        .glow(n30k > 0.3 ? 10 : 0, ROLE.warn)
        .opacity(alpha),
      lumBar(-350, 305, 180 + 950 * Math.max(vid, n30k), 34, n30k > 0.3 ? ROLE.warn : ROLE.gold, {
        opacity: alpha * (0.52 + 0.48 * Math.max(vid, n30k)),
        maxTrackW: 1130,
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'mm-decoded-budget-0', (d) => s.play(showGates.to(1, { duration: d })));
  playCue(s, c, 'mm-decoded-budget-1', (d) => s.play(showFormula.to(1, { duration: d })));
  playCue(s, c, 'mm-patch-count', (d) => s.play(show576.to(1, { duration: d })));
  playCue(s, c, 'mm-decoded-budget-2', (d) => s.play(showVideo.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'mm-video-count', (d) => s.play(show30720.to(1, { duration: d })));
}
