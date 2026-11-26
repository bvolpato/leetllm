// Scene 08: resolution-grid: Separate [CLS] slot while interpolating 14x14 (197) -> 16x20 (321) 2D position table.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function resolutionGrid(s, c) {
  const resizeT = s.value(0); // 0 = 14x14 (196+1=197), 1 = 16x20 (320+1=321)
  const showInterpNote = s.value(0);

  const bgAura = aura(0, 0, 740, '#123a5e28', '#2a1b5418');
  const title = heroTitle(['Position Grid Resize:', 'keep [CLS] untouched'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rt = resizeT.value;
    const note = showInterpNote.value;
    const isLarge = rt > 0.5;
    const cols = isLarge ? 10 : 7; // schematic 2:1 scaled visual grid
    const rows = isLarge ? 8 : 7;
    const nodes = [
      // Separate untouched [CLS] vector on left
      txt('SEPARATED [CLS] SLOT', -655, -210, 26, ROLE.bridge, 'mono', 'center').opacity(alpha),
      chipPill('[CLS]  (unchanged)', -655, -70, {
        w: 360,
        h: 92,
        color: ROLE.bridge,
        size: 30,
        glow: 12,
        opacity: alpha,
      }),
      txt('1 slot preserved identically', -655, 35, 26, ROLE.bridge, 'sans', 'center').opacity(
        alpha,
      ),

      // 2D Patch Position Grid resizing in center-right
      txt(
        isLarge
          ? 'RESIZED 2D GRID: 16 × 20 = 320 PATCHES'
          : 'ORIGINAL 2D GRID: 14 × 14 = 196 PATCHES',
        260,
        -225,
        28,
        isLarge ? ROLE.pos : ROLE.patch,
        'mono',
        'center',
      )
        .glow(6, isLarge ? ROLE.pos : ROLE.patch)
        .opacity(alpha),
    ];

    const gx0 = 260 - (cols - 1) * 26;
    const gy0 = -125;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        nodes.push(
          rect(42, 34, {
            fill: '#111e38',
            stroke: isLarge ? ROLE.pos : ROLE.patch,
            width: 1.8,
            radius: 5,
          })
            .at(gx0 + col * 52, gy0 + r * 42)
            .opacity(0.88 * alpha),
        );
      }
    }

    nodes.push(
      glowingTrail(
        [
          [-455, -70],
          [-60, -70],
        ],
        { color: ROLE.pos, width: 3.5, opacity: 0.7 * alpha },
      ),
      txt(
        isLarge
          ? '1 + 320 = 321 total positions   (raw RGB patch width stays 16×16×3 = 768)'
          : '224² → 197 slots   ·   256² → 257 slots   (raw RGB patch width stays 768)',
        -855,
        270,
        28,
        isLarge ? ROLE.pos : ROLE.patch,
        'mono',
        'left',
      )
        .glow(6, isLarge ? ROLE.pos : ROLE.patch)
        .opacity(alpha),
      txt(
        note > 0.3
          ? 'Match the checkpoint interpolation mode (linear vs bicubic align_corners=False) & re-verify accuracy'
          : 'Split [CLS] → reshape 2D → interpolate each channel → flatten → reattach [CLS]',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'resolution-grid-beat-1', (d) => s.play(resizeT.to(1, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'resolution-grid-beat-2', (d) => s.play(showInterpNote.to(1, { duration: d })), {
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), ['resolution-grid-beat-0']);
}
